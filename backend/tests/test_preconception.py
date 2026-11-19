"""Y1 · Planning-a-pregnancy checklist for the Trying stage (build week, 18 Nov 2026)."""

from __future__ import annotations

import copy
import re

from app.ai.guards import violations
from app.rag.kb import sources
from app.services import preconception
from tests.conftest import login

TRYING = {"profile": {"life_stage": "trying_to_conceive", "trying_to_conceive": True}, "events": []}


def test_five_items_each_with_a_known_source():
    c = preconception.checklist(TRYING, set())
    assert [i["id"] for i in c["items"]] == [
        "folic_acid",
        "premarital_results",
        "rubella",
        "cycle_checkup",
        "fertility_check",
    ]
    known = sources()
    for item in c["items"]:
        assert item["sources"] and all(s in known for s in item["sources"]), item
        assert len(item["source_links"]) == len(item["sources"])  # every source resolves to a title and a link
        assert all(link["url"].startswith("https://") for link in item["source_links"])


def test_new_sources_are_cite_only_with_summaries_in_both_languages():
    from app.config import SUMMARIES_DIR
    from app.rag.kb import _sections, chunks

    for sid in ("doh_premarital_screening_2024", "ukhsa_rubella_before_pregnancy"):
        assert not sources()[sid].answers  # never quoted in assistant answers, so the 60-question eval is unchanged
        assert not [c for c in chunks() if c.source_id == sid]
        sec = _sections((SUMMARIES_DIR / f"{sid}.md").read_text(encoding="utf-8"))
        assert sec.get("en") and sec.get("ar")
        assert not violations(sec["en"]) and not violations(sec["ar"])


def test_only_for_the_trying_stage():
    assert preconception.checklist({"profile": {"life_stage": "periods"}, "events": []}, set()) is None
    assert preconception.checklist({"profile": {"life_stage": "pregnancy"}, "events": []}, set()) is None
    assert preconception.checklist({"profile": {"trying_to_conceive": True}, "events": []}, set()) is not None


def test_relevant_only_when_her_own_rule_fires():
    c = preconception.checklist(TRYING, {"OBS_TTC_FERTILITY_ASSESSMENT"})
    rel = {i["id"]: i["relevant"] for i in c["items"]}
    assert rel == {
        "folic_acid": False,
        "premarital_results": False,
        "rubella": False,
        "cycle_checkup": False,
        "fertility_check": True,
    }
    rel = {i["id"]: i["relevant"] for i in preconception.checklist(TRYING, {"OBS_IRREGULAR_CYCLES"})["items"]}
    assert rel["cycle_checkup"] and not rel["fertility_check"]


def test_ticks_come_from_her_events():
    b = copy.deepcopy(TRYING)
    b["events"].append(
        {"id": "x", "type": "preconception_item", "date": "2026-11-20", "details": {"item": "folic_acid"}}
    )
    b["events"].append({"id": "y", "type": "preconception_item", "date": "2026-11-20", "details": {"item": "nope"}})
    c = preconception.checklist(b, set())
    assert c["done"] == 1 and c["total"] == 5
    assert next(i for i in c["items"] if i["id"] == "folic_acid")["done_on"] == "2026-11-20"


def test_mariam_sees_it_on_home_and_her_ticks_are_saved(client, reseed):
    h = login(client, "mariam")
    home = client.get("/v1/me/home", headers=h).json()
    pc = home["preconception"]
    assert pc and pc["done"] == 0
    assert next(i for i in pc["items"] if i["id"] == "fertility_check")["relevant"]  # OBS_TTC_FERTILITY_ASSESSMENT

    r = client.post("/v1/preconception/folic_acid", headers=h, json={"done": True})
    assert r.status_code == 200 and r.json()["done"] == 1
    assert client.post("/v1/preconception/folic_acid", headers=h, json={"done": True}).json()["done"] == 1  # once
    assert client.get("/v1/me/home", headers=h).json()["preconception"]["done"] == 1  # saved to her record

    audit = client.get("/v1/privacy", headers=h).json()["audit"]
    assert any(a["action"] == "preconception_tick" for a in audit)  # in "who saw or changed my data"
    timeline = client.get("/v1/timeline", headers=h).json()
    assert not [e for e in timeline["events"] if e["type"] == "preconception_item"]  # a note, not a health event

    assert client.post("/v1/preconception/folic_acid", headers=h, json={"done": False}).json()["done"] == 0


def test_refusals(client):
    h = login(client, "mariam")
    assert client.post("/v1/preconception/surgery", headers=h, json={"done": True}).status_code == 422
    assert client.post("/v1/preconception/folic_acid", headers=h, json={"done": "yes", "x": 1}).status_code == 422
    noura = login(client, "noura")  # not trying to conceive
    assert client.post("/v1/preconception/folic_acid", headers=noura, json={"done": True}).status_code == 404
    assert client.get("/v1/me/home", headers=noura).json()["preconception"] is None
    clinician = login(client, role="clinician")
    assert client.post("/v1/preconception/folic_acid", headers=clinician, json={"done": True}).status_code == 403


def test_web_copy_is_non_diagnostic_and_never_says_must():
    import json
    from pathlib import Path

    root = Path(__file__).resolve().parents[2] / "apps" / "web" / "messages"
    for lang in ("en", "ar"):
        block = json.loads((root / f"{lang}.json").read_text(encoding="utf-8"))["preconception"]
        text = json.dumps(block, ensure_ascii=False)
        assert not violations(text), violations(text)
        if lang == "en":  # the items never tell her she must (the note says the opposite: "Nothing here is required")
            items = json.dumps(block["items"], ensure_ascii=False)
            assert not re.search(r"\b(must|have to|you need to|required)\b", items, re.I), items
        assert set(block["items"]) == set(preconception.IDS)
