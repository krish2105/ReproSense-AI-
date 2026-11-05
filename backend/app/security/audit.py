"""Hash-chained audit log: each row stores sha256(prev_hash + canonical row). Tampering breaks the chain."""

from __future__ import annotations

import hashlib
import json
from datetime import UTC, datetime

from app.db import Actor


def _digest(prev: str, row: dict) -> str:
    return hashlib.sha256((prev + json.dumps(row, sort_keys=True, default=str)).encode()).hexdigest()


def record(
    cur, actor: Actor, action: str, subject_id: str | None = None, target: str | None = None, detail: dict | None = None
) -> None:
    cur.execute("SELECT pg_advisory_xact_lock(424242)")  # serialise chain writes
    cur.execute("SELECT audit_last_hash() AS h")
    prev = cur.fetchone()["h"]
    at = datetime.now(UTC).isoformat()
    row = {
        "actor_id": actor.user_id,
        "actor_role": actor.role,
        "action": action,
        "subject_id": subject_id,
        "target": target,
        "detail": detail or {},
        "at": at,
    }
    cur.execute(
        "INSERT INTO audit_log (actor_id, actor_role, action, subject_id, target, detail, at, prev_hash, hash)"
        " VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)",
        (actor.user_id, actor.role, action, subject_id, target, json.dumps(detail or {}), at, prev, _digest(prev, row)),
    )


def verify_chain(rows: list[dict]) -> tuple[bool, int | None]:
    """rows ordered by id. Returns (ok, first_bad_id)."""
    prev = "GENESIS"
    for r in rows:
        at = r["at"].astimezone(UTC).isoformat() if hasattr(r["at"], "astimezone") else r["at"]
        row = {
            "actor_id": r["actor_id"],
            "actor_role": r["actor_role"],
            "action": r["action"],
            "subject_id": r["subject_id"],
            "target": r["target"],
            "detail": r["detail"] or {},
            "at": at,
        }
        if r["prev_hash"] != prev or r["hash"] != _digest(prev, row):
            return False, r["id"]
        prev = r["hash"]
    return True, None
