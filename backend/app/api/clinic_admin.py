"""K4 clinic onboarding (build week): the clinic admin of one clinic invites clinicians by a single-use link or QR,
sees who joined, her clinic's own follow-up figures and exports them without names or ids.

Postgres decides what she sees: every query runs as `clinic_admin` with her clinic in app.clinic_id, the invites and
staff tables are row-level secured to that clinic, and the figures come from SECURITY DEFINER counts that read only her
clinic. She never gets a patient row. Every action lands in the hash-chained audit log."""

from __future__ import annotations

import csv
import hashlib
import io
import secrets
from collections import defaultdict
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, Field

from app.config import get_settings
from app.db import SYSTEM, Actor, session
from app.security import audit
from app.security.auth import COOKIE, create_token, require

router = APIRouter(prefix="/v1/clinic-admin", tags=["clinic-admin"])
invites_router = APIRouter(prefix="/v1/clinic-invites", tags=["clinic-admin"])

K_MIN = 10  # every published count of women is 10 or more, as on the network dashboard (docs/07)
MAX_OPEN_INVITES = 25  # a public demo: one clinic cannot pile up links
MAX_CLINICIANS = 60
STATUS = {"open": "open", "in_progress": "booked", "closed": "done"}  # care_gaps status -> the clinic's words
PC008_TYPE = "postpartum_glucose_test"
_STATUS_SQL = (
    "CASE WHEN i.revoked_at IS NOT NULL THEN 'revoked' WHEN i.accepted_at IS NOT NULL THEN 'accepted'"
    " WHEN i.expires_at <= now() THEN 'expired' ELSE 'pending' END"
)


def _hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def clinic_admin(actor: Actor = Depends(require("clinic_admin"))) -> Actor:
    """The token is signed, but the clinic it names must also be the one her own profile belongs to."""
    with session(actor) as cur:
        cur.execute("SELECT role, clinic_id FROM profiles WHERE id=%s", (actor.user_id,))
        me = cur.fetchone()
    if not actor.clinic_id or not me or me["role"] != "clinic_admin" or me["clinic_id"] != actor.clinic_id:
        raise HTTPException(403, "This needs the clinic admin of this clinic.")
    return actor


def _clinic(cur, clinic_id: str) -> dict:
    cur.execute("SELECT id, name, region FROM clinics WHERE id=%s", (clinic_id,))
    return cur.fetchone()


def _join(token: str) -> dict:
    path = f"/clinic-invite/{token}"
    origins = get_settings().origins
    url = f"{origins[0].rstrip('/')}{path}" if origins else path
    return {"join_path": path, "join_url": url, "qr_payload": url}


# ---------- invites (clinic admin) ----------


class InviteIn(BaseModel):
    expires_in_hours: int = Field(72, ge=1, le=168)


@router.post("/invites", status_code=201)
def create_invite(body: InviteIn | None = None, actor: Actor = Depends(clinic_admin)):
    hours = (body or InviteIn()).expires_in_hours
    token = secrets.token_urlsafe(32)
    with session(actor) as cur:
        cur.execute(
            "SELECT count(*) AS n FROM clinic_invites WHERE revoked_at IS NULL AND accepted_at IS NULL AND expires_at > now()"
        )
        if cur.fetchone()["n"] >= MAX_OPEN_INVITES:
            raise HTTPException(429, "Too many open invites. Withdraw one before making another.")
        cur.execute(
            "INSERT INTO clinic_invites (clinic_id, token_hash, created_by, expires_at)"
            " VALUES (%s,%s,%s, now() + %s) RETURNING id, created_at, expires_at",
            (actor.clinic_id, _hash(token), actor.user_id, timedelta(hours=hours)),
        )
        row = cur.fetchone()
        clinic = _clinic(cur, actor.clinic_id)
        audit.record(
            cur, actor, "create_clinic_invite", None, f"clinic_invite:{row['id']}", {"expires_in_hours": hours}
        )
    return {
        "id": row["id"],
        "status": "pending",
        "token": token,
        **_join(token),
        "created_at": row["created_at"],
        "expires_at": row["expires_at"],
        "clinic": clinic,
        "note": "The link works once, for one clinician. It is shown only now; withdraw it any time.",
    }


@router.get("/invites")
def list_invites(actor: Actor = Depends(clinic_admin)):
    with session(actor) as cur:
        cur.execute(
            f"SELECT i.id, {_STATUS_SQL} AS status, i.created_at, i.expires_at, i.accepted_at, i.revoked_at,"  # noqa: S608 (fixed SQL)
            " i.accepted_by, p.alias AS accepted_alias"
            " FROM clinic_invites i LEFT JOIN profiles p ON p.id = i.accepted_by ORDER BY i.id DESC"
        )
        rows = cur.fetchall()
        audit.record(cur, actor, "list_clinic_invites", None, f"clinic:{actor.clinic_id}", {"count": len(rows)})
    return {
        "clinic_id": actor.clinic_id,
        "invites": [
            {
                "id": r["id"],
                "status": r["status"],
                "created_at": r["created_at"],
                "expires_at": r["expires_at"],
                "accepted_at": r["accepted_at"],
                "revoked_at": r["revoked_at"],
                "accepted_by": {"id": r["accepted_by"], "alias": r["accepted_alias"]} if r["accepted_by"] else None,
            }
            for r in rows
        ],
    }


@router.delete("/invites/{invite_id}")
def revoke_invite(invite_id: int, actor: Actor = Depends(clinic_admin)):
    with session(actor) as cur:
        cur.execute(
            f"SELECT i.id, {_STATUS_SQL} AS status FROM clinic_invites i WHERE i.id=%s FOR UPDATE",  # noqa: S608
            (invite_id,),
        )
        row = cur.fetchone()
        if not row:  # another clinic's invite is invisible here (RLS), so it is "not found" too
            raise HTTPException(404, "Invite not found for your clinic.")
        if row["status"] != "pending":
            raise HTTPException(409, f"This invite is already {row['status']}.")
        cur.execute("UPDATE clinic_invites SET revoked_at=now() WHERE id=%s RETURNING revoked_at", (invite_id,))
        at = cur.fetchone()["revoked_at"]
        audit.record(cur, actor, "revoke_clinic_invite", None, f"clinic_invite:{invite_id}")
    return {"id": invite_id, "status": "revoked", "revoked_at": at}


# ---------- accepting (the invited clinician, no session yet) ----------


def _find(cur, token: str, lock: bool = False) -> dict:
    if not 20 <= len(token) <= 100:
        raise HTTPException(404, "This invite link is not valid.")
    cur.execute(
        f"SELECT i.id, i.clinic_id, i.expires_at, {_STATUS_SQL} AS status FROM clinic_invites i"  # noqa: S608
        " WHERE i.token_hash=%s" + (" FOR UPDATE" if lock else ""),
        (_hash(token),),
    )
    row = cur.fetchone()
    if not row:
        raise HTTPException(404, "This invite link is not valid.")
    return row


GONE = {
    "accepted": "This invite has already been used. Ask your clinic admin for a new one.",
    "revoked": "The clinic withdrew this invite. Ask your clinic admin for a new one.",
    "expired": "This invite has expired. Ask your clinic admin for a new one.",
}


@invites_router.get("/{token}")
def preview_invite(token: str):
    """What the join screen shows before she accepts: which clinic, and whether the link still works."""
    with session(SYSTEM) as cur:
        row = _find(cur, token)
        clinic = _clinic(cur, row["clinic_id"])
        audit.record(cur, Actor("system", "invite-link"), "view_clinic_invite", None, f"clinic_invite:{row['id']}")
    return {"clinic": clinic, "status": row["status"], "expires_at": row["expires_at"], "role": "clinician"}


class AcceptIn(BaseModel):
    display_name: str = Field(..., min_length=1, max_length=60)


@invites_router.post("/{token}/accept")
def accept_invite(token: str, body: AcceptIn, response: Response):
    """Synthetic demo: makes a fictional clinician account bound to the invite's clinic and signs her in. Single use."""
    if not get_settings().demo_mode:
        raise HTTPException(404, "Not found")
    name = " ".join(body.display_name.split())
    if not name or len(name) > 40 or not any(ch.isalpha() for ch in name):
        raise HTTPException(422, "Enter the name your colleagues know you by (letters, up to 40).")
    uid = f"clin-{secrets.token_hex(5)}"
    alias = f"{name} (demo)"
    with session(SYSTEM) as cur:
        row = _find(cur, token, lock=True)  # the row lock makes two accepts of one link take turns: one wins
        if row["status"] != "pending":
            raise HTTPException(410, GONE[row["status"]])
        clinic = row["clinic_id"]
        cur.execute("SELECT count(*) AS n FROM profiles WHERE role='clinician' AND clinic_id=%s", (clinic,))
        if cur.fetchone()["n"] >= MAX_CLINICIANS:
            raise HTTPException(429, "This demo clinic is full. Ask the team to reset the demo data.")
        cur.execute(
            "INSERT INTO profiles (id, alias, role, clinic_id, is_synthetic) VALUES (%s,%s,'clinician',%s,true)",
            (uid, alias, clinic),
        )
        cur.execute("UPDATE clinic_invites SET accepted_at=now(), accepted_by=%s WHERE id=%s", (uid, row["id"]))
        info = _clinic(cur, clinic)
        audit.record(
            cur,
            Actor("clinician", uid, clinic),
            "accept_clinic_invite",
            None,
            f"clinic_invite:{row['id']}",
            {"clinic_id": clinic},
        )
    token_out = create_token(uid, "clinician", clinic)
    s = get_settings()
    response.set_cookie(
        COOKIE,
        token_out,
        httponly=True,
        samesite="lax",
        secure=s.cookie_secure,
        max_age=s.token_ttl_minutes * 60,
        path="/",
    )
    return {
        "role": "clinician",
        "user_id": uid,
        "alias": alias,
        "clinic_id": clinic,
        "clinic": info,
        "token": token_out,
    }


# ---------- the clinic's team, figures and export ----------


@router.get("/team")
def team(actor: Actor = Depends(clinic_admin)):
    with session(actor) as cur:
        cur.execute(
            "SELECT p.id, p.alias, p.created_at AS joined_at,"
            " EXISTS (SELECT 1 FROM clinic_invites i WHERE i.accepted_by = p.id) AS joined_by_invite"
            " FROM profiles p WHERE p.role='clinician' AND p.clinic_id=%s ORDER BY p.created_at, p.id",
            (actor.clinic_id,),
        )
        rows = cur.fetchall()
        clinic = _clinic(cur, actor.clinic_id)
        audit.record(cur, actor, "view_clinic_team", None, f"clinic:{actor.clinic_id}", {"count": len(rows)})
    return {"clinic": clinic, "clinicians": rows}


def _k(n: int) -> int | None:
    return n if n >= K_MIN else None


def _protect(cells: dict) -> dict:
    """Cell suppression for one group whose total is published elsewhere: hide every count under 10, and when exactly
    one is hidden, hide the next smallest too, so nobody gets the hidden one back by subtraction.
    Returns {key: (count or None, reason)}."""
    out = {k: (n, "") if n >= K_MIN else (None, "fewer than 10") for k, n in cells.items()}
    hidden = [k for k, (n, _) in out.items() if n is None]
    shown = sorted((n, str(k), k) for k, (n, _) in out.items() if n is not None)
    if len(hidden) == 1 and shown:
        out[shown[0][2]] = (None, "protects a small group")
    return out


def _counts(cur) -> list[dict]:
    cur.execute("SELECT type, status, age_band, n FROM clinic_follow_up_counts()")
    return cur.fetchall()


def _by_status(rows: list[dict], where=lambda r: True) -> dict[str, int]:
    out = dict.fromkeys(STATUS.values(), 0)
    for r in rows:
        if where(r) and r["status"] in STATUS:
            out[STATUS[r["status"]]] += r["n"]
    return out


@router.get("/dashboard")
def dashboard(actor: Actor = Depends(clinic_admin)):
    with session(actor) as cur:
        rows = _counts(cur)
        cur.execute("SELECT clinic_shared_record_count() AS n")
        shared = cur.fetchone()["n"]
        cur.execute(
            "SELECT count(*) FILTER (WHERE role='clinician') AS clinicians FROM profiles WHERE clinic_id=%s",
            (actor.clinic_id,),
        )
        clinicians = cur.fetchone()["clinicians"]
        cur.execute(
            "SELECT count(*) AS n FROM clinic_invites WHERE revoked_at IS NULL AND accepted_at IS NULL AND expires_at > now()"
        )
        pending = cur.fetchone()["n"]
        clinic = _clinic(cur, actor.clinic_id)
        audit.record(cur, actor, "view_clinic_dashboard", None, f"clinic:{actor.clinic_id}")

    raw = _by_status(rows)
    total = sum(raw.values())
    cells = _protect(raw) if total >= K_MIN else dict.fromkeys(raw, (None, "fewer than 10"))
    fu = {k: v[0] for k, v in cells.items()}
    fu["total"] = _k(total)
    fu["done_pct"] = round(100.0 * raw["done"] / total, 1) if fu["total"] and fu["done"] is not None else None

    pp = _by_status(rows, lambda r: r["type"] == PC008_TYPE)
    due = sum(pp.values())
    # Hidden below 10, and also when the other follow-ups would then be under 10 (total minus PC008 = the rest).
    pc_hidden = due < K_MIN or 0 < total - due < K_MIN
    pc = {"due": None, "booked": None, "done": None, "open": None, "done_pct": None}
    if not pc_hidden:
        pcells = _protect(pp)
        pc = {
            "due": due,
            **{k: v[0] for k, v in pcells.items()},
            "done_pct": round(100.0 * pp["done"] / due, 1) if pcells["done"][0] is not None else None,
        }
    return {
        "clinic": clinic,
        "is_synthetic": True,
        "k_min": K_MIN,
        "follow_ups": fu,
        "pc008_glucose": {
            **pc,
            "suppressed": pc_hidden,
            "note": "The after-birth glucose test, one part of DoH Jawda KPI PC008. A real rate needs the clinic's own "
            "claims and records.",
        },
        "shared_records": _k(shared),
        "team": {"clinicians": clinicians, "pending_invites": pending},
        "note": "Synthetic cohort plus the live demo records shared with this clinic. Groups under 10 are hidden.",
    }


EXPORT_COLUMNS = ("clinic_id", "breakdown", "group", "follow_up_type", "status", "count", "suppressed")


def _age_group(band: str) -> str:
    """Five-year bands split a clinic's follow-ups into groups under 10, so the export uses three wide ones."""
    lo = band.split("-")[0]
    if not lo.isdigit():
        return "not recorded"
    return "18-29" if int(lo) < 30 else "30-39" if int(lo) < 40 else "40 and over"


@router.get("/export.csv")
def export(actor: Actor = Depends(clinic_admin)):
    """This clinic's follow-ups as counts: by status, by follow-up type and status, and by age group. No names, no
    patient or record ids, no dates; any count under 10 is blank, and where subtracting from a published total would
    reveal a blank cell, the next smallest cell is blank too."""
    with session(actor) as cur:
        rows = _counts(cur)
        audit.record(cur, actor, "export_clinic_follow_ups", None, f"clinic:{actor.clinic_id}")
    cid = actor.clinic_id
    status_totals = _by_status(rows)
    total = sum(status_totals.values())
    shown = _protect(status_totals) if total >= K_MIN else {}
    out: list[list] = [
        [cid, "status", "all", "all", st, *shown.get(st, (None, "fewer than 10"))] for st in STATUS.values()
    ]
    by_type: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    for r in rows:
        if r["status"] in STATUS:
            by_type[STATUS[r["status"]]][r["type"]] += r["n"]
    for st in STATUS.values():  # each status's types add up to the status count above
        for t, cell in sorted(_protect(dict(by_type[st])).items()):
            out.append([cid, "follow_up_type", "all", t, st, *cell])
    ages: dict[str, int] = defaultdict(int)
    for r in rows:
        if r["status"] in STATUS:
            ages[_age_group(r["age_band"])] += r["n"]
    if total >= K_MIN:  # the age groups add up to all follow-ups
        for g, cell in sorted(_protect(dict(ages)).items()):
            out.append([cid, "age_group", g, "all", "all", *cell])
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(EXPORT_COLUMNS)
    w.writerows(["" if v is None else v for v in r] for r in out)
    return Response(
        buf.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="reprosense-{actor.clinic_id}-follow-ups.csv"',
            "Cache-Control": "no-store",
        },
    )
