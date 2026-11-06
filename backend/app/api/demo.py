"""Demo switcher: pick a fictional persona, the clinician or the admin in one click (DEMO_MODE only)."""

from __future__ import annotations

import secrets
from datetime import date, timedelta
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, Field

from app.config import get_settings
from app.db import SYSTEM, Actor, session
from app.security import audit
from app.security.auth import COOKIE, create_token, current_actor, require
from app.services.patient_data import apply_period_log

router = APIRouter(prefix="/v1/demo", tags=["demo"])
ORDER = ["noura", "hessa", "fatima", "priya", "sara", "mariam", "layla", "amina"]  # demo story first (MASTER §13)


def _demo_only() -> None:
    if not get_settings().demo_mode:
        raise HTTPException(404, "Not found")


@router.get("/personas")
def personas():
    _demo_only()
    with session(SYSTEM) as cur:
        cur.execute(
            "SELECT p.id, p.alias, p.age, p.region, p.life_stage, p.pregnancy_weeks, p.story, p.language,"
            " (SELECT array_agg(rule_id ORDER BY rule_id) FROM observations o WHERE o.profile_id=p.id) AS rules,"
            " EXISTS (SELECT 1 FROM consents c WHERE c.profile_id=p.id AND c.purpose='care_share' AND c.granted"
            "   AND c.revoked_at IS NULL) AS shares_with_clinic"
            " FROM profiles p WHERE p.role='patient' AND p.id NOT LIKE 'guest-%%'"  # a joined record is hers alone
        )
        rows = {r["id"]: r for r in cur.fetchall()}
    return {
        "personas": [rows[i] for i in ORDER if i in rows] + [r for k, r in rows.items() if k not in ORDER],
        "staff": [
            {"id": "clin-01", "role": "clinician", "alias": "Dr. Example (fictional)"},
            {"id": "admin-01", "role": "admin", "alias": "Clinic network admin (fictional)"},
        ],
        "ref_date": get_settings().demo_ref_date.isoformat(),
    }


def _set_session(response: Response, user_id: str, role: str, clinic_id: str) -> str:
    token = create_token(user_id, role, clinic_id)
    response.set_cookie(
        COOKIE,
        token,
        httponly=True,
        samesite="lax",
        secure=get_settings().cookie_secure,
        max_age=get_settings().token_ttl_minutes * 60,
        path="/",
    )
    return token


class LoginIn(BaseModel):
    persona: str | None = None
    role: Literal["patient", "clinician", "admin"] = "patient"


@router.post("/login")
def login(body: LoginIn, response: Response):
    _demo_only()
    with session(SYSTEM) as cur:
        if body.role == "patient":
            # Only the fictional demo people open from the roster. A record she started on /join is reached through her
            # own session, never by id, so nobody else can open it.
            cur.execute(
                "SELECT id, clinic_id FROM profiles WHERE id=%s AND role='patient' AND id NOT LIKE 'guest-%%'",
                (body.persona,),
            )
        else:
            cur.execute("SELECT id, clinic_id FROM profiles WHERE role=%s ORDER BY id LIMIT 1", (body.role,))
        row = cur.fetchone()
    if not row:
        raise HTTPException(404, "Unknown demo person")
    token = _set_session(response, row["id"], body.role, row["clinic_id"] or "")
    return {"role": body.role, "user_id": row["id"], "token": token}


@router.get("/clinics")
def clinics():
    """Fictional clinics a new record can be shared with (the clinic's patient QR names one of them)."""
    _demo_only()
    with session(SYSTEM) as cur:
        cur.execute("SELECT id, name, region FROM clinics ORDER BY id")
        return {"clinics": cur.fetchall()}


GUEST_CAP = 300  # a public demo: refuse new records past this until the next demo reset


class SignupIn(BaseModel):
    """A new demo record in under a minute (MVP scorecard). Only what she types is stored; nothing is inferred."""

    name: str = Field(..., min_length=1, max_length=40)
    age: int = Field(..., ge=18, le=60)
    region: Literal["Abu Dhabi City", "Al Ain", "Al Dhafra"]
    life_stage: Literal["periods", "trying_to_conceive", "pregnancy", "after_birth", "perimenopause"]
    last_period_start: date | None = None
    pregnancy_weeks: int | None = Field(None, ge=1, le=42)
    weeks_since_birth: int | None = Field(None, ge=0, le=52)
    gdm: bool = False  # after birth: she had diabetes in this pregnancy (gestational diabetes)
    clinic_id: str | None = Field(None, max_length=40)
    share_with_clinic: bool = False
    use_ai: bool = False  # the assistant and AI wording of her cards; off unless she ticks it (DoH RAI 3.1.6.1)
    lang: Literal["en", "ar"] = "en"


@router.post("/signup")
def signup(body: SignupIn, response: Response):
    """Create a new fictional record, sign in as her, and (only if she ticks it) share it with the inviting clinic."""
    _demo_only()
    ref = get_settings().demo_ref_date
    name = " ".join(body.name.split())
    if not name or not any(ch.isalpha() for ch in name):
        raise HTTPException(422, "Enter a first name or a nickname")
    stage = body.life_stage
    if stage == "pregnancy" and not body.pregnancy_weeks:
        raise HTTPException(422, "Enter how many weeks pregnant you are")
    if stage == "after_birth" and body.weeks_since_birth is None:
        raise HTTPException(422, "Enter how many weeks ago your baby was born")
    if body.last_period_start and not (ref - timedelta(days=120) <= body.last_period_start <= ref):
        raise HTTPException(422, "The period start must be within the last 120 days")
    if body.share_with_clinic and not body.clinic_id:
        raise HTTPException(422, "Choose the clinic to share with")
    pid = f"guest-{secrets.token_hex(4)}"
    with session(SYSTEM) as cur:
        cur.execute("SELECT count(*) AS n FROM profiles WHERE id LIKE 'guest-%%'")
        if cur.fetchone()["n"] >= GUEST_CAP:
            raise HTTPException(429, "The demo is full. Ask the team to reset the demo data.")
        if body.clinic_id:
            cur.execute("SELECT 1 FROM clinics WHERE id=%s", (body.clinic_id,))
            if not cur.fetchone():
                raise HTTPException(422, "Unknown clinic")
        lo = (body.age // 5) * 5
        cur.execute(
            "INSERT INTO profiles (id, alias, role, language, age, age_range, region, life_stage, pregnant, pregnancy_weeks,"
            " trying_to_conceive, clinic_id, onboarded, is_synthetic) VALUES (%s,%s,'patient',%s,%s,%s,%s,%s,%s,%s,%s,%s,true,true)",
            (
                pid,
                f"{name} (demo)",
                body.lang,
                body.age,
                f"{lo}-{lo + 4}",
                body.region,
                stage,
                stage == "pregnancy",
                body.pregnancy_weeks or 0,
                stage == "trying_to_conceive",
                body.clinic_id,
            ),
        )
        if body.share_with_clinic:
            cur.execute(
                "INSERT INTO consents (profile_id, purpose, clinic_id, granted) VALUES (%s,'care_share',%s,true)",
                (pid, body.clinic_id),
            )
        if body.use_ai:
            cur.execute(
                "INSERT INTO consents (profile_id, purpose, clinic_id, granted) VALUES (%s,'assistant',NULL,true)",
                (pid,),
            )
        if body.last_period_start and stage in ("periods", "trying_to_conceive", "perimenopause"):
            apply_period_log(cur, pid, body.last_period_start)
        if stage == "after_birth":
            born = ref - timedelta(weeks=body.weeks_since_birth or 0)
            cur.execute(
                "INSERT INTO events (id, profile_id, type, date, details) VALUES (%s,%s,'delivery',%s,'{\"source\": \"signup\"}')",
                (f"{pid}-delivery", pid, born),
            )
            if body.gdm:
                cur.execute(
                    "INSERT INTO events (id, profile_id, type, date, details) VALUES (%s,%s,'gdm_diagnosis',%s,'{\"source\": \"signup\"}')",
                    (f"{pid}-gdm", pid, born),
                )
        audit.record(
            cur,
            Actor("patient", pid),
            "signup",
            pid,
            pid,
            {"shared_with": body.clinic_id if body.share_with_clinic else None},
        )
    from app.agents.pipeline import refresh

    refresh(pid, body.lang)
    _set_session(response, pid, "patient", body.clinic_id or "")
    return {"role": "patient", "user_id": pid}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(COOKIE, path="/")
    return {"ok": True}


@router.get("/whoami")
def whoami(actor: Actor = Depends(current_actor)):
    return {"role": actor.role, "user_id": actor.user_id, "clinic_id": actor.clinic_id}


@router.post("/reset")
def reset(actor: Actor = Depends(require("admin"))):
    _demo_only()
    from app.db.seed import seed

    return {"ok": True, **seed()}
