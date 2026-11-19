"""Staff and DoH sign-in (build week, the team's plan section 5): two doors, staff session rules, real sign-out,
step-up for exports and an audit row for every event. The judges' one-tap demo logins keep working.

- /staff/signin (clinicians, clinic admins): a passkey only.
- /doh/signin (the DoH network admin): a passkey, then a 6-digit code from an authenticator app (TOTP, set up once with
  a QR code from a single-use setup link that only the operator's CLI makes). DoH accounts are never self-created.
- Staff and DoH sessions end after 30 idle minutes (each request refreshes) and after 8 hours at most; hers keep 12 h.
- Sign-out puts the token's id (jti) on a revoked list in Postgres, so a copied cookie stops working; "sign out
  everywhere" revokes every session of the account. The lists survive a demo reset.
- Exporting the audit log or the clinic CSV needs a fresh passkey check (5 minutes); a one-tap demo session confirms
  with one tap instead, and only in demo mode.

Passkeys use the software authenticator from test_sign_in (real signatures, nothing mocked at py_webauthn). Time is
moved with the session clock (`app.security.auth.utcnow`), never by sleeping."""

from __future__ import annotations

import io
import json
from contextlib import redirect_stdout
from datetime import timedelta
from urllib.parse import parse_qs, urlparse

import jwt
import psycopg
import pyotp
import pytest
from fastapi.testclient import TestClient

from app.config import get_settings
from app.security import auth as auth_mod
from tests.conftest import login
from tests.test_sign_in import JOIN, SoftAuthenticator, origin, rp_id

STAFF_AREA = {
    "clinician": "/v1/clinic/patients",
    "clinic_admin": "/v1/clinic-admin/dashboard",
    "admin": "/v1/admin/metrics",
}


@pytest.fixture(scope="module", autouse=True)
def restore_demo(seeded):
    """Passkeys, invited clinicians and setup links made here are removed afterwards (the next module starts clean)."""
    yield
    from app.db.seed import seed

    seed()


@pytest.fixture
def web(client) -> TestClient:
    """A browser of its own: its own cookie jar, so sessions here never touch the shared client's."""
    return TestClient(client.app)


@pytest.fixture
def clock(monkeypatch):
    """Moves the session clock: clock(minutes=31) means 31 minutes from now."""
    start = auth_mod.utcnow()

    def move(**delta):
        monkeypatch.setattr(auth_mod, "utcnow", lambda: start + timedelta(**delta))

    return move


def bearer(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def cookie_token(c: TestClient) -> str:
    token = c.cookies.get("rs_token")
    assert token, "no session cookie"
    return token


def audit_rows(action: str, actor_id: str | None = None) -> list[dict]:
    with psycopg.connect(get_settings().database_url) as conn:
        conn.row_factory = psycopg.rows.dict_row
        q = "SELECT actor_id, actor_role, action, subject_id, target, detail FROM audit_log WHERE action=%s"
        args: tuple = (action,)
        if actor_id:
            q += " AND actor_id=%s"
            args += (actor_id,)
        return conn.execute(q + " ORDER BY id", args).fetchall()


def demo_tap(c: TestClient, role: str) -> str:
    r = c.post("/v1/demo/login", json={"role": role})
    assert r.status_code == 200, r.text
    return r.json()["token"]


def add_staff_passkey(c: TestClient, auth: SoftAuthenticator):
    o = c.post("/v1/staff-auth/passkey/register/options")
    assert o.status_code == 200, o.text
    opts = o.json()
    assert opts["authenticatorSelection"]["residentKey"] == "required"
    assert opts["authenticatorSelection"]["userVerification"] == "required"
    return c.post("/v1/staff-auth/passkey/register/verify", json={"credential": auth.create(opts, origin())})


def staff_door(c: TestClient, auth: SoftAuthenticator):
    c.cookies.clear()
    o = c.post("/v1/staff-auth/passkey/login/options").json()
    return c.post("/v1/staff-auth/passkey/login/verify", json={"credential": auth.get(o, origin(), rp_id())})


def invited_clinician(c: TestClient, client: TestClient, name: str = "Reem") -> str:
    h = login(client, role="clinic_admin")
    inv = client.post("/v1/clinic-admin/invites", headers=h, json={}).json()
    c.cookies.clear()
    r = c.post(f"/v1/clinic-invites/{inv['token']}/accept", json={"display_name": name})
    assert r.status_code == 200, r.text
    return r.json()["user_id"]


def setup_link(profile_id: str = "doh-01") -> str:
    from app.security.create_doh_admin import issue_setup_link

    return issue_setup_link(profile_id)["token"]


def doh_setup(c: TestClient, auth: SoftAuthenticator, profile_id: str = "doh-01") -> pyotp.TOTP:
    """The operator's link, then the passkey, the QR (otpauth URI) and the first code: she is signed in."""
    token = setup_link(profile_id)
    c.cookies.clear()
    pre = c.get(f"/v1/staff-auth/setup/{token}")
    assert pre.status_code == 200, pre.text
    assert pre.json()["status"] == "pending" and pre.json()["role"] == "admin"
    o = c.post(f"/v1/staff-auth/setup/{token}/passkey/options")
    assert o.status_code == 200, o.text
    r = c.post(f"/v1/staff-auth/setup/{token}/passkey/verify", json={"credential": auth.create(o.json(), origin())})
    assert r.status_code == 200, r.text
    a = c.post(f"/v1/staff-auth/setup/{token}/authenticator")
    assert a.status_code == 200, a.text
    uri = a.json()["otpauth_uri"]
    assert uri.startswith("otpauth://totp/") and "issuer=" in uri
    secret = parse_qs(urlparse(uri).query)["secret"][0]
    assert a.json()["secret"] == secret
    totp = pyotp.TOTP(secret)
    done = c.post(f"/v1/staff-auth/setup/{token}/code", json={"code": totp.at(now())})
    assert done.status_code == 200, done.text
    assert done.json()["role"] == "admin"
    assert c.get(f"/v1/staff-auth/setup/{token}").json()["status"] == "used"
    return totp


def doh_door(c: TestClient, auth: SoftAuthenticator):
    c.cookies.clear()
    o = c.post("/v1/staff-auth/doh/passkey/options").json()
    return c.post("/v1/staff-auth/doh/passkey/verify", json={"credential": auth.get(o, origin(), rp_id())})


def now() -> float:
    """The server's clock (moved by the clock fixture), as the authenticator app would read it."""
    return auth_mod.utcnow().timestamp()


def next_code(totp: pyotp.TOTP) -> str:
    """A code the server has not seen yet: the next 30-second step (the server accepts one step either side)."""
    return totp.at(now() + 30)


# ---------- the staff door: passkey only ----------
def test_a_clinic_admin_adds_a_passkey_in_her_area_and_signs_in_at_the_staff_door(web):
    demo_tap(web, "clinic_admin")
    me = web.get("/v1/staff-auth/me").json()
    assert me["role"] == "clinic_admin" and me["passkeys"] == [] and me["can_add_passkey"] is True
    assert me["session"]["how"] == "demo" and me["session"]["idle_minutes"] == 30
    auth = SoftAuthenticator()
    r = add_staff_passkey(web, auth)
    assert r.status_code == 200, r.text
    assert len(web.get("/v1/staff-auth/me").json()["passkeys"]) == 1

    r = staff_door(web, auth)
    assert r.status_code == 200, r.text
    assert r.json() == {"role": "clinic_admin", "user_id": "cadmin-01", "area": "/clinic-admin"}
    assert web.get("/v1/demo/whoami").json()["user_id"] == "cadmin-01"
    assert web.get("/v1/clinic-admin/dashboard").status_code == 200
    assert web.get("/v1/staff-auth/me").json()["session"]["how"] == "passkey"
    assert audit_rows("passkey_added", "cadmin-01")
    assert any(r["target"] == "staff_passkey" for r in audit_rows("sign_in", "cadmin-01"))


def test_an_invited_clinician_adds_a_passkey_and_signs_in_with_it(web, client):
    uid = invited_clinician(web, client)
    assert web.get("/v1/staff-auth/me").json()["session"]["how"] == "invite"
    auth = SoftAuthenticator()
    assert add_staff_passkey(web, auth).status_code == 200
    r = staff_door(web, auth)
    assert r.status_code == 200, r.text
    assert r.json()["role"] == "clinician" and r.json()["user_id"] == uid and r.json()["area"] == "/clinic"
    assert web.get("/v1/clinic/patients").status_code == 200


def test_the_staff_door_refuses_her_passkey_and_a_doh_passkey(web, client):
    web.cookies.clear()
    assert web.post("/v1/demo/signup", json=JOIN).status_code == 200
    hers = SoftAuthenticator()
    o = web.post("/v1/auth/passkey/register/options").json()
    assert (
        web.post("/v1/auth/passkey/register/verify", json={"credential": hers.create(o, origin())}).status_code == 200
    )
    r = staff_door(web, hers)
    assert r.status_code == 400 and "/signin" in r.json()["detail"]
    assert web.get("/v1/demo/whoami").status_code == 401

    doh = SoftAuthenticator()
    doh_setup(web, doh)
    r = staff_door(web, doh)
    assert r.status_code == 400 and "DoH" in r.json()["detail"]
    assert web.get("/v1/demo/whoami").status_code == 401
    # and the other way round: a staff passkey does not open her sign-in
    demo_tap(web, "clinician")
    staff = SoftAuthenticator()
    assert add_staff_passkey(web, staff).status_code == 200
    web.cookies.clear()
    o = web.post("/v1/auth/passkey/login/options").json()
    r = web.post("/v1/auth/passkey/login/verify", json={"credential": staff.get(o, origin(), rp_id())})
    assert r.status_code == 400 and "staff" in r.json()["detail"].lower()
    failed = audit_rows("sign_in_failed")
    assert any(f["target"] == "staff_door" and f["detail"]["reason"] == "not_staff" for f in failed)


def test_an_unknown_passkey_or_a_replayed_answer_does_not_open_the_staff_door(web):
    web.cookies.clear()
    o = web.post("/v1/staff-auth/passkey/login/options").json()
    r = web.post(
        "/v1/staff-auth/passkey/login/verify", json={"credential": SoftAuthenticator().get(o, origin(), rp_id())}
    )
    assert r.status_code == 400 and web.get("/v1/demo/whoami").status_code == 401
    assert any(
        f["target"] == "staff_door" and f["detail"]["reason"] == "unknown_passkey" for f in audit_rows("sign_in_failed")
    )

    demo_tap(web, "clinician")
    auth = SoftAuthenticator()
    assert add_staff_passkey(web, auth).status_code == 200
    web.cookies.clear()
    o = web.post("/v1/staff-auth/passkey/login/options").json()
    cred = auth.get(o, origin(), rp_id())
    assert web.post("/v1/staff-auth/passkey/login/verify", json={"credential": cred}).status_code == 200
    web.cookies.clear()
    again = web.post("/v1/staff-auth/passkey/login/verify", json={"credential": cred})
    assert again.status_code == 400 and web.get("/v1/demo/whoami").status_code == 401


# ---------- the DoH door: passkey plus authenticator code ----------
def test_the_doh_admin_signs_in_with_a_passkey_and_an_authenticator_code(web):
    auth = SoftAuthenticator()
    totp = doh_setup(web, auth)
    assert web.get("/v1/demo/whoami").json() == {"role": "admin", "user_id": "doh-01", "clinic_id": ""}
    assert web.get("/v1/staff-auth/me").json()["session"]["how"] == "passkey_code"
    assert web.post("/v1/sessions/sign-out").status_code == 200

    step1 = doh_door(web, auth)
    assert step1.status_code == 200, step1.text
    assert step1.json()["next"] == "code" and len(step1.json()["ticket"]) >= 32
    assert web.get("/v1/demo/whoami").status_code == 401  # a passkey alone is not a session
    r = web.post("/v1/staff-auth/doh/code", json={"ticket": step1.json()["ticket"], "code": next_code(totp)})
    assert r.status_code == 200, r.text
    assert r.json() == {"role": "admin", "user_id": "doh-01", "area": "/admin"}
    assert web.get("/v1/admin/metrics").status_code == 200
    me = web.get("/v1/staff-auth/me").json()
    assert me["session"]["how"] == "passkey_code" and me["authenticator_set"] is True
    assert any(r["target"] == "doh_passkey_code" for r in audit_rows("sign_in", "doh-01"))
    assert audit_rows("doh_setup_complete", "doh-01")
    # the ticket works once
    again = web.post("/v1/staff-auth/doh/code", json={"ticket": step1.json()["ticket"], "code": next_code(totp)})
    assert again.status_code == 400


def test_a_wrong_authenticator_code_does_not_sign_in_and_five_lock_the_ticket(web):
    auth = SoftAuthenticator()
    totp = doh_setup(web, auth)
    ticket = doh_door(web, auth).json()["ticket"]
    right = next_code(totp)
    wrong = "000000" if right != "000000" else "111111"
    for _ in range(5):
        r = web.post("/v1/staff-auth/doh/code", json={"ticket": ticket, "code": wrong})
        assert r.status_code == 400
    assert web.get("/v1/demo/whoami").status_code == 401
    locked = web.post("/v1/staff-auth/doh/code", json={"ticket": ticket, "code": right})
    assert locked.status_code == 400 and web.get("/v1/demo/whoami").status_code == 401
    failed = [f for f in audit_rows("sign_in_failed", "doh-01") if f["target"] == "doh_door"]
    assert sum(f["detail"]["step"] == "code" for f in failed) >= 5


def test_a_code_already_used_cannot_sign_in_again(web, clock):
    clock(minutes=0)  # hold the clock still: the setup's code and the next sign-in fall in the same 30-second step
    auth = SoftAuthenticator()
    totp = doh_setup(web, auth)
    ticket = doh_door(web, auth).json()["ticket"]
    replay = web.post("/v1/staff-auth/doh/code", json={"ticket": ticket, "code": totp.at(now())})
    assert replay.status_code == 400 and web.get("/v1/demo/whoami").status_code == 401
    assert web.post("/v1/staff-auth/doh/code", json={"ticket": ticket, "code": next_code(totp)}).status_code == 200


def test_the_doh_door_refuses_staff_and_her_passkeys(web):
    demo_tap(web, "clinic_admin")
    staff = SoftAuthenticator()
    assert add_staff_passkey(web, staff).status_code == 200
    r = doh_door(web, staff)
    assert r.status_code == 400 and "staff" in r.json()["detail"].lower()
    assert "ticket" not in r.json()


def test_doh_accounts_cannot_be_self_created(web, client):
    # Sign-up makes only her record, whatever role is asked for.
    web.cookies.clear()
    r = web.post("/v1/demo/signup", json={**JOIN, "role": "admin"})
    assert r.status_code == 200 and r.json()["role"] == "patient"
    # An invite makes only a clinician.
    assert web.get("/v1/demo/whoami").json()["role"] == "patient"
    uid = invited_clinician(web, client)
    assert web.get("/v1/demo/whoami").json() == {"role": "clinician", "user_id": uid, "clinic_id": "clinic_corniche"}
    # A DoH session cannot add passkeys from the panel, and no session can make a setup link.
    demo_tap(web, "admin")
    assert web.post("/v1/staff-auth/passkey/register/options").status_code == 403
    paths = {p for p in client.app.openapi()["paths"]}
    assert not any("create" in p or "admins" in p for p in paths if p.startswith("/v1/staff-auth"))
    # A made-up setup link is refused.
    assert web.get("/v1/staff-auth/setup/" + "x" * 43).status_code == 404
    assert web.post("/v1/staff-auth/setup/" + "x" * 43 + "/passkey/options").status_code == 404
    # The seeded DoH admin is fictional and has no way in until the operator's link is used.
    with psycopg.connect(get_settings().database_url) as conn:
        row = conn.execute("SELECT role, alias, is_synthetic FROM profiles WHERE id='doh-01'").fetchone()
    assert row[0] == "admin" and "(fictional)" in row[1] and row[2] is True


def test_the_operator_cli_creates_a_doh_admin_with_a_single_use_setup_link(web):
    from app.security import create_doh_admin

    out = io.StringIO()
    with redirect_stdout(out):
        create_doh_admin.main(["--alias", "DoH reviewer", "--json"])
    made = json.loads(out.getvalue())
    assert made["user_id"].startswith("doh-") and made["alias"] == "DoH reviewer (fictional)"
    assert made["setup_url"].endswith(f"/doh/setup/{made['token']}") and made["expires_at"]
    with psycopg.connect(get_settings().database_url) as conn:
        role = conn.execute("SELECT role FROM profiles WHERE id=%s", (made["user_id"],)).fetchone()[0]
        stored = conn.execute(
            "SELECT token_hash FROM staff_setup_links WHERE profile_id=%s", (made["user_id"],)
        ).fetchone()[0]
    assert role == "admin" and made["token"] not in stored
    assert audit_rows("doh_admin_created")
    totp = doh_setup(web, SoftAuthenticator(), made["user_id"])
    assert totp and web.get("/v1/demo/whoami").json()["user_id"] == made["user_id"]
    # --setup on someone who is not a DoH admin is refused
    with pytest.raises(SystemExit):
        create_doh_admin.main(["--setup", "clin-01"])


# ---------- sessions by role ----------
def test_staff_sessions_end_after_30_idle_minutes_and_each_request_slides_the_window(web, clock):
    token = demo_tap(web, "clinician")
    claims = jwt.decode(token, options={"verify_signature": False})
    assert claims["exp"] - claims["iat"] == 8 * 3600 and claims["amr"] == "demo" and claims["jti"]
    clock(minutes=20)
    assert web.get("/v1/demo/whoami").status_code == 200
    clock(minutes=45)  # 25 minutes after the last request
    assert web.get("/v1/demo/whoami").status_code == 200
    clock(minutes=76)  # 31 minutes after the last request
    r = web.get("/v1/demo/whoami")
    assert r.status_code == 401 and r.headers["x-session-ended"] == "idle"
    assert "30 minutes" in r.json()["detail"]


def test_a_background_refresh_does_not_count_as_activity(web, clock):
    demo_tap(web, "admin")
    clock(minutes=20)
    assert web.get("/v1/admin/metrics", headers={"x-rs-background": "1"}).status_code == 200
    clock(minutes=31)
    r = web.get("/v1/admin/metrics", headers={"x-rs-background": "1"})
    assert r.status_code == 401 and r.headers["x-session-ended"] == "idle"


def test_staff_sessions_end_after_8_hours_even_when_active(web, clock):
    demo_tap(web, "clinic_admin")
    for minutes in range(25, 8 * 60, 25):
        clock(minutes=minutes)
        assert web.get("/v1/demo/whoami").status_code == 200, minutes
    clock(minutes=8 * 60 + 1)
    r = web.get("/v1/demo/whoami")
    assert r.status_code == 401 and r.headers["x-session-ended"] == "max"


def test_her_sessions_keep_the_12_hour_policy(web, clock):
    r = web.post("/v1/demo/login", json={"persona": "noura"})
    claims = jwt.decode(r.json()["token"], options={"verify_signature": False})
    assert claims["exp"] - claims["iat"] == 12 * 3600
    assert "max-age=43200" in r.headers["set-cookie"].lower()
    clock(hours=3)  # no idle rule for her
    assert web.get("/v1/me/home").status_code == 200
    staff = web.post("/v1/demo/login", json={"role": "clinician"})
    assert "max-age=28800" in staff.headers["set-cookie"].lower()


def test_a_staff_token_past_its_own_expiry_says_the_8_hour_limit(client):
    s = get_settings()
    then = auth_mod.utcnow() - timedelta(hours=9)
    for role, reason in (("clinician", "max"), ("patient", "expired")):
        claims = {"sub": "x", "role": role, "iat": then, "exp": then + timedelta(hours=8), "aud": "reprosense-demo"}
        r = client.get("/v1/demo/whoami", headers=bearer(jwt.encode(claims, s.demo_token_secret, algorithm="HS256")))
        assert r.status_code == 401 and r.headers["x-session-ended"] == reason


def test_a_staff_token_from_before_sessions_were_tracked_is_refused(client):
    s = get_settings()
    now = auth_mod.utcnow()
    old = {
        "sub": "clin-01",
        "role": "clinician",
        "clinic_id": "clinic_corniche",
        "iat": now,
        "exp": now + timedelta(hours=1),
    }
    token = jwt.encode({**old, "aud": "reprosense-demo", "demo": True}, s.demo_token_secret, algorithm="HS256")
    r = client.get("/v1/demo/whoami", headers=bearer(token))
    assert r.status_code == 401 and r.headers["x-session-ended"] == "expired"
    # hers (no jti, 12 h) still opens until it expires, and sign-out still revokes it
    hers = jwt.encode(
        {**old, "sub": "noura", "role": "patient", "aud": "reprosense-demo", "demo": True},
        s.demo_token_secret,
        algorithm="HS256",
    )
    assert client.get("/v1/demo/whoami", headers=bearer(hers)).status_code == 200
    assert client.post("/v1/sessions/sign-out", headers=bearer(hers)).status_code == 200
    assert client.get("/v1/demo/whoami", headers=bearer(hers)).status_code == 401


# ---------- sign-out really signs out ----------
@pytest.mark.parametrize(
    "who", [{"role": "clinician"}, {"role": "admin"}, {"role": "clinic_admin"}, {"persona": "noura"}]
)
def test_after_sign_out_the_old_cookie_gets_401(web, who):
    r = web.post("/v1/demo/login", json=who)
    token = r.json()["token"]
    assert web.get("/v1/demo/whoami").status_code == 200
    out = web.post("/v1/sessions/sign-out")
    assert out.status_code == 200 and "rs_token" not in web.cookies
    stolen = web.get("/v1/demo/whoami", headers=bearer(token))
    assert stolen.status_code == 401 and stolen.headers["x-session-ended"] == "revoked"
    with psycopg.connect(get_settings().database_url) as conn:
        jti = jwt.decode(token, options={"verify_signature": False})["jti"]
        row = conn.execute("SELECT expires_at > now() FROM revoked_tokens WHERE jti=%s", (jti,)).fetchone()
    assert row and row[0] is True  # kept until the token would have expired anyway
    if "role" in who:
        assert any(a["detail"].get("how") == "demo" for a in audit_rows("sign_out", r.json()["user_id"]))


def test_the_old_logout_path_revokes_too_and_a_revoked_token_stays_revoked_after_a_demo_reset(web):
    from app.db.seed import seed

    token = demo_tap(web, "clinician")
    assert web.post("/v1/demo/logout").status_code == 200
    seed()  # the demo reset recreates the record tables; the revoked list and the sessions are kept
    assert web.get("/v1/demo/whoami", headers=bearer(token)).status_code == 401
    live = demo_tap(web, "admin")
    seed()
    assert web.get("/v1/demo/whoami", headers=bearer(live)).status_code == 200  # a reset does not sign judges out


def test_sign_out_everywhere_for_staff(web, client):
    uid = invited_clinician(web, client)
    first = cookie_token(web)
    auth = SoftAuthenticator()
    assert add_staff_passkey(web, auth).status_code == 200
    other = TestClient(client.app)
    assert staff_door(other, auth).status_code == 200
    listed = other.get("/v1/sessions").json()
    assert len(listed["sessions"]) == 2 and sum(s["current"] for s in listed["sessions"]) == 1
    r = other.post("/v1/sessions/sign-out-everywhere")
    assert r.status_code == 200 and r.json()["signed_out"] == 2
    assert web.get("/v1/demo/whoami", headers=bearer(first)).status_code == 401
    assert other.get("/v1/demo/whoami").status_code == 401
    assert audit_rows("sign_out_everywhere", uid)[-1]["detail"]["sessions"] == 2
    # and she signs in again with the same passkey
    assert staff_door(web, auth).status_code == 200


def test_sign_out_everywhere_for_her_and_her_devices_list(web, client):
    web.cookies.clear()
    pid = web.post("/v1/demo/signup", json=JOIN).json()["user_id"]
    first = cookie_token(web)
    hers = SoftAuthenticator()
    o = web.post("/v1/auth/passkey/register/options").json()
    assert (
        web.post("/v1/auth/passkey/register/verify", json={"credential": hers.create(o, origin())}).status_code == 200
    )
    phone = TestClient(client.app)
    o = phone.post("/v1/auth/passkey/login/options").json()
    assert (
        phone.post("/v1/auth/passkey/login/verify", json={"credential": hers.get(o, origin(), rp_id())}).status_code
        == 200
    )
    phone_token = cookie_token(phone)
    devices = web.get("/v1/sessions").json()["sessions"]
    assert {d["how"] for d in devices} == {"signup", "passkey"} and len(devices) == 2
    # sign one device out from the other
    other = next(d for d in devices if not d["current"])
    assert web.delete(f"/v1/sessions/{other['id']}").status_code == 200
    assert phone.get("/v1/demo/whoami").status_code == 401
    assert web.get("/v1/demo/whoami").status_code == 200
    assert web.delete(f"/v1/sessions/{other['id']}").status_code == 404
    # then everywhere
    assert web.post("/v1/sessions/sign-out-everywhere").json()["signed_out"] == 1
    assert web.get("/v1/demo/whoami", headers=bearer(first)).status_code == 401
    assert web.get("/v1/demo/whoami", headers=bearer(phone_token)).status_code == 401
    actions = [r["action"] for r in audit_rows("session_revoked", pid) + audit_rows("sign_out_everywhere", pid)]
    assert actions == ["session_revoked", "sign_out_everywhere"]


def test_shared_demo_accounts_cannot_sign_everyone_out(web, client):
    for who in ({"role": "clinician"}, {"role": "admin"}, {"role": "clinic_admin"}, {"persona": "noura"}):
        token = web.post("/v1/demo/login", json=who).json()["token"]
        judge = TestClient(client.app)
        judge_token = judge.post("/v1/demo/login", json=who).json()["token"]
        r = web.post("/v1/sessions/sign-out-everywhere")
        assert r.status_code == 403 and "demo" in r.json()["detail"].lower()
        listed = web.get("/v1/sessions").json()
        assert listed["shared_demo_account"] is True and len(listed["sessions"]) == 1
        assert web.get("/v1/demo/whoami", headers=bearer(judge_token)).status_code == 200
        assert web.get("/v1/demo/whoami", headers=bearer(token)).status_code == 200


# ---------- step-up for exports ----------
def test_exports_need_a_fresh_passkey_check(web, clock):
    demo_tap(web, "clinic_admin")
    auth = SoftAuthenticator()
    assert add_staff_passkey(web, auth).status_code == 200
    assert staff_door(web, auth).status_code == 200
    r = web.get("/v1/clinic-admin/export.csv")
    assert r.status_code == 403 and r.headers["x-step-up"] == "required"
    o = web.post("/v1/staff-auth/step-up/options")
    assert o.status_code == 200 and o.json()["mode"] == "passkey"
    opts = o.json()["options"]
    assert [c["id"] for c in opts["allowCredentials"]]  # only her own passkeys are offered
    assert web.post("/v1/staff-auth/step-up/demo").status_code == 403  # a real session cannot use the demo confirm
    v = web.post("/v1/staff-auth/step-up/verify", json={"credential": auth.get(opts, origin(), rp_id())})
    assert v.status_code == 200, v.text
    assert web.get("/v1/clinic-admin/export.csv").status_code == 200
    clock(minutes=4)
    assert web.get("/v1/clinic-admin/export.csv").status_code == 200
    clock(minutes=6)
    assert web.get("/v1/clinic-admin/export.csv").status_code == 403
    assert any(s["target"] == "passkey" for s in audit_rows("step_up", "cadmin-01"))


def test_the_doh_audit_export_needs_a_fresh_passkey_check(web):
    auth = SoftAuthenticator()
    doh_setup(web, auth)
    assert web.get("/v1/admin/audit/export.csv").status_code == 403
    o = web.post("/v1/staff-auth/step-up/options").json()
    assert o["mode"] == "passkey"
    other = SoftAuthenticator()  # a passkey of nobody here
    bad = web.post("/v1/staff-auth/step-up/verify", json={"credential": other.get(o["options"], origin(), rp_id())})
    assert bad.status_code == 400
    assert audit_rows("step_up_failed", "doh-01")
    o = web.post("/v1/staff-auth/step-up/options").json()
    assert (
        web.post(
            "/v1/staff-auth/step-up/verify", json={"credential": auth.get(o["options"], origin(), rp_id())}
        ).status_code
        == 200
    )
    r = web.get("/v1/admin/audit/export.csv")
    assert r.status_code == 200 and r.text.startswith("id,at,actor_role")
    assert "step_up" in r.text and "sign_in" in r.text


def test_step_up_with_another_staff_members_passkey_fails(web, client):
    demo_tap(web, "clinician")
    theirs = SoftAuthenticator()
    assert add_staff_passkey(web, theirs).status_code == 200
    demo_tap(web, "clinic_admin")
    mine = SoftAuthenticator()
    assert add_staff_passkey(web, mine).status_code == 200
    assert staff_door(web, mine).status_code == 200
    o = web.post("/v1/staff-auth/step-up/options").json()
    r = web.post("/v1/staff-auth/step-up/verify", json={"credential": theirs.get(o["options"], origin(), rp_id())})
    assert r.status_code == 400
    assert web.get("/v1/clinic-admin/export.csv").status_code == 403


def test_demo_sessions_confirm_an_export_in_one_tap(web):
    for role, path in (("admin", "/v1/admin/audit/export.csv"), ("clinic_admin", "/v1/clinic-admin/export.csv")):
        demo_tap(web, role)
        assert web.get(path).status_code == 403
        o = web.post("/v1/staff-auth/step-up/options")
        assert o.json() == {"fresh": False, "mode": "demo_confirm", "valid_minutes": 5}
        assert web.post("/v1/staff-auth/step-up/demo").status_code == 200
        assert web.get(path).status_code == 200
        # within the window the page can tell, without a refused download, that no new check is needed
        assert web.post("/v1/staff-auth/step-up/options").json() == {
            "fresh": True,
            "mode": "demo_confirm",
            "valid_minutes": 5,
        }
    assert any(s["target"] == "demo_confirm" for s in audit_rows("step_up", "admin-01"))


def test_the_demo_confirm_is_off_outside_demo_mode(web, monkeypatch):
    demo_tap(web, "admin")
    monkeypatch.setattr(get_settings(), "demo_mode", False)
    assert web.post("/v1/staff-auth/step-up/demo").status_code == 403
    assert web.get("/v1/admin/audit/export.csv").status_code == 403


# ---------- the judges' one tap, audit, and roles ----------
def test_the_sign_in_pages_can_state_the_rules_without_a_session(web):
    web.cookies.clear()
    assert web.get("/v1/staff-auth/rules").json() == {
        "idle_minutes": 30,
        "max_hours": 8,
        "step_up_minutes": 5,
        "patient_hours": 12,
    }


def test_one_tap_demo_logins_still_work_for_every_role(web):
    for persona in ("noura", "fatima"):
        web.cookies.clear()
        assert web.post("/v1/demo/login", json={"persona": persona}).status_code == 200
        assert web.get("/v1/me/home").status_code == 200
    for role, path in STAFF_AREA.items():
        web.cookies.clear()
        r = web.post("/v1/demo/login", json={"role": role})
        assert r.status_code == 200 and r.json()["token"]
        assert web.get(path).status_code == 200, role
        assert web.get(path, headers=bearer(r.json()["token"])).status_code == 200, role
    taps = audit_rows("sign_in")
    assert {t["actor_id"] for t in taps if t["target"] == "demo_one_tap"} >= {"clin-01", "admin-01", "cadmin-01"}


def test_staff_and_doh_events_are_in_the_hash_chain(web):
    auth = SoftAuthenticator()
    totp = doh_setup(web, auth)
    assert web.post("/v1/sessions/sign-out").status_code == 200
    assert staff_door(web, auth).status_code == 400  # the wrong door: a failed sign-in
    ticket = doh_door(web, auth).json()["ticket"]
    assert web.post("/v1/staff-auth/doh/code", json={"ticket": ticket, "code": next_code(totp)}).status_code == 200
    demo_tap(web, "admin")
    assert web.post("/v1/staff-auth/step-up/demo").status_code == 200
    for action in ("sign_in", "sign_in_failed", "sign_out", "step_up", "passkey_added", "doh_setup_complete"):
        assert audit_rows(action), action
    v = web.get("/v1/admin/audit/verify").json()
    assert v["chain_ok"] is True and v["entries"] > 0


def test_a_clinician_token_cannot_use_doh_or_clinic_admin_endpoints(web):
    demo_tap(web, "clinician")
    for path in (
        "/v1/admin/metrics",
        "/v1/admin/audit/verify",
        "/v1/admin/audit/export.csv",
        "/v1/clinic-admin/export.csv",
    ):
        assert web.get(path).status_code == 403, path
    assert web.post("/v1/demo/reset").status_code == 403
    assert web.post("/v1/staff-auth/step-up/demo").status_code == 200  # her own confirm is fine...
    assert web.get("/v1/admin/audit/export.csv").status_code == 403  # ...but it opens nothing above her role
    # the DoH door's second step needs a ticket from the DoH passkey step, not a clinician session
    assert web.post("/v1/staff-auth/doh/code", json={"ticket": "x" * 43, "code": "123456"}).status_code == 400
    # her app's sign-in methods are not staff ones either
    assert web.post("/v1/auth/passkey/register/options").status_code == 403


def test_the_new_tables_are_made_at_boot_and_survive_a_reset():
    from app.db.seed import ensure_sign_in_tables

    ensure_sign_in_tables()
    ensure_sign_in_tables()  # safe on every boot
    with psycopg.connect(get_settings().database_url) as conn:
        for t in ("auth_sessions", "revoked_tokens", "staff_totp", "staff_setup_links", "mfa_tickets"):
            assert conn.execute("SELECT to_regclass(%s) IS NOT NULL", (f"public.{t}",)).fetchone()[0], t
        forced = conn.execute(
            "SELECT relname FROM pg_class WHERE relname IN ('auth_sessions','revoked_tokens','staff_totp',"
            "'staff_setup_links','mfa_tickets') AND relrowsecurity AND relforcerowsecurity"
        ).fetchall()
    assert len(forced) == 5


def test_staff_cannot_read_sessions_secrets_or_tickets_through_the_database():
    from app.db import Actor, session

    for actor in (
        Actor("clinician", "clin-01", "clinic_corniche"),
        Actor("admin", "admin-01"),
        Actor("patient", "noura"),
    ):
        with session(actor) as cur:
            for t in ("auth_sessions", "revoked_tokens", "staff_totp", "staff_setup_links", "mfa_tickets"):
                cur.execute(f"SELECT count(*) AS n FROM {t}")  # noqa: S608 (fixed table names)
                assert cur.fetchone()["n"] == 0, (actor.role, t)


def test_a_demo_reset_takes_no_lock_on_the_session_tables():
    """A reset runs the whole schema in one long transaction. If it locked auth_sessions or revoked_tokens, every
    sign-in and staff request would wait for it (or deadlock with it)."""
    from app.db.seed import schema_sql

    with psycopg.connect(get_settings().database_url) as conn:
        conn.execute(schema_sql())  # inside one transaction, rolled back below: the demo is untouched
        held = conn.execute(
            "SELECT c.relname, l.mode FROM pg_locks l JOIN pg_class c ON c.oid = l.relation"
            " WHERE l.pid = pg_backend_pid() AND c.relname IN ('auth_sessions', 'revoked_tokens')"
        ).fetchall()
        conn.rollback()
    assert held == []


def test_judges_stay_signed_in_and_can_sign_in_during_a_demo_reset(web, client):
    import threading

    from app.db.seed import seed

    demo_tap(web, "clinician")
    t = threading.Thread(target=seed)
    t.start()
    codes = []
    while t.is_alive():
        codes.append(web.get("/v1/demo/whoami").status_code)
        codes.append(TestClient(client.app).post("/v1/demo/login", json={"role": "admin"}).status_code)
    t.join()
    assert codes and set(codes) == {200}


def test_a_database_seeded_before_staff_sign_in_gains_the_doh_admin_at_boot():
    from app.db.seed import ensure_sign_in_tables

    with psycopg.connect(get_settings().database_url, autocommit=True) as conn:
        conn.execute("SET ROLE reprosense_app")
        conn.execute("SELECT set_config('app.role', 'system', false)")
        conn.execute("DELETE FROM profiles WHERE id='doh-01'")
    ensure_sign_in_tables()
    with psycopg.connect(get_settings().database_url) as conn:
        assert conn.execute("SELECT role FROM profiles WHERE id='doh-01'").fetchone() == ("admin",)
