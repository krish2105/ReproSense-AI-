"""Passkey (WebAuthn) checks shared by her sign-in, the staff door, the DoH door and the step-up before an export.

The server makes a one-time challenge for one purpose; the device signs it after Face ID, a fingerprint or a PIN; the
server checks the signature with the public key it saved. Each purpose (door) has its own challenges, so an answer
made for one door is refused at another. The server keeps only a public key and a counter."""

from __future__ import annotations

import json
import secrets
from dataclasses import dataclass
from datetime import timedelta
from typing import Any

from fastapi import HTTPException
from webauthn import (
    generate_authentication_options,
    generate_registration_options,
    options_to_json,
    verify_authentication_response,
    verify_registration_response,
)
from webauthn.helpers import base64url_to_bytes, bytes_to_base64url, parse_client_data_json
from webauthn.helpers.structs import (
    AuthenticatorSelectionCriteria,
    PublicKeyCredentialDescriptor,
    ResidentKeyRequirement,
    UserVerificationRequirement,
)

from app.config import get_settings
from app.db import SYSTEM, session

CHALLENGE_TTL = timedelta(minutes=5)
TRANSPORTS = {"usb", "nfc", "ble", "internal", "hybrid", "smart-card", "cable"}
STALE = "This sign-in request has expired or was already used. Try again."


def store_challenge(purpose: str, pid: str | None) -> bytes:
    challenge = secrets.token_bytes(32)
    with session(SYSTEM) as cur:
        cur.execute("DELETE FROM auth_challenges WHERE expires_at < now() - interval '1 day'")
        cur.execute(
            "INSERT INTO auth_challenges (challenge, purpose, profile_id, expires_at) VALUES (%s,%s,%s, now() + %s)",
            (bytes_to_base64url(challenge), purpose, pid, CHALLENGE_TTL),
        )
    return challenge


def consume_challenge(credential: dict, purpose: str, pid: str | None) -> bytes:
    """The challenge the browser signed, if we issued it for this purpose, it is unexpired and unused. It is used up
    here, in its own transaction, before the answer is checked: a second try with the same answer always fails."""
    try:
        client_data = parse_client_data_json(base64url_to_bytes(credential["response"]["clientDataJSON"]))
        challenge = client_data.challenge
    except Exception:
        raise HTTPException(400, "That passkey answer could not be read. Try again.") from None
    with session(SYSTEM) as cur:
        cur.execute(
            "UPDATE auth_challenges SET used_at = now() WHERE challenge=%s AND purpose=%s AND used_at IS NULL"
            " AND expires_at > now() AND profile_id IS NOT DISTINCT FROM %s RETURNING challenge",
            (bytes_to_base64url(challenge), purpose, pid),
        )
        ok = cur.fetchone() is not None
    if not ok:
        raise HTTPException(400, STALE)
    return challenge


def registration_options(pid: str, name: str, existing: list[str]) -> dict:
    """A new passkey for this account: one that signs in later without typing anything, unlocked on the device."""
    s = get_settings()
    options = generate_registration_options(
        rp_id=s.passkey_rp_id,
        rp_name=s.webauthn_rp_name,
        user_id=pid.encode(),  # an account id, nothing personal
        user_name=name,
        user_display_name=name,
        challenge=store_challenge("register", pid),
        authenticator_selection=AuthenticatorSelectionCriteria(
            resident_key=ResidentKeyRequirement.REQUIRED,
            user_verification=UserVerificationRequirement.REQUIRED,
        ),
        exclude_credentials=[PublicKeyCredentialDescriptor(id=base64url_to_bytes(c)) for c in existing],
        timeout=int(CHALLENGE_TTL.total_seconds() * 1000),
    )
    return json.loads(options_to_json(options))


def save_registration(cur, credential: dict, pid: str, label: str | None) -> int | None:
    """Checks a new passkey for this account (origin, challenge, user verification) and saves its public key. Returns
    the passkey id, or None when this passkey is already saved. `cur` is a system session."""
    s = get_settings()
    challenge = consume_challenge(credential, "register", pid)
    try:
        v = verify_registration_response(
            credential=credential,
            expected_challenge=challenge,
            expected_rp_id=s.passkey_rp_id,
            expected_origin=s.passkey_origins,
            require_user_verification=True,
        )
    except Exception:
        raise HTTPException(400, "This passkey could not be checked. Try again on this device.") from None
    raw = credential.get("response", {}).get("transports") or []
    transports = [t for t in raw if isinstance(t, str) and t in TRANSPORTS][:6]
    cur.execute(
        "INSERT INTO passkeys (profile_id, credential_id, public_key, sign_count, transports, label)"
        " VALUES (%s,%s,%s,%s,%s,%s) ON CONFLICT (credential_id) DO NOTHING RETURNING id",
        (pid, bytes_to_base64url(v.credential_id), v.credential_public_key, v.sign_count, transports, label),
    )
    row = cur.fetchone()
    return row["id"] if row else None


def authentication_options(purpose: str, pid: str | None = None, allow: list[str] | None = None) -> dict:
    """A sign-in challenge. With no allow list her device offers the passkeys it holds for this site (a door); with one
    (the step-up), only this account's passkeys."""
    options = generate_authentication_options(
        rp_id=get_settings().passkey_rp_id,
        challenge=store_challenge(purpose, pid),
        allow_credentials=[PublicKeyCredentialDescriptor(id=base64url_to_bytes(c)) for c in allow] if allow else None,
        user_verification=UserVerificationRequirement.REQUIRED,
        timeout=int(CHALLENGE_TTL.total_seconds() * 1000),
    )
    return json.loads(options_to_json(options))


@dataclass
class PasskeyFailed(Exception):
    """A passkey answer that did not check out. `profile_id` is the account it named, when it named a known one."""

    reason: str  # unknown_passkey | bad_signature
    profile_id: str | None
    message: str


def check_assertion(credential: dict[str, Any], purpose: str, pid: str | None = None) -> dict:
    """Checks a passkey answer to a challenge made for `purpose` (and this account, when `pid` is given). Returns the
    passkey's account: {passkey_id, profile_id, role, clinic_id}. Raises HTTPException(400) for a stale challenge and
    PasskeyFailed for an unknown passkey or a bad signature (the caller audits and answers 400)."""
    s = get_settings()
    challenge = consume_challenge(credential, purpose, pid)
    cred_id = str(credential.get("rawId") or credential.get("id") or "")
    with session(SYSTEM) as cur:
        cur.execute(
            "SELECT k.id, k.profile_id, k.public_key, k.sign_count, p.role, p.clinic_id FROM passkeys k"
            " JOIN profiles p ON p.id = k.profile_id WHERE k.credential_id=%s",
            (cred_id,),
        )
        pk = cur.fetchone()
    if not pk:
        raise PasskeyFailed(
            "unknown_passkey", None, "This passkey is not linked to an account here. It may have been removed."
        )
    try:
        handle = credential.get("response", {}).get("userHandle")
        if handle and base64url_to_bytes(handle) != pk["profile_id"].encode():
            raise ValueError("user handle")
        v = verify_authentication_response(
            credential=credential,
            expected_challenge=challenge,
            expected_rp_id=s.passkey_rp_id,
            expected_origin=s.passkey_origins,
            credential_public_key=bytes(pk["public_key"]),
            credential_current_sign_count=pk["sign_count"],
            require_user_verification=True,
        )
    except Exception:
        raise PasskeyFailed(
            "bad_signature", pk["profile_id"], "This passkey could not be checked. Try again."
        ) from None
    with session(SYSTEM) as cur:
        cur.execute("UPDATE passkeys SET sign_count=%s, last_used_at=now() WHERE id=%s", (v.new_sign_count, pk["id"]))
    return {
        "passkey_id": pk["id"],
        "profile_id": pk["profile_id"],
        "role": pk["role"],
        "clinic_id": pk["clinic_id"] or "",
    }
