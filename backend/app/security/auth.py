"""Demo role tokens (QUESTIONS #13): /demo issues a signed JWT for a fictional persona, the clinician or the admin.
Production path: Supabase Auth with passkeys issues the JWT; the API checks it the same way and RLS does the rest."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

import jwt
from fastapi import Depends, HTTPException, Request

from app.config import get_settings
from app.db import Actor

COOKIE = "rs_token"
ALG = "HS256"


def create_token(user_id: str, role: str, clinic_id: str = "") -> str:
    s = get_settings()
    now = datetime.now(UTC)
    claims = {
        "sub": user_id,
        "role": role,
        "clinic_id": clinic_id,
        "iat": now,
        "exp": now + timedelta(minutes=s.token_ttl_minutes),
        "aud": "reprosense-demo",
        "demo": True,
    }
    return jwt.encode(claims, s.demo_token_secret, algorithm=ALG)


def decode(token: str) -> Actor:
    try:
        c = jwt.decode(token, get_settings().demo_token_secret, algorithms=[ALG], audience="reprosense-demo")
    except jwt.PyJWTError as e:
        raise HTTPException(401, "Your demo session has expired. Open /demo to pick a person again.") from e
    if c.get("role") not in ("patient", "clinician", "admin"):
        raise HTTPException(401, "Unknown role")
    return Actor(c["role"], c["sub"], c.get("clinic_id", ""))


def current_actor(request: Request) -> Actor:
    auth = request.headers.get("authorization", "")
    token = auth[7:] if auth.lower().startswith("bearer ") else request.cookies.get(COOKIE)
    if not token:
        raise HTTPException(401, "Not signed in. Open /demo to pick a person.")
    actor = decode(token)
    request.state.actor = actor
    return actor


def require(*roles: str):
    def dep(actor: Actor = Depends(current_actor)) -> Actor:
        if actor.role not in roles:
            raise HTTPException(403, f"This needs the {' or '.join(roles)} role.")
        return actor

    return dep
