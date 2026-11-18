"""OpenRouter provider (build week, 18 Nov): the hackathon's AI credits come as an OpenRouter key.

OpenRouter speaks the OpenAI chat-completions format. The provider sits behind the same interface as Claude, so every
caller keeps its deterministic template when the model fails, is slow or answers badly. The network is replaced by
httpx.MockTransport: nothing here leaves the machine.
"""

import json

import httpx
import pytest

from app.ai import llm
from app.config import get_settings

SYSTEM = "Return JSON only."
USER = "Question: what is PCOS?"


def provider(handler, model="test/model-a"):
    client = httpx.Client(transport=httpx.MockTransport(handler))
    return llm.OpenRouterProvider("or-test-not-a-key", model, client=client)


def reply(content: str, finish: str = "stop", status: int = 200):
    body = {"choices": [{"message": {"role": "assistant", "content": content}, "finish_reason": finish}]}
    return lambda request: httpx.Response(status, json=body)


@pytest.fixture(autouse=True)
def no_cache(monkeypatch, tmp_path):
    monkeypatch.setattr(llm, "CACHE_DIR", tmp_path / "cache")


def test_it_sends_a_chat_completion_with_the_key_in_the_header_only():
    seen = {}

    def handler(request: httpx.Request):
        seen["url"] = str(request.url)
        seen["auth"] = request.headers.get("authorization")
        seen["body"] = json.loads(request.content)
        return reply('{"answer": "ok"}')(request)

    out = provider(handler).complete_json(SYSTEM, USER, max_tokens=300)
    assert out == {"answer": "ok"}
    assert seen["url"] == "https://openrouter.ai/api/v1/chat/completions"
    assert seen["auth"] == "Bearer or-test-not-a-key"
    body = seen["body"]
    assert body["model"] == "test/model-a" and body["max_tokens"] == 300
    assert body["messages"] == [{"role": "system", "content": SYSTEM}, {"role": "user", "content": USER}]
    assert "or-test-not-a-key" not in json.dumps(body)


def test_json_wrapped_in_prose_or_a_code_fence_is_still_read():
    out = provider(reply('Here you go:\n```json\n{"sentences": []}\n```')).complete_json(SYSTEM, USER)
    assert out == {"sentences": []}


@pytest.mark.parametrize(
    "handler",
    [
        reply("", status=429),  # rate limited
        reply("", status=500),  # provider error
        reply("no json at all"),  # not JSON
        reply('{"answer": "cut', finish="length"),  # cut at max_tokens
    ],
    ids=["429", "500", "not-json", "cut-off"],
)
def test_any_failure_returns_none_so_the_template_answers(handler):
    assert provider(handler).complete_json(SYSTEM, USER) is None


def test_a_network_error_returns_none():
    def handler(request):
        raise httpx.ConnectError("offline")

    assert provider(handler).complete_json(SYSTEM, USER) is None


def test_a_good_answer_is_cached_and_reused_without_a_second_call():
    calls = []

    def handler(request):
        calls.append(1)
        return reply('{"answer": "cached"}')(request)

    p = provider(handler)
    assert p.complete_json(SYSTEM, USER) == {"answer": "cached"}
    assert p.complete_json(SYSTEM, USER) == {"answer": "cached"}
    assert len(calls) == 1


@pytest.fixture
def env(monkeypatch):
    def use(**values):
        for k in ("LLM_PROVIDER", "ANTHROPIC_API_KEY", "OPENROUTER_API_KEY", "OPENROUTER_MODEL"):
            monkeypatch.delenv(k, raising=False)
        for k, v in values.items():
            monkeypatch.setenv(k, v)
        get_settings.cache_clear()
        return llm.get_llm()

    yield use
    get_settings.cache_clear()


def test_auto_uses_openrouter_when_only_an_openrouter_key_is_set(env):
    m = env(LLM_PROVIDER="auto", ANTHROPIC_API_KEY="", OPENROUTER_API_KEY="or-test", OPENROUTER_MODEL="test/m")
    assert m.name == "openrouter"
    assert m.inner.model == "test/m"


def test_explicit_openrouter_needs_its_key(env):
    assert env(LLM_PROVIDER="openrouter", ANTHROPIC_API_KEY="", OPENROUTER_API_KEY="or-test").name == "openrouter"
    assert env(LLM_PROVIDER="openrouter", ANTHROPIC_API_KEY="", OPENROUTER_API_KEY="").name == "none"


def test_none_stays_none_even_with_an_openrouter_key(env):
    """Demo-safe mode (issue #24) holds for the new provider too."""
    assert env(LLM_PROVIDER="none", OPENROUTER_API_KEY="or-test").name == "none"
