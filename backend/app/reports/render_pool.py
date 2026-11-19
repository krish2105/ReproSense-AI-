"""Doctor-PDF rendering off the request threads (found by the round-4 load test).

WeasyPrint is CPU-bound Python. Rendered on the API's worker threads, concurrent PDFs fought each other and every page
request for the interpreter lock: with 20 virtual users, PDF downloads took 10 s on average and 22 s at p95, past the
web's 15 s limit. Now:

- renders run in a small pool of separate processes (`PDF_WORKERS`, 2), so they use other cores and leave the request
  threads free;
- each render has a time limit (`PDF_TIMEOUT_S`, 12 s, under the web's 15 s): past it the caller gets a clear 503
  "try again in a moment", and the render keeps going and is cached when it finishes;
- finished PDFs are cached by the exact report content (a saved report never changes), so a second download, or the
  doctor opening her share link, costs nothing.
"""

from __future__ import annotations

import hashlib
import json
import logging
import multiprocessing
import threading
from collections import OrderedDict
from concurrent.futures import Future, ProcessPoolExecutor
from concurrent.futures import TimeoutError as FuturesTimeout
from concurrent.futures.process import BrokenProcessPool

from app.config import get_settings

log = logging.getLogger("reprosense.pdf")
CACHE_MAX = 64  # ~30 kB each
_cache: OrderedDict[str, bytes] = OrderedDict()
_lock = threading.Lock()
_pool: ProcessPoolExecutor | None = None


class RenderTimeout(Exception):
    """The PDF is still rendering; it will be cached when done."""


def _key(payload: dict) -> str:
    return hashlib.sha256(json.dumps(payload, sort_keys=True, default=str).encode()).hexdigest()


def _executor() -> ProcessPoolExecutor:
    global _pool
    with _lock:
        if _pool is None:
            # spawn, not fork: the API process has threads (pool, model calls) that must not be copied mid-state.
            _pool = ProcessPoolExecutor(get_settings().pdf_workers, mp_context=multiprocessing.get_context("spawn"))
        return _pool


def _reset_executor() -> None:
    global _pool
    with _lock:
        if _pool is not None:
            _pool.shutdown(wait=False, cancel_futures=True)
        _pool = None


def _store(key: str, pdf: bytes) -> None:
    with _lock:
        _cache[key] = pdf
        _cache.move_to_end(key)
        while len(_cache) > CACHE_MAX:
            _cache.popitem(last=False)


def cached(payload: dict) -> bytes | None:
    with _lock:
        return _cache.get(_key(payload))


def render(payload: dict) -> bytes:
    """The PDF for a report payload. Raises RenderTimeout past PDF_TIMEOUT_S, OSError if the PDF engine is missing."""
    from app.reports.pdf import render_pdf

    key = _key(payload)
    hit = cached(payload)
    if hit is not None:
        return hit
    s = get_settings()
    if s.pdf_workers <= 0:  # in-process (tests or a single-core host can opt for this)
        pdf = render_pdf(payload)
        _store(key, pdf)
        return pdf
    for attempt in (1, 2):
        try:
            fut: Future = _executor().submit(render_pdf, payload)
            break
        except BrokenProcessPool:  # a worker died (out of memory): start a fresh pool once
            log.warning("PDF worker pool broken; restarting it (attempt %s)", attempt)
            _reset_executor()
    else:  # pragma: no cover
        raise OSError("PDF workers unavailable")

    def keep(f: Future) -> None:
        if not f.cancelled() and f.exception() is None:
            _store(key, f.result())

    fut.add_done_callback(keep)  # also caches a render that finishes after the caller gave up
    try:
        return fut.result(timeout=s.pdf_timeout_s)
    except FuturesTimeout as e:
        log.warning("PDF render passed %.0f s; it will be cached when done", s.pdf_timeout_s)
        raise RenderTimeout from e
    except BrokenProcessPool as e:
        _reset_executor()
        raise OSError("PDF worker crashed") from e
