"""docs/31 §H, H3: the one-tap admin is public on the demo, so with DEMO_RESET_KEY set the demo reset also needs the
operator key (the team has it; a visitor does not). Unset, the reset works as before (local development, e2e)."""

import secrets

import pytest
from conftest import login

from app.config import get_settings


@pytest.fixture
def admin(client):
    return login(client, role="admin")


def test_without_a_key_the_reset_works_as_before(client, admin, monkeypatch, reseed):
    monkeypatch.setattr(get_settings(), "demo_reset_key", "")
    assert client.post("/v1/demo/reset", headers=admin).status_code == 200


def test_with_a_key_the_reset_needs_it(client, admin, monkeypatch, reseed):
    key = "op-" + secrets.token_hex(12)
    monkeypatch.setattr(get_settings(), "demo_reset_key", key)
    no_key = client.post("/v1/demo/reset", headers=admin)
    assert no_key.status_code == 403 and no_key.json()["detail"] == "The demo reset needs the operator key."
    assert client.post("/v1/demo/reset", headers=admin, json={"operator_key": "guess"}).status_code == 403
    assert client.post("/v1/demo/reset", headers=admin, json={"operator_key": key}).status_code == 200


def test_the_key_never_replaces_the_admin_role(client, monkeypatch):
    key = "op-" + secrets.token_hex(12)
    monkeypatch.setattr(get_settings(), "demo_reset_key", key)
    her = login(client, "noura")
    assert client.post("/v1/demo/reset", headers=her, json={"operator_key": key}).status_code == 403
