"""Y4 · Family support view: a read-only, revocable link to her upcoming care steps (build week, 18 Nov 2026)."""

from __future__ import annotations

import json

import psycopg

from app.config import get_settings
from app.services import family
from tests.conftest import login


def _link(client, h, **body):
    r = client.post("/v1/family-links", headers=h, json={"relation": "husband", "consent": True, **body})
    assert r.status_code == 200, r.text
    return r.json()


def test_a_link_needs_her_consent_and_a_known_relation(client):
    h = login(client, "fatima")
    assert client.post("/v1/family-links", headers=h, json={"relation": "husband", "consent": False}).status_code == 422
    assert client.post("/v1/family-links", headers=h, json={"relation": "boss", "consent": True}).status_code == 422
    assert (
        client.post(
            "/v1/family-links", headers=login(client, role="clinician"), json={"relation": "mother", "consent": True}
        ).status_code
        == 403
    )


def test_without_details_it_shows_only_steps_tips_and_her_name(client, reseed):
    h = login(client, "fatima")
    link = _link(client, h)
    assert link["path"].startswith("/family/") and len(link["token"]) >= 40
    v = client.get(f"/v1/family/{link['token']}").json()
    assert v["first_name"] == "Fatima" and v["stage"] == "after_birth" and v["relation"] == "husband"
    assert [s["id"] for s in v["steps"]] == ["glucose_test"]  # the only step still due 9 weeks after the birth
    assert v["details"] is None
    text = json.dumps(v).lower()
    for word in ("gestational", "gdm", "diabetes", "mood", "epds", "depress", "pattern"):
        assert word not in text, word  # a step never says why it is on her list


def test_with_details_it_adds_weeks_and_pattern_ids_never_mood_or_red_flags(client, reseed):
    v = client.get(f"/v1/family/{_link(client, login(client, 'fatima'), include_details=True)['token']}").json()
    assert v["details"]["weeks_since_birth"] == 9
    # Fatima's mood pattern is never on a family link, and her glucose test is already a step: no pattern ids left.
    assert v["details"]["patterns"] == []
    noura = client.get(f"/v1/family/{_link(client, login(client, 'noura'), include_details=True)['token']}").json()
    assert "OBS_IRREGULAR_CYCLES" in noura["details"]["patterns"]
    assert all(p.startswith("OBS_") for p in noura["details"]["patterns"])  # ids, never her own card text ("your …")
    sara = client.get(f"/v1/family/{_link(client, login(client, 'sara'), include_details=True)['token']}").json()
    text = json.dumps(sara)
    assert "998" not in text and "dizz" not in text.lower() and "RF1" not in text  # red flags never leave her app


def test_pregnancy_shows_the_glucose_screen(client, reseed):
    v = client.get(f"/v1/family/{_link(client, login(client, 'hessa'))['token']}").json()
    assert v["stage"] == "pregnancy" and [s["id"] for s in v["steps"]] == ["pregnancy_glucose_screen"]


def test_every_view_is_in_her_who_saw_my_data(client, reseed):
    h = login(client, "fatima")
    token = _link(client, h)["token"]
    client.get(f"/v1/family/{token}")
    audit = client.get("/v1/privacy", headers=h).json()["audit"]
    views = [a for a in audit if a["action"] == "view_family_link"]
    assert views and views[0]["actor_role"] == "family"
    assert any(a["action"] == "create_family_link" for a in audit)
    links = client.get("/v1/family-links", headers=h).json()
    assert links[0]["last_viewed_at"] is not None and "token" not in links[0] and "token_hash" not in links[0]


def test_revoked_and_expired_links_stop_working(client, reseed):
    h = login(client, "fatima")
    a, b = _link(client, h), _link(client, h, relation="mother")
    assert client.delete(f"/v1/family-links/{a['id']}", headers=h).status_code == 200
    assert client.get(f"/v1/family/{a['token']}").status_code == 404
    assert client.delete(f"/v1/family-links/{a['id']}", headers=h).status_code == 404  # already off
    with psycopg.connect(get_settings().database_url, autocommit=True) as conn:
        conn.execute("UPDATE family_links SET expires_at = now() - interval '1 minute' WHERE id = %s", (b["id"],))
    assert client.get(f"/v1/family/{b['token']}").status_code == 410
    assert client.get("/v1/family/not-a-real-token-at-all-0123456789").status_code == 404


def test_she_only_sees_and_revokes_her_own_links(client, reseed):
    mine = _link(client, login(client, "fatima"))
    other = login(client, "noura")
    assert client.get("/v1/family-links", headers=other).json() == []
    assert client.delete(f"/v1/family-links/{mine['id']}", headers=other).status_code == 404  # RLS hides it
    assert client.get(f"/v1/family/{mine['token']}").status_code == 200


def test_deleting_her_data_ends_her_family_links(client, reseed):
    h = login(client, "fatima")
    token = _link(client, h)["token"]
    client.delete("/v1/me/data", headers=h)
    assert client.get(f"/v1/family/{token}").status_code == 404


def test_the_table_is_added_to_an_older_database_safely():
    from app.db.seed import ensure_addon_tables

    ensure_addon_tables()
    ensure_addon_tables()  # every statement is safe to run again
    with psycopg.connect(get_settings().database_url) as conn:
        assert conn.execute("SELECT to_regclass('public.family_links') IS NOT NULL").fetchone()[0]


def test_first_name_from_the_alias():
    assert family.first_name("Fatima K. (fictional)") == "Fatima"
    assert family.first_name("Reem (demo)") == "Reem"
    assert family.first_name("(fictional)") == ""
