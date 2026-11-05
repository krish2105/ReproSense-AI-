"""Provider-agnostic LLM client. Hackathon: Claude API on synthetic, de-identified data. Production: a UAE-hosted
model behind the same interface. With no key (or LLM_PROVIDER=none) every caller uses its deterministic template,
so the demo never depends on the network. Successful outputs are cached (app/ai/cache) for demo-safe mode."""

from __future__ import annotations

import hashlib
import json
import logging
import re
from pathlib import Path
from typing import Protocol

from app.config import get_settings

log = logging.getLogger("reprosense.llm")
CACHE_DIR = Path(__file__).parent / "cache"


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

    def complete_json(self, system: str, user: str, max_tokens: int = 2000) -> dict | None:
        return cache_get(system, user)  # demo-safe: answers cached from an earlier Claude run, if any


class ClaudeProvider:
    """Claude via the official Anthropic SDK. Refusal fallbacks are enabled (server-side, routed by category)."""

    name = "claude"

    def __init__(self, api_key: str, model: str):
        import anthropic

        self._anthropic = anthropic
        self.client = anthropic.Anthropic(api_key=api_key, max_retries=2, timeout=30.0)
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
        text = "".join(b.text for b in resp.content if getattr(b, "type", "") == "text")
        value = _parse_json(text)
        if value is not None:
            cache_put(system, user, value)
        return value


def get_llm() -> LLM:
    s = get_settings()
    use = s.llm_provider
    if use == "auto":
        use = "claude" if s.anthropic_api_key else "none"
    if use == "claude" and s.anthropic_api_key:
        return ClaudeProvider(s.anthropic_api_key, s.llm_model)
    return NoLLM()
