"""Her care plan after a diagnosis (22 Nov 2026): Salma's doctor diagnosed PCOS and set a plan; she keeps using the
record for it. ReproSense never diagnoses and never chooses a medicine: the plan is her doctor's, stored as an event.
She ticks today's dose (and can undo it); her clinician sees the plan and how she is keeping to it, read-only."""

from conftest import login

from app.services import care_plan


def home(client, who: str, h=None):
    out = client.get("/v1/me/home", headers=h or login(client, who)).json()
    client.cookies.clear()
    return out


def test_salma_sees_her_doctors_plan_with_checks_and_her_month(client):
    p = home(client, "salma")["care_plan"]
    assert p["condition"] == "pcos" and "fictional" in p["recorded_by"] and p["since"] == "2026-09-10"
    (med,) = p["medicines"]
    assert med["id"] == "metformin" and med["dose"] == "500 mg" and med["reminder"] == "20:00"
    assert med["when"] == "once a day with the evening meal"
    assert med["taken_today"] is False and med["taken_last_7"] == 6  # she missed one day this week
    checks = {c["id"]: c for c in p["checks"]}
    assert checks["review"]["due"] == "2026-12-10" and checks["review"]["status"] == "due_soon"
    assert checks["glucose"]["due"] == "2027-09-10" and checks["glucose"]["status"] == "planned"
    assert checks["glucose"]["source_links"][0]["source_id"] == "pcos_guideline_2023"
    assert p["checkin"]["due"] is True  # her monthly symptom check-in is due
    assert {w["id"] for w in p["watch"]} == {"no_period_90", "checks_matter", "emergency"}


def test_arabic_home_gives_the_medicine_time_in_arabic(client):
    h = login(client, "salma")
    p = client.get("/v1/me/home?lang=ar", headers=h).json()["care_plan"]
    assert p["medicines"][0]["when"] == "مرة يومياً مع وجبة العشاء"


def test_she_ticks_todays_dose_and_can_undo_it(client):
    h = login(client, "salma")
    r = client.post("/v1/care-plan/medicines/metformin", headers=h, json={"taken": True})
    assert r.status_code == 200, r.text
    assert r.json()["medicines"][0]["taken_today"] is True
    r = client.post("/v1/care-plan/medicines/metformin", headers=h, json={"taken": True})  # twice: still one tick
    assert r.json()["medicines"][0]["taken_today"] is True
    r = client.post("/v1/care-plan/medicines/metformin", headers=h, json={"taken": False})
    assert r.json()["medicines"][0]["taken_today"] is False


def test_women_without_a_plan_have_none_and_cannot_tick_one(client):
    assert home(client, "noura")["care_plan"] is None
    h = login(client, "noura")
    assert client.post("/v1/care-plan/medicines/metformin", headers=h, json={"taken": True}).status_code == 404
    h = login(client, "salma")
    assert client.post("/v1/care-plan/medicines/aspirin", headers=h, json={"taken": True}).status_code == 404


def test_plan_events_stay_out_of_her_health_timeline(client):
    t = client.get("/v1/timeline?months=12", headers=login(client, "salma")).json()
    assert not any(e["type"] in (care_plan.PLAN_EVENT, care_plan.TAKEN_EVENT) for e in t["events"])


def test_her_clinician_sees_the_plan_read_only(client):
    h = login(client, role="clinician")
    v = client.get("/v1/clinic/patients/salma", headers=h).json()
    assert v["care_plan"]["condition"] == "pcos"
    assert v["care_plan"]["medicines"][0]["taken_last_7"] == 6
    client.cookies.clear()  # the shared test client keeps the clinician's cookie otherwise
