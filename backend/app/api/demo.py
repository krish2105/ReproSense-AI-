"""Demo switcher: pick a fictional persona, the clinician or the admin in one click (DEMO_MODE only)."""

from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel

from app.config import get_settings
from app.db import SYSTEM, Actor, session
from app.security.auth import COOKIE, create_token, current_actor, require

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
            " FROM profiles p WHERE p.role='patient'"
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


class LoginIn(BaseModel):
    persona: str | None = None
    role: Literal["patient", "clinician", "admin"] = "patient"


@router.post("/login")
def login(body: LoginIn, response: Response):
    _demo_only()
    with session(SYSTEM) as cur:
        if body.role == "patient":
            cur.execute("SELECT id, clinic_id FROM profiles WHERE id=%s AND role='patient'", (body.persona,))
        else:
            cur.execute("SELECT id, clinic_id FROM profiles WHERE role=%s ORDER BY id LIMIT 1", (body.role,))
        row = cur.fetchone()
    if not row:
        raise HTTPException(404, "Unknown demo person")
    token = create_token(row["id"], body.role, row["clinic_id"] or "")
    response.set_cookie(
        COOKIE,
        token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=get_settings().token_ttl_minutes * 60,
        path="/",
    )
    return {"role": body.role, "user_id": row["id"], "token": token}


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
