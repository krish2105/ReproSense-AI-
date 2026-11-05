"""Assistant endpoint: answers from the curated knowledge base, with citations."""

from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.agents.assistant import SUGGESTED, answer
from app.db import Actor, session
from app.security import audit
from app.security.auth import require

router = APIRouter(prefix="/v1/assistant", tags=["assistant"])


class AskIn(BaseModel):
    question: str = Field(..., min_length=1, max_length=600)
    lang: Literal["en", "ar"] | None = None


@router.post("/ask")
def ask(body: AskIn, actor: Actor = Depends(require("patient"))):
    with session(actor) as cur:
        cur.execute("SELECT alias FROM profiles WHERE id=%s", (actor.user_id,))
        alias = (cur.fetchone() or {}).get("alias", "")
        audit.record(cur, actor, "assistant_ask", actor.user_id, "assistant")
    return answer(body.question, body.lang, [alias])


@router.get("/suggested")
def suggested(lang: Literal["en", "ar"] = "en"):
    return {"questions": SUGGESTED[lang]}
