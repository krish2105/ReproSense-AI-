"""K4 clinic onboarding (build week): a clinic-admin role per clinic, single-use clinician invites, the clinic's own
dashboard and a follow-up export without names or ids. Postgres row-level security keeps each clinic to itself."""

import csv
import hashlib
import io

import psycopg
import pytest
from fastapi.testclient import TestClient

from app.db import SYSTEM, Actor, session
from app.security.auth import create_token
from tests.conftest import login

CORNICHE, NORTH = "clinic_corniche", "clinic_north"
CADMIN_NORTH = Actor("clinic_admin", "cadmin-02", NORTH)


@pytest.fixture(scope="module", autouse=True)
def fresh_demo_after(seeded):
    """Invites and invited clinicians stay inside this module: the next test file sees the plain demo again."""
    yield
    from app.db.seed import seed

    seed()


def bearer(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def north_admin() -> dict:
    return bearer(create_token(CADMIN_NORTH.user_id, "clinic_admin", NORTH))


def invite(client, h, **body) -> dict:
    r = client.post("/v1/clinic-admin/invites", headers=h, json=body)
    assert r.status_code == 201, r.text
    return r.json()


def accept(client, token, name="Reem"):
    return client.post(f"/v1/clinic-invites/{token}/accept", json={"display_name": name})


def statuses(client, h) -> dict:
    r = client.get("/v1/clinic-admin/invites", headers=h)
    assert r.status_code == 200, r.text
    return {i["id"]: i["status"] for i in r.json()["invites"]}


# ---------- the role and its demo login ----------


def test_clinic_admin_demo_login_is_one_tap(client):
    staff = {s["role"]: s for s in client.get("/v1/demo/personas").json()["staff"]}
    assert staff["clinic_admin"]["clinic_id"] == CORNICHE and "fictional" in staff["clinic_admin"]["alias"]
    h = login(client, role="clinic_admin")
    me = client.get("/v1/demo/whoami", headers=h).json()
    assert me == {"role": "clinic_admin", "user_id": "cadmin-01", "clinic_id": CORNICHE}
    # the existing staff logins still open the seeded people, whoever joins later
    assert client.get("/v1/demo/whoami", headers=login(client, role="clinician")).json()["user_id"] == "clin-01"


def test_patient_clinician_and_network_admin_cannot_call_clinic_admin_endpoints(client):
    paths = [
        ("get", "/v1/clinic-admin/invites"),
        ("post", "/v1/clinic-admin/invites"),
        ("delete", "/v1/clinic-admin/invites/1"),
        ("get", "/v1/clinic-admin/team"),
        ("get", "/v1/clinic-admin/dashboard"),
        ("get", "/v1/clinic-admin/export.csv"),
    ]
    for who in (login(client, "noura"), login(client, role="clinician"), login(client, role="admin")):
        for method, path in paths:
            r = client.request(method.upper(), path, headers=who, json={} if method == "post" else None)
            assert r.status_code == 403, (method, path, r.status_code)
    anon = TestClient(client.app)
    for method, path in paths:
        assert anon.request(method.upper(), path).status_code == 401, path


def test_a_forged_clinic_claim_is_refused(client):
    """The token says clinic_corniche but cadmin-02 administers clinic_north: the API checks the profile, not the claim."""
    h = bearer(create_token("cadmin-02", "clinic_admin", CORNICHE))
    assert client.get("/v1/clinic-admin/dashboard", headers=h).status_code == 403
    assert (
        client.get(
            "/v1/clinic-admin/dashboard", headers=bearer(create_token("noura", "clinic_admin", CORNICHE))
        ).status_code
        == 403
    )


# ---------- invites ----------


def test_invite_create_list_and_revoke(client):
    h = login(client, role="clinic_admin")
    inv = invite(client, h, expires_in_hours=48)
    assert inv["status"] == "pending" and inv["clinic"]["id"] == CORNICHE
    token = inv["token"]
    assert len(token) >= 32
    assert inv["join_path"] == f"/clinic-invite/{token}"
    assert inv["join_url"].endswith(inv["join_path"]) and inv["qr_payload"] == inv["join_url"]
    with session(SYSTEM) as cur:  # only the hash is stored
        cur.execute("SELECT * FROM clinic_invites WHERE id=%s", (inv["id"],))
        row = cur.fetchone()
    assert row["token_hash"] == hashlib.sha256(token.encode()).hexdigest()
    assert token not in {str(v) for v in row.values()}
    assert statuses(client, h)[inv["id"]] == "pending"
    listed = next(
        i for i in client.get("/v1/clinic-admin/invites", headers=h).json()["invites"] if i["id"] == inv["id"]
    )
    assert "token" not in listed and "token_hash" not in listed

    preview = client.get(f"/v1/clinic-invites/{token}")
    assert preview.status_code == 200 and preview.json()["clinic"]["id"] == CORNICHE
    assert preview.json()["status"] == "pending"

    r = client.delete(f"/v1/clinic-admin/invites/{inv['id']}", headers=h)
    assert r.status_code == 200 and r.json()["status"] == "revoked"
    assert statuses(client, h)[inv["id"]] == "revoked"
    assert accept(client, token).status_code == 410
    assert client.delete(f"/v1/clinic-admin/invites/{inv['id']}", headers=h).status_code == 409
    assert client.delete("/v1/clinic-admin/invites/999999", headers=h).status_code == 404


def test_invite_expiry_bounds(client):
    h = login(client, role="clinic_admin")
    assert client.post("/v1/clinic-admin/invites", headers=h, json={"expires_in_hours": 0}).status_code == 422
    assert client.post("/v1/clinic-admin/invites", headers=h, json={"expires_in_hours": 24 * 8}).status_code == 422
    assert invite(client, h)["status"] == "pending"  # default lifetime


def test_accept_once_only_creates_a_clinician_bound_to_the_clinic(client):
    h = login(client, role="clinic_admin")
    inv = invite(client, h)
    r = accept(client, inv["token"], "  Reem  ")
    assert r.status_code == 200, r.text
    me = r.json()
    assert me["role"] == "clinician" and me["clinic_id"] == CORNICHE and me["token"]
    assert me["alias"] == "Reem (demo)"
    who = client.get("/v1/demo/whoami", headers=bearer(me["token"])).json()
    assert who == {"role": "clinician", "user_id": me["user_id"], "clinic_id": CORNICHE}
    with session(SYSTEM) as cur:
        cur.execute("SELECT role, clinic_id, is_synthetic FROM profiles WHERE id=%s", (me["user_id"],))
        assert cur.fetchone() == {"role": "clinician", "clinic_id": CORNICHE, "is_synthetic": True}

    again = accept(client, inv["token"], "Someone else")
    assert again.status_code == 410
    assert statuses(client, h)[inv["id"]] == "accepted"
    listed = next(
        i for i in client.get("/v1/clinic-admin/invites", headers=h).json()["invites"] if i["id"] == inv["id"]
    )
    assert listed["accepted_by"] == {"id": me["user_id"], "alias": "Reem (demo)"}
    team = client.get("/v1/clinic-admin/team", headers=h).json()
    assert me["user_id"] in {c["id"] for c in team["clinicians"]} and "clin-01" in {c["id"] for c in team["clinicians"]}


def test_expired_invite_is_gone(client):
    h = login(client, role="clinic_admin")
    inv = invite(client, h)
    with session(SYSTEM) as cur:
        cur.execute("UPDATE clinic_invites SET expires_at = now() - interval '1 minute' WHERE id=%s", (inv["id"],))
    assert accept(client, inv["token"]).status_code == 410
    assert client.get(f"/v1/clinic-invites/{inv['token']}").json()["status"] == "expired"
    assert statuses(client, h)[inv["id"]] == "expired"
    assert client.delete(f"/v1/clinic-admin/invites/{inv['id']}", headers=h).status_code == 409


def test_unknown_token_and_bad_names(client):
    assert accept(client, "not-a-real-invite-token-0000000000000").status_code == 404
    assert client.get("/v1/clinic-invites/not-a-real-invite-token-0000000000000").status_code == 404
    inv = invite(client, login(client, role="clinic_admin"))
    for bad in ("", "   ", "12345", "x" * 61):
        assert accept(client, inv["token"], bad).status_code == 422, bad
    assert accept(client, inv["token"], "Hind").status_code == 200  # a refused name does not use up the invite


# ---------- each clinic sees only itself (one clinic admin attacking another: attack 4, test_attack_suite.py) ----------


def test_new_clinician_sees_only_their_clinics_consented_patients(client):
    corniche = accept(client, invite(client, login(client, role="clinic_admin"))["token"], "Maha").json()
    seeded_ids = {
        p["id"] for p in client.get("/v1/clinic/patients", headers=login(client, role="clinician")).json()["patients"]
    }
    mine = {p["id"] for p in client.get("/v1/clinic/patients", headers=bearer(corniche["token"])).json()["patients"]}
    assert mine == seeded_ids and "noura" in mine and "amina" not in mine  # Amina has not shared with a clinic

    north = accept(client, invite(client, north_admin())["token"], "Salma").json()
    assert north["clinic_id"] == NORTH
    hn = bearer(north["token"])
    assert client.get("/v1/clinic/patients", headers=hn).json()["patients"] == []
    assert client.get("/v1/clinic/patients/noura", headers=hn).status_code == 404
    assert client.get("/v1/clinic/care-gaps", headers=hn).json() == []


def test_rls_refuses_writes_into_another_clinic():
    with pytest.raises(psycopg.errors.InsufficientPrivilege):
        with session(CADMIN_NORTH) as cur:
            cur.execute(
                "INSERT INTO clinic_invites (clinic_id, token_hash, created_by, expires_at)"
                " VALUES (%s, 'x', 'cadmin-02', now() + interval '1 day')",
                (CORNICHE,),
            )
    with pytest.raises(psycopg.errors.InsufficientPrivilege):
        with session(Actor("patient", "noura")) as cur:
            cur.execute(
                "INSERT INTO clinic_invites (clinic_id, token_hash, created_by, expires_at)"
                " VALUES (%s, 'y', 'noura', now() + interval '1 day')",
                (CORNICHE,),
            )
    for actor in (Actor("clinician", "clin-01", CORNICHE), Actor("patient", "noura"), Actor("admin", "admin-01")):
        with session(actor) as cur:
            cur.execute("SELECT count(*) n FROM clinic_invites")
            assert cur.fetchone()["n"] == 0, actor
            cur.execute("SELECT coalesce(sum(n), 0) AS n FROM clinic_follow_up_counts()")
            assert cur.fetchone()["n"] == 0, actor


def test_clinician_reads_only_their_own_clinics_cohort():
    with session(Actor("clinician", "clin-01", CORNICHE)) as cur:
        cur.execute("SELECT count(*) n FROM cohort_members WHERE clinic_id <> %s", (CORNICHE,))
        assert cur.fetchone()["n"] == 0


# ---------- dashboard and export ----------


def _cohort(clinic: str) -> dict:
    with session(SYSTEM) as cur:
        cur.execute(
            "SELECT count(*) FILTER (WHERE care_gap_status='open') open,"
            " count(*) FILTER (WHERE care_gap_status='in_progress') booked,"
            " count(*) FILTER (WHERE care_gap_status='closed') done,"
            " count(*) FILTER (WHERE consented_care_share) shared"
            " FROM cohort_members WHERE clinic_id=%s",
            (clinic,),
        )
        return cur.fetchone()


def _live(clinic: str) -> dict:
    with session(SYSTEM) as cur:
        cur.execute(
            "SELECT count(*) FILTER (WHERE g.status='open') open, count(*) FILTER (WHERE g.status='in_progress') booked,"
            " count(*) FILTER (WHERE g.status='closed') done FROM care_gaps g WHERE g.clinic_id=%s",
            (clinic,),
        )
        gaps = cur.fetchone()
        cur.execute(
            "SELECT count(DISTINCT profile_id) n FROM consents WHERE purpose='care_share' AND granted AND revoked_at IS NULL"
            " AND clinic_id=%s",
            (clinic,),
        )
        return {**gaps, "shared": cur.fetchone()["n"]}


def test_dashboard_counts_this_clinics_follow_ups(client):
    d = client.get("/v1/clinic-admin/dashboard", headers=login(client, role="clinic_admin")).json()
    c, live = _cohort(CORNICHE), _live(CORNICHE)
    fu = d["follow_ups"]
    assert fu["open"] == c["open"] + live["open"]
    assert fu["booked"] == c["booked"] + live["booked"]
    assert fu["done"] == c["done"] + live["done"]
    assert fu["total"] == fu["open"] + fu["booked"] + fu["done"]
    assert fu["done_pct"] == round(100.0 * fu["done"] / fu["total"], 1)
    assert d["shared_records"] == c["shared"] + live["shared"]
    assert d["is_synthetic"] is True and d["k_min"] == 10
    assert d["team"]["clinicians"] >= 1
    pc = d["pc008_glucose"]  # a handful of after-birth glucose follow-ups: hidden below 10 like every small group
    assert set(pc) >= {"due", "booked", "done", "open", "done_pct", "suppressed"}
    assert pc["suppressed"] is True and pc["due"] is None and pc["done_pct"] is None


def test_closing_a_follow_up_moves_the_clinic_dashboard(client, reseed):
    h = login(client, role="clinic_admin")
    before = client.get("/v1/clinic-admin/dashboard", headers=h).json()["follow_ups"]
    hc = login(client, role="clinician")
    gap = next(g for g in client.get("/v1/clinic/care-gaps", headers=hc).json() if g["status"] != "closed")
    assert client.patch(f"/v1/clinic/care-gaps/{gap['id']}", headers=hc, json={"status": "closed"}).status_code == 200
    after = client.get("/v1/clinic-admin/dashboard", headers=h).json()["follow_ups"]
    assert after["done"] == before["done"] + 1 and after["total"] == before["total"]


def test_export_has_no_names_or_ids_and_hides_small_groups(client):
    h = login(client, role="clinic_admin")
    r = client.get("/v1/clinic-admin/export.csv", headers=h)
    assert r.status_code == 200 and r.headers["content-type"].startswith("text/csv")
    assert "attachment" in r.headers["content-disposition"]
    rows = list(csv.DictReader(io.StringIO(r.text)))
    assert rows and list(rows[0]) == [
        "clinic_id",
        "breakdown",
        "group",
        "follow_up_type",
        "status",
        "count",
        "suppressed",
    ]
    with session(SYSTEM) as cur:
        cur.execute("SELECT id, alias FROM profiles")
        people = cur.fetchall()
    low = r.text.lower()
    assert "syn-" not in low and "guest-" not in low
    for p in people:
        assert p["id"].lower() not in low.replace(CORNICHE, ""), p["id"]
        assert p["alias"].split(" (")[0].lower() not in low, p["alias"]
    for row in rows:
        assert row["clinic_id"] == CORNICHE
        if row["count"]:
            assert int(row["count"]) >= 10, row
            assert row["suppressed"] == ""
        else:
            assert row["suppressed"] in ("fewer than 10", "protects a small group"), row
    assert {r["breakdown"] for r in rows} == {"status", "follow_up_type", "age_group"}
    assert any(
        r["breakdown"] == "age_group" and r["count"] for r in rows
    )  # wide groups, so the breakdown says something
    # complementary suppression: within every group that adds up to a published total, never exactly one blank cell
    groups = {}
    for r in rows:
        if r["breakdown"] != "status":
            groups.setdefault((r["breakdown"], r["status"]), []).append(r)
    for key, cells in groups.items():
        assert len([c for c in cells if not c["count"]]) != 1, (key, cells)


def test_every_clinic_admin_action_is_audited(client):
    h = login(client, role="clinic_admin")
    inv = invite(client, h)
    client.get("/v1/clinic-admin/invites", headers=h)
    client.get(f"/v1/clinic-invites/{inv['token']}")
    joined = accept(client, inv["token"], "Noor").json()
    gone = invite(client, h)
    client.delete(f"/v1/clinic-admin/invites/{gone['id']}", headers=h)
    client.get("/v1/clinic-admin/team", headers=h)
    client.get("/v1/clinic-admin/dashboard", headers=h)
    client.get("/v1/clinic-admin/export.csv", headers=h)
    with session(SYSTEM) as cur:
        cur.execute(
            "SELECT actor_id, actor_role, action, target FROM audit_log WHERE action LIKE '%%clinic%%' ORDER BY id"
        )
        rows = cur.fetchall()
    actions = {r["action"] for r in rows}
    assert {
        "create_clinic_invite",
        "list_clinic_invites",
        "view_clinic_invite",
        "accept_clinic_invite",
        "revoke_clinic_invite",
        "view_clinic_team",
        "view_clinic_dashboard",
        "export_clinic_follow_ups",
    } <= actions
    acc = [r for r in rows if r["action"] == "accept_clinic_invite"][-1]
    assert acc["actor_id"] == joined["user_id"] and acc["actor_role"] == "clinician"
    assert acc["target"] == f"clinic_invite:{inv['id']}"
    for r in rows:
        assert inv["token"] not in str(r)
    v = client.get("/v1/admin/audit/verify", headers=login(client, role="admin")).json()
    assert v["chain_ok"] is True


def test_demo_reset_clears_invites_and_keeps_the_clinic_admin(client):
    from app.db.seed import seed

    h = login(client, role="clinic_admin")
    token = invite(client, h)["token"]
    seed()
    with session(SYSTEM) as cur:
        cur.execute("SELECT count(*) n FROM clinic_invites")
        assert cur.fetchone()["n"] == 0
        cur.execute("SELECT count(*) n FROM profiles WHERE role='clinician'")
        assert cur.fetchone()["n"] == 1
    assert accept(client, token).status_code == 404
    assert client.get("/v1/clinic-admin/dashboard", headers=login(client, role="clinic_admin")).status_code == 200
