"""Family support links (build week Y4): she shares a read-only view of her upcoming care steps with someone she trusts,
with health details only if she ticks them, revocable at any time. See app/services/family.py for what it shows."""

from __future__ import annotations

import hashlib
import secrets
from datetime import UTC, datetime, timedelta
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict

from app.agents.pipeline import run
from app.config import get_settings
from app.db import SYSTEM, Actor, session
from app.security import audit
from app.security.auth import require
from app.services import family
from app.services.patient_data import load_bundle

router = APIRouter(prefix="/v1", tags=["family"])
patient = require("patient")
LINK_ACTOR = Actor("family", "family-link")  # how a view appears in her "who saw my data"


def _hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


class FamilyLinkIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    relation: Literal["husband", "mother", "sister", "friend", "other"]
    include_details: bool = False
    consent: bool


@router.post("/family-links")
def create_link(body: FamilyLinkIn, actor: Actor = Depends(patient)):
    if not body.consent:
        raise HTTPException(422, "Sharing needs your consent.")
    token = secrets.token_urlsafe(32)
    expires = datetime.now(UTC) + timedelta(days=family.LINK_DAYS)
    with session(actor) as cur:
        cur.execute(
            "INSERT INTO family_links (profile_id, relation, include_details, token_hash, expires_at)"
            " VALUES (%s,%s,%s,%s,%s) RETURNING id",
            (actor.user_id, body.relation, body.include_details, _hash(token), expires),
        )
        lid = cur.fetchone()["id"]
        audit.record(
            cur,
            actor,
            "create_family_link",
            actor.user_id,
            f"family:{lid}",
            {"relation": body.relation, "details": body.include_details, "expires": expires.isoformat()},
        )
    return {"id": lid, "token": token, "path": f"/family/{token}", "expires_at": expires}


@router.get("/family-links")
def list_links(actor: Actor = Depends(patient)):
    with session(actor) as cur:
        cur.execute(
            "SELECT id, relation, include_details, expires_at, revoked_at, last_viewed_at, created_at,"
            " (revoked_at IS NULL AND expires_at > now()) AS active FROM family_links"
            " WHERE profile_id=%s ORDER BY id DESC",
            (actor.user_id,),
        )
        return cur.fetchall()


@router.delete("/family-links/{link_id}")
def revoke_link(link_id: int, actor: Actor = Depends(patient)):
    with session(actor) as cur:
        cur.execute(
            "UPDATE family_links SET revoked_at=now() WHERE id=%s AND revoked_at IS NULL RETURNING id", (link_id,)
        )
        if not cur.fetchone():
            raise HTTPException(404, "Link not found or already turned off.")
        audit.record(cur, actor, "revoke_family_link", actor.user_id, f"family:{link_id}")
    return {"ok": True}


@router.get("/family/{token}")
def open_link(token: str, lang: Literal["en", "ar"] = "en"):
    """The family view, no sign-in: the token is the key. 404 when unknown or turned off, 410 when expired."""
    with session(SYSTEM) as cur:
        cur.execute("SELECT * FROM family_links WHERE token_hash=%s", (_hash(token),))
        link = cur.fetchone()
        if not link or link["revoked_at"] is not None:
            raise HTTPException(404, "This link is not valid or was turned off.")
        if link["expires_at"] < datetime.now(UTC):
            raise HTTPException(410, "This link has expired. Ask her to share a new one.")
        b = load_bundle(cur, link["profile_id"], include_notes=False)
        if not b:
            raise HTTPException(404, "This link is not valid or was turned off.")
        cur.execute(
            "SELECT type, due_date FROM care_gaps WHERE profile_id=%s AND status <> 'closed'", (link["profile_id"],)
        )
        gaps = cur.fetchall()
        cur.execute("UPDATE family_links SET last_viewed_at=now() WHERE id=%s", (link["id"],))
        audit.record(
            cur,
            LINK_ACTOR,
            "view_family_link",
            link["profile_id"],
            f"family:{link['id']}",
            {"relation": link["relation"]},
        )
    # Pattern titles only when she ticked "include health details"; the pipeline runs with no connection held.
    cards = run(b, lang=lang)["cards"] if link["include_details"] else []
    ref = get_settings().demo_ref_date
    return {
        **family.view(b, gaps, cards, link["include_details"], ref),
        "relation": link["relation"],
        "expires_at": link["expires_at"],
        "ref_date": ref.isoformat(),
    }
