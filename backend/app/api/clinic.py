"""Clinician endpoints. Postgres RLS returns only patients with an active care_share consent to her clinic."""

from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.agents import copilot
from app.agents import copy as cp
from app.agents.pipeline import cards_for
from app.config import get_settings
from app.db import Actor, session
from app.rules.engine import evaluate
from app.security import audit
from app.security.auth import require
from app.services import views
from app.services.patient_data import load_bundle

router = APIRouter(prefix="/v1/clinic", tags=["clinic"])
clinician = require("clinician")
URG = {"urgent": 0, "soon": 1, "discuss": 2, "info": 3}


def _ref():
    return get_settings().demo_ref_date


@router.get("/patients")
def patients(actor: Actor = Depends(clinician)):
    with session(actor) as cur:
        cur.execute(
            "SELECT p.id, p.alias, p.age, p.region, p.life_stage, p.pregnancy_weeks,"
            " (SELECT count(*) FROM observations o WHERE o.profile_id=p.id AND o.kind='red_flag') AS red_flags,"
            " (SELECT count(*) FROM observations o WHERE o.profile_id=p.id AND o.kind<>'red_flag' AND o.status='open') AS open_obs,"
            " (SELECT array_agg(o.rule_id ORDER BY o.rule_id) FROM observations o WHERE o.profile_id=p.id) AS rules,"
            " (SELECT max(r.created_at) FROM reports r WHERE r.profile_id=p.id) AS last_report,"
            " (SELECT count(*) FROM care_gaps g WHERE g.profile_id=p.id AND g.status<>'closed') AS open_gaps,"
            " (SELECT reviewed_at FROM clinic_reviews cr WHERE cr.profile_id=p.id) AS reviewed_at"
            " FROM profiles p WHERE p.role='patient'"
        )
        rows = cur.fetchall()
        audit.record(cur, actor, "list_patients", None, "clinic_list", {"count": len(rows)})
    rows.sort(
        key=lambda r: (-r["red_flags"], -r["open_obs"], -(r["last_report"].timestamp() if r["last_report"] else 0))
    )
    return {"patients": rows, "clinic_id": actor.clinic_id}


@router.get("/patients/{pid}")
def patient_view(pid: str, actor: Actor = Depends(clinician)):
    with session(actor) as cur:
        b = load_bundle(cur, pid)
        if not b:
            raise HTTPException(404, "No shared record for this patient (no active consent).")
        cur.execute(
            "SELECT id, type, status, due_date, updated_at FROM care_gaps WHERE profile_id=%s ORDER BY id", (pid,)
        )
        gaps = cur.fetchall()
        cur.execute("SELECT reviewed_at, visit_note FROM clinic_reviews WHERE profile_id=%s", (pid,))
        review = cur.fetchone()
        cur.execute("SELECT id, created_at FROM reports WHERE profile_id=%s ORDER BY id DESC LIMIT 1", (pid,))
        report = cur.fetchone()
        audit.record(cur, actor, "view_record", pid, "clinician_view")
    ref = _ref()
    ev = evaluate(b, ref, get_settings().red_flag_window_days)
    cards, trace, crisis = cards_for(b, "en")
    return {
        "profile": {
            k: b["profile"].get(k)
            for k in ("id", "alias", "age", "region", "life_stage", "pregnancy_weeks", "language", "ttc_months")
        },
        "sbar": copilot.sbar(b, ev, ref),
        "cards": sorted(
            [  # the clinician reads the pattern names in clinician voice; her own wording stays in her app
                {**c, "clinician_title": cp.clinician_title(c["observation_id"], c["title"])} for c in cards
            ],
            key=lambda c: (c["kind"] != "red_flag", URG.get(c["urgency"], 9)),
        ),
        "crisis": crisis,
        "trace": trace,
        "labs": b["labs"],
        "care_gaps": gaps,
        "review": review,
        "latest_report": report,
        "analytics": views.analytics(b, ev, ref, 12),
        "timeline": views.timeline(b, ref, 12),
        "days_logged": views.days_logged(b),
        "her_questions": list(dict.fromkeys(q for c in cards for q in c.get("questions_for_doctor", [])))[:5],
        "visit_note_draft": (review or {}).get("visit_note") or copilot.visit_note_draft(b, ev, ref),
    }


class AskIn(BaseModel):
    question: str = Field(..., min_length=1, max_length=300)


@router.post("/patients/{pid}/ask")
def ask_record(pid: str, body: AskIn, actor: Actor = Depends(clinician)):
    with session(actor) as cur:
        b = load_bundle(cur, pid)
        if not b:
            raise HTTPException(404, "No shared record for this patient.")
        audit.record(cur, actor, "ask_record", pid, "copilot")
    return copilot.ask_record(b, body.question)


def _require_shared(cur, pid: str) -> None:
    """A clinician acts only on a record shared with her clinic: a clear 404 instead of a database refusal (HTTP 500)."""
    cur.execute("SELECT clinician_can_see(%s) AS ok", (pid,))
    if not cur.fetchone()["ok"]:
        raise HTTPException(404, "No shared record for this patient (no active consent).")


@router.post("/patients/{pid}/review")
def mark_reviewed(pid: str, actor: Actor = Depends(clinician)):
    with session(actor) as cur:
        _require_shared(cur, pid)
        cur.execute(
            "INSERT INTO clinic_reviews (profile_id, clinician_id, reviewed_at) VALUES (%s,%s,now())"
            " ON CONFLICT (profile_id) DO UPDATE SET reviewed_at=now(), clinician_id=EXCLUDED.clinician_id RETURNING reviewed_at",
            (pid, actor.user_id),
        )
        r = cur.fetchone()
        cur.execute("UPDATE observations SET status='reviewed' WHERE profile_id=%s AND kind<>'red_flag'", (pid,))
        audit.record(cur, actor, "mark_reviewed", pid, "review")
    return {"reviewed_at": r["reviewed_at"]}


class NoteIn(BaseModel):
    text: str = Field(..., max_length=6000)


@router.put("/patients/{pid}/visit-note")
def save_note(pid: str, body: NoteIn, actor: Actor = Depends(clinician)):
    with session(actor) as cur:
        _require_shared(cur, pid)
        cur.execute(
            "INSERT INTO clinic_reviews (profile_id, clinician_id, visit_note) VALUES (%s,%s,%s)"
            " ON CONFLICT (profile_id) DO UPDATE SET visit_note=EXCLUDED.visit_note, updated_at=now()",
            (pid, actor.user_id, body.text),
        )
        audit.record(cur, actor, "save_visit_note", pid, "visit_note")
    return {"ok": True}


@router.get("/care-gaps")
def care_gaps(actor: Actor = Depends(clinician)):
    with session(actor) as cur:
        cur.execute(
            "SELECT g.*, p.alias, p.language FROM care_gaps g JOIN profiles p ON p.id=g.profile_id ORDER BY g.status, g.due_date"
        )
        return cur.fetchall()


class GapIn(BaseModel):
    status: Literal["open", "in_progress", "closed"]


@router.patch("/care-gaps/{gap_id}")
def update_gap(gap_id: int, body: GapIn, actor: Actor = Depends(clinician)):
    with session(actor) as cur:
        cur.execute(
            "UPDATE care_gaps SET status=%s, updated_at=now(), updated_by=%s WHERE id=%s RETURNING id, profile_id, type, status",
            (body.status, actor.user_id, gap_id),
        )
        g = cur.fetchone()
        if not g:
            raise HTTPException(404, "Care gap not found for your clinic.")
        audit.record(cur, actor, "care_gap_" + body.status, g["profile_id"], f"care_gap:{gap_id}")
    return g


REMINDER = {
    "postpartum_glucose_test": (
        "Your after-birth glucose test is due. Please call the clinic or reply to book it. — {clinic}",
        "حان موعد فحص السكر بعد الولادة. يرجى الاتصال بالعيادة أو الرد للحجز. — {clinic}",
    ),
    "pregnancy_glucose_screen": (
        "Your pregnancy glucose test (24–28 weeks) is due. Please call the clinic to book it. — {clinic}",
        "حان موعد فحص سكر الحمل (الأسبوع 24–28). يرجى الاتصال بالعيادة للحجز. — {clinic}",
    ),
}


@router.post("/care-gaps/{gap_id}/reminder")
def reminder_draft(gap_id: int, actor: Actor = Depends(clinician)):
    with session(actor) as cur:
        cur.execute(
            "SELECT g.type, p.alias FROM care_gaps g JOIN profiles p ON p.id=g.profile_id WHERE g.id=%s", (gap_id,)
        )
        g = cur.fetchone()
        if not g:
            raise HTTPException(404, "Care gap not found")
        cur.execute("SELECT name FROM clinics WHERE id=%s", (actor.clinic_id,))
        clinic = cur.fetchone()["name"]
    en, ar = REMINDER.get(
        g["type"],
        (
            "Please contact the clinic about your follow-up. — {clinic}",
            "يرجى التواصل مع العيادة بخصوص المتابعة. — {clinic}",
        ),
    )
    return {
        "en": en.format(clinic=clinic),
        "ar": ar.format(clinic=clinic),
        "sent": False,
        "note": "Draft only. Review and send it from your clinic's own messaging system.",
    }
