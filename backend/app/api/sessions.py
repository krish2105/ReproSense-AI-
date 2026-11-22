"""Signing out that really signs out (the team's plan section 5), for every role.

- Sign out: the token's id goes on the revoked list (Postgres, kept until the token would have expired), so a copied
  cookie stops working at once, and the browser's cookie is cleared.
- Her and staff "signed-in devices": the live sessions of the account, and signing one of them out.
- Sign out everywhere: every live session of the account. Refused for the shared fictional demo accounts, which every
  judge opens with one tap: it would sign them all out.
Staff sign-outs are always audited; hers are audited for a record she started herself (demo people are shared)."""

from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Request, Response

from app.db import SYSTEM, Actor, session
from app.security import audit
from app.security import auth as sessions
from app.security.auth import (
    COOKIE,
    SessionInfo,
    current_session,
    forget_demo_persona,
    jti_of,
    peek,
    presented,
    shared_account,
)

router = APIRouter(prefix="/v1/sessions", tags=["sessions"])

SHARED = (
    "This is a shared fictional demo account that every judge opens with one tap, so signing out everywhere would "
    "sign them all out. Sign out signs out this browser."
)


def _audited(actor: Actor, how: str) -> bool:
    return sessions.is_staff(actor.role) or (not shared_account(actor) and how != "demo")


def _subject(actor: Actor) -> str | None:
    return actor.user_id if actor.role == "patient" else None


def sign_out(request: Request, response: Response) -> dict:
    """Revokes the presented token (cookie or bearer) if it is still valid, and always clears the cookie, so a session
    that already ended can still leave cleanly."""
    token = presented(request)
    claims = peek(token) if token else None
    if claims and claims.get("role") in sessions.ROLES:
        actor = Actor(claims["role"], claims["sub"], claims.get("clinic_id", ""))
        how = claims.get("amr", "demo" if claims.get("demo") else "legacy")
        with session(SYSTEM) as cur:
            exp = datetime.fromtimestamp(claims["exp"], UTC)
            if sessions.revoke(cur, jti_of(claims, token), actor.user_id, exp, "sign_out") and _audited(actor, how):
                audit.record(cur, actor, "sign_out", _subject(actor), "this_device", {"how": how})
    response.delete_cookie(COOKIE, path="/")
    forget_demo_persona(response)
    return {"ok": True}


@router.post("/sign-out")
def sign_out_here(request: Request, response: Response):
    return sign_out(request, response)


def _live(cur, actor: Actor) -> list[dict]:
    """The account's sessions that would still be accepted: not revoked, not past their limit, and for staff not idle."""
    now = sessions.utcnow()
    cur.execute(
        "SELECT s.id, s.jti, s.how, s.device, s.created_at, s.last_seen_at, s.expires_at FROM auth_sessions s"
        " WHERE s.profile_id=%s AND s.role=%s AND s.expires_at > %s"
        " AND NOT EXISTS (SELECT 1 FROM revoked_tokens r WHERE r.jti = s.jti) ORDER BY s.last_seen_at DESC",
        (actor.user_id, actor.role, now),
    )
    rows = cur.fetchall()
    if sessions.is_staff(actor.role):
        rows = [r for r in rows if now - r["last_seen_at"] <= sessions.idle_limit()]
    return rows


@router.get("")
def my_sessions(actor: Actor = Depends(sessions.current_actor), sess: SessionInfo = Depends(current_session)):
    shared = shared_account(actor)
    with session(SYSTEM) as cur:
        rows = _live(cur, actor)
    if shared:  # other judges' sessions are not this visitor's devices
        rows = [r for r in rows if r["jti"] == sess.jti]
    return {
        "shared_demo_account": shared,
        "idle_minutes": sessions.idle_limit().seconds // 60 if sessions.is_staff(actor.role) else None,
        "sessions": [
            {
                "id": r["id"],
                "how": r["how"],
                "device": r["device"],
                "started_at": r["created_at"],
                "last_seen_at": r["last_seen_at"],
                "expires_at": r["expires_at"],
                "current": r["jti"] == sess.jti,
            }
            for r in rows
        ],
    }


@router.post("/sign-out-everywhere")
def sign_out_everywhere(
    response: Response, actor: Actor = Depends(sessions.current_actor), sess: SessionInfo = Depends(current_session)
):
    if shared_account(actor):
        raise HTTPException(403, SHARED)
    with session(SYSTEM) as cur:
        n = sum(
            sessions.revoke(cur, r["jti"], actor.user_id, r["expires_at"], "sign_out_everywhere")
            for r in _live(cur, actor)
        )
        if sess.id is None:  # a token of hers from before sessions had rows
            n += sessions.revoke(cur, sess.jti, actor.user_id, sess.expires_at, "sign_out_everywhere")
        audit.record(cur, actor, "sign_out_everywhere", _subject(actor), "all_devices", {"sessions": n})
    response.delete_cookie(COOKIE, path="/")
    forget_demo_persona(response)
    return {"ok": True, "signed_out": n}


@router.delete("/{session_id}")
def sign_out_device(
    session_id: int,
    response: Response,
    actor: Actor = Depends(sessions.current_actor),
    sess: SessionInfo = Depends(current_session),
):
    if shared_account(actor):
        raise HTTPException(403, SHARED)
    with session(SYSTEM) as cur:
        row = next((r for r in _live(cur, actor) if r["id"] == session_id), None)
        if row:
            sessions.revoke(cur, row["jti"], actor.user_id, row["expires_at"], "signed_out_from_another_device")
            audit.record(cur, actor, "session_revoked", _subject(actor), "one_device", {"how": row["how"]})
    if not row:
        raise HTTPException(404, "That session has already ended.")
    if row["jti"] == sess.jti:
        response.delete_cookie(COOKIE, path="/")
        forget_demo_persona(response)
    return {"ok": True}
