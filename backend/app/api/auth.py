"""Her own sign-in (build week K5): a passkey first, a 6-digit email code as backup.

A record she started on /join is reached only through her own session. These endpoints let her open it again on any
device: with a passkey (WebAuthn; Face ID, a fingerprint or a phone PIN unlock it on her device, and the server keeps
only a public key and a counter), or with a code sent to an email address she linked from Privacy. Demo people stay
one tap on /demo and have no sign-in methods. Every sign-in, failed try and change of method is in the audit log."""

from __future__ import annotations

import hmac
import json
import re
import secrets
from datetime import timedelta
from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, Field
from webauthn import (
    generate_authentication_options,
    generate_registration_options,
    options_to_json,
    verify_authentication_response,
    verify_registration_response,
)
from webauthn.helpers import base64url_to_bytes, bytes_to_base64url
from webauthn.helpers.structs import (
    AuthenticatorSelectionCriteria,
    PublicKeyCredentialDescriptor,
    ResidentKeyRequirement,
    UserVerificationRequirement,
)

from app.config import get_settings
from app.db import SYSTEM, Actor, session
from app.security import audit
from app.security.auth import current_actor, device_label, set_session
from app.security.crypto import keyed_hash
from app.security.email import SendFailed, get_sender
from app.security.passkeys import CHALLENGE_TTL, TRANSPORTS
from app.security.passkeys import consume_challenge as _consume_challenge
from app.security.passkeys import store_challenge as _store_challenge

router = APIRouter(prefix="/v1/auth", tags=["sign-in"])

CODE_TTL = timedelta(minutes=10)
CODE_TRIES = 5
CODES_PER_ADDRESS = 3  # per address and purpose, in any 10 minutes
CODES_PER_HOUR = 60  # all addresses together: keeps the email provider's free quota for the demo
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

NOT_OWN = "Sign-in methods are for a record you started yourself on /join. Demo people open with one tap on /demo."
NO_EMAIL = "Sign-in by email code is not set up on this server. Use a passkey, or open a demo person on /demo."
STAFF_PASSKEY = "This passkey belongs to a staff account. Clinicians and clinic admins sign in at /staff/signin."
WRONG_CODE = "That code is not right, or it has expired. Check it, or ask for a new code."
SENT = "If this address is linked to a record, a 6-digit code is on its way. It works for 10 minutes."


def own_record(actor: Actor) -> bool:
    """A record she started on /join (the fictional demo people are shared by every visitor)."""
    return actor.role == "patient" and actor.user_id.startswith("guest-")


def her_own(actor: Actor = Depends(current_actor)) -> Actor:
    if not own_record(actor):
        raise HTTPException(403, NOT_OWN)
    return actor


def _signed_in(response: Response, pid: str, method: str, request: Request) -> dict:
    with session(SYSTEM) as cur:
        cur.execute("SELECT clinic_id FROM profiles WHERE id=%s AND role='patient'", (pid,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(400, "This record no longer exists.")
        audit.record(cur, Actor("patient", pid), "sign_in", pid, method)
    set_session(response, pid, "patient", row["clinic_id"] or "", how=method, device=_device(request))
    return {"role": "patient", "user_id": pid}


def _failed(pid: str, method: str) -> None:
    with session(SYSTEM) as cur:
        audit.record(cur, Actor("patient", pid), "sign_in_failed", pid, method)


@router.get("/methods")
def methods():
    """What the sign-in page offers. The email code needs a configured provider."""
    return {"passkey": True, "email": get_sender() is not None}


@router.get("/me")
def my_methods(actor: Actor = Depends(current_actor)):
    """Her sign-in methods for Privacy. Never the address: only whether one is linked."""
    out: dict[str, Any] = {
        "own_record": own_record(actor),
        "passkeys": [],
        "email_linked": False,
        "email_available": get_sender() is not None,
    }
    if not own_record(actor):
        return out
    with session(actor) as cur:
        cur.execute(
            "SELECT id, label, created_at, last_used_at FROM passkeys WHERE profile_id=%s ORDER BY id", (actor.user_id,)
        )
        out["passkeys"] = cur.fetchall()
        cur.execute("SELECT 1 FROM sign_in_emails WHERE profile_id=%s", (actor.user_id,))
        out["email_linked"] = cur.fetchone() is not None
    return out


# ---------- passkeys ----------
def _device(request: Request) -> str | None:
    return device_label(request.headers.get("user-agent"))


class CredentialIn(BaseModel):
    credential: dict[str, Any]


@router.post("/passkey/register/options")
def register_options(actor: Actor = Depends(her_own)):
    s = get_settings()
    with session(actor) as cur:
        cur.execute("SELECT alias FROM profiles WHERE id=%s", (actor.user_id,))
        alias = (cur.fetchone() or {}).get("alias") or "ReproSense"
        cur.execute("SELECT credential_id FROM passkeys WHERE profile_id=%s", (actor.user_id,))
        existing = [PublicKeyCredentialDescriptor(id=base64url_to_bytes(r["credential_id"])) for r in cur.fetchall()]
    options = generate_registration_options(
        rp_id=s.passkey_rp_id,
        rp_name=s.webauthn_rp_name,
        user_id=actor.user_id.encode(),  # a random record id, nothing personal
        user_name=alias,
        user_display_name=alias,
        challenge=_store_challenge("register", actor.user_id),
        authenticator_selection=AuthenticatorSelectionCriteria(
            resident_key=ResidentKeyRequirement.REQUIRED,  # sign in later without typing anything
            user_verification=UserVerificationRequirement.REQUIRED,  # Face ID, fingerprint or PIN on her device
        ),
        exclude_credentials=existing,
        timeout=int(CHALLENGE_TTL.total_seconds() * 1000),
    )
    return json.loads(options_to_json(options))


@router.post("/passkey/register/verify")
def register_verify(body: CredentialIn, request: Request, actor: Actor = Depends(her_own)):
    s = get_settings()
    challenge = _consume_challenge(body.credential, "register", actor.user_id)
    try:
        v = verify_registration_response(
            credential=body.credential,
            expected_challenge=challenge,
            expected_rp_id=s.passkey_rp_id,
            expected_origin=s.passkey_origins,
            require_user_verification=True,
        )
    except Exception:
        raise HTTPException(400, "This passkey could not be checked. Try again on this device.") from None
    raw = body.credential.get("response", {}).get("transports") or []
    transports = [t for t in raw if isinstance(t, str) and t in TRANSPORTS][:6]
    with session(SYSTEM) as cur:
        cur.execute(
            "INSERT INTO passkeys (profile_id, credential_id, public_key, sign_count, transports, label)"
            " VALUES (%s,%s,%s,%s,%s,%s) ON CONFLICT (credential_id) DO NOTHING RETURNING id",
            (
                actor.user_id,
                bytes_to_base64url(v.credential_id),
                v.credential_public_key,
                v.sign_count,
                transports,
                _device(request),
            ),
        )
        added = cur.fetchone()
        if added:
            audit.record(cur, actor, "passkey_added", actor.user_id, "passkey")
    if not added:
        raise HTTPException(409, "This passkey is already saved.")
    return {"ok": True}


@router.post("/passkey/login/options")
def login_options():
    options = generate_authentication_options(
        rp_id=get_settings().passkey_rp_id,
        challenge=_store_challenge("login", None),
        user_verification=UserVerificationRequirement.REQUIRED,
        timeout=int(CHALLENGE_TTL.total_seconds() * 1000),
    )  # no allow list: her device offers the passkeys it holds for this site
    return json.loads(options_to_json(options))


@router.post("/passkey/login/verify")
def login_verify(body: CredentialIn, request: Request, response: Response):
    s = get_settings()
    challenge = _consume_challenge(body.credential, "login", None)
    cred_id = str(body.credential.get("rawId") or body.credential.get("id") or "")
    with session(SYSTEM) as cur:
        cur.execute(
            "SELECT k.id, k.profile_id, k.public_key, k.sign_count, p.role FROM passkeys k"
            " JOIN profiles p ON p.id = k.profile_id WHERE k.credential_id=%s",
            (cred_id,),
        )
        pk = cur.fetchone()
    if not pk:
        raise HTTPException(400, "This passkey is not linked to a record here. It may have been removed.")
    if pk["role"] != "patient":  # a staff or DoH passkey: their own doors, never her record
        with session(SYSTEM) as cur:
            audit.record(
                cur,
                Actor(pk["role"], pk["profile_id"]),
                "sign_in_failed",
                None,
                "her_door",
                {"reason": "staff_passkey"},
            )
        raise HTTPException(400, STAFF_PASSKEY)
    try:
        handle = body.credential.get("response", {}).get("userHandle")
        if handle and base64url_to_bytes(handle) != pk["profile_id"].encode():
            raise ValueError("user handle")
        v = verify_authentication_response(
            credential=body.credential,
            expected_challenge=challenge,
            expected_rp_id=s.passkey_rp_id,
            expected_origin=s.passkey_origins,
            credential_public_key=bytes(pk["public_key"]),
            credential_current_sign_count=pk["sign_count"],
            require_user_verification=True,
        )
    except Exception:
        _failed(pk["profile_id"], "passkey")
        raise HTTPException(400, "This passkey could not be checked. Try again.") from None
    with session(SYSTEM) as cur:
        cur.execute("UPDATE passkeys SET sign_count=%s, last_used_at=now() WHERE id=%s", (v.new_sign_count, pk["id"]))
    return _signed_in(response, pk["profile_id"], "passkey", request)


@router.delete("/passkeys/{passkey_id}")
def remove_passkey(passkey_id: int, actor: Actor = Depends(her_own)):
    with session(actor) as cur:
        cur.execute("DELETE FROM passkeys WHERE id=%s AND profile_id=%s RETURNING id", (passkey_id, actor.user_id))
        gone = cur.fetchone()
        if gone:
            audit.record(cur, actor, "passkey_removed", actor.user_id, "passkey")
    if not gone:
        raise HTTPException(404, "Passkey not found")
    return {"ok": True}


# ---------- email code ----------
class EmailIn(BaseModel):
    email: str = Field(..., min_length=3, max_length=254)
    lang: Literal["en", "ar"] = "en"


class CodeIn(BaseModel):
    email: str = Field(..., min_length=3, max_length=254)
    code: str = Field(..., pattern=r"^\d{6}$")


def _email_hash(email: str) -> str:
    e = email.strip().lower()
    if not EMAIL_RE.match(e):
        raise HTTPException(422, "Enter an email address")
    return keyed_hash("email", e)


def _code_hash(email_hash: str, code: str) -> str:
    return keyed_hash("email-code", f"{email_hash}:{code}")


def _sender():
    sender = get_sender()
    if sender is None:
        raise HTTPException(503, NO_EMAIL)
    return sender


def _issue(cur, email_hash: str, purpose: str, pid: str | None) -> str:
    cur.execute(
        "SELECT count(*) AS n FROM email_codes WHERE email_hash=%s AND purpose=%s AND created_at > now() - %s",
        (email_hash, purpose, CODE_TTL),
    )
    if cur.fetchone()["n"] >= CODES_PER_ADDRESS:
        raise HTTPException(429, "Too many codes for this address. Wait 10 minutes and try again.")
    cur.execute("SELECT count(*) AS n FROM email_codes WHERE created_at > now() - interval '1 hour'")
    if cur.fetchone()["n"] >= CODES_PER_HOUR:
        raise HTTPException(429, "Too many codes were asked for in the last hour. Try again later, or use a passkey.")
    cur.execute(
        "UPDATE email_codes SET used_at=now() WHERE email_hash=%s AND purpose=%s AND used_at IS NULL",
        (email_hash, purpose),
    )  # only the newest code works
    code = f"{secrets.randbelow(10**6):06d}"
    cur.execute(
        "INSERT INTO email_codes (email_hash, purpose, profile_id, code_hash, expires_at) VALUES (%s,%s,%s,%s, now() + %s)",
        (email_hash, purpose, pid, _code_hash(email_hash, code), CODE_TTL),
    )
    return code


def _check(email_hash: str, purpose: str, code: str, pid: str | None = None) -> tuple[bool, str | None]:
    """(right, profile on the code). A wrong try is counted and committed; the fifth wrong try locks the code."""
    with session(SYSTEM) as cur:
        cur.execute(
            "SELECT id, profile_id, code_hash, attempts, expires_at > now() AS live FROM email_codes"
            " WHERE email_hash=%s AND purpose=%s AND used_at IS NULL AND (%s::text IS NULL OR profile_id = %s)"
            " ORDER BY id DESC LIMIT 1 FOR UPDATE",
            (email_hash, purpose, pid, pid),
        )
        row = cur.fetchone()
        if not row or not row["live"] or row["attempts"] >= CODE_TRIES:
            return False, None
        if hmac.compare_digest(row["code_hash"], _code_hash(email_hash, code)):
            cur.execute("UPDATE email_codes SET used_at=now() WHERE id=%s", (row["id"],))
            return True, row["profile_id"]
        tries = row["attempts"] + 1
        cur.execute(
            "UPDATE email_codes SET attempts=%s, used_at=CASE WHEN %s THEN now() END WHERE id=%s",
            (tries, tries >= CODE_TRIES, row["id"]),
        )
        return False, row["profile_id"]


def _send(sender, email: str, code: str, lang: str) -> None:
    try:
        sender.send_code(email.strip(), code, lang)
    except SendFailed:
        raise HTTPException(
            502, "The code could not be sent just now. Try again in a minute, or use a passkey."
        ) from None


@router.post("/email/start")
def email_start(body: EmailIn):
    """Sends a code when the address is linked to a record. The answer is the same either way, so nobody can learn
    which addresses have a record; an unknown address gets a code row too, so the rate limit behaves the same."""
    sender = _sender()
    eh = _email_hash(body.email)
    with session(SYSTEM) as cur:
        cur.execute("SELECT profile_id FROM sign_in_emails WHERE email_hash=%s", (eh,))
        row = cur.fetchone()
        pid = row["profile_id"] if row else None
        code = _issue(cur, eh, "sign_in", pid)
    if pid:
        _send(sender, body.email, code, body.lang)
    return {"sent": True, "message": SENT}


@router.post("/email/verify")
def email_verify(body: CodeIn, request: Request, response: Response):
    _sender()
    eh = _email_hash(body.email)
    right, pid = _check(eh, "sign_in", body.code)
    if right and pid:
        with session(SYSTEM) as cur:  # still linked to the same record (she may have unlinked it since)
            cur.execute("SELECT profile_id FROM sign_in_emails WHERE email_hash=%s", (eh,))
            linked = cur.fetchone()
        if linked and linked["profile_id"] == pid:
            return _signed_in(response, pid, "email_code", request)
    if pid:
        _failed(pid, "email_code")
    raise HTTPException(400, WRONG_CODE)


@router.post("/email/link/start")
def link_start(body: EmailIn, actor: Actor = Depends(her_own)):
    """From Privacy, after sign-in: a code to the address proves it is hers before it is linked."""
    sender = _sender()
    eh = _email_hash(body.email)
    with session(SYSTEM) as cur:
        code = _issue(cur, eh, "link", actor.user_id)
    _send(sender, body.email, code, body.lang)
    return {"sent": True}


@router.post("/email/link/verify")
def link_verify(body: CodeIn, actor: Actor = Depends(her_own)):
    _sender()
    eh = _email_hash(body.email)
    right, _ = _check(eh, "link", body.code, actor.user_id)
    if not right:
        raise HTTPException(400, WRONG_CODE)
    with session(SYSTEM) as cur:
        cur.execute("SELECT profile_id FROM sign_in_emails WHERE email_hash=%s", (eh,))
        other = cur.fetchone()
        if other and other["profile_id"] != actor.user_id:
            raise HTTPException(409, "This address is already linked to another record.")
        cur.execute(
            "INSERT INTO sign_in_emails (profile_id, email_hash) VALUES (%s,%s)"
            " ON CONFLICT (profile_id) DO UPDATE SET email_hash=EXCLUDED.email_hash, created_at=now()",
            (actor.user_id, eh),
        )
        audit.record(cur, actor, "email_linked", actor.user_id, "email")
    return {"ok": True}


@router.delete("/email")
def unlink_email(actor: Actor = Depends(her_own)):
    with session(actor) as cur:
        cur.execute("DELETE FROM sign_in_emails WHERE profile_id=%s RETURNING profile_id", (actor.user_id,))
        if cur.fetchone():
            audit.record(cur, actor, "email_unlinked", actor.user_id, "email")
    return {"ok": True}
