"""Request IDs and JSON access logs (18 Nov production audit: no request IDs, no latency, no way to join web and API logs)."""

from __future__ import annotations

import json
import logging

from tests.conftest import login


def test_every_response_carries_a_request_id(client):
    r = client.get("/healthz")
    assert len(r.headers["x-request-id"]) >= 8
    mine = client.get("/v1/demo/personas", headers={"x-request-id": "web-1234-abcd"})
    assert mine.headers["x-request-id"] == "web-1234-abcd"  # the web tier's ID is kept, so both logs join
    bad = client.get("/v1/demo/personas", headers={"x-request-id": "<script>alert(1)</script>"})
    assert bad.headers["x-request-id"] != "<script>alert(1)</script>"  # malformed: replaced, never echoed


def test_access_log_is_json_with_route_template_and_no_secrets(client, caplog, monkeypatch):
    from app.observability import JsonFormatter

    monkeypatch.setattr(logging.getLogger("reprosense"), "propagate", True)  # let caplog see the app's logger
    h = login(client, "noura")
    share_token = "SECRET-share-token-value"
    with caplog.at_level(logging.INFO, logger="reprosense.access"):
        client.get("/v1/me", headers={**h, "x-request-id": "trace-me-0001"})
        client.get(f"/v1/shared/{share_token}?q=private")
        client.get("/v1/ping")
    lines = [json.loads(JsonFormatter().format(r)) for r in caplog.records if r.name == "reprosense.access"]
    me = next(x for x in lines if x["route"] == "/v1/me")
    assert me["request_id"] == "trace-me-0001" and me["status"] == 200 and me["role"] == "patient" and me["ms"] >= 0
    dump = json.dumps(lines)
    assert share_token not in dump and "private" not in dump  # the template /v1/shared/{token} is logged instead
    assert any(x["route"] == "/v1/shared/{token}" for x in lines)
    assert not any(x["route"] == "/v1/ping" for x in lines)  # wake-up pings are not logged


def test_unhandled_errors_are_logged_with_their_request_id(client, monkeypatch, caplog):
    from fastapi.testclient import TestClient

    import app.api.patient as patient_api
    from app.main import app

    def boom(*_a, **_k):
        raise RuntimeError("unexpected")

    monkeypatch.setattr(patient_api, "load_bundle", boom)
    monkeypatch.setattr(logging.getLogger("reprosense"), "propagate", True)
    c = TestClient(app, raise_server_exceptions=False, headers={"x-rs-client": "mobile"})  # login() reads the body token (L6)
    with caplog.at_level(logging.ERROR, logger="reprosense.access"):
        r = c.get("/v1/timeline", headers={**login(c, "noura"), "x-request-id": "crash-0001-xyz"})
    assert r.status_code == 500
    rec = next(x for x in caplog.records if x.name == "reprosense.access" and x.exc_info)
    assert rec.fields["status"] == 500 and rec.fields["route"] == "/v1/timeline"
    assert rec.fields["request_id"] == "crash-0001-xyz"
