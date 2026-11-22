"""docs/31 §H, L6: a session token is returned in a JSON body only to the phone app (which keeps it in the Keychain or
Keystore and says so with X-RS-Client: mobile). The web signs in with the httpOnly cookie alone, so a script injected
into a page could never read a token from a sign-in response."""

from fastapi.testclient import TestClient


def _web() -> TestClient:
    from app.main import app

    return TestClient(app)  # no X-RS-Client header: the web


def test_the_web_gets_the_cookie_but_no_token_in_the_body():
    r = _web().post("/v1/demo/login", json={"persona": "noura", "role": "patient"})
    assert r.status_code == 200
    assert "token" not in r.json()
    assert "rs_token=" in r.headers.get("set-cookie", "")


def test_the_phone_app_gets_the_token():
    r = _web().post("/v1/demo/login", json={"role": "clinician"}, headers={"x-rs-client": "mobile"})
    assert r.status_code == 200 and r.json()["token"]


def test_sign_up_follows_the_same_rule(reseed):
    body = {"name": "Huda", "age": 29, "region": "Al Ain", "life_stage": "periods"}
    web = _web().post("/v1/demo/signup", json=body)
    assert web.status_code == 200 and "token" not in web.json()
    phone = _web().post("/v1/demo/signup", json=body, headers={"x-rs-client": "mobile"})
    assert phone.status_code == 200 and phone.json()["token"]
