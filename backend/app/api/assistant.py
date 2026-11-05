"""Assistant endpoint: answers from the curated knowledge base, with citations."""

from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.agents.assistant import SUGGESTED, answer
from app.db import Actor, session
from app.security import audit
from app.security.auth import require
from app.services.patient_data import ai_allowed

router = APIRouter(prefix="/v1/assistant", tags=["assistant"])


class AskIn(BaseModel):
    question: str = Field(..., min_length=1, max_length=600)
    lang: Literal["en", "ar"] | None = None


@router.get("/status")
def status(actor: Actor = Depends(require("patient"))):
    with session(actor) as cur:
        return {"ai_on": ai_allowed(cur, actor.user_id)}


@router.post("/ask")
def ask(body: AskIn, actor: Actor = Depends(require("patient"))):
    with session(actor) as cur:
        if not ai_allowed(cur, actor.user_id):  # she turned AI off in Privacy: nothing is sent anywhere
            raise HTTPException(403, "ai_off")
        cur.execute("SELECT alias FROM profiles WHERE id=%s", (actor.user_id,))
        alias = (cur.fetchone() or {}).get("alias", "")
        audit.record(cur, actor, "assistant_ask", actor.user_id, "assistant")
    return answer(body.question, body.lang, [alias])


@router.get("/suggested")
def suggested(lang: Literal["en", "ar"] = "en"):
    return {"questions": SUGGESTED[lang]}
