"""The closed loop made visible and measurable (sections 4 and 8): each follow-up's history from the audit log, the
event timeline for the DoH admin and a clinic admin, the loop metrics, the overdue flag and reminder drafts."""

import json
import re
from datetime import date, datetime, timedelta
from pathlib import Path

import pytest

from app.config import get_settings
from app.db import SYSTEM, Actor, session
from app.security.auth import create_token
from app.services import followups as fu
from app.services.followups import TZ, LoopRow
from tests.conftest import login

ROOT = Path(__file__).resolve().parents[2]
REF = date(2026, 11, 22)
PERSONAS = ("amina", "fatima", "hessa", "layla", "mariam", "noura", "priya", "sara")


def bearer(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def fatima_gap(client, hc) -> dict:
    gaps = client.get("/v1/clinic/care-gaps", headers=hc).json()
    return next(g for g in gaps if g["profile_id"] == "fatima" and g["type"] == "postpartum_glucose_test")


def actions(subject: str) -> list[tuple[str, str, str]]:
    with session(SYSTEM) as cur:
        cur.execute("SELECT actor_role, action, target FROM audit_log WHERE subject_id=%s ORDER BY id", (subject,))
        return [(r["actor_role"], r["action"], r["target"]) for r in cur.fetchall()]


# ---------- 1. follow-up history ----------


def test_fatima_glucose_history_shows_rule_shared_booked_done_in_order(client, reseed):
    hc = login(client, role="clinician")
    g = fatima_gap(client, hc)
    assert client.get("/v1/clinic/patients/fatima", headers=hc).status_code == 200  # her record, before the visit
    assert (
        client.patch(f"/v1/clinic/care-gaps/{g['id']}", headers=hc, json={"status": "in_progress"}).status_code == 200
    )
    assert client.patch(f"/v1/clinic/care-gaps/{g['id']}", headers=hc, json={"status": "closed"}).status_code == 200

    r = client.get(f"/v1/clinic/patients/fatima/followups/{g['id']}/history", headers=hc)
    assert r.status_code == 200, r.text
    h = r.json()
    assert [s["step"] for s in h["steps"]] == ["opened", "shared", "booked", "done"]
    opened, shared, booked, done = h["steps"]
    # opened by which rule, why, and its source
    assert opened["actor_role"] == "system" and opened["actor_id"] == "rules"
    assert opened["evidence"]["rule_id"] == "CARE_POSTPARTUM_GLUCOSE_TEST"
    assert "4–12 weeks" in opened["evidence"]["why"]
    assert [s["source_id"] for s in opened["evidence"]["sources"]] == ["ada_standards_pregnancy"]
    assert opened["evidence"]["audit_id"]  # the opening is a row in the chained audit log
    # shared with her clinic (on 1 Sep, before the follow-up opened), booked and done by the clinician
    assert shared["actor_role"] == "patient" and shared["evidence"]["clinic"].startswith("Seaside")
    assert shared["evidence"]["before_opened"] is True and shared["days"] == 0
    assert (booked["actor_role"], booked["actor_id"]) == ("clinician", "clin-01")
    assert (done["actor_role"], done["actor_id"]) == ("clinician", "clin-01")
    assert done["evidence"]["record_opened_before"]  # her record was opened before the visit (marked done)
    # each line has a time, in order, and how many days the step took
    times = [s["at"] for s in h["steps"]]
    assert all(times) and times[0] <= times[2] <= times[3]
    assert booked["days"] >= 0 and done["days"] == 0
    assert h["pending"] == ["result"] and h["follow_up"]["status"] == "closed"
    assert h["summary"]["booked_to_done"] == 0 and h["summary"]["done_in_window"] is True

    # she reads the same story in her app; her view names the clinic, never a staff id
    hp = login(client, "fatima")
    mine = client.get(f"/v1/me/followups/{g['id']}/history", headers=hp).json()
    assert [s["step"] for s in mine["steps"]] == ["opened", "shared", "booked", "done"]
    assert all(s["actor_id"] in (None, "rules") for s in mine["steps"])
    listed = client.get("/v1/me/followups", headers=hp).json()["follow_ups"]
    assert [f["follow_up"]["id"] for f in listed] == [g["id"]]
    # the clinician's record view carries the same history, expandable per follow-up
    rec = client.get("/v1/clinic/patients/fatima", headers=hc).json()
    assert [s["step"] for s in rec["care_gaps"][0]["history"]["steps"]] == ["opened", "shared", "booked", "done"]


def test_a_confirmed_lab_result_is_the_last_step(client, reseed):
    hp = login(client, "fatima")
    gid = client.get("/v1/me/followups", headers=hp).json()["follow_ups"][0]["follow_up"]["id"]
    text = (ROOT / "data/synthetic/demo_uploads/fatima_postnatal_ogtt.txt").read_bytes()
    up = client.post("/v1/documents", headers=hp, files={"file": ("ogtt.txt", text, "text/plain")}).json()
    assert client.post(f"/v1/documents/{up['id']}/confirm", headers=hp, json={"rows": up["rows"]}).status_code == 200
    h = client.get(f"/v1/me/followups/{gid}/history", headers=hp, params={"lang": "ar"}).json()
    steps = {s["step"]: s for s in h["steps"]}
    assert set(steps) == {"opened", "shared", "result", "done"}
    assert steps["result"]["actor_role"] == "patient"
    assert [t["code"] for t in steps["result"]["evidence"]["tests"]] == ["OGTT2H"]
    assert steps["done"]["actor_role"] == "system" and steps["done"]["evidence"]["reason"] == "rule_resolved"
    assert h["pending"] == [] and h["summary"]["opened_to_result"] == 0
    assert steps["opened"]["evidence"]["title"] != "Your after-birth glucose test may be due"  # her Arabic title
    assert ("system", "care_gap_resolved", f"care_gap:{gid}") in actions("fatima")


def test_a_patient_cannot_read_another_womans_history(client):
    hc = login(client, role="clinician")
    gid = fatima_gap(client, hc)["id"]
    assert client.get(f"/v1/me/followups/{gid}/history", headers=login(client, "noura")).status_code == 404
    assert client.get("/v1/me/followups", headers=login(client, "noura")).json()["follow_ups"] == []
    # a clinician of another clinic, and a clinician asking for a record that is not shared, see nothing either
    other = bearer(create_token("clin-x", "clinician", "clinic_alain"))
    assert client.get(f"/v1/clinic/patients/fatima/followups/{gid}/history", headers=other).status_code == 404
    assert client.get(f"/v1/clinic/patients/amina/followups/{gid}/history", headers=hc).status_code == 404
    assert (
        client.get(f"/v1/clinic/patients/fatima/followups/{gid}/history", headers=login(client, "fatima")).status_code
        == 403
    )
    # and the database function behind it returns no rows to anyone else
    for actor in (Actor("patient", "noura"), Actor("clinician", "clin-x", "clinic_alain"), Actor("admin", "admin-01")):
        with session(actor) as cur:
            cur.execute("SELECT count(*) n FROM follow_up_audit('fatima', %s)", (gid,))
            assert cur.fetchone()["n"] == 0, actor


# ---------- 2. event timeline ----------


def test_a_clinic_admins_timeline_shows_only_her_clinic(client, reseed):
    hc = login(client, role="clinician")  # clin-01, Seaside (corniche)
    gid = fatima_gap(client, hc)["id"]
    client.patch(f"/v1/clinic/care-gaps/{gid}", headers=hc, json={"status": "in_progress"})
    north = bearer(create_token("cadmin-02", "clinic_admin", "clinic_north"))
    assert client.post("/v1/clinic-admin/invites", headers=north, json={}).status_code == 201

    mine = client.get("/v1/clinic-admin/events", headers=login(client, role="clinic_admin"), params={"page_size": 100})
    assert mine.status_code == 200, mine.text
    m = mine.json()
    assert m["scope"] == "clinic" and m["clinic_id"] == "clinic_corniche" and m["chain"]["ok"] is True
    assert m["events"] and {e["clinic_id"] for e in m["events"]} == {"clinic_corniche"}
    assert any(e["action"] == "care_gap_in_progress" and e["actor"] == "clin-01" for e in m["events"])
    assert not any(e["action"] == "create_clinic_invite" for e in m["events"])  # north's invite

    n = client.get("/v1/clinic-admin/events", headers=north, params={"page_size": 100}).json()
    assert {e["clinic_id"] for e in n["events"]} == {"clinic_north"}
    assert any(e["action"] == "create_clinic_invite" for e in n["events"])
    assert not any(e["actor"] == "clin-01" for e in n["events"])
    # filters narrow it, and asking for another clinic's rows by role or action still returns only hers
    f = client.get("/v1/clinic-admin/events", headers=north, params={"role": "clinician"}).json()
    assert f["events"] == [] and f["total"] == 0
    # the database function, not the API, keeps her to her clinic
    with session(Actor("clinic_admin", "cadmin-02", "clinic_north")) as cur:
        cur.execute("SELECT DISTINCT clinic_id FROM audit_event_rows('clinic_corniche')")
        assert [r["clinic_id"] for r in cur.fetchall()] == ["clinic_north"]
    for actor in (Actor("clinician", "clin-01", "clinic_corniche"), Actor("patient", "fatima")):
        with session(actor) as cur:
            cur.execute("SELECT count(*) n FROM audit_event_rows(NULL)")
            assert cur.fetchone()["n"] == 0, actor
    assert client.get("/v1/clinic-admin/events", headers=hc).status_code == 403
    assert client.get("/v1/admin/events", headers=login(client, role="clinic_admin")).status_code == 403


def test_the_doh_timeline_is_paginated_filtered_and_never_contains_names(client, reseed):
    hc = login(client, role="clinician")
    for pid in ("fatima", "noura", "sara", "priya"):
        client.get(f"/v1/clinic/patients/{pid}", headers=hc)
    hp = login(client, "noura")
    client.post("/v1/logs", headers=hp, json={"date": "2026-11-22", "flow": "light", "pain": 2})
    ha = login(client, role="admin")
    first = client.get("/v1/admin/events", headers=ha, params={"page_size": 5}).json()
    assert first["scope"] == "network" and first["chain"]["ok"] is True and first["chain"]["entries"] > 0
    assert len(first["events"]) == 5 and first["pages"] >= 2 and first["total"] > 5
    snap = {"page_size": 5, "page": 2, "snapshot": first["snapshot"]}
    second = client.get("/v1/admin/events", headers=ha, params=snap).json()
    assert first["events"][-1]["id"] == second["events"][0]["id"] + 1  # newest first, no gap, no overlap
    assert second["total"] == first["total"]  # this view's own audit row does not shift the pages
    views = client.get("/v1/admin/events", headers=ha, params={"role": "clinician", "action": "view_record"}).json()
    assert views["total"] >= 4 and {e["action"] for e in views["events"]} == {"view_record"}
    assert {"clinician", "patient", "system", "admin"} <= set(views["filters"]["roles"])
    today = datetime.now(TZ).date()  # the timeline's days are Abu Dhabi days
    ranged = client.get("/v1/admin/events", headers=ha, params={"from": today.isoformat(), "to": today.isoformat()})
    assert ranged.json()["total"] > 0
    past = client.get("/v1/admin/events", headers=ha, params={"to": "2020-01-01"}).json()
    assert past["total"] == 0 and past["events"] == []
    corniche = client.get("/v1/admin/events", headers=ha, params={"clinic": "clinic_corniche", "page_size": 100})
    assert {e["clinic_id"] for e in corniche.json()["events"]} == {"clinic_corniche"}
    assert client.get("/v1/admin/events", headers=ha, params={"action": "x; drop"}).status_code == 422

    everything = client.get("/v1/admin/events", headers=ha, params={"page_size": 100, "page": 1}).json()
    rows = list(everything["events"])
    for page in range(2, everything["pages"] + 1):
        rows += client.get("/v1/admin/events", headers=ha, params={"page_size": 100, "page": page}).json()["events"]
    text = json.dumps(rows).lower()
    with session(SYSTEM) as cur:
        cur.execute("SELECT id, alias FROM profiles")
        people = cur.fetchall()
    names = set(PERSONAS) | {w.lower() for p in people for w in re.findall(r"[A-Za-z]{4,}", p["alias"])}
    names -= {"fictional", "demo", "clinic", "admin", "network", "women", "example", "seaside", "north", "island"}
    for name in names:
        assert not re.search(rf"\b{name}\b", text), name
    assert any(e["record"] and e["record"].startswith("R-") for e in rows)
    assert all("detail" not in e for e in rows)
    assert client.get("/v1/admin/events", headers=hc).status_code == 403


# ---------- 3. loop metrics ----------


def _row(opened, booked=None, done=None, result=None, end=None, status="open", report=False, kind="gyn_review"):
    d = REF - timedelta(days=opened)
    return LoopRow(
        kind,
        status,
        d,
        d + timedelta(days=booked) if booked is not None else None,
        d + timedelta(days=done) if done is not None else None,
        d + timedelta(days=result) if result is not None else None,
        d + timedelta(days=end) if end is not None else None,
        report,
    )


def test_loop_metrics_on_a_small_fixture_with_suppression_under_k():
    done = [_row(60, 2 + i, 10 + i, 12 + i, 42, "closed", report=i < 6) for i in range(12)]  # booked 2..13 days
    late = [_row(100, 30, 70, None, 42, "closed") for _ in range(10)]  # done after its window
    overdue = [_row(80, end=42) for _ in range(11)]  # never booked, window ended 38 days ago
    waiting = [_row(5, end=42) for _ in range(3)]  # window still open
    steps = [{"step": "visit_2w", "from": "2026-10-01", "to": "2026-10-08", "done_on": "2026-10-05"}] * 15
    steps += [{"step": "visit_2w", "from": "2026-10-01", "to": "2026-10-08", "done_on": None}] * 10
    steps += [{"step": "visit_6w", "from": "2026-11-20", "to": "2026-12-04", "done_on": None}] * 4  # not ended
    m = fu.loop_metrics(done + late + overdue + waiting, steps, REF)
    assert m["median_days"]["opened_to_booked"] == {"days": 12.5, "n": 22}  # 2..13 and ten 30s: middle 12 and 13
    assert m["median_days"]["booked_to_done"] == {"days": 8.0, "n": 22}
    assert m["median_days"]["opened_to_result"] == {"days": 17.5, "n": 12}  # 12..23
    assert m["done_in_window"] == {"n": 12, "of": 33, "pct": 36.4, "suppressed": False}
    assert m["overdue"] == {"n": 11, "suppressed": False}
    assert m["postnatal_in_window"] == {"n": 15, "of": 25, "pct": 60.0, "suppressed": False}
    assert m["record_opened_before_visit"]["suppressed"] is True  # 6 of 22: a group under 10
    # under k: everything small is hidden, never shown as 0
    small = fu.loop_metrics(done[:5] + overdue[:3], steps[:4], REF)
    assert small["median_days"]["opened_to_booked"] == {"days": None, "n": None}
    assert small["done_in_window"]["suppressed"] and small["done_in_window"]["pct"] is None
    assert small["overdue"] == {"n": None, "suppressed": True} and small["follow_ups"] is None
    assert small["postnatal_in_window"]["suppressed"]


def test_loop_metrics_count_results_from_ten():
    rows = [_row(40, 3, 9, 11, 42, "closed") for _ in range(10)]
    m = fu.loop_metrics(rows, [], REF)
    assert m["median_days"]["opened_to_result"] == {"days": 11.0, "n": 10}
    assert m["overdue"] == {"n": 0, "suppressed": False}


def test_network_and_clinic_loop_figures_are_plausible_and_repeat_after_a_reset(client):
    ha = login(client, role="admin")
    loop = client.get("/v1/admin/metrics", headers=ha).json()["loop"]
    md = loop["median_days"]
    assert 3 <= md["opened_to_booked"]["days"] <= 20 and md["opened_to_booked"]["n"] >= 100
    assert 5 <= md["booked_to_done"]["days"] <= 25 and 5 <= md["opened_to_result"]["days"] <= 60
    for key in ("done_in_window", "postnatal_in_window", "record_opened_before_visit"):
        assert loop[key]["suppressed"] is False and 10 <= loop[key]["pct"] <= 95, (key, loop[key])
    assert loop["overdue"]["n"] >= 50
    clinic = client.get("/v1/clinic-admin/dashboard", headers=login(client, role="clinic_admin")).json()["loop"]
    assert clinic["follow_ups"] < loop["follow_ups"] and clinic["median_days"]["opened_to_booked"]["days"]
    from app.db.seed import seed

    seed()
    again = client.get("/v1/admin/metrics", headers=login(client, role="admin")).json()["loop"]
    assert again == loop


def test_cohort_loop_dates_are_derived_from_the_member_alone():
    row = {"patient_id": "SYN-00042", "care_gap_type": "postpartum_glucose_test", "care_gap_status": "closed",
           "days_overdue": 0, "report_shared": True, "recent_delivery": True, "gdm_history": True}  # fmt: skip
    a, b = fu.cohort_loop(row, REF), fu.cohort_loop(dict(row), REF)
    assert a == b
    assert a["gap_opened_on"] <= a["gap_booked_on"] <= a["gap_done_on"] <= REF
    assert a["birth_on"] == a["gap_opened_on"] - timedelta(days=28)
    assert a["gap_window_end"] == a["birth_on"] + timedelta(days=84)
    glucose = next(s for s in a["postnatal_steps"] if s["step"] == "glucose_test")
    assert glucose["done_on"] == a["gap_done_on"].isoformat()
    late = fu.cohort_loop({**row, "care_gap_status": "open", "days_overdue": 30}, REF)
    assert late["gap_window_end"] == REF - timedelta(days=30) and late["gap_booked_on"] is None


# ---------- 4. overdue flag and reminder drafts ----------


def test_overdue_follow_ups_are_flagged_sorted_and_counted(client, reseed):
    ha = login(client, role="admin")
    before = client.get("/v1/admin/metrics", headers=ha).json()["loop"]["overdue"]["n"]
    client.cookies.clear()
    r = client.post(
        "/v1/demo/signup",
        json={"name": "Maryam", "age": 31, "region": "Al Ain", "lang": "en", "life_stage": "after_birth",
              "weeks_since_birth": 14, "gdm": True, "clinic_id": "clinic_corniche", "share_with_clinic": True},
    )  # fmt: skip
    assert r.status_code == 200, r.text
    pid = r.json()["user_id"]
    client.cookies.clear()
    hc = login(client, role="clinician")
    gaps = client.get("/v1/clinic/care-gaps", headers=hc).json()
    mine = next(g for g in gaps if g["profile_id"] == pid)
    assert mine["overdue"] is True and mine["status"] == "open" and mine["window_end"] < "2026-11-22"
    assert gaps[0]["overdue"] is True  # overdue first
    assert not next(g for g in gaps if g["profile_id"] == "fatima")["overdue"]  # inside her window
    patients = client.get("/v1/clinic/patients", headers=hc).json()["patients"]
    order = [p["id"] for p in patients]
    flagged = [p for p in patients if p["red_flags"]]
    assert order.index(pid) == len(flagged)  # after the urgent ones, before everyone else
    assert next(p for p in patients if p["id"] == pid)["overdue_gaps"] == 1
    rec = client.get(f"/v1/clinic/patients/{pid}", headers=hc).json()
    assert rec["care_gaps"][0]["overdue"] is True and rec["care_gaps"][0]["history"]["follow_up"]["overdue"]
    after = client.get("/v1/admin/metrics", headers=ha).json()["loop"]["overdue"]["n"]
    assert after == before + 1
    # booking it ends the overdue flag
    client.patch(f"/v1/clinic/care-gaps/{mine['id']}", headers=hc, json={"status": "in_progress"})
    gaps = client.get("/v1/clinic/care-gaps", headers=hc).json()
    assert next(g for g in gaps if g["profile_id"] == pid)["overdue"] is False


def test_drafting_a_reminder_sends_nothing(client, reseed):
    hc = login(client, role="clinician")
    g = fatima_gap(client, hc)
    d = client.post(f"/v1/clinic/care-gaps/{g['id']}/reminder", headers=hc).json()
    assert d["status"] == "draft" and d["sent"] is False and "glucose" in d["en"] and d["ar"]
    again = client.post(f"/v1/clinic/care-gaps/{g['id']}/reminder", headers=hc).json()
    assert again["id"] == d["id"]  # one open draft per follow-up
    with session(SYSTEM) as cur:
        cur.execute("SELECT origin, status, created_by, care_gap_id FROM navigator_drafts WHERE id=%s", (d["id"],))
        row = cur.fetchone()
    assert row == {"origin": "clinic", "status": "draft", "created_by": "clin-01", "care_gap_id": g["id"]}
    # her own navigator never shows the clinic's draft, and she cannot approve it
    hp = login(client, "fatima")
    assert all(x["id"] != d["id"] for x in client.get("/v1/navigator", headers=hp).json()["drafts"])
    assert client.post(f"/v1/navigator/drafts/{d['id']}/approve", headers=hp).status_code == 404
    ok = client.post(f"/v1/clinic/reminders/{d['id']}/approve", headers=hc).json()
    assert ok["status"] == "approved" and ok["sent"] is False and "Nothing was sent" in ok["message"]
    assert client.post(f"/v1/clinic/reminders/{d['id']}/discard", headers=hc).status_code == 409
    # the database has no "sent" status at all
    with pytest.raises(Exception, match="check"):
        with session(SYSTEM) as cur:
            cur.execute("UPDATE navigator_drafts SET status='sent' WHERE id=%s", (d["id"],))
    log = actions("fatima")
    assert ("clinician", "reminder_drafted", f"care_gap:{g['id']}") in log
    assert ("clinician", "reminder_approved", f"care_gap:{g['id']}") in log
    assert not any("send" in a or "sent" in a for _, a, _ in log)
    steps = client.get(f"/v1/clinic/patients/fatima/followups/{g['id']}/history", headers=hc).json()["steps"]
    assert [s["step"] for s in steps] == ["opened", "shared", "reminder", "reminder_approved"]
    assert all(s["evidence"].get("sent") is False for s in steps if s["step"].startswith("reminder"))
    # another clinic's clinician cannot draft for her
    other = bearer(create_token("clin-x", "clinician", "clinic_alain"))
    assert client.post(f"/v1/clinic/care-gaps/{g['id']}/reminder", headers=other).status_code == 404


# ---------- audit ----------


def test_every_loop_step_and_every_view_is_in_the_chained_audit_log(client, reseed):
    opened = [a for a in actions("fatima") if a[1] == "care_gap_opened"]
    assert len(opened) == 1 and opened[0][0] == "system"
    hc = login(client, role="clinician")
    gid = fatima_gap(client, hc)["id"]
    client.get(f"/v1/clinic/patients/fatima/followups/{gid}/history", headers=hc)
    client.get(f"/v1/me/followups/{gid}/history", headers=login(client, "fatima"))
    client.get("/v1/admin/events", headers=login(client, role="admin"))
    client.get("/v1/clinic-admin/events", headers=login(client, role="clinic_admin"))
    log = actions("fatima")
    assert ("clinician", "view_followup_history", f"care_gap:{gid}") in log
    assert ("patient", "view_followup_history", f"care_gap:{gid}") in log
    with session(SYSTEM) as cur:
        cur.execute(
            "SELECT actor_role, action, target FROM audit_log WHERE action IN ('view_audit_events','view_clinic_events')"
        )
        seen = {(r["actor_role"], r["action"], r["target"]) for r in cur.fetchall()}
    assert seen == {
        ("admin", "view_audit_events", "admin"),
        ("clinic_admin", "view_clinic_events", "clinic:clinic_corniche"),
    }
    v = client.get("/v1/admin/audit/verify", headers=login(client, role="admin")).json()
    assert v["chain_ok"] is True
    assert get_settings().demo_ref_date == REF
