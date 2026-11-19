"""Baby's first-year schedule (build week D1, 19 Nov 2026).

The steps come from DoH Abu Dhabi's own documents, read on 19 Nov 2026:
- newborn screening in hospital (Standard for Newborn Screening Requirements, DOH/NBSC/SD/V4/2024, Jan 2025): a full
  newborn examination in the first 24 hours, hearing within 48 hours, the pulse-oximetry heart screen from 24 hours and
  the heel prick at 24-48 hours;
- vaccinations (ADPHC immunisation schedule, updated April 2026, Circular 2026/77): BCG and hepatitis B at birth, the
  RSV antibody at birth for babies born 1 September to 1 March (Circular 2026/37), then the end of months 2, 4 and 6;
- well-child visits at 1, 2, 4, 6 and 9 months (Standard for Well-Child Visits, DOH/WCV/SD/10/2025, Dec 2025).
Dates and sources only: no advice, no score, no red flag. An item past its window with nothing logged is "not
recorded", never "missed": the app cannot know what happened.
"""

import json
import re
from datetime import date

from conftest import login

from app.ai.guards import violations
from app.rag.kb import sources
from app.services import baby

BIRTH = date(2026, 9, 20)  # Fatima's baby, 9 weeks before the demo date
ARABIC = re.compile(r"[؀-ۿ]")


def bundle(events=(), birth=BIRTH):
    ev = [{"id": "e-birth", "type": "delivery", "date": birth.isoformat(), "details": {"mode": "vaginal"}}]
    return {"profile": {"life_stage": "after_birth"}, "events": ev + list(events), "labs": []}


def items(s):
    return {i["id"]: i for i in s["items"]}


def window(i):
    return i["due_from"], i["due_to"]


def test_windows_follow_the_doh_schedules_from_the_birth_date():
    s = baby.schedule(bundle(), date(2026, 9, 20))
    it = items(s)
    assert s["birth_date"] == "2026-09-20" and s["age_days"] == 0
    # newborn screening in hospital, in days after the birth
    assert window(it["newborn_exam"]) == ("2026-09-20", "2026-09-21")  # first 24 hours
    assert window(it["hearing_screen"]) == ("2026-09-20", "2026-09-22")  # within 48 hours
    assert window(it["heart_screen"]) == ("2026-09-21", "2026-09-22")  # from 24 hours
    assert window(it["heel_prick"]) == ("2026-09-21", "2026-09-22")  # 24-48 hours
    # vaccinations at the published age, shown as due for 4 weeks (ADPHC recalls children 4 weeks behind)
    assert window(it["vaccines_birth"]) == ("2026-09-20", "2026-10-18")
    assert window(it["vaccines_2m"]) == ("2026-11-20", "2026-12-18")  # end of month 2
    assert window(it["vaccines_4m"]) == ("2027-01-20", "2027-02-17")
    assert window(it["vaccines_6m"]) == ("2027-03-20", "2027-04-17")
    # well-child visits at 1, 2, 4, 6 and 9 months
    assert window(it["check_1m"]) == ("2026-10-20", "2026-11-17")
    assert window(it["check_9m"]) == ("2027-06-20", "2027-07-18")
    assert [i["id"] for i in s["items"]] == [
        "newborn_exam",
        "hearing_screen",
        "heart_screen",
        "heel_prick",
        "vaccines_birth",
        "rsv_antibody",
        "check_1m",
        "check_2m",
        "vaccines_2m",
        "check_4m",
        "vaccines_4m",
        "check_6m",
        "vaccines_6m",
        "check_9m",
    ]
    assert {i["kind"] for i in s["items"]} == {"screening", "vaccination", "check"}


def test_vaccines_are_named_as_the_schedule_publishes_them():
    it = items(baby.schedule(bundle(), date(2026, 9, 20)))
    assert it["vaccines_birth"]["vaccine_codes"] == ["BCG", "HepB"]
    assert it["rsv_antibody"]["vaccine_codes"] == ["RSV mAb"]
    assert it["vaccines_2m"]["vaccine_codes"] == ["Hexavalent", "PCV20", "RV1"]
    assert it["vaccines_4m"]["vaccine_codes"] == ["Hexavalent", "PCV20", "RV1"]
    assert it["vaccines_6m"]["vaccine_codes"] == ["Hexavalent", "bOPV"]
    assert it["check_2m"]["vaccine_codes"] == [] and it["check_2m"]["vaccines"] == []
    assert len(it["vaccines_2m"]["vaccines"]) == 3


def test_month_ends_are_kept_inside_the_month():
    # born 31 December: 2 months is 28 February (2027 is not a leap year), 6 months is 30 June
    it = items(baby.schedule(bundle(birth=date(2026, 12, 31)), date(2026, 12, 31)))
    assert it["vaccines_2m"]["due_from"] == "2027-02-28"
    assert it["vaccines_6m"]["due_from"] == "2027-06-30"


def test_the_rsv_antibody_is_listed_only_for_babies_born_1_september_to_1_march():
    for born, listed in [
        (date(2026, 9, 1), True),
        (date(2027, 1, 15), True),
        (date(2027, 3, 1), True),
        (date(2027, 3, 2), False),
        (date(2026, 8, 31), False),
        (date(2026, 6, 10), False),
    ]:
        s = baby.schedule(bundle(birth=born), born)
        assert ("rsv_antibody" in items(s)) is listed, born


def test_statuses_are_done_due_upcoming_or_not_recorded_never_missed():
    heel = {"id": "b1", "type": "baby_check", "date": "2026-09-21", "details": {"item": "heel_prick"}}
    visit = {"id": "b2", "type": "baby_check", "date": "2026-10-22", "details": {"item": "check_1m"}}
    s = baby.schedule(bundle([heel, visit]), date(2026, 11, 22))
    it = items(s)
    assert it["heel_prick"]["status"] == "done" and it["heel_prick"]["done_on"] == "2026-09-21"
    assert it["check_1m"]["status"] == "done"
    assert it["hearing_screen"]["status"] == "not_recorded" and it["hearing_screen"]["done_on"] is None
    assert it["vaccines_2m"]["status"] == "due" and it["check_2m"]["status"] == "due"
    assert it["vaccines_4m"]["status"] == "upcoming"
    assert {i["status"] for i in s["items"]} <= {"done", "due", "upcoming", "not_recorded"}
    assert "missed" not in json.dumps(s)
    assert (s["done"], s["total"]) == (2, 14)
    assert s["next"] == ["check_2m", "vaccines_2m"]  # what is due now comes first


def test_next_is_the_nearest_upcoming_items_when_nothing_is_due():
    s = baby.schedule(bundle(), date(2026, 12, 25))  # 3 months: the 2-month window closed, the 4-month one not open
    assert s["next"] == ["check_4m", "vaccines_4m"]


def test_entries_before_this_birth_or_for_unknown_items_are_ignored():
    old = {"id": "b0", "type": "baby_check", "date": "2024-05-01", "details": {"item": "check_1m"}}
    odd = {"id": "b9", "type": "baby_check", "date": "2026-10-01", "details": {"item": "nope"}}
    it = items(baby.schedule(bundle([old, odd]), date(2026, 11, 22)))
    assert it["check_1m"]["status"] == "not_recorded"


def test_shown_only_within_12_months_of_a_birth():
    assert baby.schedule(bundle(), date(2026, 9, 20)) is not None  # the day of the birth
    assert baby.schedule(bundle(), date(2027, 9, 19)) is not None  # the day before the first birthday
    assert baby.schedule(bundle(), date(2027, 9, 20)) is None  # 12 months
    assert baby.schedule(bundle(), date(2026, 9, 19)) is None  # a birth after "today" is not shown
    assert baby.schedule({"profile": {}, "events": [], "labs": []}, date(2026, 11, 22)) is None


def test_the_latest_birth_is_used():
    first = {"id": "e-old", "type": "delivery", "date": "2024-01-10", "details": {}}
    s = baby.schedule(bundle([first]), date(2026, 11, 22))
    assert s["birth_date"] == "2026-09-20"


def test_every_item_cites_a_known_source():
    s = baby.schedule(bundle(), date(2026, 9, 20))
    known = sources()
    for i in s["items"]:
        assert i["sources"] and all(sid in known for sid in i["sources"]), i["id"]
        assert len(i["source_links"]) == len(i["sources"])
        assert all(link["url"].startswith("https://www.doh.gov.ae/") for link in i["source_links"]), i["id"]
    by_kind = {i["kind"]: set(i["sources"]) for i in s["items"]}
    assert "doh_newborn_screening_2025" in by_kind["screening"]
    assert "doh_immunization_schedule_2026" in by_kind["vaccination"]
    assert "doh_well_child_visits_2025" in by_kind["check"]
    assert "doh_rsv_antibody_2026" in items(s)["rsv_antibody"]["sources"]


def test_new_sources_are_cite_only_with_summaries_in_both_languages():
    from app.config import SUMMARIES_DIR
    from app.rag.kb import _sections, chunks

    for sid in baby.SOURCE_IDS:
        src = sources()[sid]
        assert not src.answers, sid  # never quoted in assistant answers, so the 60-question eval is unchanged
        assert not [c for c in chunks() if c.source_id == sid]
        sec = _sections((SUMMARIES_DIR / f"{sid}.md").read_text(encoding="utf-8"))
        assert sec.get("en") and sec.get("ar"), sid
        assert ARABIC.search(sec["ar"]), sid
        assert not violations(sec["en"]) and not violations(sec["ar"]), sid


def test_labels_are_plain_and_never_diagnostic_in_english_and_arabic():
    for lang in ("en", "ar"):
        s = baby.schedule(bundle(), date(2026, 9, 20), lang)
        for i in s["items"]:
            text = " ".join([i["label"], *i["vaccines"]])
            assert i["label"] and not violations(text), (lang, i["id"])
            if lang == "ar":
                assert ARABIC.search(i["label"]), i["id"]
                assert all(ARABIC.search(v) for v in i["vaccines"]), i["id"]


def test_arabic_labels_differ_from_english_and_keep_the_vaccine_codes():
    en = items(baby.schedule(bundle(), date(2026, 9, 20), "en"))
    ar = items(baby.schedule(bundle(), date(2026, 9, 20), "ar"))
    for iid in en:
        assert en[iid]["label"] != ar[iid]["label"], iid
    assert "PCV20" in " ".join(ar["vaccines_2m"]["vaccines"])  # the code her baby's clinic uses, in both languages


def test_fatima_sees_her_babys_first_year_on_home(client, reseed):
    h = login(client, "fatima")
    s = client.get("/v1/me/home", headers=h).json()["baby"]
    it = items(s)
    assert s["birth_date"] == "2026-09-20" and s["age_weeks"] == 9
    for done in ("newborn_exam", "hearing_screen", "heart_screen", "heel_prick", "vaccines_birth", "rsv_antibody"):
        assert it[done]["status"] == "done", done
    assert it["check_1m"]["status"] == "done"
    assert it["vaccines_2m"]["status"] == "due" and it["check_2m"]["status"] == "due"
    assert it["vaccines_4m"]["status"] == "upcoming"
    assert (s["done"], s["total"]) == (7, 14)
    ar = client.get("/v1/me/home", params={"lang": "ar"}, headers=h).json()["baby"]
    assert ARABIC.search(items(ar)["vaccines_2m"]["label"])


def test_her_babys_entries_stay_out_of_her_own_health_timeline(client):
    h = login(client, "fatima")
    events = client.get("/v1/timeline", headers=h).json()["events"]
    assert events and not [e for e in events if e["type"] == "baby_check"]


def test_women_without_a_birth_in_the_last_12_months_have_no_schedule(client):
    for who in ("noura", "hessa", "layla"):
        assert client.get("/v1/me/home", headers=login(client, who)).json()["baby"] is None


def test_she_can_record_an_item_and_it_is_audited(client, reseed):
    h = login(client, "fatima")
    r = client.post("/v1/baby/vaccines_2m", headers=h, json={"date": "2026-11-21"})
    assert r.status_code == 200, r.text
    it = items(r.json())
    assert it["vaccines_2m"]["status"] == "done" and it["vaccines_2m"]["done_on"] == "2026-11-21"
    who = client.get("/v1/privacy", headers=h).json()
    assert any(a["action"] == "baby_check" for a in who.get("audit", who.get("access_log", [])))
    # a second entry for the same item replaces the date instead of adding a second record
    client.post("/v1/baby/vaccines_2m", headers=h, json={"date": "2026-11-22"})
    s = client.get("/v1/me/home", headers=h).json()["baby"]
    assert items(s)["vaccines_2m"]["done_on"] == "2026-11-22" and s["done"] == 8


def test_an_item_can_be_recorded_before_its_window_opens(client, reseed):
    # Clinics may give the 2-month vaccinations a few days before the baby is 2 calendar months old.
    h = login(client, "fatima")
    r = client.post("/v1/baby/check_2m", headers=h, json={"date": "2026-11-18"})
    assert r.status_code == 200 and items(r.json())["check_2m"]["status"] == "done"


def test_bad_items_and_dates_are_refused(client, reseed):
    h = login(client, "fatima")
    assert client.post("/v1/baby/nope", headers=h, json={"date": "2026-11-02"}).status_code == 422
    assert client.post("/v1/baby/vaccines_2m", headers=h, json={"date": "2026-12-30"}).status_code == 422  # future
    before_birth = {"date": "2026-09-01"}
    assert client.post("/v1/baby/vaccines_2m", headers=h, json=before_birth).status_code == 422
    assert client.post("/v1/baby/vaccines_2m", headers=h, json={"date": "not a date"}).status_code == 422
    assert client.post("/v1/baby/vaccines_2m", headers=h, json={"date": "2026-11-21", "x": 1}).status_code == 422
    assert client.post("/v1/baby/vaccines_2m", headers=h, json={}).status_code == 422


def test_a_woman_without_a_recent_birth_cannot_record_a_baby_item(client):
    r = client.post("/v1/baby/check_1m", headers=login(client, "noura"), json={"date": "2026-11-02"})
    assert r.status_code == 404


def test_the_clinician_sees_the_schedule_read_only(client, reseed):
    hc = login(client, role="clinician")
    s = client.get("/v1/clinic/patients/fatima", headers=hc).json()["baby"]
    assert items(s)["vaccines_2m"]["status"] == "due" and s["done"] == 7
    r = client.post("/v1/baby/vaccines_2m", headers=hc, json={"date": "2026-11-21"})
    assert r.status_code in (401, 403), r.status_code  # recording is hers alone
