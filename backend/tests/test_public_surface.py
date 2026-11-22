"""docs/31 §H, L3 and L4: what the API shows anyone who calls it directly.

- L3: the interactive API docs and the OpenAPI schema are off unless EXPOSE_API_DOCS is set (a map of every route is
  useful to an attacker and to nobody else on a live site).
- L4: /readyz tells a direct caller only whether the service and its demo data are ready. The counts, the model
  provider and the demo flag go only to the web app's own server (x-rs-edge) or when no edge secret is configured.
"""

import secrets

from app.config import get_settings


def test_api_docs_are_off_by_default(client):
    for path in ("/docs", "/redoc", "/openapi.json"):
        assert client.get(path).status_code == 404, path


def test_api_docs_open_when_asked():
    from app.main import docs_settings

    assert docs_settings(False) == {"docs_url": None, "redoc_url": None, "openapi_url": None}
    assert docs_settings(True) == {"docs_url": "/docs", "redoc_url": "/redoc", "openapi_url": "/openapi.json"}


def test_readyz_tells_a_direct_caller_only_readiness(client, monkeypatch):
    edge = "edge-" + secrets.token_hex(8)
    monkeypatch.setattr(get_settings(), "edge_secret", edge)
    public = client.get("/readyz").json()
    assert public == {"ok": True, "db": True, "data_ready": True}
    vouched = client.get("/readyz", headers={"x-rs-edge": edge}).json()
    assert vouched["data_ready"] is True and vouched["personas"] >= 8 and "llm" in vouched and "demo_mode" in vouched


def test_readyz_keeps_details_without_an_edge_secret(client, monkeypatch):
    monkeypatch.setattr(get_settings(), "edge_secret", "")
    r = client.get("/readyz").json()
    assert r["db"] is True and r["personas"] >= 8 and r["kb_chunks"] > 0 and r["data_ready"] is True
