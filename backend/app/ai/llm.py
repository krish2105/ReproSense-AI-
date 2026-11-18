"""Provider-agnostic LLM client. Hackathon: Claude API on synthetic, de-identified data. Production: a UAE-hosted
model behind the same interface. With no key (or LLM_PROVIDER=none) every caller uses its deterministic template,
so the demo never depends on the network. Successful outputs are cached (app/ai/cache) for demo-safe mode."""

from __future__ import annotations

import hashlib
import json
import logging
import re
import time
from collections.abc import Iterator
from concurrent.futures import ThreadPoolExecutor
from concurrent.futures import TimeoutError as FuturesTimeout
from contextlib import contextmanager
from contextvars import ContextVar
from pathlib import Path
from typing import Protocol

from app.config import get_settings

log = logging.getLogger("reprosense.llm")
CACHE_DIR = Path(__file__).parent / "cache"

# One time budget for all model calls inside one API request (set by app.security.middleware.ModelBudget).
_DEADLINE: ContextVar[float | None] = ContextVar("llm_deadline", default=None)
_POOL = ThreadPoolExecutor(max_workers=8, thread_name_prefix="llm")
MIN_CALL_S = 0.5  # with less time left than this, do not start a model call
PHOTO_TIMEOUT_S = 14.0  # reading a photo: under the web's 15 s limit for one API call


@contextmanager
def request_budget(seconds: float) -> Iterator[None]:
    token = _DEADLINE.set(time.monotonic() + seconds)
    try:
        yield
    finally:
        _DEADLINE.reset(token)


def budget_left() -> float | None:
    """Seconds left in this request's model budget, or None outside a request (no limit beyond the call timeout)."""
    deadline = _DEADLINE.get()
    return None if deadline is None else deadline - time.monotonic()


class LLM(Protocol):
    name: str

    def complete_json(self, system: str, user: str, max_tokens: int = 2000) -> dict | None: ...


def _key(system: str, user: str) -> str:
    return hashlib.sha256((system + "\x00" + user).encode()).hexdigest()[:32]


def cache_get(system: str, user: str) -> dict | None:
    f = CACHE_DIR / f"{_key(system, user)}.json"
    return json.loads(f.read_text()) if f.exists() else None


def cache_put(system: str, user: str, value: dict) -> None:
    CACHE_DIR.mkdir(exist_ok=True)
    (CACHE_DIR / f"{_key(system, user)}.json").write_text(json.dumps(value, ensure_ascii=False, indent=1))


def _parse_json(text: str) -> dict | None:
    m = re.search(r"\{.*\}", text or "", re.S)
    if not m:
        return None
    try:
        return json.loads(m.group(0))
    except json.JSONDecodeError:
        return None


class NoLLM:
    name = "none"
    supports_images = False

    def complete_json(self, system: str, user: str, max_tokens: int = 2000) -> dict | None:
        return cache_get(system, user)  # demo-safe: answers cached from an earlier Claude run, if any


class ClaudeProvider:
    """Claude via the official Anthropic SDK. Refusal fallbacks are enabled (server-side, routed by category)."""

    name = "claude"
    supports_images = False  # this build sends photos through OpenRouter only

    def __init__(self, api_key: str, model: str):
        import anthropic

        self._anthropic = anthropic
        s = get_settings()
        self.client = anthropic.Anthropic(api_key=api_key, max_retries=s.llm_max_retries, timeout=s.llm_timeout_s)
        self.model = model

    def complete_json(self, system: str, user: str, max_tokens: int = 2000) -> dict | None:
        cached = cache_get(system, user)
        if cached is not None:
            return cached
        a = self._anthropic
        try:
            resp = self.client.beta.messages.create(
                model=self.model,
                max_tokens=max_tokens,
                system=system,
                messages=[{"role": "user", "content": user}],
                output_config={"effort": "low"},
                betas=["server-side-fallback-2026-07-01"],
                fallbacks="default",
            )
        except a.RateLimitError:
            log.warning("LLM rate limited; using template")
            return None
        except a.APIStatusError as e:
            log.warning("LLM API error %s; using template", e.status_code)
            return None
        except a.APIConnectionError:
            log.warning("LLM unreachable; using template")
            return None
        if resp.stop_reason == "refusal":
            return None
        if resp.stop_reason == "max_tokens":
            log.warning("LLM reply cut at max_tokens=%s; using template", max_tokens)
            return None
        text = "".join(b.text for b in resp.content if getattr(b, "type", "") == "text")
        value = _parse_json(text)
        if value is not None:
            cache_put(system, user, value)
        return value


class OpenRouterProvider:
    """A model through OpenRouter (the hackathon's AI credits), in the OpenAI chat-completions format. Same contract as
    ClaudeProvider: any error, refusal, cut-off or non-JSON reply returns None, so the caller's template answers. The
    key travels only in the Authorization header; synthetic, redacted text only."""

    name = "openrouter"
    supports_images = True
    URL = "https://openrouter.ai/api/v1/chat/completions"

    def __init__(self, api_key: str, model: str, client=None):
        import httpx

        s = get_settings()
        self.model = model
        self._httpx = httpx
        self.client = client or httpx.Client(timeout=s.llm_timeout_s)
        self._headers = {
            "Authorization": f"Bearer {api_key}",
            "HTTP-Referer": "https://reprosense.vercel.app",
            "X-Title": "ReproSense (HealthX Ajyal, synthetic data)",
        }

    def complete_json(self, system: str, user: str, max_tokens: int = 2000) -> dict | None:
        cached = cache_get(system, user)
        if cached is not None:
            return cached
        return self._send(system, user, user, max_tokens)

    def complete_json_image(
        self, system: str, user: str, image: bytes, mime: str, max_tokens: int = 2000
    ) -> dict | None:
        """The same call with one image (a photographed lab report), sent as a base64 data URL."""
        import base64

        key = user + "\x00" + hashlib.sha256(image).hexdigest()
        cached = cache_get(system, key)
        if cached is not None:
            return cached
        url = f"data:{mime};base64,{base64.b64encode(image).decode()}"
        content = [{"type": "text", "text": user}, {"type": "image_url", "image_url": {"url": url}}]
        return self._send(system, content, key, max_tokens, timeout=PHOTO_TIMEOUT_S)

    def _send(self, system: str, content, cache_key: str, max_tokens: int, timeout: float | None = None) -> dict | None:
        body = {
            "model": self.model,
            "max_tokens": max_tokens,
            "messages": [{"role": "system", "content": system}, {"role": "user", "content": content}],
        }
        try:
            extra = {"timeout": timeout} if timeout else {}
            resp = self.client.post(self.URL, json=body, headers=self._headers, **extra)
        except self._httpx.HTTPError as e:
            log.warning("OpenRouter unreachable (%s); using template", type(e).__name__)
            return None
        if resp.status_code != 200:
            log.warning("OpenRouter error %s; using template", resp.status_code)
            return None
        try:
            choice = resp.json()["choices"][0]
            text = choice["message"]["content"] or ""
        except (ValueError, KeyError, IndexError, TypeError):
            log.warning("OpenRouter reply had no message; using template")
            return None
        if choice.get("finish_reason") == "length":
            log.warning("OpenRouter reply cut at max_tokens=%s; using template", max_tokens)
            return None
        value = _parse_json(text)
        if value is not None:
            cache_put(system, cache_key, value)
        return value


class Budgeted:
    """Runs a provider's call inside the request's model budget. Past the budget it returns None, so the caller uses
    its deterministic template and Home never waits past the web's limit with a red-flag card hidden behind it."""

    def __init__(self, inner: LLM):
        self.inner = inner
        self.name = inner.name
        self.supports_images = getattr(inner, "supports_images", False)

    def complete_json(self, system: str, user: str, max_tokens: int = 2000) -> dict | None:
        cached = cache_get(system, user)
        if cached is not None:
            return cached
        left = budget_left()
        if left is None:
            return self.inner.complete_json(system, user, max_tokens)
        if left < MIN_CALL_S:
            log.warning("model budget for this request is spent; using template")
            return None
        future = _POOL.submit(self.inner.complete_json, system, user, max_tokens)
        try:
            return future.result(timeout=left)
        except FuturesTimeout:
            log.warning("model call ran past this request's budget; using template")
            return None

    def complete_json_image(
        self, system: str, user: str, image: bytes, mime: str, max_tokens: int = 2000
    ) -> dict | None:
        """Reading a photo is the request's only model call and she is waiting for it, so it gets its own timeout
        (the provider's) rather than the shared page budget. A provider without image support returns None."""
        read = getattr(self.inner, "complete_json_image", None)
        return read(system, user, image, mime, max_tokens) if read else None


def get_llm() -> LLM:
    s = get_settings()
    use = s.llm_provider
    if use == "auto":
        use = "claude" if s.anthropic_api_key else "openrouter" if s.openrouter_api_key else "none"
    if use == "claude" and s.anthropic_api_key:
        return Budgeted(ClaudeProvider(s.anthropic_api_key, s.llm_model))
    if use == "openrouter" and s.openrouter_api_key:
        return Budgeted(OpenRouterProvider(s.openrouter_api_key, s.openrouter_model))
    return NoLLM()
