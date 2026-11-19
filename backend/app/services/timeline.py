"""The event timeline: who did what and when, from the hash-chained audit log, for the DoH network admin (every clinic)
and a clinic admin (her own clinic only, enforced in Postgres by audit_event_rows()).

Ids only, never names: a patient's id (persona ids are first names) is replaced by a keyed pseudonym before it leaves
the API, in the actor, record and target columns alike. Staff ids are already pseudonymous ("clin-01"). The free-text
detail column is never returned. The audit log is only read."""

from __future__ import annotations

import hashlib
import hmac
import re
from datetime import UTC, date, datetime, time, timedelta

from app.config import get_settings
from app.db import SYSTEM, session
from app.security.audit import verify_chain
from app.services.followups import TZ

ROLES = ("patient", "clinician", "clinic_admin", "admin", "system")
ACTION_RE = re.compile(r"^[a-z_]{1,60}$")
MAX_PAGE_SIZE = 100


def pseudonym(pid: str) -> str:
    """A stable, keyed pseudonym for a patient's id: the same record reads the same on every page, and the id (a first
    name for the demo personas) cannot be recovered by hashing a guess without the server's key."""
    key = (get_settings().notes_key or "reprosense-demo").encode()
    return "R-" + hmac.new(key, pid.encode(), hashlib.sha256).hexdigest()[:8].upper()


def _row(r: dict) -> dict:
    patients = {r["subject_id"]} if r["subject_id"] else set()
    if r["actor_role"] == "patient" and r["actor_id"]:
        patients.add(r["actor_id"])
    target = r["target"]
    for pid in sorted(patients, key=len, reverse=True):
        if target and pid in target:
            target = target.replace(pid, pseudonym(pid))
    actor = pseudonym(r["actor_id"]) if r["actor_role"] == "patient" and r["actor_id"] else r["actor_id"]
    return {
        "id": r["id"],
        "at": r["at"],
        "actor_role": r["actor_role"],
        "actor": actor,
        "action": r["action"],
        "record": pseudonym(r["subject_id"]) if r["subject_id"] else None,
        "target": target,
        "clinic_id": r["clinic_id"],
    }


def _day_start(d: date) -> datetime:
    return datetime.combine(d, time(0), TZ).astimezone(UTC)


def chain() -> dict:
    """The existing chain check over the whole log, read by the system; only the verdict is returned."""
    with session(SYSTEM) as cur:
        cur.execute("SELECT * FROM audit_log ORDER BY id")
        rows = cur.fetchall()
    ok, bad = verify_chain(rows)
    return {"ok": ok, "entries": len(rows), "first_bad_id": bad}


def events(
    cur,
    clinic: str | None,
    role: str | None,
    action: str | None,
    since: date | None,
    until: date | None,
    page: int,
    page_size: int,
    snapshot: int | None = None,
) -> dict:
    """One page of events, newest first, filtered by role, action and date range (days in Abu Dhabi, inclusive).
    Pages count down from `snapshot` (the newest id when the first page was read), so rows written meanwhile, such as
    this very view, never shift a page."""
    if snapshot is None:
        cur.execute("SELECT max(id) AS m FROM audit_event_rows(%s)", (clinic,))
        snapshot = cur.fetchone()["m"] or 0
    where, args = ["id <= %s"], [snapshot]
    if role:
        where.append("actor_role = %s")
        args.append(role)
    if action:
        where.append("action = %s")
        args.append(action)
    if since:
        where.append("at >= %s")
        args.append(_day_start(since))
    if until:
        where.append("at < %s")
        args.append(_day_start(until + timedelta(days=1)))
    cond = " AND ".join(where)
    cur.execute(f"SELECT count(*) AS n FROM audit_event_rows(%s) WHERE {cond}", (clinic, *args))  # noqa: S608
    total = cur.fetchone()["n"]
    cur.execute(
        f"SELECT * FROM audit_event_rows(%s) WHERE {cond} ORDER BY id DESC LIMIT %s OFFSET %s",  # noqa: S608
        (clinic, *args, page_size, (page - 1) * page_size),
    )
    rows = [_row(r) for r in cur.fetchall()]
    cur.execute("SELECT DISTINCT actor_role, action FROM audit_event_rows(%s)", (clinic,))
    facets = cur.fetchall()
    return {
        "events": rows,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": max(1, -(-total // page_size)),
        "snapshot": snapshot,
        "filters": {
            "roles": sorted({f["actor_role"] for f in facets}),
            "actions": sorted({f["action"] for f in facets}),
        },
        "applied": {
            "role": role,
            "action": action,
            "from": since.isoformat() if since else None,
            "to": until.isoformat() if until else None,
        },
    }
