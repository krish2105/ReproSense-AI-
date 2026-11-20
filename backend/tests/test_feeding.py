"""Feeding log after a birth (build week D2, 20 Nov 2026).

She taps a feed (breast, expressed milk or formula) and can mark a worry (latch, pain, fewer wet nappies). Home shows
her last 7 days. A worry gets a fixed line to talk to her midwife, nurse or doctor, with its source (NHS, read 20 Nov
2026: "Breastfeeding: is my baby getting enough milk?" and "Common breastfeeding problems"). Information only: no
amounts, no targets, no score, no red flag for the baby.
"""

import re
from datetime import date, timedelta

from conftest import login

from app.ai.guards import violations
from app.rag.kb import sources
from app.services import feeding

BIRTH = date(2026, 9, 20)
REF = date(2026, 11, 22)
ARABIC = re.compile(r"[؀-ۿ]")


def bundle(feeds=(), birth=BIRTH):
    ev = [{"id": "e-birth", "type": "delivery", "date": birth.isoformat(), "details": {}}] if birth else []
    return {"profile": {}, "events": ev, "feeds": list(feeds)}


def feed(day: date, kind="breast", worries=(), time="10:00"):
    return {
        "id": f"f-{day}-{time}-{kind}",
        "date": day.isoformat(),
        "time": time,
        "kind": kind,
        "worries": list(worries),
    }


# ---------- the service ----------
def test_shown_only_in_the_first_12_months_after_a_birth():
    assert feeding.summary(bundle(birth=None), REF) is None
    assert feeding.summary(bundle(), REF) is not None
    assert feeding.summary(bundle(birth=date(2025, 11, 22)), REF) is None  # 12 months to the day
    assert feeding.summary(bundle(birth=date(2025, 11, 23)), REF) is not None


def test_the_last_7_days_are_counted_by_kind_oldest_first():
    feeds = [
        feed(REF, "breast", time="06:00"),
        feed(REF, "breast", time="09:00"),
        feed(REF, "formula", time="13:00"),
        feed(REF - timedelta(days=2), "expressed"),
        feed(REF - timedelta(days=7), "breast"),  # 8 days ago: outside the window
        feed(REF + timedelta(days=1), "breast"),  # never counted
    ]
    s = feeding.summary(bundle(feeds), REF)
    days = s["days"]
    assert [d["date"] for d in days] == [(REF - timedelta(days=i)).isoformat() for i in range(6, -1, -1)]
    assert days[-1] == {"date": REF.isoformat(), "breast": 2, "expressed": 0, "formula": 1, "total": 3}
    assert days[-3]["expressed"] == 1 and days[-3]["total"] == 1
    assert sum(d["total"] for d in days) == 4
    assert s["today"] == 3 and s["last"]["time"] == "13:00" and s["last"]["kind"] == "formula"


def test_no_worry_no_support_line():
    s = feeding.summary(bundle([feed(REF)]), REF)
    assert s["worries"] == []


def test_a_worry_in_the_last_7_days_returns_a_sourced_line_to_talk_to_her_care_team():
    feeds = [feed(REF - timedelta(days=1), worries=["pain"]), feed(REF, worries=["pain", "few_wet_nappies"])]
    s = feeding.summary(bundle(feeds), REF)
    by_id = {w["id"]: w for w in s["worries"]}
    assert list(by_id) == ["pain", "few_wet_nappies"]  # each worry once, in a fixed order
    assert by_id["pain"]["last_on"] == REF.isoformat() and by_id["pain"]["times"] == 2
    known = sources()
    for w in s["worries"]:
        assert w["sources"] and all(sid in known for sid in w["sources"]), w["id"]
        assert [x["source_id"] for x in w["source_links"]] == w["sources"]
        assert re.search(r"midwife|nurse|doctor", w["text"]), w["id"]
    old = feeding.summary(bundle([feed(REF - timedelta(days=9), worries=["latch"])]), REF)
    assert old["worries"] == []


def test_support_lines_are_plain_never_diagnostic_and_translated():
    every = [feed(REF, worries=list(feeding.WORRIES))]
    en = feeding.summary(bundle(every), REF, "en")
    ar = feeding.summary(bundle(every), REF, "ar")
    assert [w["id"] for w in en["worries"]] == list(feeding.WORRIES)
    for a, b in zip(en["worries"], ar["worries"], strict=True):
        assert not violations(a["text"]) and not violations(b["text"]), a["id"]
        assert ARABIC.search(b["text"]) and a["text"] != b["text"], a["id"]
        # information only: no amounts, no medicines, no "normal"/"enough" verdicts
        assert not re.search(r"\b(ml|oz|mg|tablet|paracetamol|ibuprofen|normal|enough)\b", a["text"], re.I), a["id"]
    assert not violations(en["note"]) and ARABIC.search(ar["note"])


def test_new_sources_are_cite_only_nhs_pages_with_summaries_in_both_languages():
    from app.config import SUMMARIES_DIR
    from app.rag.kb import _sections, chunks

    for sid in feeding.SOURCE_IDS:
        src = sources()[sid]
        assert not src.answers, sid  # never quoted in assistant answers, so the eval sets are unchanged
        assert src.url.startswith("https://www.nhs.uk/baby/breastfeeding-and-bottle-feeding/"), sid
        assert not [c for c in chunks() if c.source_id == sid]
        sec = _sections((SUMMARIES_DIR / f"{sid}.md").read_text(encoding="utf-8"))
        assert sec.get("en") and ARABIC.search(sec.get("ar", "")), sid
        assert not violations(sec["en"]) and not violations(sec["ar"]), sid


# ---------- the API ----------
def test_fatima_sees_her_last_7_days_of_feeds_on_home(client, reseed):
    s = client.get("/v1/me/home", headers=login(client, "fatima")).json()["feeding"]
    assert len(s["days"]) == 7 and s["days"][-1]["date"] == "2026-11-22"
    assert sum(d["total"] for d in s["days"]) > 0  # the demo shows a week of feeds


def test_women_without_a_birth_in_the_last_12_months_cannot_log_a_feed(client):
    for who in ("noura", "hessa"):
        h = login(client, who)
        assert client.get("/v1/me/home", headers=h).json()["feeding"] is None
        r = client.post("/v1/feeds", headers=h, json={"date": "2026-11-22", "kind": "breast"})
        assert r.status_code == 422, who


def test_she_logs_a_feed_with_a_worry_and_it_is_audited(client, reseed):
    h = login(client, "fatima")
    before = client.get("/v1/me/home", headers=h).json()["feeding"]["days"][-1]["formula"]
    r = client.post(
        "/v1/feeds",
        params={"lang": "ar"},
        headers=h,
        json={"date": "2026-11-22", "time": "14:05", "kind": "formula", "worries": ["few_wet_nappies"]},
    )
    assert r.status_code == 200, r.text
    s = r.json()
    assert s["days"][-1]["formula"] == before + 1 and s["last"]["time"] == "14:05"
    assert [w["id"] for w in s["worries"]][-1] == "few_wet_nappies" and ARABIC.search(s["worries"][-1]["text"])
    log = client.get("/v1/privacy", headers=h).json()
    assert any(a["action"] == "create_feed" for a in log["audit"])
    assert log["stored"]["feeds"] >= 1


def test_bad_feeds_are_refused(client, reseed):
    h = login(client, "fatima")
    ok = {"date": "2026-11-22", "kind": "breast"}
    assert client.post("/v1/feeds", headers=h, json=ok).status_code == 200
    for bad in (
        {**ok, "kind": "bottle"},
        {**ok, "worries": ["colic"]},
        {**ok, "date": "2026-11-23"},  # a future day
        {**ok, "date": "2026-09-19"},  # before the birth
        {**ok, "amount_ml": 90},
        {"kind": "breast"},
    ):
        assert client.post("/v1/feeds", headers=h, json=bad).status_code == 422, bad


def test_feeds_are_hers_only_exported_and_deleted_with_her_data(client, reseed):
    h = login(client, "fatima")
    client.post("/v1/feeds", headers=h, json={"date": "2026-11-22", "kind": "expressed"})
    assert any(f["kind"] == "expressed" for f in client.get("/v1/export", headers=h).json()["feeds"])
    # another woman never sees them, and the clinician record does not carry them
    assert client.get("/v1/export", headers=login(client, "noura")).json()["feeds"] == []
    rec = client.get("/v1/clinic/patients/fatima", headers=login(client, role="clinician")).json()
    assert "feeds" not in rec
    assert client.delete("/v1/me/data", headers=h).status_code == 200
    assert client.get("/v1/export", headers=h).json()["feeds"] == []
