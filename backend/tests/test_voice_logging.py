"""Voice logging (build week K2, 18 Nov): she speaks, the browser turns it into text, and POST /v1/logs/parse fills
the log form for her to check.

The rule-based reader always runs. With a model configured and her AI switch on, the model may also read the text
(Gulf Arabic and English) into the fixed fields; it can only add to what the rules found, never remove, and anything
outside the fixed lists is dropped. With AI off or no model, only the rules run and nothing is sent anywhere. Nothing
is saved until she confirms, but a red flag in the parsed entry shows its 998 guidance at once.
"""

import pytest
from conftest import login

from app.ai import llm
from app.db import SYSTEM, session


class FakeModel:
    name = "fake"

    def __init__(self, reply):
        self.reply, self.calls = reply, []

    def complete_json(self, system, user, max_tokens=2000):
        self.calls.append({"system": system, "user": user})
        return self.reply


@pytest.fixture
def model(monkeypatch):
    def use(reply):
        fake = FakeModel(reply)
        monkeypatch.setattr(llm, "get_llm", lambda: fake)
        return fake

    return use


@pytest.fixture
def no_model(monkeypatch):
    monkeypatch.setattr(llm, "get_llm", lambda: llm.NoLLM())


def parse(client, h, text, **kw):
    r = client.post("/v1/logs/parse", headers=h, json={"text": text, **kw})
    assert r.status_code == 200, r.text
    return r.json()


def test_english_without_a_model_uses_the_rules(client, reseed, no_model):
    p = parse(client, login(client, "noura"), "Heavy period today, cramps and a headache, pain 7/10, missed work")
    assert p["reader"] == "rules"
    assert p["flow"] == "heavy" and p["pain"] == 7 and p["impact"] == "missed work or study"
    assert {"cramps", "headache"} <= set(p["symptoms"])
    assert p["red_flags"] == [] and p["crisis"] is False


def test_arabic_without_a_model_uses_the_rules(client, reseed, no_model):
    p = parse(client, login(client, "noura"), "عندي مغص وصداع ونزيف غزير اليوم", lang="ar")
    assert p["reader"] == "rules" and p["flow"] == "heavy"
    assert {"cramps", "headache"} <= set(p["symptoms"])


def test_the_model_reads_gulf_arabic_into_the_fixed_fields(client, reseed, model):
    fake = model(
        {"flow": "medium", "pain": 6, "symptoms": ["cramps", "back pain"], "impact": "stayed in bed", "mood": "in pain"}
    )
    p = parse(client, login(client, "noura"), "بطني يعورني وايد وظهري بعد، ما قدرت أقوم من الفراش", lang="ar")
    assert len(fake.calls) == 1 and p["reader"] == "model"
    assert p["flow"] == "medium" and p["pain"] == 6 and p["impact"] == "stayed in bed" and p["mood"] == "in pain"
    assert {"cramps", "back pain"} <= set(p["symptoms"])


def test_the_model_can_only_add_and_out_of_list_values_are_dropped(client, reseed, model):
    model({"flow": "torrential", "pain": 15, "symptoms": ["vertigo", "nausea"], "impact": "none", "mood": "furious"})
    p = parse(client, login(client, "noura"), "I feel dizzy and sick, pain 4 out of 10")
    assert "dizziness" in p["symptoms"], "a sign the rules found is never removed by the model"
    assert "nausea" in p["symptoms"] and "vertigo" not in p["symptoms"]
    assert p["pain"] == 4, "the rules' number stands; 15 is outside 0-10"
    assert p["flow"] is None and p["mood"] is None


def test_a_model_error_falls_back_to_the_rules(client, reseed, model):
    model(None)
    p = parse(client, login(client, "noura"), "cramps and bloating")
    assert p["reader"] == "rules" and {"cramps", "bloating"} <= set(p["symptoms"])


def test_with_ai_off_nothing_reaches_a_model(client, reseed, model):
    fake = model({"symptoms": ["cramps"]})
    h = login(client, "noura")
    assert client.patch("/v1/consents", headers=h, json={"purpose": "assistant", "granted": False}).status_code == 200
    p = parse(client, h, "cramps and a headache")
    assert fake.calls == [] and p["reader"] == "rules"


def test_her_name_is_redacted_before_the_model_reads_it(client, reseed, model):
    fake = model({"symptoms": []})
    h = login(client, "noura")
    alias = client.get("/v1/me", headers=h).json()["alias"]
    parse(client, h, f"{alias.split()[0]} here, cramps again")
    assert alias.split()[0] not in fake.calls[0]["user"]


def test_a_red_flag_in_the_parsed_entry_shows_998_before_anything_is_saved(client, reseed, no_model):
    h = login(client, "noura")
    with session(SYSTEM) as cur:
        cur.execute("SELECT count(*) AS n FROM daily_logs WHERE profile_id='noura'")
        before = cur.fetchone()["n"]
    p = parse(client, h, "bleeding a lot, soaking through pads, and I feel dizzy")
    assert [c["observation_id"] for c in p["red_flags"]] == ["RF1_heavy_bleeding_with_dizziness"]
    assert "998" in p["red_flags"][0]["summary"] or any("998" in s for s in p["red_flags"][0]["what_to_consider"])
    with session(SYSTEM) as cur:
        cur.execute("SELECT count(*) AS n FROM daily_logs WHERE profile_id='noura'")
        assert cur.fetchone()["n"] == before, "nothing is saved until she confirms"


def test_crisis_words_in_the_note_open_the_support_card(client, reseed, no_model):
    p = parse(client, login(client, "noura"), "I want to end my life")
    assert p["crisis"] is True
