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

    demo_mode: bool = True
    demo_ref_date: date = date(2026, 11, 22)  # "today" inside the demo (showcase day), see QUESTIONS #16
    database_url: str = "postgresql:///reprosense?host=/tmp"
    allowed_origins: str = "http://localhost:3000"
    demo_token_secret: str = ""  # HMAC key for demo role tokens; random per process if unset
    notes_key: str = ""  # base64 32-byte AES-GCM key for field-level encryption
    token_ttl_minutes: int = 720
    llm_provider: str = "auto"  # auto | claude | none  (auto = claude if a key is present)
    anthropic_api_key: str = ""
    llm_model: str = "claude-opus-5-5"
    embeddings_provider: str = "hashing"  # hashing (built in) — see QUESTIONS #14
    cookie_secure: bool = False  # true when served over HTTPS (Render/Vercel); local http stays false
    seed_if_empty: bool = False  # first boot on a fresh hosted database: load the synthetic demo data (DEMO_MODE only)
    rate_limit_per_min: int = 120
    rate_limit_sensitive_per_min: int = 20  # assistant + uploads
    red_flag_window_days: int = 14  # QUESTIONS #17 default (needs clinician sign-off)

    @property
    def origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    s = Settings()
    if not s.demo_token_secret:
        s.demo_token_secret = secrets.token_urlsafe(48)
    return s


RULES_PATH = ROOT / "rules" / "clinical_rules.yaml"
SOURCES_PATH = ROOT / "knowledge_base" / "sources.yaml"
SUMMARIES_DIR = ROOT / "knowledge_base" / "summaries"
GRAPH_PATH = ROOT / "knowledge_base" / "graph.yaml"
DATA_DIR = ROOT / "data" / "synthetic" / "output"
