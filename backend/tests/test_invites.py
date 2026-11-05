"""Clinic onboarding (SaaS scorecard): an admin invites a clinician to one clinic, and that clinician sees only the
patients who share with that clinic (each clinic is its own tenant)."""

from conftest import login


def invite(client, clinic_id: str) -> dict:
    r = client.post("/v1/admin/invites", headers=login(client, role="admin"), json={"clinic_id": clinic_id})
    assert r.status_code == 200, r.text
    return r.json()


def token_of(inv: dict) -> str:
    return inv["path"].split("invite=", 1)[1]


def join(client, inv: dict, name: str = "Dr Rana") -> None:
    client.cookies.clear()
    r = client.post("/v1/demo/clinician-join", json={"invite": token_of(inv), "name": name})
    assert r.status_code == 200, r.text


def test_an_invited_clinician_sees_only_her_clinics_patients(client, reseed):
    north = invite(client, "clinic_north")
    assert north["clinic_name"].startswith("North Island") and north["path"].startswith("/join/clinician?invite=")
    assert client.get("/v1/demo/invite", params={"invite": token_of(north)}).json()["clinic"]["id"] == "clinic_north"
    join(client, north)
    assert client.get("/v1/clinic/patients").json()["patients"] == []  # nobody shares with North Island
    assert client.get("/v1/clinic/patients/noura").status_code == 404  # Noura shares with Seaside only

    seaside = invite(client, "clinic_corniche")
    join(client, seaside, "Dr Huda")
    ids = {p["id"] for p in client.get("/v1/clinic/patients").json()["patients"]}
    assert "noura" in ids and "amina" not in ids  # consented personas only, the same as the seeded clinician
    client.cookies.clear()


def test_invites_refuse_what_they_should(client):
    assert (
        client.post("/v1/admin/invites", headers=login(client, "noura"), json={"clinic_id": "clinic_north"}).status_code
        == 403
    )
    bad = client.post("/v1/admin/invites", headers=login(client, role="admin"), json={"clinic_id": "nowhere"})
    assert bad.status_code == 422
    client.cookies.clear()
    forged = client.post("/v1/demo/clinician-join", json={"invite": "x" * 40, "name": "Dr X"})
    assert forged.status_code == 410
    inv = invite(client, "clinic_alain")
    client.cookies.clear()
    assert client.post("/v1/demo/clinician-join", json={"invite": token_of(inv), "name": "123"}).status_code == 422
