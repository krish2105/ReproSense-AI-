"""Demo-safe mode (issue #24): with LLM_PROVIDER=none nothing reaches a model, even when a key is configured.

The Anthropic client is replaced by a tripwire that fails the test if it is ever built. The first test proves the
tripwire works (auto + key does build it), so the demo-safe test cannot pass by accident.
"""

import anthropic
import pytest

from app.ai import llm
from app.config import get_settings
from tests.conftest import login


class Tripwire(Exception):
    pass


@pytest.fixture
def model_env(monkeypatch):
    def boom(*a, **k):
        raise Tripwire("a model client was built")

    monkeypatch.setattr(anthropic, "Anthropic", boom)
    monkeypatch.setenv("ANTHROPIC_API_KEY", "demo-safe-test-not-a-key")

    def use(provider):
        monkeypatch.setenv("LLM_PROVIDER", provider)
        get_settings.cache_clear()

    yield use
    get_settings.cache_clear()


def test_tripwire_fires_when_a_model_would_be_used(model_env):
    model_env("auto")
    with pytest.raises(Tripwire):
        llm.get_llm()


def test_none_never_builds_a_model_client_on_the_demo_path(model_env, client):
    model_env("none")
    assert llm.get_llm().name == "none"
    assert client.get("/readyz").json()["llm"] == "none"
    for who in ("noura", "hessa", "fatima"):
        h = login(client, who)
        assert client.get("/v1/insights", headers=h).status_code == 200
        assert client.get("/v1/me/home", headers=h).status_code == 200
    r = client.post("/v1/assistant/ask", json={"question": "Is a 32-day cycle normal?", "lang": "en"}, headers=login(client, "noura"))
    assert r.status_code == 200 and r.json()["citations"]
