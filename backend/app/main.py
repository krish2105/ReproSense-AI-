"""ReproSense API. Run: uv run uvicorn app.main:app --port 8010 --reload"""

from __future__ import annotations

import base64
import binascii
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.ai.llm import get_llm
from app.api import admin, assistant, clinic, demo, patient, quality, reports
from app.config import get_settings
from app.db import SYSTEM, session
from app.security.middleware import ModelBudget, RateLimit, SecurityHeaders

s = get_settings()
log = logging.getLogger("reprosense")


def check_notes_key() -> None:
    """Fail at boot, not in the middle of a demo, when the field-encryption key is missing or the wrong size."""
    try:
        ok = len(base64.b64decode(s.notes_key, validate=True)) == 32
    except (binascii.Error, ValueError):
        ok = False
    if not ok:
        raise RuntimeError("NOTES_KEY must be 32 random bytes, base64-encoded (see docs/16_DEPLOY_NOW.md)")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    check_notes_key()
    if s.demo_mode and s.seed_if_empty:
        from app.db.seed import seed_if_empty

        loaded = seed_if_empty()
        log.warning("first boot: %s", f"seeded {loaded}" if loaded else "demo data already present")
    yield


app = FastAPI(
    title="ReproSense API",
    version="0.4.0",
    description="Non-diagnostic reproductive health record. Synthetic demo data only.",
    lifespan=lifespan,
)
app.add_middleware(ModelBudget)  # one model time budget per request (step 4b)
app.add_middleware(RateLimit)
app.add_middleware(SecurityHeaders)
app.add_middleware(
    CORSMiddleware,
    allow_origins=s.origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE"],
    allow_headers=["content-type", "authorization"],
)
for r in (demo.router, patient.router, assistant.router, reports.router, clinic.router, admin.router, quality.router):
    app.include_router(r)


@app.get("/healthz")
def healthz():
    return {"ok": True}


@app.get("/readyz")
def readyz():
    with session(SYSTEM) as cur:
        cur.execute("SELECT count(*) AS n FROM kb_chunks")
        kb = cur.fetchone()["n"]
        cur.execute("SELECT count(*) AS n FROM profiles WHERE role='patient'")
        people = cur.fetchone()["n"]
    return {
        "db": True,
        "kb_chunks": kb,
        "personas": people,
        "llm": get_llm().name,
        "demo_mode": s.demo_mode,
        "ref_date": s.demo_ref_date.isoformat(),
    }
