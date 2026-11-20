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

Cold starts (live check, 20 Nov): the workers started on the first download, and on the free host starting them took
longer than the time limit, so the first PDF after the API woke was always a 503. Now (`PDF_WARM`):

- the API starts the workers at boot and renders the latest saved report of each woman in the background (`warm_up`);
- a new report starts rendering as soon as it is saved (`prefetch`), so the download a few seconds later finds it done
  or joins the render already running (one render per report content, never two);
- workers run at a lower CPU priority, so warming never slows the pages a judge is opening.
"""

from __future__ import annotations

import hashlib
import json
import logging
import multiprocessing
import os
import threading
from collections import OrderedDict
from collections.abc import Callable, Iterable
from concurrent.futures import Future, ProcessPoolExecutor, wait
from concurrent.futures import TimeoutError as FuturesTimeout
from concurrent.futures.process import BrokenProcessPool

from app.config import get_settings

log = logging.getLogger("reprosense.pdf")
CACHE_MAX = 64  # ~30 kB each
_cache: OrderedDict[str, bytes] = OrderedDict()
_inflight: dict[str, Future] = {}  # renders still running, by report content
_lock = threading.Lock()
_pool: ProcessPoolExecutor | None = None


class RenderTimeout(Exception):
    """The PDF is still rendering; it will be cached when done."""


def _key(payload: dict) -> str:
    return hashlib.sha256(json.dumps(payload, sort_keys=True, default=str).encode()).hexdigest()


def _lower_priority() -> None:
    """Worker initializer: PDFs yield the CPU to the API's page requests (the free host has a fraction of one core)."""
    try:
        os.nice(10)
    except (AttributeError, OSError):  # pragma: no cover - no nice() on this platform
        pass


def _executor() -> ProcessPoolExecutor:
    global _pool
    with _lock:
        if _pool is None:
            # spawn, not fork: the API process has threads (pool, model calls) that must not be copied mid-state.
            _pool = ProcessPoolExecutor(
                get_settings().pdf_workers,
                mp_context=multiprocessing.get_context("spawn"),
                initializer=_lower_priority,
            )
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


def clear() -> None:
    """Forget cached and running renders (tests)."""
    with _lock:
        _cache.clear()
        _inflight.clear()


def _submit(key: str, payload: dict) -> Future:
    """The running render for this content, or a new one. Raises OSError if the workers cannot start."""
    from app.reports.pdf import render_pdf

    with _lock:
        running = _inflight.get(key)
    if running is not None:
        return running
    for attempt in (1, 2):
        try:
            fut: Future = _executor().submit(render_pdf, payload)
            break
        except BrokenProcessPool:  # a worker died (out of memory): start a fresh pool once
            log.warning("PDF worker pool broken; restarting it (attempt %s)", attempt)
            _reset_executor()
    else:  # pragma: no cover
        raise OSError("PDF workers unavailable")
    with _lock:
        _inflight[key] = fut

    def keep(f: Future) -> None:
        with _lock:
            if _inflight.get(key) is f:
                del _inflight[key]
        if not f.cancelled() and f.exception() is None:
            _store(key, f.result())

    fut.add_done_callback(keep)  # also caches a render that finishes after the caller gave up
    return fut


def prefetch(payload: dict) -> None:
    """Start rendering a report now, without waiting, so its download finds it ready. Never raises."""
    s = get_settings()
    if not s.pdf_warm or s.pdf_workers <= 0:
        return
    key = _key(payload)
    if cached(payload) is not None:
        return
    try:
        _submit(key, payload)
    except Exception as e:  # the download will try again and answer clearly
        log.warning("PDF prefetch not started: %s", type(e).__name__)


def warm_up(saved_reports: Callable[[], Iterable[dict]], wait_s: float = 120.0) -> None:
    """At boot: start every worker (loading WeasyPrint and the fonts), then render the latest saved reports."""
    from app.reports.pdf import warm

    s = get_settings()
    if not s.pdf_warm or s.pdf_workers <= 0:
        return
    try:
        futs = [_executor().submit(warm) for _ in range(s.pdf_workers)]
        done, _ = wait(futs, timeout=wait_s)
        log.info("PDF workers warm: %s of %s", sum(1 for f in done if f.exception() is None), len(futs))
        n = 0
        for payload in saved_reports():
            prefetch(payload)
            n += 1
        log.info("PDF warm-up queued %s saved reports", n)
    except Exception as e:  # the API still serves; the first PDF just takes longer
        log.warning("PDF warm-up skipped: %s", type(e).__name__)


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
    fut = _submit(key, payload)
    try:
        return fut.result(timeout=s.pdf_timeout_s)
    except FuturesTimeout as e:
        log.warning("PDF render passed %.0f s; it will be cached when done", s.pdf_timeout_s)
        raise RenderTimeout from e
    except BrokenProcessPool as e:
        _reset_executor()
        raise OSError("PDF worker crashed") from e
