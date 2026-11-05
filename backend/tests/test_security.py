"""Security headers, rate limits, encryption at the field level, redaction, audit hash chain."""

import psycopg

from app.ai.redact import redact
from app.config import get_settings
from app.security.audit import verify_chain
from app.security.crypto import decrypt, encrypt
from tests.conftest import login


def test_security_headers(client):
    r = client.get("/healthz")
    assert r.headers["x-frame-options"] == "DENY" and r.headers["x-content-type-options"] == "nosniff"
    assert "frame-ancestors 'none'" in r.headers["content-security-policy"]


def test_cors_allows_only_the_web_origin(client):
    ok = client.options(
        "/v1/demo/personas", headers={"Origin": "http://localhost:3000", "Access-Control-Request-Method": "GET"}
    )
    bad = client.options(
        "/v1/demo/personas", headers={"Origin": "https://evil.example", "Access-Control-Request-Method": "GET"}
    )
    assert ok.headers.get("access-control-allow-origin") == "http://localhost:3000"
    assert "access-control-allow-origin" not in bad.headers


def test_rate_limit(client, monkeypatch):
    s = get_settings()
    monkeypatch.setattr(s, "rate_limit_sensitive_per_min", 3)
    h = login(client, "noura")
    codes = [
        client.post(
            "/v1/assistant/ask",
            headers={**h, "x-test": "rl"},
            json={"question": "What is PCOS?"},
            cookies={"rs_token": "rate-limit-test-client-0001"},
        ).status_code
        for _ in range(5)
    ]
    assert codes.count(429) >= 1


def test_notes_are_encrypted_at_rest():
    with psycopg.connect(get_settings().database_url) as conn:
        row = conn.execute("SELECT note_enc FROM daily_logs WHERE note_enc IS NOT NULL LIMIT 1").fetchone()
    blob = bytes(row[0])
    text = decrypt(blob)
    assert text and text.encode() not in blob
    assert decrypt(encrypt("hello")) == "hello"


def test_redaction_before_llm():
    t = redact(
        "Noura A. (fictional) on 2026-11-12, call +971 50 123 4567, mail a@b.com, EID 784-1990-1234567-1",
        ["Noura A. (fictional)"],
        __import__("datetime").date(2026, 11, 22),
    )
    assert (
        "Noura" not in t
        and "2026-11-12" not in t
        and "day -10" in t
        and "[phone]" in t
        and "[email]" in t
        and "[id]" in t
    )


def test_audit_chain_verifies_and_detects_tampering(client):
    h = login(client, role="admin")
    v = client.get("/v1/admin/audit/verify", headers=h).json()
    assert v["chain_ok"] is True and v["entries"] > 0
    with psycopg.connect(get_settings().database_url) as conn:
        rows = conn.execute("SELECT * FROM audit_log ORDER BY id").fetchall()
        cols = [d.name for d in conn.execute("SELECT * FROM audit_log LIMIT 0").description]
    dicts = [dict(zip(cols, r, strict=True)) for r in rows]
    dicts[0]["action"] = "tampered"
    ok, bad = verify_chain(dicts)
    assert ok is False and bad == dicts[0]["id"]
