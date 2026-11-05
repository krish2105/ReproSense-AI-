"""Field-level encryption for free-text notes and uploaded documents (AES-256-GCM)."""

from __future__ import annotations

import base64
import os

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.config import get_settings

_key: bytes | None = None


def _aes() -> AESGCM:
    global _key
    if _key is None:
        k = get_settings().notes_key
        if not k:
            raise RuntimeError("NOTES_KEY is not set. Run `make env` (or see .env.example) to create a local key.")
        _key = base64.b64decode(k)
        if len(_key) != 32:
            raise RuntimeError("NOTES_KEY must be 32 bytes, base64-encoded")
    return AESGCM(_key)


def encrypt(text: str | None) -> bytes | None:
    if not text:
        return None
    nonce = os.urandom(12)
    return nonce + _aes().encrypt(nonce, text.encode(), b"reprosense")


def decrypt(blob: bytes | memoryview | None) -> str:
    if not blob:
        return ""
    b = bytes(blob)
    return _aes().decrypt(b[:12], b[12:], b"reprosense").decode()
