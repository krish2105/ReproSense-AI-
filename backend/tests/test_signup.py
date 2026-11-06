"""A new demo record (MVP scorecard: sign up, consent, log, see value in under three minutes)."""

from fastapi.testclient import TestClient

BASE = {"name": "Maryam", "age": 29, "region": "Al Ain", "lang": "en"}


def fresh(client: TestClient) -> TestClient:
    client.cookies.clear()
    return client


def test_new_record_with_a_period_shows_her_cycle_day(client, reseed):
    r = fresh(client).post("/v1/demo/signup", json={**BASE, "life_stage": "periods", "last_period_start": "2026-11-10"})
    assert r.status_code == 200, r.text
    assert r.json()["user_id"].startswith("guest-")
    home = client.get("/v1/me/home").json()
    assert home["profile"]["alias"] == "Maryam (demo)"
    assert home["status"]["mode"] == "cycle" and home["status"]["day"] == 13  # 10 Nov to the demo date, 22 Nov
    assert home["observations"] == [] and home["red_flags"] == []  # nothing is invented from one entry
    assert client.post("/v1/reports").status_code in (200, 201)  # the doctor report works from day one


def test_after_birth_with_gestational_diabetes_opens_the_glucose_follow_up(client, reseed):
    r = fresh(client).post(
        "/v1/demo/signup", json={**BASE, "life_stage": "after_birth", "weeks_since_birth": 6, "gdm": True}
    )
    assert r.status_code == 200, r.text
    home = client.get("/v1/me/home").json()
    assert home["status"]["mode"] == "after_birth" and home["status"]["week"] == 6
    assert any(g["type"] == "postpartum_glucose_test" for g in home["care_gaps"])


def test_sharing_with_the_inviting_clinic_puts_her_on_the_clinician_list(client, reseed):
    r = fresh(client).post(
        "/v1/demo/signup",
        json={
            **BASE,
            "life_stage": "pregnancy",
            "pregnancy_weeks": 25,
            "clinic_id": "clinic_corniche",
            "share_with_clinic": True,
        },
    )
    pid = r.json()["user_id"]
    fresh(client).post("/v1/demo/login", json={"role": "clinician"})
    ids = [p["id"] for p in client.get("/v1/clinic/patients").json()["patients"]]
    assert pid in ids
    assert client.get(f"/v1/clinic/patients/{pid}").status_code == 200


def test_not_sharing_keeps_her_off_the_clinician_list(client, reseed):
    r = fresh(client).post(
        "/v1/demo/signup", json={**BASE, "life_stage": "perimenopause", "clinic_id": "clinic_corniche"}
    )
    pid = r.json()["user_id"]
    fresh(client).post("/v1/demo/login", json={"role": "clinician"})
    assert pid not in [p["id"] for p in client.get("/v1/clinic/patients").json()["patients"]]


def test_signup_refuses_what_it_should(client):
    c = fresh(client)
    assert (
        c.post("/v1/demo/signup", json={**BASE, "age": 16, "life_stage": "periods"}).status_code == 422
    )  # adults only
    assert (
        c.post("/v1/demo/signup", json={**BASE, "life_stage": "periods", "last_period_start": "2026-12-01"}).status_code
        == 422
    )
    assert c.post("/v1/demo/signup", json={**BASE, "life_stage": "pregnancy"}).status_code == 422  # weeks needed
    assert c.post("/v1/demo/signup", json={**BASE, "name": "1234", "life_stage": "periods"}).status_code == 422
    assert (
        c.post(
            "/v1/demo/signup", json={**BASE, "life_stage": "periods", "clinic_id": "nope", "share_with_clinic": True}
        ).status_code
        == 422
    )


def test_public_clinic_list(client):
    clinics = fresh(client).get("/v1/demo/clinics").json()["clinics"]
    assert {c["id"] for c in clinics} >= {"clinic_corniche"}
    assert all("(fictional)" in c["name"] for c in clinics)


def test_sharing_from_privacy_goes_to_her_own_clinic_only(client, reseed):
    """A record with no clinic cannot be shared by accident; one invited by Al Ain shares with Al Ain, not Seaside."""
    fresh(client)
    assert client.post("/v1/demo/signup", json={**BASE, "life_stage": "periods"}).status_code == 200
    assert client.get("/v1/privacy").json()["home_clinic"] is None
    r = client.patch("/v1/consents", json={"purpose": "care_share", "granted": True})
    assert r.status_code == 422
    fresh(client)
    assert (
        client.post(
            "/v1/demo/signup", json={**BASE, "name": "Shamma", "life_stage": "periods", "clinic_id": "clinic_alain"}
        ).status_code
        == 200
    )
    assert client.get("/v1/privacy").json()["home_clinic"]["id"] == "clinic_alain"
    assert client.patch("/v1/consents", json={"purpose": "care_share", "granted": True}).status_code == 200
    shares = [c for c in client.get("/v1/privacy").json()["consents"] if c["purpose"] == "care_share"]
    assert shares and shares[0]["clinic_id"] == "clinic_alain" and shares[0]["granted"]
    fresh(client)


def test_a_joined_record_is_not_on_the_public_roster(client, reseed):
    fresh(client)
    me = client.post("/v1/demo/signup", json={**BASE, "name": "Alia", "life_stage": "periods"})
    assert me.status_code == 200
    gid = client.get("/v1/me").json()["id"]
    fresh(client)
    roster = client.get("/v1/demo/personas").json()["personas"]
    assert all(not p["id"].startswith("guest-") for p in roster)
    assert client.post("/v1/demo/login", json={"persona": gid}).status_code == 404  # nobody else can open her record


def test_a_period_entered_backwards_stays_one_period(client, reseed):
    """She logs the days of one period from the last day back to the first: one period, not four one-day cycles."""
    fresh(client)
    r = client.post(
        "/v1/demo/signup", json={**BASE, "name": "Salma", "life_stage": "periods", "last_period_start": "2026-10-13"}
    )
    assert r.status_code == 200, r.text
    for d in ("2026-11-14", "2026-11-13", "2026-11-12", "2026-11-11", "2026-11-10"):
        r = client.post("/v1/logs", json={"date": d, "flow": "medium", "pain": 2})
        assert r.status_code == 200, r.text
    cycles = client.get("/v1/export").json()["cycles"]
    assert [c["start"] for c in cycles] == ["2026-10-13", "2026-11-10"]
    assert [c["length_days"] for c in cycles] == [28, None]
    assert cycles[-1]["bleed_days"] == 5
    patterns = {c["observation_id"] for c in client.get("/v1/insights").json()["cards"]}
    assert "OBS_IRREGULAR_CYCLES" not in patterns
    fresh(client)


def test_periods_entered_after_joining_become_cycles(client, reseed):
    """She joins with her last period, then adds the three before it: none of them is dropped."""
    fresh(client)
    assert (
        client.post(
            "/v1/demo/signup", json={**BASE, "name": "Mira", "life_stage": "periods", "last_period_start": "2026-11-10"}
        ).status_code
        == 200
    )
    for d in ("2026-10-13", "2026-09-15", "2026-08-18"):
        r = client.post("/v1/logs", json={"date": d, "flow": "medium", "pain": 3})
        assert r.status_code == 200, r.text
    cycles = client.get("/v1/export").json()["cycles"]
    assert [c["start"] for c in cycles] == ["2026-08-18", "2026-09-15", "2026-10-13", "2026-11-10"]
    assert [c["length_days"] for c in cycles] == [28, 28, 28, None]
    patterns = {c["observation_id"] for c in client.get("/v1/insights").json()["cards"]}
    assert "OBS_IRREGULAR_CYCLES" not in patterns  # regular 28-day cycles are not called irregular
    fresh(client)
