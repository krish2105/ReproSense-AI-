"""Her own sign-in (build week K5): a passkey first, a 6-digit email code as backup, export and delete after sign-in.

The passkey tests use a small software authenticator (a P-256 key, "none" attestation), so py_webauthn verifies real
signatures over real client data: nothing is mocked at the library boundary. The email tests use a fake sender that
captures the code, so no email leaves the test run."""

from __future__ import annotations

import base64
import hashlib
import json
import logging
import os
import struct

import psycopg
import pytest
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ec
from webauthn.helpers import encode_cbor

from app.config import get_settings
from tests.conftest import login

JOIN = {"name": "Maryam", "age": 29, "region": "Al Ain", "lang": "en", "life_stage": "periods"}
EMAIL = "maryam.demo@example.com"  # example.com is reserved for documentation; nothing is sent in tests


def b64u(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode()


def unb64u(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


class SoftAuthenticator:
    """A platform authenticator in software: one ES256 key per credential, user present and verified."""

    def __init__(self) -> None:
        self.key = ec.generate_private_key(ec.SECP256R1())
        self.cred_id = os.urandom(16)
        self.count = 0
        self.user_handle = b""

    def _cose(self) -> bytes:
        n = self.key.public_key().public_numbers()
        return encode_cbor({1: 2, 3: -7, -1: 1, -2: n.x.to_bytes(32, "big"), -3: n.y.to_bytes(32, "big")})

    @staticmethod
    def _client_data(kind: str, challenge: str, origin: str) -> bytes:
        return json.dumps({"type": kind, "challenge": challenge, "origin": origin, "crossOrigin": False}).encode()

    def create(self, options: dict, origin: str) -> dict:
        self.user_handle = unb64u(options["user"]["id"])
        cdj = self._client_data("webauthn.create", options["challenge"], origin)
        rp_hash = hashlib.sha256(options["rp"]["id"].encode()).digest()
        attested = bytes(16) + struct.pack(">H", len(self.cred_id)) + self.cred_id + self._cose()
        auth_data = rp_hash + bytes([0x45]) + struct.pack(">I", self.count) + attested  # UP, UV, AT
        att = encode_cbor({"fmt": "none", "attStmt": {}, "authData": auth_data})
        return {
            "id": b64u(self.cred_id),
            "rawId": b64u(self.cred_id),
            "type": "public-key",
            "response": {"clientDataJSON": b64u(cdj), "attestationObject": b64u(att), "transports": ["internal"]},
            "clientExtensionResults": {},
            "authenticatorAttachment": "platform",
        }

    def get(self, options: dict, origin: str, rp_id: str) -> dict:
        self.count += 1
        cdj = self._client_data("webauthn.get", options["challenge"], origin)
        auth_data = hashlib.sha256(rp_id.encode()).digest() + bytes([0x05]) + struct.pack(">I", self.count)
        sig = self.key.sign(auth_data + hashlib.sha256(cdj).digest(), ec.ECDSA(hashes.SHA256()))
        return {
            "id": b64u(self.cred_id),
            "rawId": b64u(self.cred_id),
            "type": "public-key",
            "response": {
                "clientDataJSON": b64u(cdj),
                "authenticatorData": b64u(auth_data),
                "signature": b64u(sig),
                "userHandle": b64u(self.user_handle),
            },
            "clientExtensionResults": {},
            "authenticatorAttachment": "platform",
        }


def origin() -> str:
    return get_settings().passkey_origins[0]


def rp_id() -> str:
    return get_settings().passkey_rp_id


def join(client) -> str:
    client.cookies.clear()
    r = client.post("/v1/demo/signup", json=JOIN)
    assert r.status_code == 200, r.text
    return r.json()["user_id"]


def add_passkey(client, auth: SoftAuthenticator):
    opts = client.post("/v1/auth/passkey/register/options")
    assert opts.status_code == 200, opts.text
    o = opts.json()
    assert o["rp"]["id"] == rp_id() and o["authenticatorSelection"]["residentKey"] == "required"
    return client.post("/v1/auth/passkey/register/verify", json={"credential": auth.create(o, origin())})


def passkey_sign_in(client, auth: SoftAuthenticator, at: str | None = None):
    client.cookies.clear()  # another device: no session
    o = client.post("/v1/auth/passkey/login/options").json()
    cred = auth.get(o, at or origin(), rp_id())
    return client.post("/v1/auth/passkey/login/verify", json={"credential": cred}), cred


def audit_actions(pid: str) -> list[tuple[str, str]]:
    with psycopg.connect(get_settings().database_url) as conn:
        rows = conn.execute("SELECT action, target FROM audit_log WHERE subject_id=%s ORDER BY id", (pid,)).fetchall()
    return [(a, t) for a, t in rows]


@pytest.fixture(scope="module", autouse=True)
def restore_demo():
    """The joined records and sign-in methods made here are removed afterwards (the next module starts clean)."""
    yield
    from app.db.seed import seed

    seed()


# ---------- passkeys ----------
def test_she_adds_a_passkey_and_signs_in_with_it_on_another_device(client):
    pid = join(client)
    auth = SoftAuthenticator()
    r = add_passkey(client, auth)
    assert r.status_code == 200, r.text
    mine = client.get("/v1/auth/me").json()
    assert mine["own_record"] is True and len(mine["passkeys"]) == 1 and mine["email_linked"] is False

    r, _ = passkey_sign_in(client, auth)
    assert r.status_code == 200, r.text
    assert r.json() == {"role": "patient", "user_id": pid}
    assert "rs_token" in r.cookies or client.cookies.get("rs_token")
    assert client.get("/v1/demo/whoami").json()["user_id"] == pid
    assert client.get("/v1/me/home").json()["profile"]["alias"] == "Maryam (demo)"
    assert ("passkey_added", "passkey") in audit_actions(pid)
    assert ("sign_in", "passkey") in audit_actions(pid)  # every sign-in is audited

    # The stored passkey is a public key and a counter: nothing biometric, and the counter moved on.
    with psycopg.connect(get_settings().database_url) as conn:
        cols = [d.name for d in conn.execute("SELECT * FROM passkeys LIMIT 0").description]
        row = conn.execute("SELECT sign_count, public_key FROM passkeys WHERE profile_id=%s", (pid,)).fetchone()
    assert set(cols) == {
        "id",
        "profile_id",
        "credential_id",
        "public_key",
        "sign_count",
        "transports",
        "label",
        "created_at",
        "last_used_at",
    }
    assert row[0] == 1 and len(bytes(row[1])) > 60


def test_a_replayed_passkey_answer_does_not_sign_in(client):
    join(client)
    auth = SoftAuthenticator()
    assert add_passkey(client, auth).status_code == 200
    first, cred = passkey_sign_in(client, auth)
    assert first.status_code == 200
    client.cookies.clear()
    again = client.post("/v1/auth/passkey/login/verify", json={"credential": cred})
    assert again.status_code == 400 and "expired" in again.json()["detail"].lower()
    assert client.get("/v1/demo/whoami").status_code == 401


def test_a_passkey_answer_from_another_website_does_not_sign_in(client):
    join(client)
    auth = SoftAuthenticator()
    assert add_passkey(client, auth).status_code == 200
    r, _ = passkey_sign_in(client, auth, at="https://evil.example")
    assert r.status_code == 400
    assert client.get("/v1/demo/whoami").status_code == 401
    # Registration checks the origin too.
    join(client)
    o = client.post("/v1/auth/passkey/register/options").json()
    bad = client.post(
        "/v1/auth/passkey/register/verify", json={"credential": SoftAuthenticator().create(o, "https://evil.example")}
    )
    assert bad.status_code == 400


def test_an_expired_passkey_challenge_does_not_sign_in(client):
    join(client)
    auth = SoftAuthenticator()
    assert add_passkey(client, auth).status_code == 200
    client.cookies.clear()
    o = client.post("/v1/auth/passkey/login/options").json()
    with psycopg.connect(get_settings().database_url) as conn:
        conn.execute(
            "UPDATE auth_challenges SET expires_at = now() - interval '1 second' WHERE challenge=%s", (o["challenge"],)
        )
    r = client.post("/v1/auth/passkey/login/verify", json={"credential": auth.get(o, origin(), rp_id())})
    assert r.status_code == 400


def test_an_unknown_passkey_does_not_sign_in(client):
    client.cookies.clear()
    r, _ = passkey_sign_in(client, SoftAuthenticator())
    assert r.status_code == 400 and client.get("/v1/demo/whoami").status_code == 401


def test_she_can_remove_a_passkey_and_it_no_longer_works(client):
    pid = join(client)
    auth = SoftAuthenticator()
    assert add_passkey(client, auth).status_code == 200
    pk = client.get("/v1/auth/me").json()["passkeys"][0]
    assert client.delete(f"/v1/auth/passkeys/{pk['id']}").status_code == 200
    assert client.get("/v1/auth/me").json()["passkeys"] == []
    assert ("passkey_removed", "passkey") in audit_actions(pid)
    r, _ = passkey_sign_in(client, auth)
    assert r.status_code == 400


def test_demo_personas_stay_one_tap_and_cannot_add_sign_in_methods(client):
    h = login(client, "noura")  # one tap from /demo, as before
    assert client.get("/v1/me/home", headers=h).status_code == 200
    me = client.get("/v1/auth/me", headers=h).json()
    assert me["own_record"] is False
    assert client.post("/v1/auth/passkey/register/options", headers=h).status_code == 403
    assert client.post("/v1/auth/email/link/start", headers=h, json={"email": EMAIL}).status_code == 403
    staff = login(client, role="clinician")
    assert client.post("/v1/auth/passkey/register/options", headers=staff).status_code == 403
    cadmin = login(client, role="clinic_admin")
    assert client.post("/v1/auth/passkey/register/options", headers=cadmin).status_code == 403


def test_export_and_delete_work_after_signing_in(client):
    pid = join(client)
    auth = SoftAuthenticator()
    assert add_passkey(client, auth).status_code == 200
    client.post("/v1/logs", json={"date": "2026-11-20", "flow": "light", "pain": 2})
    r, _ = passkey_sign_in(client, auth)
    assert r.status_code == 200
    out = client.get("/v1/export")
    assert out.status_code == 200 and out.json()["profile"]["id"] == pid
    assert client.delete("/v1/me/data").status_code == 200
    assert client.get("/v1/privacy").json()["stored"]["daily_logs"] == 0
    # Her sign-in methods stay, so she can still open the emptied record.
    assert passkey_sign_in(client, auth)[0].status_code == 200


# ---------- email code (guessing a code until it locks: attack 10 in test_attack_suite.py) ----------
class FakeSender:
    def __init__(self) -> None:
        self.sent: list[tuple[str, str]] = []

    def send_code(self, to: str, code: str, lang: str) -> None:
        self.sent.append((to, code))


@pytest.fixture
def mailbox():
    from app.security import email

    with psycopg.connect(get_settings().database_url) as conn:  # each test starts with no linked address
        conn.execute("DELETE FROM sign_in_emails")
        conn.execute("DELETE FROM email_codes")
    fake = FakeSender()
    email.set_sender(fake)
    yield fake
    email.set_sender(None)


def link_email(client, mailbox: FakeSender) -> str:
    pid = join(client)
    r = client.post("/v1/auth/email/link/start", json={"email": EMAIL})
    assert r.status_code == 200, r.text
    code = mailbox.sent[-1][1]
    r = client.post("/v1/auth/email/link/verify", json={"email": EMAIL, "code": code})
    assert r.status_code == 200, r.text
    assert client.get("/v1/auth/me").json()["email_linked"] is True
    return pid


def start_code(client, mailbox: FakeSender, email: str = EMAIL) -> str:
    client.cookies.clear()
    r = client.post("/v1/auth/email/start", json={"email": email})
    assert r.status_code == 200, r.text
    return mailbox.sent[-1][1]


def test_without_an_email_key_the_code_option_is_off_and_says_why(client):
    from app.security import email

    email.set_sender(None)
    assert not get_settings().resend_api_key
    assert client.get("/v1/auth/methods").json() == {"passkey": True, "email": False}
    r = client.post("/v1/auth/email/start", json={"email": EMAIL})
    assert r.status_code == 503 and "email" in r.json()["detail"].lower()
    assert client.post("/v1/auth/email/verify", json={"email": EMAIL, "code": "123456"}).status_code == 503


def test_the_right_email_code_signs_her_in(client, mailbox):
    pid = link_email(client, mailbox)
    assert client.get("/v1/auth/methods").json()["email"] is True
    code = start_code(client, mailbox)
    assert len(code) == 6 and code.isdigit()
    r = client.post("/v1/auth/email/verify", json={"email": EMAIL.upper(), "code": code})  # case does not matter
    assert r.status_code == 200, r.text
    assert r.json() == {"role": "patient", "user_id": pid}
    assert client.get("/v1/demo/whoami").json()["user_id"] == pid
    assert ("sign_in", "email_code") in audit_actions(pid)
    assert ("email_linked", "email") in audit_actions(pid)
    # A code works once.
    client.cookies.clear()
    assert client.post("/v1/auth/email/verify", json={"email": EMAIL, "code": code}).status_code == 400


def test_an_expired_code_does_not_sign_in(client, mailbox):
    link_email(client, mailbox)
    code = start_code(client, mailbox)
    with psycopg.connect(get_settings().database_url) as conn:
        conn.execute("UPDATE email_codes SET expires_at = now() - interval '1 second'")
    r = client.post("/v1/auth/email/verify", json={"email": EMAIL, "code": code})
    assert r.status_code == 400 and client.get("/v1/demo/whoami").status_code == 401


def test_codes_are_rate_limited_per_address(client, mailbox):
    link_email(client, mailbox)
    client.cookies.clear()
    codes = [client.post("/v1/auth/email/start", json={"email": EMAIL}).status_code for _ in range(4)]
    assert codes[:3] == [200, 200, 200] and codes[3] == 429


def test_an_unknown_address_gets_the_same_answer_and_no_email(client, mailbox):
    client.cookies.clear()
    r = client.post("/v1/auth/email/start", json={"email": "nobody.demo@example.com"})
    assert r.status_code == 200 and mailbox.sent == []
    known = link_email(client, mailbox)
    assert known
    client.cookies.clear()
    r2 = client.post("/v1/auth/email/start", json={"email": EMAIL})
    assert r2.json() == r.json()  # nobody can learn which addresses have a record


def test_the_code_and_the_address_never_reach_logs_responses_or_the_database(client, mailbox, caplog):
    caplog.set_level(logging.DEBUG)
    pid = link_email(client, mailbox)
    client.cookies.clear()
    r1 = client.post("/v1/auth/email/start", json={"email": EMAIL})
    code = mailbox.sent[-1][1]
    r2 = client.post("/v1/auth/email/verify", json={"email": EMAIL, "code": "999999" if code != "999999" else "000000"})
    r3 = client.post("/v1/auth/email/verify", json={"email": EMAIL, "code": code})
    me = client.get("/v1/auth/me")
    privacy = client.get("/v1/privacy")
    for r in (r1, r2, r3, me, privacy):
        assert code not in r.text and EMAIL not in r.text.lower()
    assert code not in caplog.text and EMAIL not in caplog.text.lower()
    with psycopg.connect(get_settings().database_url) as conn:
        dump = json.dumps(
            [
                conn.execute("SELECT * FROM sign_in_emails").fetchall(),
                conn.execute("SELECT * FROM email_codes").fetchall(),
                conn.execute("SELECT detail FROM audit_log WHERE subject_id=%s", (pid,)).fetchall(),
            ],
            default=str,
        )
    assert EMAIL not in dump.lower() and "maryam.demo" not in dump and f"'{code}'" not in dump


def test_she_can_unlink_her_email(client, mailbox):
    pid = link_email(client, mailbox)
    assert client.delete("/v1/auth/email").status_code == 200
    assert client.get("/v1/auth/me").json()["email_linked"] is False
    assert ("email_unlinked", "email") in audit_actions(pid)
    mailbox.sent.clear()
    client.cookies.clear()
    client.post("/v1/auth/email/start", json={"email": EMAIL})
    assert mailbox.sent == []


def test_an_address_already_on_another_record_is_not_moved(client, mailbox):
    link_email(client, mailbox)
    join(client)
    client.post("/v1/auth/email/link/start", json={"email": EMAIL})
    r = client.post("/v1/auth/email/link/verify", json={"email": EMAIL, "code": mailbox.sent[-1][1]})
    assert r.status_code == 409


def test_a_database_seeded_before_sign_in_gains_the_tables_at_boot():
    from app.db.seed import ensure_sign_in_tables

    ensure_sign_in_tables()
    ensure_sign_in_tables()  # safe to run on every boot


def test_row_level_security_keeps_passkeys_to_their_owner(client):
    from app.db import Actor, session

    first = join(client)
    assert add_passkey(client, SoftAuthenticator()).status_code == 200
    second = join(client)
    with session(Actor("patient", second)) as cur:
        cur.execute("SELECT count(*) AS n FROM passkeys WHERE profile_id=%s", (first,))
        assert cur.fetchone()["n"] == 0
    with session(Actor("clinician", "clin-01", "clinic_corniche")) as cur:
        cur.execute("SELECT count(*) AS n FROM passkeys")
        assert cur.fetchone()["n"] == 0  # staff never see how she signs in
        cur.execute("SELECT count(*) AS n FROM email_codes")
        assert cur.fetchone()["n"] == 0
    with session(Actor("clinic_admin", "cadmin-01", "clinic_corniche")) as cur:
        cur.execute("SELECT count(*) AS n FROM passkeys")
        assert cur.fetchone()["n"] == 0  # nor the clinic admin (K4)


def test_a_configured_key_turns_the_email_option_on_and_a_provider_error_logs_no_address(client, monkeypatch, caplog):
    import urllib.error
    import urllib.request

    from app.security import email

    email.set_sender(None)
    monkeypatch.setattr(get_settings(), "resend_api_key", "test-key-not-real")
    sender = email.get_sender()
    assert isinstance(sender, email.ResendSender) and sender.sender == email.TEST_SENDER
    assert client.get("/v1/auth/methods").json()["email"] is True

    def refuse(req, timeout):
        body = json.loads(req.data)
        assert body["to"] == [EMAIL] and "123456" in body["text"] and req.full_url == email.ResendSender.URL
        raise urllib.error.HTTPError(req.full_url, 403, "Forbidden", {}, None)

    monkeypatch.setattr(urllib.request, "urlopen", refuse)
    caplog.set_level(logging.DEBUG)
    with pytest.raises(email.SendFailed):
        sender.send_code(EMAIL, "123456", "en")
    assert "403" in caplog.text and EMAIL not in caplog.text and "123456" not in caplog.text
