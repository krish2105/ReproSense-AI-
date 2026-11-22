"""Settings. Every secret comes from the environment (.env is git-ignored); nothing is hard-coded."""

from __future__ import annotations

import secrets
from datetime import date
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT = Path(__file__).resolve().parents[2]  # repository root


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=(ROOT / ".env", ROOT / "backend" / ".env"), extra="ignore")

    # Off unless the environment says DEMO_MODE=true (make env, CI and render.yaml all do). On, it opens one-tap staff
    # and DoH-admin sessions and the demo reset, so a deploy that forgets the variable must not get it by default.
    demo_mode: bool = False
    demo_ref_date: date = date(2026, 11, 22)  # "today" inside the demo (showcase day), see QUESTIONS #16
    database_url: str = "postgresql:///reprosense?host=/tmp"
    allowed_origins: str = "http://localhost:3000"
    demo_token_secret: str = ""  # HMAC key for session tokens; required outside demo mode (M3), random in demo mode
    demo_token_secret_previous: str = ""  # M3: during a rotation, tokens signed with the old secret still verify
    notes_key: str = ""  # base64 32-byte AES-GCM key for field-level encryption
    notes_key_previous: str = ""  # M4: during a rotation, data under the old key still decrypts
    token_ttl_minutes: int = 720  # her session (and a demo person's): 12 hours, no idle rule
    # Staff and DoH sessions (clinician, clinic_admin, admin; the team's plan section 5): end after this many minutes
    # without a request, and after the maximum however busy. A one-tap demo staff session follows the same rules.
    staff_idle_minutes: int = 30
    staff_session_max_minutes: int = 480
    step_up_minutes: int = 5  # an export needs a passkey check (or, in a demo session, a one-tap confirm) this recent
    setup_link_hours: int = 24  # a DoH admin's single-use setup link from the operator's CLI
    llm_provider: str = "auto"  # auto | claude | openrouter | none (auto: claude, else openrouter, if a key is set)
    anthropic_api_key: str = ""
    llm_model: str = "claude-opus-5-5"
    # The hackathon's AI credits: an OpenRouter key limited to a few models (programs.upstartbar.com). The model id is
    # one of those, e.g. "anthropic/claude-sonnet-5.5-20260928"; set OPENROUTER_MODEL to the one the credits allow.
    openrouter_api_key: str = ""
    openrouter_model: str = "anthropic/claude-sonnet-5.5-20260928"
    # Model time limits. The web gives up on an API call after 15 s (apps/web/src/lib/api/server.ts), so every model
    # call inside one API request shares one budget; past it the deterministic template answers (step 4b, 7 Nov).
    llm_request_budget_s: float = 10.0
    llm_timeout_s: float = 8.0  # one call, outside a request too (make safety-eval)
    llm_max_retries: int = 1
    embeddings_provider: str = "hashing"  # hashing (built in) — see QUESTIONS #14
    # docs/31 §H, H2: a secret the web app's own server sends as x-rs-edge. With it set, only that server may name the
    # visitor's address in X-Forwarded-For; direct callers count against the address the nearest proxy saw. Empty: as before.
    edge_secret: str = ""
    # docs/31 §H, L3: the interactive API docs and the OpenAPI schema, off unless asked for (local development).
    expose_api_docs: bool = False
    # docs/31 §H, M6: an uploaded PDF is read in its own process and stopped after this many seconds
    pdf_parse_timeout_s: float = 10.0
    cookie_secure: bool = False  # true when served over HTTPS (Render/Vercel); local http stays false
    seed_if_empty: bool = False  # first boot on a fresh hosted database: load the synthetic demo data (DEMO_MODE only)
    rate_limit_per_min: int = 400  # 22 Nov (Krishna): raised from 120 for showcase day so fast-clicking judges don't hit error pages
    rate_limit_sensitive_per_min: int = 20  # assistant + uploads
    red_flag_window_days: int = 14  # QUESTIONS #17 default (needs clinician sign-off)
    # Connection pool. Wait less than the web's 15 s API timeout, so a saturated pool answers 503 + Retry-After instead
    # of the page hanging until the web gives up. No clinical meaning.
    db_pool_min: int = 1
    db_pool_max: int = 10
    db_pool_timeout_s: float = 8.0
    # Doctor PDFs render in worker processes (0: in the request thread); past the timeout the caller gets 503 "try
    # again" and the render finishes and is cached. No clinical meaning.
    pdf_workers: int = 2
    pdf_timeout_s: float = 12.0
    # Start the PDF workers at boot and render each saved report as soon as it is created, so the first download after
    # the free host wakes is not a 503 (live check, 20 Nov). Tests turn it off. No clinical meaning.
    pdf_warm: bool = True
    log_level: str = "INFO"  # the API's JSON logs (app/observability.py); no clinical meaning
    # The demo reset rebuilds every table and anyone can press it on the public demo: one at a time, one per window.
    demo_reset_cooldown_s: int = 60
    # docs/31 §H, H3: when set, the demo reset also needs this operator key (the one-tap admin is public on the demo)
    demo_reset_key: str = ""
    max_pdf_pages: int = 30  # an uploaded lab report longer than this is refused (and would cost CPU to parse)
    # Her own sign-in (K5). Passkeys: the relying party is the web app's host. Empty = the host of the first
    # ALLOWED_ORIGINS entry, and the accepted origins = ALLOWED_ORIGINS. No clinical meaning.
    webauthn_rp_id: str = ""
    webauthn_rp_name: str = "ReproSense"
    webauthn_origins: str = ""
    # The email code backup sends only when a Resend key is set; without it the option is hidden and the API says 503.
    resend_api_key: str = ""
    email_from: str = ""  # sender on a domain verified in Resend; empty = the test sender (security/email.py)

    @property
    def origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def passkey_origins(self) -> list[str]:
        return [o.strip() for o in self.webauthn_origins.split(",") if o.strip()] or self.origins

    @property
    def passkey_rp_id(self) -> str:
        from urllib.parse import urlparse

        return self.webauthn_rp_id or urlparse(self.passkey_origins[0]).hostname or "localhost"


def finalise(s: Settings) -> Settings:
    """Checks the settings once at start-up. docs/31 §H, M3: outside demo mode a missing signing secret stops the API;
    a random per-process secret signed everyone out on every restart and two instances rejected each other's tokens."""
    if not s.demo_token_secret:
        if not s.demo_mode:
            raise RuntimeError("DEMO_TOKEN_SECRET must be set when DEMO_MODE is off (see .env.example).")
        s.demo_token_secret = secrets.token_urlsafe(48)  # demo and development only
    return s


@lru_cache
def get_settings() -> Settings:
    return finalise(Settings())


RULES_PATH = ROOT / "rules" / "clinical_rules.yaml"
SOURCES_PATH = ROOT / "knowledge_base" / "sources.yaml"
SUMMARIES_DIR = ROOT / "knowledge_base" / "summaries"
GRAPH_PATH = ROOT / "knowledge_base" / "graph.yaml"
DATA_DIR = ROOT / "data" / "synthetic" / "output"
