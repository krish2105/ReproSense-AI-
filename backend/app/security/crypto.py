"""Field-level encryption for free-text notes and uploaded documents (AES-256-GCM).

docs/31 §H, M4: ciphertext names its key, so NOTES_KEY can be rotated. New blobs are
    b"RSk1" + key id (4 bytes) + nonce (12 bytes) + ciphertext and tag
under the current NOTES_KEY. During a rotation NOTES_KEY_PREVIOUS still decrypts what was written before; blobs from
before key ids existed (nonce + ciphertext) still read with either key. A re-encryption job can then move old rows to
the new key and NOTES_KEY_PREVIOUS can be removed.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import os

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.config import get_settings

AAD = b"reprosense"
MAGIC = b"RSk1"
_keys: list[tuple[bytes, bytes, AESGCM]] | None = None  # (key id, raw key, cipher); the current key first


def _raw(b64: str, name: str) -> bytes:
    key = base64.b64decode(b64)
    if len(key) != 32:
        raise RuntimeError(f"{name} must be 32 bytes, base64-encoded")
    return key


def key_id(key: bytes) -> bytes:
    """Four bytes that name a key inside each ciphertext (not secret, never enough to recover the key)."""
    return hashlib.sha256(b"reprosense-notes-kid:" + key).digest()[:4]


def reset_keys() -> None:
    """Forget the loaded keys (tests that change NOTES_KEY; a restart does the same in production)."""
    global _keys
    _keys = None


def _load() -> list[tuple[bytes, bytes, AESGCM]]:
    global _keys
    if _keys is None:
        s = get_settings()
        if not s.notes_key:
            raise RuntimeError("NOTES_KEY is not set. Run `make env` (or see .env.example) to create a local key.")
        found = [_raw(s.notes_key, "NOTES_KEY")]
        if s.notes_key_previous:
            found.append(_raw(s.notes_key_previous, "NOTES_KEY_PREVIOUS"))
        _keys = [(key_id(k), k, AESGCM(k)) for k in found]
    return _keys


def encrypt(text: str | None) -> bytes | None:
    if not text:
        return None
    kid, _, aes = _load()[0]
    nonce = os.urandom(12)
    return MAGIC + kid + nonce + aes.encrypt(nonce, text.encode(), AAD)


def decrypt(blob: bytes | memoryview | None) -> str:
    if not blob:
        return ""
    b = bytes(blob)
    keys = _load()
    if b.startswith(MAGIC) and len(b) > 4 + 4 + 12:
        kid, body = b[4:8], b[8:]
        for _, _, aes in sorted(keys, key=lambda k: k[0] != kid):  # the key it names first
            try:
                return aes.decrypt(body[:12], body[12:], AAD).decode()
            except InvalidTag:
                continue
    for _, _, aes in keys:  # written before key ids existed
        try:
            return aes.decrypt(b[:12], b[12:], AAD).decode()
        except InvalidTag:
            continue
    raise InvalidTag()


def keyed_hash(purpose: str, value: str) -> str:
    """HMAC-SHA256 under a key derived from NOTES_KEY, for values that are looked up but never stored (her sign-in
    email, a 6-digit code). Without the key a leaked table cannot be matched to an address by guessing. Derived from the
    current key only: rotating NOTES_KEY also needs the lookup hashes re-made (docs/31 §H, M4)."""
    _, key, _ = _load()[0]
    sub = hmac.new(key, b"reprosense-lookup:" + purpose.encode(), hashlib.sha256).digest()
    return hmac.new(sub, value.encode(), hashlib.sha256).hexdigest()
