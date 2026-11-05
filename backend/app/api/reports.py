"""Doctor report: preview payload, PDF, and consented share links (random token, stored hashed, 7-day expiry, revocable)."""

from __future__ import annotations

import hashlib
import json
import secrets
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

from app.agents.pipeline import cards_for
from app.config import get_settings
from app.db import SYSTEM, Actor, session
from app.reports.pdf import build_payload, render_pdf
from app.rules.engine import evaluate
from app.security import audit
from app.security.auth import require
from app.services.patient_data import load_bundle

router = APIRouter(prefix="/v1", tags=["reports"])
patient = require("patient")


def _payload(cur, profile_id: str) -> dict:
    b = load_bundle(cur, profile_id)
    if not b:
        raise HTTPException(404, "Record not found")
    ref = get_settings().demo_ref_date
    cards, _, _ = cards_for(b, "en")
    return build_payload(b, evaluate(b, ref), cards, ref)


def _pdf_response(payload: dict, name: str) -> Response:
    try:
        pdf = render_pdf(payload)
    except OSError as e:  # Pango/Cairo missing on the host
        raise HTTPException(503, "PDF engine unavailable on this server; the preview still works.") from e
    return Response(pdf, media_type="application/pdf", headers={"Content-Disposition": f'inline; filename="{name}"'})


@router.post("/reports")
def create_report(actor: Actor = Depends(patient)):
    with session(actor) as cur:
        pl = _payload(cur, actor.user_id)
        cur.execute(
            "INSERT INTO reports (profile_id, payload) VALUES (%s,%s) RETURNING id, created_at",
            (actor.user_id, json.dumps(pl, default=str, ensure_ascii=False)),
        )
        r = cur.fetchone()
        audit.record(cur, actor, "create_report", actor.user_id, f"report:{r['id']}")
    return {"id": r["id"], "created_at": r["created_at"], "payload": pl}


@router.get("/reports/latest")
def latest_report(actor: Actor = Depends(patient)):
    with session(actor) as cur:
        cur.execute(
            "SELECT id, created_at, payload FROM reports WHERE profile_id=%s ORDER BY id DESC LIMIT 1", (actor.user_id,)
        )
        return cur.fetchone()


@router.get("/reports/{report_id}.pdf")
def report_pdf(report_id: int, actor: Actor = Depends(patient)):
    with session(actor) as cur:
        cur.execute("SELECT payload FROM reports WHERE id=%s", (report_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(404, "Report not found")
        audit.record(cur, actor, "download_report", actor.user_id, f"report:{report_id}")
    return _pdf_response(row["payload"], f"reprosense-report-{report_id}.pdf")


class ShareIn(BaseModel):
    report_id: int
    consent: bool


@router.post("/shares")
def create_share(body: ShareIn, actor: Actor = Depends(patient)):
    if not body.consent:
        raise HTTPException(422, "Sharing needs your consent.")
    token = secrets.token_urlsafe(32)
    expires = datetime.now(UTC) + timedelta(days=7)
    with session(actor) as cur:
        cur.execute("SELECT id FROM reports WHERE id=%s", (body.report_id,))
        if not cur.fetchone():
            raise HTTPException(404, "Report not found")
        cur.execute("SELECT clinic_id FROM profiles WHERE id=%s", (actor.user_id,))
        clinic = cur.fetchone()["clinic_id"]
        cur.execute(
            "INSERT INTO shares (profile_id, report_id, clinic_id, token_hash, expires_at) VALUES (%s,%s,%s,%s,%s) RETURNING id",
            (actor.user_id, body.report_id, clinic, hashlib.sha256(token.encode()).hexdigest(), expires),
        )
        sid = cur.fetchone()["id"]
        audit.record(cur, actor, "create_share", actor.user_id, f"share:{sid}", {"expires": expires.isoformat()})
    return {
        "id": sid,
        "token": token,
        "expires_at": expires,
        "path": f"/shared/{token}",
        "note": "The link works for 7 days. You can revoke it any time in Privacy.",
    }


@router.get("/shares")
def list_shares(actor: Actor = Depends(patient)):
    with session(actor) as cur:
        cur.execute(
            "SELECT id, report_id, clinic_id, expires_at, revoked_at, created_at FROM shares WHERE profile_id=%s ORDER BY id DESC",
            (actor.user_id,),
        )
        return cur.fetchall()


@router.delete("/shares/{share_id}")
def revoke_share(share_id: int, actor: Actor = Depends(patient)):
    with session(actor) as cur:
        cur.execute("UPDATE shares SET revoked_at=now() WHERE id=%s AND revoked_at IS NULL RETURNING id", (share_id,))
        if not cur.fetchone():
            raise HTTPException(404, "Share not found or already revoked")
        audit.record(cur, actor, "revoke_share", actor.user_id, f"share:{share_id}")
    return {"ok": True}


def _resolve_share(cur, token: str) -> dict:
    cur.execute(
        "SELECT s.*, r.payload FROM shares s JOIN reports r ON r.id = s.report_id WHERE token_hash=%s",
        (hashlib.sha256(token.encode()).hexdigest(),),
    )
    s = cur.fetchone()
    if not s or s["revoked_at"] is not None:
        raise HTTPException(404, "This link is not valid or was revoked.")
    if s["expires_at"] < datetime.now(UTC):
        raise HTTPException(410, "This link has expired. Ask her to share a new one.")
    return s


@router.get("/shared/{token}.pdf")
def open_share_pdf(token: str):
    with session(SYSTEM) as cur:
        s = _resolve_share(cur, token)
        audit.record(
            cur, Actor("clinician", "share-link"), "download_shared_report", s["profile_id"], f"share:{s['id']}"
        )
    return _pdf_response(s["payload"], "reprosense-shared-report.pdf")


@router.get("/shared/{token}")
def open_share(token: str):
    with session(SYSTEM) as cur:
        s = _resolve_share(cur, token)
        audit.record(cur, Actor("clinician", "share-link"), "view_shared_report", s["profile_id"], f"share:{s['id']}")
    return {"payload": s["payload"], "expires_at": s["expires_at"], "report_id": s["report_id"]}
