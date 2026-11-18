"""K3 pre-visit brief: "what changed since your last visit", from her own entries only.

Rules and data decide every fact; a model (when configured, and only when she allows AI) may reword, and the verifier
keeps only sentences supported by her data. Never a diagnosis or a probability; every line links to its entries."""

import json
import re
from datetime import UTC, date, datetime, timedelta

import pytest
from conftest import login

from app.ai.guards import violations
from app.config import DATA_DIR, get_settings
from app.services import previsit

REF = get_settings().demo_ref_date
ARABIC = re.compile(r"[؀-ۿ]")


@pytest.fixture(scope="module", autouse=True)
def fresh_seed():
    """Start from the seeded demo record: an earlier test file may have reviewed or shared Noura's record."""
    from app.db.seed import seed

    seed()


def brief(client, persona="noura", lang="en"):
    r = client.get(f"/v1/brief?lang={lang}", headers=login(client, persona))
    assert r.status_code == 200, r.text
    return r.json()


def lines_of(b, kind):
    return [ln for ln in b["lines"] if ln["kind"] == kind]


def noura_ids() -> set[str]:
    d = json.loads((DATA_DIR / "personas" / "noura.json").read_text())
    return {e["id"] for e in d["daily_logs"] + d["events"]}


def test_nouras_brief_lists_her_patterns_and_cycle_change_with_evidence(client):
    b = brief(client)
    assert b["since"] == (REF - timedelta(days=90)).isoformat() and b["since_basis"] == "default_90_days"
    assert b["written_by"] == "template" and b["lang"] == "en"
    patterns = {ln["rule_id"]: ln for ln in lines_of(b, "pattern")}
    assert {"OBS_IRREGULAR_CYCLES", "OBS_IRREGULAR_PLUS_ANDROGEN"} <= set(patterns)
    known = noura_ids()
    for ln in patterns.values():
        assert ln["status"] in ("new", "ongoing")
        assert ln["evidence"], f"{ln['rule_id']} links to no entries"
        assert all(e["entry_id"] in known and e["date"] for e in ln["evidence"])
        assert ln["sources"], "a pattern line carries its guideline sources"
    # Her cycles: the one that started on 9 Sep ran 56 days, the longest in her record (before: 42 to 55 days).
    (cycle,) = lines_of(b, "cycle")
    assert "56" in cycle["text"] and "42 to 55" in cycle["text"]
    assert "noura-e0100" in {e["entry_id"] for e in cycle["evidence"]}  # the 9 Sep period start
    # Pain: 7/10 on 4 Nov, higher than anything in the 6 months before the visit (5/10).
    (pain,) = lines_of(b, "pain")
    assert "7 out of 10" in pain["text"] and "5 out of 10" in pain["text"]
    assert [e["entry_id"] for e in pain["evidence"]][0] == "noura-e0120"
    labs = {ln["evidence"][0]["text"].split(":")[0]: ln for ln in lines_of(b, "lab")}
    assert "Total testosterone" in labs and "above the lab's range" in labs["Total testosterone"]["text"]
    assert all(ln["evidence"][0]["entry_id"].startswith("lab-") for ln in labs.values())
    questions = lines_of(b, "question")
    assert questions and all(q["rule_id"] and q["evidence"] for q in questions)


def test_last_visit_is_the_latest_share_or_review_else_90_days():
    shared = datetime(2026, 10, 1, 9, tzinfo=UTC)
    reviewed = datetime(2026, 10, 20, 9, tzinfo=UTC)
    assert previsit.last_visit(None, None, REF) == {"date": REF - timedelta(days=90), "basis": "default_90_days"}
    assert previsit.last_visit(shared, None, REF) == {"date": date(2026, 10, 1), "basis": "shared_report"}
    assert previsit.last_visit(shared, reviewed, REF) == {"date": date(2026, 10, 20), "basis": "clinician_review"}
    assert previsit.last_visit(reviewed + timedelta(days=5), reviewed, REF)["basis"] == "shared_report"
    # A real clock past the demo's "today" never puts the visit after it.
    assert previsit.last_visit(datetime(2027, 1, 5, tzinfo=UTC), None, REF)["date"] == REF


def test_sharing_a_report_then_a_clinician_review_moves_the_last_visit(client, reseed):
    h = login(client, "noura")
    report = client.post("/v1/reports", headers=h).json()
    assert client.post("/v1/shares", headers=h, json={"report_id": report["id"], "consent": True}).status_code == 200
    b = client.get("/v1/brief", headers=h).json()
    assert b["since_basis"] == "shared_report" and date.fromisoformat(b["since"]) <= REF
    assert lines_of(b, "pattern"), "patterns still in her record are listed"
    c = login(client, role="clinician")
    assert client.post("/v1/clinic/patients/noura/review", headers=c).status_code == 200
    b = client.get("/v1/brief", headers=login(client, "noura")).json()
    assert b["since_basis"] == "clinician_review"
    clinic = client.get("/v1/clinic/patients/noura", headers=c).json()["previsit_brief"]
    assert clinic["since_basis"] == "clinician_review" and clinic["since"] == b["since"]


@pytest.mark.parametrize("lang", ["en", "ar"])
def test_no_diagnostic_wording_in_any_brief(client, lang):
    for f in sorted((DATA_DIR / "personas").glob("*.json")):
        b = brief(client, f.stem, lang)
        for ln in b["lines"]:
            assert violations(ln["text"]) == [], f"{f.stem} {lang}: {ln['text']}"
            assert not re.search(r"\d\s*%", ln["text"]), "no percentages or probabilities"


class FakeLLM:
    name = "fake-llm"

    def __init__(self, extra=" Your hormones are out of balance and need treatment now."):
        self.calls = 0
        self.extra = extra

    def complete_json(self, system, user, max_tokens=2000):
        self.calls += 1
        lines = json.loads(user)["lines"]
        return {"lines": [{"id": ln["id"], "text": ln["text"] + self.extra} for ln in lines]}


def test_a_model_sentence_her_data_does_not_support_is_dropped(client, monkeypatch):
    fake = FakeLLM()
    monkeypatch.setattr(previsit, "get_llm", lambda: fake)
    template = brief(client, lang="ar")  # Arabic stays on the reviewed template: the model is not asked
    assert fake.calls == 0 and template["written_by"] == "template"
    b = brief(client)
    assert fake.calls == 1
    assert b["written_by"] == "fake-llm" and b["dropped_sentences"] >= len(lines_of(b, "pattern"))
    assert not any("out of balance" in ln["text"] for ln in b["lines"])
    assert any(ln["written_by"] == "fake-llm" for ln in b["lines"])
    # Her own questions and any urgent line are never sent for rewording.
    assert {ln["written_by"] for ln in b["lines"] if ln["kind"] in ("question", "red_flag")} <= {"template"}


def test_a_model_line_with_diagnostic_wording_falls_back_to_the_template(client, monkeypatch):
    plain = brief(client)
    fake = FakeLLM(extra=" This looks like PCOS.")
    monkeypatch.setattr(previsit, "get_llm", lambda: fake)
    b = brief(client)
    assert fake.calls == 1
    assert all(violations(ln["text"]) == [] for ln in b["lines"])
    assert [ln["text"] for ln in b["lines"]] == [ln["text"] for ln in plain["lines"]]


def test_with_ai_off_the_brief_is_the_template_and_no_model_is_called(client, reseed, monkeypatch):
    fake = FakeLLM()
    monkeypatch.setattr(previsit, "get_llm", lambda: fake)
    h = login(client, "noura")
    assert client.patch("/v1/consents", headers=h, json={"purpose": "assistant", "granted": False}).status_code == 200
    b = client.get("/v1/brief?lang=en", headers=h).json()
    assert fake.calls == 0
    assert b["ai_on"] is False and b["written_by"] == "template"
    assert {ln["written_by"] for ln in b["lines"]} == {"template"}
    assert lines_of(b, "pattern"), "rules still decide her patterns with AI off"


def test_the_clinician_patient_view_includes_the_brief(client):
    c = login(client, role="clinician")
    r = client.get("/v1/clinic/patients/noura", headers=c)
    assert r.status_code == 200
    b = r.json()["previsit_brief"]
    assert b["audience"] == "clinician" and b["lang"] == "en"
    titles = " ".join(ln["text"] for ln in lines_of(b, "pattern"))
    assert "Irregular cycle lengths" in titles  # clinician voice
    assert not re.search(r"\byou(r)?\b", " ".join(ln["text"] for ln in b["lines"] if ln["kind"] != "question"), re.I)
    assert all(ln["evidence"] for ln in lines_of(b, "pattern"))
    # The brief never opens a record she has not shared, and it is hers: a clinician cannot call the patient route.
    assert client.get("/v1/clinic/patients/amina", headers=c).status_code == 404
    assert client.get("/v1/brief", headers=c).status_code == 403


def test_arabic_brief(client):
    b = brief(client, lang="ar")
    assert b["lang"] == "ar"
    kinds = {ln["kind"] for ln in b["lines"]}
    assert {"pattern", "cycle", "pain", "lab", "question"} <= kinds
    for ln in b["lines"]:
        assert ARABIC.search(ln["text"]), ln["text"]
        for e in ln["evidence"]:
            if not e["entry_id"].startswith("lab-"):
                assert ARABIC.search(e["text"]), e["text"]
    (cycle,) = lines_of(b, "cycle")
    assert "56" in cycle["text"]
    titles = " ".join(ln["text"] for ln in lines_of(b, "pattern"))
    assert "أطوال دوراتك كانت غير منتظمة" in titles
