"""The DoH network admin's second check: a 6-digit code from an authenticator app (RFC 6238 TOTP: 30-second steps,
SHA-1, 6 digits, as Google Authenticator, Microsoft Authenticator and 1Password expect). The shared secret is set up
once with a QR code and stored encrypted (AES-GCM, NOTES_KEY); a code is accepted one step either side of now, and
each step works once."""

from __future__ import annotations

import hmac

import pyotp

from app.security.crypto import decrypt, encrypt

ISSUER = "ReproSense DoH (demo)"
STEP_SECONDS = 30


def new_secret() -> str:
    return pyotp.random_base32()  # 32 base32 characters: 160 random bits


def provisioning_uri(secret: str, account: str) -> str:
    """What the QR code holds: otpauth://totp/<issuer>:<account>?secret=...&issuer=..."""
    return pyotp.TOTP(secret).provisioning_uri(name=account, issuer_name=ISSUER)


def seal(secret: str) -> bytes:
    sealed = encrypt(secret)
    assert sealed is not None
    return sealed


def unseal(blob: bytes | memoryview) -> str:
    return decrypt(blob)


def match(secret: str, code: str, at: float, last_step: int) -> int | None:
    """The 30-second step this code belongs to (now, or one step either side), if that step is newer than the last one
    used; otherwise None. Constant-time comparison."""
    if not (len(code) == 6 and code.isdigit()):
        return None
    totp = pyotp.TOTP(secret)
    now_step = int(at // STEP_SECONDS)
    for step in (now_step - 1, now_step, now_step + 1):
        if step > last_step and hmac.compare_digest(totp.at(step * STEP_SECONDS), code):
            return step
    return None
