"""Operator only: create a DoH network admin, or a new setup link for one. There is no HTTP route for this, so a DoH
account can never be created by sign-up; running it needs the server's DATABASE_URL and NOTES_KEY (on Render: the API
service's Shell).

    uv run python -m app.security.create_doh_admin --alias "DoH reviewer"   # a new fictional DoH admin + setup link
    uv run python -m app.security.create_doh_admin --setup doh-01           # a new setup link for an existing one

The link opens /doh/setup/<token> once, within 24 hours (SETUP_LINK_HOURS). There she adds a passkey, scans a QR code
into an authenticator app and types its first 6-digit code; after that she signs in at /doh/signin with both. Only the
token's sha256 is stored. Finishing a new setup removes the account's older passkeys and authenticator and signs out
its sessions (a lost phone). Synthetic data only: every alias is marked "(fictional)". A demo reset deletes accounts
made here and every passkey; the seeded doh-01 comes back and needs a new link."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import secrets
import sys
from datetime import timedelta

from app.config import get_settings
from app.db import SYSTEM, Actor, session
from app.security import audit
from app.security.auth import utcnow

OPERATOR = Actor("system", "operator-cli")
ALIAS_RE = re.compile(r"^[\w .'()-]{2,48}$")


def token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def setup_url(token: str) -> str:
    path = f"/doh/setup/{token}"
    origins = get_settings().origins
    return f"{origins[0].rstrip('/')}{path}" if origins else path


def issue_setup_link(profile_id: str, hours: int | None = None) -> dict:
    """A single-use setup link for an existing DoH admin. Earlier unused links for her stop working."""
    hours = hours or get_settings().setup_link_hours
    token = secrets.token_urlsafe(32)
    expires = utcnow() + timedelta(hours=hours)
    with session(SYSTEM) as cur:
        cur.execute("SELECT alias FROM profiles WHERE id=%s AND role='admin'", (profile_id,))
        row = cur.fetchone()
        if not row:
            raise LookupError(f"{profile_id} is not a DoH network admin")
        cur.execute(
            "UPDATE staff_setup_links SET expires_at = least(expires_at, %s) WHERE profile_id=%s AND used_at IS NULL",
            (utcnow(), profile_id),
        )
        cur.execute(
            "INSERT INTO staff_setup_links (profile_id, token_hash, created_by, expires_at) VALUES (%s,%s,%s,%s)"
            " RETURNING id",
            (profile_id, token_hash(token), OPERATOR.user_id, expires),
        )
        link_id = cur.fetchone()["id"]
        audit.record(cur, OPERATOR, "doh_setup_link_issued", None, f"setup_link:{link_id}", {"profile_id": profile_id})
    return {
        "user_id": profile_id,
        "alias": row["alias"],
        "token": token,
        "setup_url": setup_url(token),
        "expires_at": expires.isoformat(),
    }


def create_admin(alias: str) -> str:
    """A new fictional DoH network admin (no clinic). Returns the account id."""
    name = " ".join(alias.split())
    name = re.sub(r"\s*\(fictional\)$", "", name, flags=re.IGNORECASE)
    if not ALIAS_RE.match(name):
        raise ValueError("Use 2 to 48 letters, digits, spaces or . ' ( ) - for the alias")
    pid = f"doh-{secrets.token_hex(4)}"
    with session(SYSTEM) as cur:
        cur.execute(
            "INSERT INTO profiles (id, alias, role, clinic_id, is_synthetic) VALUES (%s,%s,'admin',NULL,true)",
            (pid, f"{name} (fictional)"),
        )
        audit.record(cur, OPERATOR, "doh_admin_created", None, f"profile:{pid}")
    return pid


def main(argv: list[str] | None = None) -> None:
    p = argparse.ArgumentParser(prog="python -m app.security.create_doh_admin", description=__doc__.split("\n\n")[0])
    who = p.add_mutually_exclusive_group(required=True)
    who.add_argument("--alias", help="create a new fictional DoH network admin with this display name")
    who.add_argument("--setup", metavar="ID", help="issue a new setup link for this existing DoH admin (e.g. doh-01)")
    p.add_argument("--hours", type=int, default=None, help="how long the link works (default SETUP_LINK_HOURS, 24)")
    p.add_argument("--json", action="store_true", help="print JSON (for scripts and the e2e test)")
    args = p.parse_args(argv)
    if args.hours is not None and not 1 <= args.hours <= 72:
        p.error("--hours must be 1 to 72")
    try:
        pid = create_admin(args.alias) if args.alias else args.setup
        link = issue_setup_link(pid, args.hours)
    except (LookupError, ValueError) as e:
        raise SystemExit(f"create_doh_admin: {e}") from None
    if args.json:
        print(json.dumps(link))
        return
    print(f"DoH network admin: {link['alias']} ({link['user_id']})")
    print(f"Setup link (works once, until {link['expires_at']}):")
    print(f"  {link['setup_url']}")
    print("Send it to her privately. She adds a passkey and an authenticator app there, then signs in at /doh/signin.")


if __name__ == "__main__":
    main(sys.argv[1:])
