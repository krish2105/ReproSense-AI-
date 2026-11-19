"""Staff and DoH sign-in (build week, the team's plan section 5): two doors, the staff "Your sign-in" panel, the DoH
admin's setup link, and the step-up check before an export.

- The staff door (/staff/signin) is for clinicians and clinic admins: a passkey only. Staff add a passkey after joining
  by invite, or from "Your sign-in" in their area.
- The DoH door (/doh/signin) is for the DoH network admin: a passkey, then a 6-digit code from an authenticator app
  (TOTP). Between the two steps there is only a 5-minute ticket, never a session. DoH accounts are made by the
  operator's CLI (app/security/create_doh_admin.py), never by sign-up; the CLI's single-use link sets up both.
- Exports (the audit log, the clinic CSV) need a fresh passkey check; a one-tap demo session confirms with one tap,
  in demo mode only.
Every sign-in, failed sign-in, step-up and change of passkey is in the hash-chained audit log."""

from __future__ import annotations

import hashlib
import secrets
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, Field

from app.config import get_settings
from app.db import SYSTEM, Actor, session
from app.security import audit, totp
from app.security import auth as sessions
from app.security.auth import SessionInfo, current_session, device_label, require, set_session, shared_account
from app.security.passkeys import (
    PasskeyFailed,
    authentication_options,
    check_assertion,
    check_registration,
    registration_options,
    save_passkey,
)

router = APIRouter(prefix="/v1/staff-auth", tags=["staff sign-in"])

STAFF_DOOR = ("clinician", "clinic_admin")
AREA = {"clinician": "/clinic", "clinic_admin": "/clinic-admin", "admin": "/admin"}
TICKET_TTL = timedelta(minutes=5)
TRIES = 5

DOH_AT_STAFF_DOOR = "This is a DoH network admin passkey. Use the DoH sign-in at /doh/signin."
HERS_AT_STAFF_DOOR = "This passkey opens a personal record, not a staff account. Use /signin."
STAFF_AT_DOH_DOOR = "This is a staff passkey. Clinicians and clinic admins sign in at /staff/signin."
HERS_AT_DOH_DOOR = "This passkey opens a personal record, not a DoH account. Use /signin."
NOT_SET_UP = "This DoH account has not finished setup. Ask the platform operator for a new setup link."
TICKET_GONE = "This sign-in has expired. Start again with your passkey."
WRONG_CODE = "That code is not right. Check the 6-digit code in your authenticator app and try again."
DOH_PASSKEYS = "A DoH account adds passkeys through a one-time setup link from the platform operator."
LINK_GONE = {
    "used": "This setup link was already used. Sign in at /doh/signin, or ask the operator for a new link.",
    "expired": "This setup link has expired. Ask the platform operator for a new one.",
}
DEMO_ONLY = "The one-tap confirm is for fictional demo sessions. Confirm with your passkey."
NO_PASSKEY = "Add a passkey in Your sign-in first: exports are confirmed with it."

staff = require(*sessions.STAFF_ROLES)


def _hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _device(request: Request) -> str | None:
    return device_label(request.headers.get("user-agent"))


def _failed(door: str, step: str, reason: str, pid: str | None, role: str | None) -> None:
    """A failed sign-in or step-up, in the audit chain. The actor is the account the passkey named, if any."""
    actor = Actor(role or "system", pid or f"{door}-unknown")
    action = "step_up_failed" if door == "step_up" else "sign_in_failed"
    with session(SYSTEM) as cur:
        audit.record(cur, actor, action, None, door, {"step": step, "reason": reason})


def _passkeys(cur, pid: str) -> list[dict]:
    cur.execute(
        "SELECT id, credential_id, label, created_at, last_used_at FROM passkeys WHERE profile_id=%s ORDER BY id",
        (pid,),
    )
    return cur.fetchall()


def _session_out(sess: SessionInfo) -> dict:
    s = get_settings()
    window = timedelta(minutes=s.step_up_minutes)
    return {
        "how": sess.how,
        "started_at": sess.created_at,
        "last_seen_at": sess.last_seen_at,
        "expires_at": sess.expires_at,
        "idle_minutes": s.staff_idle_minutes,
        "max_hours": s.staff_session_max_minutes // 60,
        "step_up_until": sess.step_up_at + window if sess.step_up_at else None,
    }


def _demo_session(sess: SessionInfo) -> bool:
    return get_settings().demo_mode and sess.how == "demo"


@router.get("/rules")
def rules():
    """The session rules the sign-in pages state (public, no session)."""
    s = get_settings()
    return {
        "idle_minutes": s.staff_idle_minutes,
        "max_hours": s.staff_session_max_minutes // 60,
        "step_up_minutes": s.step_up_minutes,
        "patient_hours": s.token_ttl_minutes // 60,
    }


# ---------- Your sign-in (staff panel) ----------
@router.get("/me")
def me(actor: Actor = Depends(staff), sess: SessionInfo = Depends(current_session)):
    with session(actor) as cur:
        cur.execute("SELECT alias FROM profiles WHERE id=%s", (actor.user_id,))
        alias = (cur.fetchone() or {}).get("alias") or actor.user_id
        keys = _passkeys(cur, actor.user_id)
    with session(SYSTEM) as cur:
        cur.execute("SELECT 1 FROM staff_totp WHERE profile_id=%s", (actor.user_id,))
        has_totp = cur.fetchone() is not None
    return {
        "role": actor.role,
        "user_id": actor.user_id,
        "alias": alias,
        "clinic_id": actor.clinic_id,
        "shared_demo_account": shared_account(actor),
        "can_add_passkey": actor.role in STAFF_DOOR,
        "passkeys": [{k: v for k, v in p.items() if k != "credential_id"} for p in keys],
        "authenticator_set": has_totp,
        "session": _session_out(sess),
        "step_up": "demo_confirm" if _demo_session(sess) else "passkey",
    }


class CredentialIn(BaseModel):
    credential: dict


@router.post("/passkey/register/options")
def register_options(actor: Actor = Depends(staff)):
    if actor.role not in STAFF_DOOR:
        raise HTTPException(403, DOH_PASSKEYS)
    with session(actor) as cur:
        cur.execute("SELECT alias FROM profiles WHERE id=%s", (actor.user_id,))
        alias = (cur.fetchone() or {}).get("alias") or "ReproSense staff"
        existing = [p["credential_id"] for p in _passkeys(cur, actor.user_id)]
    return registration_options(actor.user_id, alias, existing)


@router.post("/passkey/register/verify")
def register_verify(body: CredentialIn, request: Request, actor: Actor = Depends(staff)):
    if actor.role not in STAFF_DOOR:
        raise HTTPException(403, DOH_PASSKEYS)
    new = check_registration(body.credential, actor.user_id)
    with session(SYSTEM) as cur:
        added = save_passkey(cur, actor.user_id, new, _device(request))
        if added:
            audit.record(cur, actor, "passkey_added", None, "staff_passkey")
    if not added:
        raise HTTPException(409, "This passkey is already saved.")
    return {"ok": True}


@router.delete("/passkeys/{passkey_id}")
def remove_passkey(passkey_id: int, actor: Actor = Depends(staff)):
    if actor.role not in STAFF_DOOR:
        raise HTTPException(403, DOH_PASSKEYS)
    with session(actor) as cur:
        cur.execute("DELETE FROM passkeys WHERE id=%s AND profile_id=%s RETURNING id", (passkey_id, actor.user_id))
        gone = cur.fetchone()
        if gone:
            audit.record(cur, actor, "passkey_removed", None, "staff_passkey")
    if not gone:
        raise HTTPException(404, "Passkey not found")
    return {"ok": True}


# ---------- the staff door: a passkey only ----------
@router.post("/passkey/login/options")
def staff_login_options():
    return authentication_options("staff_login")  # no allow list: her device offers its passkeys for this site


@router.post("/passkey/login/verify")
def staff_login_verify(body: CredentialIn, request: Request, response: Response):
    try:
        who = check_assertion(body.credential, "staff_login")
    except PasskeyFailed as f:
        _failed("staff_door", "passkey", f.reason, f.profile_id, None)
        raise HTTPException(400, f.message) from None
    if who["role"] not in STAFF_DOOR:
        reason, text = (
            ("doh_account", DOH_AT_STAFF_DOOR) if who["role"] == "admin" else ("not_staff", HERS_AT_STAFF_DOOR)
        )
        _failed("staff_door", "passkey", reason, who["profile_id"], who["role"])
        raise HTTPException(400, text)
    role, pid = who["role"], who["profile_id"]
    with session(SYSTEM) as cur:
        audit.record(cur, Actor(role, pid, who["clinic_id"]), "sign_in", None, "staff_passkey")
    set_session(response, pid, role, who["clinic_id"], how="passkey", device=_device(request))
    return {"role": role, "user_id": pid, "area": AREA[role]}


# ---------- the DoH door: a passkey, then an authenticator code ----------
@router.post("/doh/passkey/options")
def doh_login_options():
    return authentication_options("doh_login")


@router.post("/doh/passkey/verify")
def doh_login_verify(body: CredentialIn):
    try:
        who = check_assertion(body.credential, "doh_login")
    except PasskeyFailed as f:
        _failed("doh_door", "passkey", f.reason, f.profile_id, None)
        raise HTTPException(400, f.message) from None
    pid = who["profile_id"]
    if who["role"] != "admin":
        text = HERS_AT_DOH_DOOR if who["role"] == "patient" else STAFF_AT_DOH_DOOR
        _failed("doh_door", "passkey", "not_doh", pid, who["role"])
        raise HTTPException(400, text)
    ticket = secrets.token_urlsafe(32)
    with session(SYSTEM) as cur:
        cur.execute("SELECT 1 FROM staff_totp WHERE profile_id=%s", (pid,))
        ready = cur.fetchone() is not None
        if ready:
            cur.execute("DELETE FROM mfa_tickets WHERE expires_at < %s", (sessions.utcnow() - timedelta(days=1),))
            cur.execute(
                "INSERT INTO mfa_tickets (ticket_hash, profile_id, expires_at) VALUES (%s,%s,%s)",
                (_hash(ticket), pid, sessions.utcnow() + TICKET_TTL),
            )
    if not ready:
        _failed("doh_door", "passkey", "no_authenticator", pid, "admin")
        raise HTTPException(400, NOT_SET_UP)
    return {"next": "code", "ticket": ticket, "expires_in": int(TICKET_TTL.total_seconds())}


class CodeIn(BaseModel):
    code: str = Field(..., pattern=r"^\d{6}$")


class TicketCodeIn(CodeIn):
    ticket: str = Field(..., min_length=20, max_length=100)


@router.post("/doh/code")
def doh_code(body: TicketCodeIn, request: Request, response: Response):
    """The second step. A wrong code is counted (and committed) before the answer; the fifth ends the ticket."""
    now = sessions.utcnow()
    with session(SYSTEM) as cur:
        cur.execute(
            "SELECT t.profile_id, t.attempts, t.used_at, t.expires_at, s.secret_enc, s.last_step, p.clinic_id"
            " FROM mfa_tickets t JOIN staff_totp s ON s.profile_id = t.profile_id"
            " JOIN profiles p ON p.id = t.profile_id WHERE t.ticket_hash=%s FOR UPDATE OF t, s",
            (_hash(body.ticket),),
        )
        row = cur.fetchone()
        live = row and row["used_at"] is None and row["expires_at"] > now and row["attempts"] < TRIES
        step = (
            totp.match(totp.unseal(row["secret_enc"]), body.code, now.timestamp(), row["last_step"]) if live else None
        )
        if live and step is None:
            tries = row["attempts"] + 1
            cur.execute(
                "UPDATE mfa_tickets SET attempts=%s, used_at=CASE WHEN %s THEN now() END WHERE ticket_hash=%s",
                (tries, tries >= TRIES, _hash(body.ticket)),
            )
            audit.record(
                cur,
                Actor("admin", row["profile_id"]),
                "sign_in_failed",
                None,
                "doh_door",
                {"step": "code", "reason": "wrong_code"},
            )
        elif step is not None:
            cur.execute("UPDATE mfa_tickets SET used_at=now() WHERE ticket_hash=%s", (_hash(body.ticket),))
            cur.execute("UPDATE staff_totp SET last_step=%s WHERE profile_id=%s", (step, row["profile_id"]))
            audit.record(cur, Actor("admin", row["profile_id"]), "sign_in", None, "doh_passkey_code")
    if not live:
        raise HTTPException(400, TICKET_GONE)
    if step is None:
        raise HTTPException(400, WRONG_CODE)
    pid = row["profile_id"]
    set_session(response, pid, "admin", row["clinic_id"] or "", how="passkey_code", device=_device(request))
    return {"role": "admin", "user_id": pid, "area": AREA["admin"]}


# ---------- the DoH admin's setup link (made by the operator's CLI) ----------
def _link(cur, token: str, lock: bool = False) -> dict:
    if not 20 <= len(token) <= 100:
        raise HTTPException(404, "This setup link is not valid.")
    cur.execute(
        "SELECT l.id, l.profile_id, l.expires_at, l.used_at, l.passkey_id, l.secret_enc, l.attempts, p.alias, p.role,"
        " p.clinic_id FROM staff_setup_links l JOIN profiles p ON p.id = l.profile_id WHERE l.token_hash=%s"
        + (" FOR UPDATE OF l" if lock else ""),
        (_hash(token),),
    )
    row = cur.fetchone()
    if not row or row["role"] != "admin":
        raise HTTPException(404, "This setup link is not valid.")
    row["status"] = (
        "used"
        if row["used_at"]
        else "expired"
        if row["expires_at"] <= sessions.utcnow() or row["attempts"] >= TRIES
        else "pending"
    )
    return row


def _pending(cur, token: str, lock: bool = False) -> dict:
    row = _link(cur, token, lock)
    if row["status"] != "pending":
        raise HTTPException(410, LINK_GONE[row["status"]])
    return row


@router.get("/setup/{token}")
def setup_preview(token: str):
    with session(SYSTEM) as cur:
        row = _link(cur, token)
    return {
        "status": row["status"],
        "role": "admin",
        "alias": row["alias"],
        "expires_at": row["expires_at"],
        "passkey_added": row["passkey_id"] is not None,
    }


@router.post("/setup/{token}/passkey/options")
def setup_passkey_options(token: str):
    with session(SYSTEM) as cur:
        row = _pending(cur, token)
    return registration_options(row["profile_id"], row["alias"], [])


@router.post("/setup/{token}/passkey/verify")
def setup_passkey_verify(token: str, body: CredentialIn, request: Request):
    with session(SYSTEM) as cur:
        pid = _pending(cur, token)["profile_id"]
    new = check_registration(body.credential, pid)  # its own session: never two at once (db/__init__.py)
    with session(SYSTEM) as cur:
        row = _pending(cur, token, lock=True)  # still pending, for the same account
        if row["profile_id"] != pid:
            raise HTTPException(409, "This setup link changed. Open it again.")
        added = save_passkey(cur, pid, new, _device(request))
        if not added:
            raise HTTPException(409, "This passkey is already saved.")
        cur.execute("UPDATE staff_setup_links SET passkey_id=%s WHERE id=%s", (added, row["id"]))
        audit.record(cur, Actor("admin", row["profile_id"]), "passkey_added", None, "doh_setup")
    return {"ok": True}


@router.post("/setup/{token}/authenticator")
def setup_authenticator(token: str):
    """The QR code's contents. The same secret comes back until setup is finished (a reload shows the same QR)."""
    with session(SYSTEM) as cur:
        row = _pending(cur, token, lock=True)
        if row["passkey_id"] is None:
            raise HTTPException(409, "Add a passkey first.")
        if row["secret_enc"]:
            secret = totp.unseal(row["secret_enc"])
        else:
            secret = totp.new_secret()
            cur.execute("UPDATE staff_setup_links SET secret_enc=%s WHERE id=%s", (totp.seal(secret), row["id"]))
    return {"otpauth_uri": totp.provisioning_uri(secret, row["alias"]), "secret": secret, "issuer": totp.ISSUER}


@router.post("/setup/{token}/code")
def setup_code(token: str, body: CodeIn, request: Request, response: Response):
    """The first code proves the app was set up. Then the link is used up, older passkeys and the old authenticator
    are removed, her other sessions end, and she is signed in."""
    now = sessions.utcnow()
    with session(SYSTEM) as cur:
        row = _pending(cur, token, lock=True)
        if not row["secret_enc"]:
            raise HTTPException(409, "Scan the QR code first.")
        step = totp.match(totp.unseal(row["secret_enc"]), body.code, now.timestamp(), 0)
        pid = row["profile_id"]
        if step is None:
            cur.execute("UPDATE staff_setup_links SET attempts = attempts + 1 WHERE id=%s", (row["id"],))
        else:
            cur.execute(
                "INSERT INTO staff_totp (profile_id, secret_enc, last_step, confirmed_at) VALUES (%s,%s,%s,%s)"
                " ON CONFLICT (profile_id) DO UPDATE SET secret_enc=EXCLUDED.secret_enc, last_step=EXCLUDED.last_step,"
                " confirmed_at=EXCLUDED.confirmed_at",
                (pid, row["secret_enc"], step, now),
            )
            cur.execute("DELETE FROM passkeys WHERE profile_id=%s AND id <> %s", (pid, row["passkey_id"]))
            cur.execute("UPDATE staff_setup_links SET used_at=%s WHERE id=%s", (now, row["id"]))
            cur.execute(
                "SELECT s.jti, s.expires_at FROM auth_sessions s WHERE s.profile_id=%s AND s.expires_at > %s"
                " AND NOT EXISTS (SELECT 1 FROM revoked_tokens r WHERE r.jti = s.jti)",
                (pid, now),
            )
            for old in cur.fetchall():
                sessions.revoke(cur, old["jti"], pid, old["expires_at"], "doh_setup")
            actor = Actor("admin", pid, row["clinic_id"] or "")
            audit.record(cur, actor, "doh_setup_complete", None, f"setup_link:{row['id']}")
            audit.record(cur, actor, "sign_in", None, "doh_setup")
    if step is None:
        raise HTTPException(400, WRONG_CODE)
    set_session(response, pid, "admin", row["clinic_id"] or "", how="passkey_code", device=_device(request))
    return {"role": "admin", "user_id": pid, "area": AREA["admin"]}


# ---------- step-up before an export ----------
@router.post("/step-up/options")
def step_up_options(actor: Actor = Depends(staff), sess: SessionInfo = Depends(current_session)):
    """How this session confirms an export. `fresh`: a check in the last few minutes still holds, so the export can
    go ahead without asking again (and no challenge is made)."""
    minutes = get_settings().step_up_minutes
    if sess.step_up_at and sessions.utcnow() - sess.step_up_at <= timedelta(minutes=minutes):
        return {"fresh": True, "mode": "demo_confirm" if _demo_session(sess) else "passkey", "valid_minutes": minutes}
    if _demo_session(sess):
        return {"fresh": False, "mode": "demo_confirm", "valid_minutes": minutes}
    with session(actor) as cur:
        allow = [p["credential_id"] for p in _passkeys(cur, actor.user_id)]
    if not allow:
        raise HTTPException(409, NO_PASSKEY)
    options = authentication_options("step_up", actor.user_id, allow)
    return {"fresh": False, "mode": "passkey", "options": options, "valid_minutes": minutes}


def _stepped_up(actor: Actor, sess: SessionInfo, how: str) -> dict:
    with session(SYSTEM) as cur:
        cur.execute("UPDATE auth_sessions SET step_up_at=%s WHERE jti=%s", (sessions.utcnow(), sess.jti))
        audit.record(cur, actor, "step_up", None, how)
    return {"ok": True, "valid_minutes": get_settings().step_up_minutes}


@router.post("/step-up/verify")
def step_up_verify(body: CredentialIn, actor: Actor = Depends(staff), sess: SessionInfo = Depends(current_session)):
    try:
        who = check_assertion(body.credential, "step_up", actor.user_id)
    except PasskeyFailed as f:
        _failed("step_up", "passkey", f.reason, actor.user_id, actor.role)
        raise HTTPException(400, f.message) from None
    if who["profile_id"] != actor.user_id:
        _failed("step_up", "passkey", "not_yours", actor.user_id, actor.role)
        raise HTTPException(400, "This passkey is not one of yours. Use a passkey saved for this account.")
    return _stepped_up(actor, sess, "passkey")


@router.post("/step-up/demo")
def step_up_demo(actor: Actor = Depends(staff), sess: SessionInfo = Depends(current_session)):
    if not _demo_session(sess):
        raise HTTPException(403, DEMO_ONLY)
    return _stepped_up(actor, sess, "demo_confirm")
