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
