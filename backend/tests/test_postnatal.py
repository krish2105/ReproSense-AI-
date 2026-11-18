"""Postnatal 6-week pathway (build week K1, 18 Nov).

DoH Abu Dhabi's Postnatal Care Program Standard (DoH/ST/HQS/PCP/V1/2025, May 2025) sets four postnatal checks: in
hospital at days 2-3 after delivery, a teleconsultation (or home visit) at days 2-3 after discharge, a visit at days
7-14 after discharge, and a visit at 6 weeks; and an assessment at 10-14 days for the maternal blues (section
3.1.2.1). After gestational diabetes, the glucose test falls 4-12 weeks after birth (CARE_POSTPARTUM_GLUCOSE_TEST).
These are care steps with dates and sources. They never add a red flag, a score or a diagnosis. A step past its window
with nothing logged is "not recorded", never "missed": the app does not know what happened.
"""

from datetime import date

from conftest import login

from app.rag.kb import sources
from app.services import postnatal

BIRTH = date(2026, 9, 20)


def bundle(events=(), labs=(), gdm=False):
    ev = [{"id": "e-birth", "type": "delivery", "date": BIRTH.isoformat(), "details": {}}]
    if gdm:
        ev.insert(0, {"id": "e-gdm", "type": "gdm_diagnosis", "date": "2026-06-28", "details": {}})
    return {"profile": {"life_stage": "after_birth"}, "events": ev + list(events), "labs": list(labs)}


def steps(p):
    return {s["id"]: s for s in p["steps"]}


def test_windows_follow_the_doh_standard_with_discharge_assumed_two_days_after_birth():
    p = postnatal.pathway(bundle(), date(2026, 9, 21))
    s = steps(p)
    assert p["birth_date"] == "2026-09-20" and p["discharge_assumed"] is True
    assert (s["teleconsult"]["from"], s["teleconsult"]["to"]) == (
        "2026-09-24",
        "2026-09-25",
    )  # days 2-3 after discharge
    assert (s["visit_2w"]["from"], s["visit_2w"]["to"]) == ("2026-09-29", "2026-10-06")  # days 7-14 after discharge
    assert (s["mood"]["from"], s["mood"]["to"]) == ("2026-09-30", "2026-10-04")  # 10-14 days after birth
    assert (s["visit_6w"]["from"], s["visit_6w"]["to"]) == ("2026-11-01", "2026-11-15")  # 6 weeks, up to 8 weeks
    assert "glucose_test" not in s, "the glucose step is only for women who had gestational diabetes"
    assert all(x["status"] == "upcoming" for x in p["steps"])


def test_a_recorded_hospital_discharge_moves_the_windows():
    discharge = {"id": "e-d", "type": "hospital_discharge", "date": "2026-09-25", "details": {}}
    p = postnatal.pathway(bundle([discharge]), date(2026, 9, 26))
    assert p["discharge_assumed"] is False
    assert (steps(p)["teleconsult"]["from"], steps(p)["teleconsult"]["to"]) == ("2026-09-27", "2026-09-28")


def test_statuses_are_due_upcoming_done_or_not_recorded_never_missed():
    mood = {"id": "q1", "type": "questionnaire", "date": "2026-10-02", "details": {"tool": "EPDS", "total": 6}}
    check = {"id": "c1", "type": "postnatal_check", "date": "2026-10-01", "details": {"step": "visit_2w"}}
    p = postnatal.pathway(bundle([mood, check]), date(2026, 10, 3))
    s = steps(p)
    assert s["teleconsult"]["status"] == "not_recorded"
    assert s["visit_2w"]["status"] == "done" and s["visit_2w"]["done_on"] == "2026-10-01"
    assert s["mood"]["status"] == "done" and s["mood"]["done_on"] == "2026-10-02"
    assert s["visit_6w"]["status"] == "upcoming"
    assert {x["status"] for x in p["steps"]} <= {"done", "due", "upcoming", "not_recorded"}


def test_the_glucose_test_after_gestational_diabetes_is_due_4_to_12_weeks_after_birth():
    p = postnatal.pathway(bundle(gdm=True), date(2026, 11, 22))
    g = steps(p)["glucose_test"]
    assert (g["from"], g["to"], g["status"]) == ("2026-10-18", "2026-12-13", "due")
    ogtt = {"code": "OGTT2H", "date": "2026-11-20", "value": 6.1}
    assert (
        steps(postnatal.pathway(bundle(gdm=True, labs=[ogtt]), date(2026, 11, 22)))["glucose_test"]["status"] == "done"
    )


def test_the_pathway_shows_for_12_weeks_after_a_birth_only():
    assert postnatal.pathway(bundle(), date(2026, 12, 13)) is not None  # day 84
    assert postnatal.pathway(bundle(), date(2026, 12, 14)) is None  # day 85
    assert postnatal.pathway({"profile": {}, "events": [], "labs": []}, date(2026, 11, 22)) is None


def test_every_step_cites_a_known_source():
    p = postnatal.pathway(bundle(gdm=True), date(2026, 9, 21))
    known = sources()
    for s in p["steps"]:
        assert s["sources"] and all(sid in known for sid in s["sources"]), s["id"]
    assert known["doh_postnatal_standard_2025"].url.startswith("https://www.doh.gov.ae/")
    assert not known["doh_postnatal_standard_2025"].answers, "cite-only: not quoted in general answers"


def test_fatima_sees_her_pathway_on_home(client, reseed):
    h = login(client, "fatima")
    p = client.get("/v1/me/home", headers=h).json()["postnatal"]
    s = steps(p)
    assert p["birth_date"] == "2026-09-20" and p["weeks_since_birth"] == 9
    assert s["mood"]["status"] == "done" and s["mood"]["done_on"] == "2026-11-15"  # her EPDS
    assert s["glucose_test"]["status"] == "due"
    assert s["visit_6w"]["status"] == "not_recorded"


def test_she_can_record_a_check_and_it_is_audited(client, reseed):
    h = login(client, "fatima")
    r = client.post("/v1/postnatal/visit_6w", headers=h, json={"date": "2026-11-02"})
    assert r.status_code == 200, r.text
    assert steps(r.json())["visit_6w"]["status"] == "done"
    who = client.get("/v1/privacy", headers=h).json()
    assert any(a["action"] == "postnatal_check" for a in who.get("audit", who.get("access_log", [])))


def test_bad_steps_and_dates_are_refused(client, reseed):
    h = login(client, "fatima")
    assert client.post("/v1/postnatal/glucose_test", headers=h, json={"date": "2026-11-02"}).status_code == 422
    assert client.post("/v1/postnatal/nope", headers=h, json={"date": "2026-11-02"}).status_code == 422
    assert client.post("/v1/postnatal/visit_6w", headers=h, json={"date": "2026-12-30"}).status_code == 422
    assert client.post("/v1/postnatal/visit_6w", headers=h, json={"date": "2026-09-01"}).status_code == 422


def test_women_without_a_recent_birth_have_no_pathway(client, reseed):
    for who in ("noura", "hessa"):
        assert client.get("/v1/me/home", headers=login(client, who)).json()["postnatal"] is None


def test_the_clinician_sees_her_pathway(client, reseed):
    hc = login(client, role="clinician")
    p = client.get("/v1/clinic/patients/fatima", headers=hc).json()["postnatal"]
    assert steps(p)["glucose_test"]["status"] == "due"
