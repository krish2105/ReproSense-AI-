"""Abuse and input hardening from the 18 Nov production audit. Each test failed on main before the fix."""

from __future__ import annotations

import inspect
import secrets

import psycopg
import pytest

from app.config import get_settings
from tests.conftest import login

LAB = b"Sample date: 2026-11-01\nFerritin   9 ng/mL 15-150 L\n"


# ---------- abuse ----------
def test_random_cookies_cannot_dodge_the_rate_limit(client, monkeypatch):
    monkeypatch.setattr(get_settings(), "rate_limit_sensitive_per_min", 3)
    codes = []
    for _ in range(8):
        client.cookies.clear()
        client.cookies.set("rs_token", secrets.token_urlsafe(30))  # forged, unsigned: counts against the address
        codes.append(client.post("/v1/assistant/ask", json={"question": "What is PCOS?"}).status_code)
    client.cookies.clear()
    assert 429 in codes  # before: every request had its own bucket, so nothing was ever limited


def test_rate_limit_table_is_swept():
    from app.security.middleware import RateLimit

    rl = RateLimit(app=None)
    for i in range(50):
        rl.hits[(f"ip:{i}", "general")].append(0.0)
    rl._sweep(now=120.0)
    assert not rl.hits  # idle buckets go, so forged clients cannot grow the table without bound


def test_the_demo_reset_has_a_cooldown(client, monkeypatch, reseed):
    from app.api import demo

    monkeypatch.setattr(get_settings(), "demo_reset_cooldown_s", 120)
    monkeypatch.setitem(demo._last_reset, "at", float("-inf"))
    h = login(client, role="admin")  # one click on the public demo
    assert client.post("/v1/demo/reset", headers=h).status_code == 200
    second = client.post("/v1/demo/reset", headers=h)
    assert second.status_code == 429 and int(second.headers["retry-after"]) > 0


def test_deleting_her_data_ends_clinic_sharing(client, reseed):
    client.delete("/v1/me/data", headers=login(client, "priya"))
    ids = [
        p["id"] for p in client.get("/v1/clinic/patients", headers=login(client, role="clinician")).json()["patients"]
    ]
    assert "priya" not in ids  # before: the clinic kept listing her, with an empty record


# ---------- data integrity and input validation ----------
def _upload(client, h):
    return client.post("/v1/documents", headers=h, files={"file": ("lab.txt", LAB, "text/plain")}).json()


def test_confirming_a_document_twice_saves_once(client, reseed):
    h = login(client, "noura")
    d = _upload(client, h)
    assert client.post(f"/v1/documents/{d['id']}/confirm", headers=h, json={"rows": d["rows"]}).status_code == 200
    again = client.post(f"/v1/documents/{d['id']}/confirm", headers=h, json={"rows": d["rows"]})
    assert again.status_code == 409
    labs = [x for x in client.get("/v1/export", headers=h).json()["labs"] if x["source_doc_id"] == d["id"]]
    assert len(labs) == 1  # before: 2 rows, so her record and the doctor PDF showed the value twice


def test_bad_rows_are_422_not_500(client, reseed):
    h = login(client, "noura")
    d = _upload(client, h)
    for row in (
        {"code": "FERR", "value": "9", "date": "not-a-date"},
        {"code": "FERR", "value": "9", "date": "2026-11-01", "ref_low": "low"},
        {"code": "DROP TABLE", "value": "9", "date": "2026-11-01"},
    ):
        r = client.post(f"/v1/documents/{d['id']}/confirm", headers=h, json={"rows": [row]})
        assert r.status_code == 422, (row, r.status_code)
    too_many = [{"code": "FERR", "value": "9", "date": "2026-11-01"}] * 51
    assert client.post(f"/v1/documents/{d['id']}/confirm", headers=h, json={"rows": too_many}).status_code == 422


@pytest.mark.parametrize("blob", [b"%PDF-1.4 garbage", b"%PDF-" + b"\x00" * 64])
def test_a_damaged_pdf_is_a_clear_422(client, blob):
    r = client.post("/v1/documents", headers=login(client, "noura"), files={"file": ("x.pdf", blob, "application/pdf")})
    assert r.status_code == 422 and "PDF" in r.json()["detail"]


def test_the_upload_handler_does_not_block_the_event_loop():
    from app.api.patient import upload_document

    assert not inspect.iscoroutinefunction(upload_document)  # a plain def runs in the worker pool


# ---------- LLM cache ----------
def test_llm_cache_tolerates_damaged_entries_and_can_forget(tmp_path, monkeypatch):
    from app.ai import llm

    monkeypatch.setattr(llm, "CACHE_DIR", tmp_path)
    llm.cache_put("s", "u", {"summary": "ok"})
    assert llm.cache_get("s", "u") == {"summary": "ok"}
    (tmp_path / f"{llm._key('s', 'u')}.json").write_text("{half a fi")
    assert llm.cache_get("s", "u") is None  # was a JSONDecodeError inside the request
    llm.cache_put("s", "u", {"summary": "bad"})
    llm.cache_drop("s", "u")
    assert llm.cache_get("s", "u") is None
    assert not list(tmp_path.glob("*.tmp"))


def test_lab_rows_saved_by_main_still_confirm(client, reseed):
    """The typed rows accept exactly what the web sends after extraction (the existing document flow)."""
    h = login(client, "fatima")
    with psycopg.connect(get_settings().database_url) as conn:
        before = conn.execute("SELECT count(*) FROM lab_results WHERE profile_id='fatima'").fetchone()[0]
    d = _upload(client, h)
    assert client.post(f"/v1/documents/{d['id']}/confirm", headers=h, json={"rows": d["rows"]}).json()["saved"] == 1
    with psycopg.connect(get_settings().database_url) as conn:
        assert conn.execute("SELECT count(*) FROM lab_results WHERE profile_id='fatima'").fetchone()[0] == before + 1
