"""docs/31 §H, H2 and H2b (docs/30 security assessment): the client address a rate limit counts against cannot be chosen
by the caller, and sign-ins cannot grow the auth tables without limit.

- With EDGE_SECRET set, only the web app's own server (which sends x-rs-edge) may name the visitor's address in
  X-Forwarded-For. Anyone calling the API directly counts against the address the nearest proxy saw connect (the
  rightmost entry), so a forged leftmost entry changes nothing.
- Sign-ins count against the address, never against a session token: before, each demo sign-in minted a token and the
  next sign-in sent it, so every request got a fresh allowance.
- Expired passkey challenges are deleted as soon as they expire, not a day later.
"""

import secrets

from app.config import get_settings
from app.db import SYSTEM, session


def _flood(client, headers_for, n=8, path="/v1/assistant/ask"):
    codes = []
    for i in range(n):
        client.cookies.clear()
        codes.append(client.post(path, json={"question": "What is PCOS?"}, headers=headers_for(i)).status_code)
    return codes


def test_without_an_edge_secret_behaviour_is_unchanged(client, monkeypatch):
    from app.security.middleware import client_ip

    monkeypatch.setattr(get_settings(), "edge_secret", "")

    class Req:
        headers = {"x-forwarded-for": "10.0.0.1, 203.0.113.9"}
        client = type("C", (), {"host": "198.51.100.7"})()

    assert client_ip(Req()) == "198.51.100.7"  # what uvicorn already decided, as before


def test_a_direct_caller_cannot_choose_its_address(client, monkeypatch):
    monkeypatch.setattr(get_settings(), "edge_secret", "edge-" + secrets.token_hex(8))
    monkeypatch.setattr(get_settings(), "rate_limit_sensitive_per_min", 3)
    codes = _flood(client, lambda i: {"x-forwarded-for": f"10.0.{i}.1, 203.0.113.9"})
    assert 429 in codes, codes  # every request counted against 203.0.113.9, whatever the leftmost entry said


def test_a_wrong_edge_header_is_treated_as_a_direct_caller(client, monkeypatch):
    monkeypatch.setattr(get_settings(), "edge_secret", "edge-" + secrets.token_hex(8))
    monkeypatch.setattr(get_settings(), "rate_limit_sensitive_per_min", 3)
    codes = _flood(client, lambda i: {"x-forwarded-for": f"10.1.{i}.1, 203.0.113.10", "x-rs-edge": "guess"})
    assert 429 in codes, codes


def test_the_web_edge_passes_each_visitors_own_address(client, monkeypatch):
    edge = "edge-" + secrets.token_hex(8)
    monkeypatch.setattr(get_settings(), "edge_secret", edge)
    monkeypatch.setattr(get_settings(), "rate_limit_sensitive_per_min", 3)
    codes = _flood(client, lambda i: {"x-forwarded-for": f"10.2.{i}.1, 203.0.113.11", "x-rs-edge": edge})
    assert 429 not in codes, codes  # eight different visitors behind the same Vercel address are not throttled together


def test_demo_sign_ins_count_against_the_address_not_the_token(monkeypatch):
    from fastapi.testclient import TestClient

    from app.main import app

    own = TestClient(app)  # keeps each new cookie and sends it with the next sign-in, as an attacker's script would
    monkeypatch.setattr(get_settings(), "rate_limit_sensitive_per_min", 3)
    codes = [own.post("/v1/demo/login", json={"persona": "noura", "role": "patient"}).status_code for _ in range(8)]
    assert 429 in codes, codes


def test_expired_passkey_challenges_are_deleted_at_once(client):
    from app.security.passkeys import store_challenge

    with session(SYSTEM) as cur:
        cur.execute(
            "INSERT INTO auth_challenges (challenge, purpose, profile_id, expires_at) VALUES (%s,'login',NULL, now() - interval '1 second')",
            ("expired-" + secrets.token_hex(8),),
        )
    store_challenge("login", None)
    with session(SYSTEM) as cur:
        cur.execute("SELECT count(*) AS n FROM auth_challenges WHERE expires_at < now()")
        assert cur.fetchone()["n"] == 0
