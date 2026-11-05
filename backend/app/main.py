"""ReproSense API. Run: uv run uvicorn app.main:app --port 8010 --reload"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.ai.llm import get_llm
from app.api import admin, assistant, clinic, demo, patient, quality, reports
from app.config import get_settings
from app.db import SYSTEM, session
from app.security.middleware import RateLimit, SecurityHeaders

s = get_settings()
app = FastAPI(
    title="ReproSense API",
    version="0.4.0",
    description="Non-diagnostic reproductive health record. Synthetic demo data only.",
)
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
