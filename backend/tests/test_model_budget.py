"""Request-path model calls finish or fall back inside the web's time limit (Atharva's 7 Nov handoff, step 4b).

The web gives up on an API call after 15 s (apps/web/src/lib/api/server.ts). With a model on, Home writes cards and the
assistant runs a second safety check, each a model call that could take 30 s with retries. A slow model must never
push Home past the web's limit, because the error screen would hide a red-flag card."""

import time

import pytest

from app.ai import llm
from app.config import get_settings
from tests.conftest import login


class SlowModel:
    """Stands in for Claude: answers nothing, slowly."""

    name = "claude"
    calls = 0

    def __init__(self, *args, **kwargs):
        pass

    def complete_json(self, system, user, max_tokens=2000):
        SlowModel.calls += 1
        time.sleep(4)
        return None


@pytest.fixture
def slow_model(monkeypatch):
    s = get_settings()
    monkeypatch.setattr(s, "llm_provider", "claude")
    monkeypatch.setattr(s, "anthropic_api_key", "test-key-not-real")
    if hasattr(s, "llm_request_budget_s"):  # a short budget keeps the test fast
        monkeypatch.setattr(s, "llm_request_budget_s", 1.5)
    monkeypatch.setattr(llm, "ClaudeProvider", SlowModel)
    SlowModel.calls = 0
    yield SlowModel


def test_home_shows_the_red_flag_inside_the_limit_with_a_slow_model(client, slow_model):
    h = login(client, "sara")
    t0 = time.monotonic()
    r = client.get("/v1/me/home", headers=h)
    elapsed = time.monotonic() - t0
    assert r.status_code == 200
    assert r.json()["red_flags"], "Sara's RF1 card must render"
    assert elapsed < 4.5, f"Home took {elapsed:.1f} s with a slow model"
    assert slow_model.calls >= 1, "the model was asked, then the template took over"


def test_the_assistant_gives_998_inside_the_limit_with_a_slow_model(client, slow_model):
    h = login(client, "amina")
    t0 = time.monotonic()
    r = client.post("/v1/assistant/ask", headers=h, json={"question": "heavy bleeding and I feel dizzy"})
    elapsed = time.monotonic() - t0
    assert r.status_code == 200 and r.json()["urgent"]["number"] == "998"
    assert elapsed < 4.5, f"the assistant took {elapsed:.1f} s with a slow model"


def test_the_request_budget_stays_under_the_web_limit():
    s = get_settings()
    assert s.llm_request_budget_s <= 12, "leave room under the web's 15 s limit for the rest of the request"
    assert s.llm_timeout_s * (s.llm_max_retries + 1) <= 20
