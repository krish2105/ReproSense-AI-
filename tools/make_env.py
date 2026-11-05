#!/usr/bin/env python3
"""Create a local .env with random demo keys. Never commit .env (it is git-ignored)."""
import base64
import os
import secrets
from pathlib import Path

ENV = Path(__file__).resolve().parent.parent / ".env"

if ENV.exists():
    print(".env already exists; not changed")
else:
    lines = [
        "DEMO_MODE=true",
        "DEMO_REF_DATE=2026-11-22",
        "DATABASE_URL=postgresql:///reprosense?host=/tmp",
        "ALLOWED_ORIGINS=http://localhost:3000",
        f"DEMO_TOKEN_SECRET={secrets.token_urlsafe(48)}",
        f"NOTES_KEY={base64.b64encode(os.urandom(32)).decode()}",
        "LLM_PROVIDER=auto",
        "ANTHROPIC_API_KEY=",
        "EMBEDDINGS_PROVIDER=hashing",
        "API_URL=http://127.0.0.1:8010",
    ]
    ENV.write_text("\n".join(lines) + "\n")
    ENV.chmod(0o600)
    print("wrote .env")
