"""docs/31 §B: Back always works across the demo views.

The demo holds one sign-in at a time, so opening Clinician replaces the woman's sign-in. A patient demo sign-in now also
leaves the woman's public persona id in `rs_demo_persona`, so the web can sign her back in when Back returns to her app.
The hint is never set for staff or for a record someone started on /join, and every sign-out clears it.
"""

from fastapi.testclient import TestClient

from app.security.auth import DEMO_PERSONA_COOKIE


def _set_cookie_headers(r) -> list[str]:
    return [v for k, v in r.headers.multi_items() if k.lower() == "set-cookie"]


def _hint(r) -> str | None:
    for h in _set_cookie_headers(r):
        if h.startswith(f"{DEMO_PERSONA_COOKIE}="):
            return h
    return None


def test_a_patient_demo_sign_in_remembers_the_woman(client):
    r = client.post("/v1/demo/login", json={"persona": "noura", "role": "patient"})
    assert r.status_code == 200, r.text
    h = _hint(r)
    assert h is not None and h.startswith(f"{DEMO_PERSONA_COOKIE}=noura;")
    low = h.lower()
    assert "httponly" in low and "samesite=lax" in low and "path=/" in low
    assert "max-age=43200" in low  # her session's 12 hours, no longer


def test_a_staff_demo_sign_in_leaves_the_hint_alone(client):
    for role in ("clinician", "admin", "clinic_admin"):
        r = client.post("/v1/demo/login", json={"role": role})
        assert r.status_code == 200, r.text
        assert _hint(r) is None, role  # switching to a staff view must not forget which woman was open


def test_every_sign_out_clears_the_hint():
    from app.main import app

    c = TestClient(app)
    c.post("/v1/demo/login", json={"persona": "sara", "role": "patient"})
    out = c.post("/v1/sessions/sign-out")
    h = _hint(out)
    assert h is not None and ("max-age=0" in h.lower() or "expires=" in h.lower()), h

    c.post("/v1/demo/login", json={"persona": "sara", "role": "patient"})
    old = c.post("/v1/demo/logout")
    assert _hint(old) is not None


def test_signing_up_clears_the_hint(reseed):
    from app.main import app

    c = TestClient(app)
    c.post("/v1/demo/login", json={"persona": "noura", "role": "patient"})
    r = c.post(
        "/v1/demo/signup",
        json={
            "name": "Huda",
            "age": 29,
            "region": "Al Ain",
            "life_stage": "periods",
            "last_period_start": "2026-11-10",
        },
    )
    assert r.status_code == 200, r.text
    h = _hint(r)  # her own record replaces the demo woman: Back must never open Noura in its place
    assert h is not None and ("max-age=0" in h.lower() or "expires=" in h.lower())


def test_a_joined_record_cannot_be_named_as_a_demo_persona(client):
    r = client.post("/v1/demo/login", json={"persona": "guest-anything", "role": "patient"})
    assert r.status_code == 404
    assert _hint(r) is None
