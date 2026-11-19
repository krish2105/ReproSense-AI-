"""ReproSense API. Run: uv run uvicorn app.main:app --port 8010 --reload"""

from __future__ import annotations

import base64
import binascii
import logging
from contextlib import asynccontextmanager

import psycopg
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from psycopg_pool import PoolTimeout

from app.ai.llm import get_llm
from app.api import (
    admin,
    assistant,
    auth,
    clinic,
    clinic_admin,
    demo,
    family,
    patient,
    quality,
    reports,
    sessions,
    staff_auth,
)
from app.config import get_settings
from app.db import SYSTEM, session
from app.observability import RequestContext, setup_logging
from app.security.middleware import ModelBudget, RateLimit, SecurityHeaders

s = get_settings()
setup_logging(s.log_level)
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
    try:
        from app.db.seed import ensure_addon_tables

        ensure_addon_tables()  # K5 and Y4: a database seeded before them gains their tables
    except Exception as e:  # the API still starts; sign-in answers 500 until the database is reachable
        log.warning("sign-in and family tables not checked: %s", type(e).__name__)
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
    expose_headers=["x-request-id"],
)
app.add_middleware(RequestContext)  # outermost: every response, even a refusal or a crash, gets an ID and a log line
for r in (
    demo.router,
    auth.router,
    staff_auth.router,
    sessions.router,
    patient.router,
    assistant.router,
    reports.router,
    family.router,
    clinic.router,
    admin.router,
    clinic_admin.router,
    clinic_admin.invites_router,
    quality.router,
):
    app.include_router(r)


@app.exception_handler(psycopg.errors.DataError)
async def bad_value(request: Request, exc: psycopg.errors.DataError):
    """A value the database cannot store (a malformed date, a number out of range) is the caller's mistake: 422."""
    log.warning("rejected value on %s %s: %s", request.method, request.url.path, type(exc).__name__)
    return JSONResponse({"detail": "One of the values is not valid. Please check it and try again."}, status_code=422)


@app.exception_handler(PoolTimeout)
async def pool_busy(request: Request, _exc: PoolTimeout):
    """Every database connection is busy: say so (503, retry shortly) instead of a bare 500, and log it as saturation."""
    log.error("database pool exhausted: %s %s", request.method, request.url.path)
    return JSONResponse(
        {"detail": "The service is busy. Please try again in a few seconds."},
        status_code=503,
        headers={"Retry-After": "5"},
    )


@app.get("/healthz")
def healthz():
    return {"ok": True}


@app.get("/v1/ping")
def ping():
    """Wake-up call from the public pages (the web proxies only /v1). A free Render instance sleeps after about 15
    idle minutes and takes up to a minute to wake; the landing page calls this so it is awake by the time a judge picks
    a demo person. No database, no data, no session."""
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
