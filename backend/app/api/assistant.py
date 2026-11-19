"""Assistant endpoint. A router (app/agents/router.py) sends each question, after the safety routes, to the cited
knowledge answer, to her own record (numbers computed by code, with dated chips) or to her next steps (care-navigator
drafts she approves; nothing is sent)."""

from __future__ import annotations

import json
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from app.agents import navigator
from app.agents import router as lanes
from app.agents.assistant import SUGGESTED
from app.config import get_settings
from app.db import Actor, session
from app.rules.engine import evaluate
from app.security import audit
from app.security.auth import require
from app.services.patient_data import ai_allowed, load_bundle

router = APIRouter(prefix="/v1/assistant", tags=["assistant"])


class AskIn(BaseModel):
    # Her question only: the record is always the signed-in woman's own, so a request cannot name another record.
    model_config = ConfigDict(extra="forbid")
    question: str = Field(..., min_length=1, max_length=600)
    lang: Literal["en", "ar"] | None = None


@router.get("/status")
def status(actor: Actor = Depends(require("patient"))):
    with session(actor) as cur:
        return {"ai_on": ai_allowed(cur, actor.user_id)}


def _attach_drafts(cur, actor: Actor, bundle: dict, out: dict) -> None:
    """Lane (c): each pattern or care step gets her care-navigator draft (her open one, or a new one). Drafts only:
    status `draft` until she approves or discards it with the navigator's own endpoints. Nothing is sent or booked."""
    items = [i for i in out.get("next_steps", []) if i["kind"] in ("pattern", "care_step")]
    if not items:
        return
    s = get_settings()
    ev = evaluate(bundle, s.demo_ref_date, s.red_flag_window_days)
    hits = {h.rule_id: h for h in ev.observations}
    cur.execute("SELECT name FROM clinics WHERE id=%s", (bundle["profile"].get("clinic_id"),))
    row = cur.fetchone()
    clinic = row["name"] if row else "your clinic"
    lang = out["lang"]
    for item in items:
        hit = hits.get(item["rule_id"])
        if not hit:
            continue
        cur.execute(
            "SELECT * FROM navigator_drafts WHERE profile_id=%s AND rule_id=%s AND status <> 'discarded'"
            " ORDER BY id DESC LIMIT 1",
            (actor.user_id, item["rule_id"]),
        )
        d = cur.fetchone()
        if not d:
            cur.execute(
                "INSERT INTO navigator_drafts (profile_id, rule_id, draft) VALUES (%s,%s,%s) RETURNING *",
                (actor.user_id, item["rule_id"], json.dumps(navigator.draft(hit, ev, clinic), ensure_ascii=False)),
            )
            d = cur.fetchone()
            audit.record(cur, actor, "navigator_draft", actor.user_id, f"draft:{d['id']}")
        body = d["draft"] if isinstance(d["draft"], dict) else json.loads(d["draft"])
        item["draft"] = {
            "id": d["id"],
            "status": d["status"],
            "to": body.get("to"),
            "subject": body.get("subject"),
            "message": body.get("message_ar" if lang == "ar" else "message_en"),
            "bring": body.get("bring_ar" if lang == "ar" else "bring_en") or [],
            "sent": False,  # the app never sends: she copies the message or shows it at the desk
        }


@router.post("/ask")
def ask(body: AskIn, actor: Actor = Depends(require("patient"))):
    with session(actor) as cur:
        ai_on = ai_allowed(cur, actor.user_id)
        bundle = load_bundle(cur, actor.user_id, include_notes=False)  # her own record; her notes are never read
    if not bundle:
        raise HTTPException(404, "Record not found")
    alias = bundle["profile"].get("alias", "")
    out = lanes.ask(
        body.question, body.lang, bundle=bundle, ref=get_settings().demo_ref_date, ai_on=ai_on, names=[alias]
    )
    if out.get("lane") == "ai_off":  # she turned AI off in Privacy: the knowledge answer stays closed
        raise HTTPException(403, "ai_off")
    with session(actor) as cur:
        if out["lane"] == "next_step":
            _attach_drafts(cur, actor, bundle, out)
        audit.record(cur, actor, "assistant_ask", actor.user_id, "assistant", {"lane": out["lane"]})
    return out


@router.get("/suggested")
def suggested(lang: Literal["en", "ar"] = "en"):
    return {"questions": SUGGESTED[lang]}
