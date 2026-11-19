"""Sessions for every role (QUESTIONS #13; staff and DoH sign-in, the team's plan section 5).

A sign-in (a demo tap, her passkey or email code, a staff passkey, the DoH passkey plus authenticator code, an invite)
issues a signed JWT in the httpOnly cookie `rs_token`. The token carries an id (jti) and has a row in auth_sessions,
and every request checks that row:
- staff and DoH (clinician, clinic_admin, admin): 30 minutes without a request ends the session, and 8 hours is the
  most, however busy. Each request moves the idle window on; a background refresh (header `x-rs-background: 1`) does
  not. One-tap demo staff sessions follow the same rules;
- her sessions keep the 12-hour lifetime and no idle rule.
Signing out puts the jti on revoked_tokens, so a copied cookie stops working at once. A refused session answers 401
with `X-Session-Ended: idle | max | revoked | expired`, so the web can say why. Production path: the same checks behind
Supabase Auth or a UAE-hosted identity provider; RLS does the rest."""

from __future__ import annotations

import hashlib
import secrets
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

import jwt
from fastapi import Depends, HTTPException, Request, Response

from app.config import get_settings
from app.db import SYSTEM, Actor, session

COOKIE = "rs_token"
ALG = "HS256"
AUD = "reprosense-demo"
ROLES = ("patient", "clinician", "admin", "clinic_admin")
STAFF_ROLES = ("clinician", "clinic_admin", "admin")
# The seeded staff every judge opens with one tap (or could): one account, many people. Signing out "everywhere" would
# sign them all out, so it is refused for these. doh-01 is not one of them: it opens only through the operator's link.
SHARED_DEMO_STAFF = frozenset({"clin-01", "admin-01", "cadmin-01", "cadmin-02"})
LAST_SEEN_EVERY = {"staff": timedelta(seconds=15), "patient": timedelta(seconds=60)}  # fewer writes, same rule

EXPIRED = "Your demo session has expired. Open /demo to pick a person again."
REVOKED = "This session was signed out. Sign in again."
STEP_UP = "Confirm it is you before this export: check your passkey again (a demo session confirms with one tap)."


def utcnow() -> datetime:
    """The session clock. Tests move it (monkeypatch) instead of sleeping."""
    return datetime.now(UTC)


def is_staff(role: str) -> bool:
    return role in STAFF_ROLES


def shared_account(actor: Actor) -> bool:
    """A fictional demo account that everyone opens with one tap: the demo staff, and the demo women on /demo (a record
    she started on /join is hers alone)."""
    if actor.role == "patient":
        return not actor.user_id.startswith("guest-")
    return actor.user_id in SHARED_DEMO_STAFF


def lifetime(role: str) -> timedelta:
    s = get_settings()
    return timedelta(minutes=s.staff_session_max_minutes if is_staff(role) else s.token_ttl_minutes)


def idle_limit() -> timedelta:
    return timedelta(minutes=get_settings().staff_idle_minutes)


def device_label(user_agent: str | None) -> str | None:
    """A coarse device name for her and staff session lists. Nothing more specific is kept."""
    ua = user_agent or ""
    for key, name in (
        ("iPhone", "iPhone"),
        ("iPad", "iPad"),
        ("Android", "Android"),
        ("CrOS", "Chromebook"),
        ("Macintosh", "Mac"),
        ("Windows", "Windows"),
        ("Linux", "Linux"),
    ):
        if key in ua:
            return name
    return None


def create_token(user_id: str, role: str, clinic_id: str = "", how: str = "demo", device: str | None = None) -> str:
    """A signed token and its session row. `how` is the way in: demo, signup, invite, passkey, email_code or
    passkey_code (the DoH door: a passkey plus an authenticator code)."""
    now = utcnow()
    life = lifetime(role)
    jti = secrets.token_urlsafe(18)
    with session(SYSTEM) as cur:
        cur.execute("DELETE FROM auth_sessions WHERE expires_at < %s", (now - timedelta(days=1),))
        cur.execute("DELETE FROM revoked_tokens WHERE expires_at < %s", (now - timedelta(days=1),))
        cur.execute(
            "INSERT INTO auth_sessions (jti, profile_id, role, clinic_id, how, device, created_at, last_seen_at,"
            " expires_at) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)",
            (jti, user_id, role, clinic_id or "", how, device, now, now, now + life),
        )
    issued = datetime.now(UTC)  # the token's own times use the real clock (a token is never issued in the future)
    claims = {
        "sub": user_id,
        "role": role,
        "clinic_id": clinic_id,
        "iat": issued,
        "exp": issued + life,
        "aud": AUD,
        "demo": how == "demo",
        "jti": jti,
        "amr": how,
    }
    return jwt.encode(claims, get_settings().demo_token_secret, algorithm=ALG)


def set_session(
    response: Response, user_id: str, role: str, clinic_id: str, how: str = "demo", device: str | None = None
) -> str:
    """The httpOnly session cookie, the same for every way in. Staff cookies last 8 hours, hers 12."""
    s = get_settings()
    token = create_token(user_id, role, clinic_id, how, device)
    response.set_cookie(
        COOKIE,
        token,
        httponly=True,
        samesite="lax",
        secure=s.cookie_secure,
        max_age=int(lifetime(role).total_seconds()),
        path="/",
    )
    return token


@dataclass(frozen=True)
class SessionInfo:
    """The checked session behind this request (request.state.session)."""

    id: int | None  # None: a token of hers from before sessions had rows
    jti: str
    how: str
    created_at: datetime | None
    last_seen_at: datetime | None
    expires_at: datetime
    step_up_at: datetime | None


def presented(request: Request) -> str | None:
    auth = request.headers.get("authorization", "")
    return auth[7:] if auth.lower().startswith("bearer ") else request.cookies.get(COOKIE)


def jti_of(claims: dict, token: str) -> str:
    """The token id. A token from before ids existed is known by a hash of itself, so sign-out can still revoke it."""
    return claims.get("jti") or "legacy:" + hashlib.sha256(token.encode()).hexdigest()[:40]


def ended(reason: str) -> HTTPException:
    s = get_settings()
    text = {
        "idle": f"Your session ended after {s.staff_idle_minutes} minutes without activity. Sign in again.",
        "max": f"Your session reached its {s.staff_session_max_minutes // 60}-hour limit. Sign in again.",
        "revoked": REVOKED,
        "expired": EXPIRED,
    }[reason]
    return HTTPException(401, text, headers={"X-Session-Ended": reason})


def peek(token: str) -> dict | None:
    """The claims of a token with a good signature that has not expired, or None. No session checks (sign-out)."""
    try:
        return jwt.decode(token, get_settings().demo_token_secret, algorithms=[ALG], audience=AUD)
    except jwt.PyJWTError:
        return None


def _claims(token: str) -> dict:
    try:
        c = jwt.decode(token, get_settings().demo_token_secret, algorithms=[ALG], audience=AUD)
    except jwt.ExpiredSignatureError as e:
        raise ended("expired") from e
    except jwt.PyJWTError as e:
        raise HTTPException(401, EXPIRED) from e
    if c.get("role") not in ROLES:
        raise HTTPException(401, "Unknown role")
    return c


def decode(token: str) -> Actor:
    c = _claims(token)
    return Actor(c["role"], c["sub"], c.get("clinic_id", ""))


def current_actor(request: Request) -> Actor:
    token = presented(request)
    if not token:
        raise HTTPException(401, "Not signed in. Open /demo to pick a person.")
    c = _claims(token)
    actor = Actor(c["role"], c["sub"], c.get("clinic_id", ""))
    jti = jti_of(c, token)
    staff = is_staff(actor.role)
    background = request.headers.get("x-rs-background") == "1"
    now = utcnow()
    with session(SYSTEM) as cur:
        cur.execute(
            "SELECT s.id, s.profile_id, s.role, s.how, s.created_at, s.last_seen_at, s.expires_at, s.step_up_at,"
            " EXISTS (SELECT 1 FROM revoked_tokens r WHERE r.jti = %s) AS revoked"
            " FROM (SELECT 1) one LEFT JOIN auth_sessions s ON s.jti = %s",
            (jti, jti),
        )
        row = cur.fetchone()
        if row["revoked"]:
            raise ended("revoked")
        if row["id"] is None:
            if staff:  # a staff token from before sessions had rows, or one whose row was cleaned up: sign in again
                raise ended("expired")
            info = SessionInfo(None, jti, "legacy", None, None, datetime.fromtimestamp(c["exp"], UTC), None)
        else:
            if row["profile_id"] != actor.user_id or row["role"] != actor.role:
                raise HTTPException(401, EXPIRED)
            if now >= row["expires_at"]:
                raise ended("max" if staff else "expired")
            if staff and now - row["last_seen_at"] > idle_limit():
                raise ended("idle")
            seen = row["last_seen_at"]
            if not background and now - seen >= LAST_SEEN_EVERY["staff" if staff else "patient"]:
                cur.execute("UPDATE auth_sessions SET last_seen_at=%s WHERE id=%s", (now, row["id"]))
                seen = now
            info = SessionInfo(
                row["id"], jti, row["how"], row["created_at"], seen, row["expires_at"], row["step_up_at"]
            )
    request.state.actor = actor
    request.state.session = info
    return actor


def current_session(request: Request, _actor: Actor = Depends(current_actor)) -> SessionInfo:
    return request.state.session


def require(*roles: str):
    def dep(actor: Actor = Depends(current_actor)) -> Actor:
        if actor.role not in roles:
            raise HTTPException(403, f"This needs the {' or '.join(roles)} role.")
        return actor

    return dep


def fresh_step_up(request: Request) -> None:
    """For exports: a passkey check (or a demo session's one-tap confirm) in the last few minutes. Use after the role
    check, so a wrong role still answers 403 for the role."""
    sess: SessionInfo | None = getattr(request.state, "session", None)
    window = timedelta(minutes=get_settings().step_up_minutes)
    if sess is None or sess.step_up_at is None or utcnow() - sess.step_up_at > window:
        raise HTTPException(403, STEP_UP, headers={"X-Step-Up": "required"})


def revoke(cur, jti: str, profile_id: str, expires_at: datetime, reason: str) -> bool:
    """Puts a token on the revoked list until it would have expired. True when it was live until now."""
    cur.execute(
        "INSERT INTO revoked_tokens (jti, profile_id, reason, revoked_at, expires_at) VALUES (%s,%s,%s,%s,%s)"
        " ON CONFLICT (jti) DO NOTHING RETURNING jti",
        (jti, profile_id, reason, utcnow(), expires_at),
    )
    return cur.fetchone() is not None
