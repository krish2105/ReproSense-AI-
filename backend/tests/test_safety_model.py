"""The second safety check by the language model (app/agents/safety.py model_check).

Held-out round 4 showed the word checks alone miss messages like "cutting again. deeper this time". With a model
configured, a second check reads the redacted message and can add the crisis or urgent route. It never removes a route,
never sees names or phone numbers, and any error or odd reply leaves the word checks in charge. Without a model it is off.
"""

import pytest

from app.agents import assistant, safety
from app.ai.llm import NoLLM


class RouterLLM:
    """Answers the safety router prompt with a fixed decision; returns nothing for the writer prompt (extractive answer)."""

    name = "fake-router"

    def __init__(self, route=None, raises=False):
        self.route, self.raises, self.seen = route, raises, []

    def complete_json(self, system, user, max_tokens=2000):
        if system != safety.MODEL_SYSTEM:
            return None
        self.seen.append(user)
        if self.raises:
            raise RuntimeError("model timed out")
        return self.route


def test_without_a_model_the_second_check_is_off():
    assert safety.model_check("cutting again. deeper this time", NoLLM()) is None


def test_the_model_routes_a_crisis_the_word_checks_miss(monkeypatch):
    q = "cutting again. deeper this time"
    assert not assistant._crisis(q), "held-out round 4: the word checks miss this"
    monkeypatch.setattr(assistant, "get_llm", lambda: RouterLLM({"crisis": True, "urgent": None}))
    out = assistant.answer(q, "en")
    assert out["crisis"] and out["urgent"]["number"] == "998"
    assert out["answer"] == assistant.URGENT_TEXT["en"]["crisis"] and out["sentences"] == []
    assert [c["source_id"] for c in out["citations"]] == ["nice_cg192"]
    assert any("second check by the language model" in s["detail"] for s in out["trace"])


def test_the_model_adds_urgent_guidance_the_word_checks_miss(monkeypatch):
    q = "33 weeks, tightenings every 5 min since 2am"
    assert assistant._urgent_kind(q) is None
    monkeypatch.setattr(assistant, "get_llm", lambda: RouterLLM({"crisis": False, "urgent": "pregnancy"}))
    out = assistant.answer(q, "en")
    assert out["urgent"]["kind"] == "pregnancy" and out["urgent"]["number"] == "998"
    assert out["answer"].startswith(assistant.URGENT_TEXT["en"]["pregnancy"])
    assert out["citations"][0]["source_id"] == "nhs_pregnancy_urgent"


def test_the_model_can_never_remove_a_route(monkeypatch):
    fake = RouterLLM({"crisis": False, "urgent": None})
    monkeypatch.setattr(assistant, "get_llm", lambda: fake)
    assert assistant.answer("I want to kill myself", "en")["crisis"]
    assert fake.seen == [], "a crisis the word checks find never waits on the model"
    assert assistant.answer("I'm pregnant and bleeding with bad pain", "en")["urgent"]["kind"] == "pregnancy"


def test_an_everyday_question_stays_an_answer(monkeypatch):
    monkeypatch.setattr(assistant, "get_llm", lambda: RouterLLM({"crisis": False, "urgent": None}))
    out = assistant.answer("How long is a normal cycle?", "en")
    assert not out["crisis"] and out["urgent"] is None and out["sentences"] and out["citations"]


@pytest.mark.parametrize(
    "reply,expected",
    [
        (None, None),
        ({"crisis": False, "urgent": "cancer"}, {"crisis": False, "urgent": None}),
        ({"crisis": "yes", "urgent": "Bleed"}, {"crisis": True, "urgent": "bleed"}),
        ({"urgent": ["pain"]}, {"crisis": False, "urgent": None}),
    ],
)
def test_odd_replies_never_invent_a_route_and_lean_to_safety(reply, expected):
    assert safety.model_check("a message", RouterLLM(reply)) == expected


def test_a_model_error_leaves_the_word_checks_in_charge(monkeypatch):
    assert safety.model_check("a message", RouterLLM(raises=True)) is None
    monkeypatch.setattr(assistant, "get_llm", lambda: RouterLLM(raises=True))
    assert assistant.answer("I want to end my life", "en")["crisis"]


def test_the_model_sees_redacted_text_only():
    fake = RouterLLM({"crisis": False, "urgent": None})
    safety.model_check("Noura here, call me on 050 123 4567 or noura@example.com", fake, ["Noura (fictional)"])
    sent = fake.seen[0]
    assert "Noura" not in sent and "050 123 4567" not in sent and "@" not in sent
    assert sent.startswith("<message>") and sent.endswith("</message>"), (
        "the message is marked as data, not instructions"
    )
