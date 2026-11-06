"""Load one woman's record from the database into the plain-dict bundle the rules engine and agents use."""

from __future__ import annotations

from app.security.crypto import decrypt


def _iso(v):
    return v.isoformat() if hasattr(v, "isoformat") else v


def load_bundle(cur, profile_id: str, include_notes: bool = True) -> dict | None:
    cur.execute("SELECT * FROM profiles WHERE id = %s", (profile_id,))
    prof = cur.fetchone()
    if not prof:
        return None
    cur.execute(
        "SELECT start_date, bleed_days, length_days FROM cycles WHERE profile_id=%s ORDER BY start_date", (profile_id,)
    )
    cycles = [
        {"start": _iso(r["start_date"]), "bleed_days": r["bleed_days"], "length_days": r["length_days"]}
        for r in cur.fetchall()
    ]
    cur.execute("SELECT * FROM daily_logs WHERE profile_id=%s ORDER BY date, id", (profile_id,))
    logs = []
    for r in cur.fetchall():
        logs.append(
            {
                "id": r["id"],
                "date": _iso(r["date"]),
                "flow": r["flow"],
                "pain": r["pain"],
                "pain_sites": list(r["pain_sites"] or []),
                "symptoms": list(r["symptoms"] or []),
                "impact": r["impact"],
                "mood": r["mood"],
                "sleep_h": float(r["sleep_h"]) if r["sleep_h"] is not None else None,
                "pbac": r["pbac"],
                "pbac_items": r["pbac_items"],
                "note": decrypt(r["note_enc"]) if include_notes and r["note_enc"] else "",
                "source": r["source"],
            }
        )
    cur.execute("SELECT id, type, date, details FROM events WHERE profile_id=%s ORDER BY date, id", (profile_id,))
    events = [
        {"id": r["id"], "type": r["type"], "date": _iso(r["date"]), "details": r["details"] or {}}
        for r in cur.fetchall()
    ]
    cur.execute("SELECT * FROM lab_results WHERE profile_id=%s AND confirmed ORDER BY date, id", (profile_id,))
    labs = []
    for r in cur.fetchall():
        labs.append(
            {
                "id": f"lab-{r['id']}",
                "code": r["code"],
                "test": r["test"],
                "value": float(r["value_num"]) if r["value_num"] is not None else r["value"],
                "unit": r["unit"],
                "ref_low": float(r["ref_low"]) if r["ref_low"] is not None else None,
                "ref_high": float(r["ref_high"]) if r["ref_high"] is not None else None,
                "flag": r["flag"],
                "date": _iso(r["date"]),
                "source_doc_id": r["source_doc_id"],
            }
        )
    profile = {k: _iso(v) for k, v in prof.items()}
    return {
        "profile": profile,
        "cycles": cycles,
        "daily_logs": logs,
        "events": events,
        "labs": labs,
        "ai_ok": ai_allowed(cur, profile_id),
    }


def ai_allowed(cur, profile_id: str) -> bool:
    """Her "AI features" choice in Privacy (consent purpose `assistant`; DoH Responsible AI Standard 3.1.6.1: patients
    may opt out of AI). Off, or never given: the assistant is closed and cards keep the fixed template wording, so no
    text of hers reaches a language model. Rules, patterns and reports work the same either way."""
    cur.execute(
        "SELECT granted AND revoked_at IS NULL AS ok FROM consents WHERE profile_id=%s AND purpose='assistant'"
        " ORDER BY id DESC LIMIT 1",
        (profile_id,),
    )
    row = cur.fetchone()
    return bool(row and row["ok"])


def apply_period_log(cur, profile_id: str, day) -> None:
    """Update cycles when a flow day is logged, in any order (she may enter earlier periods after joining, or the days
    of one period backwards). A flow day within 3 days of the end of the period it follows extends that period; a flow
    day up to 3 days before the next period's start means that period started earlier, so it is moved back. Any other
    flow day starts a new cycle, and the cycle before it ends there. Cycles that are not touched keep their lengths."""
    cur.execute(
        "SELECT id, start_date, bleed_days FROM cycles WHERE profile_id=%s AND start_date <= %s"
        " ORDER BY start_date DESC LIMIT 1",
        (profile_id, day),
    )
    before = cur.fetchone()
    if before:
        end = before["start_date"].toordinal() + before["bleed_days"] - 1
        if day.toordinal() - end <= 3:  # the same period: extend it
            new_bleed = max(before["bleed_days"], day.toordinal() - before["start_date"].toordinal() + 1)
            cur.execute("UPDATE cycles SET bleed_days=%s WHERE id=%s", (new_bleed, before["id"]))
            return
    cur.execute(
        "SELECT id, start_date FROM cycles WHERE profile_id=%s AND start_date > %s ORDER BY start_date LIMIT 1",
        (profile_id, day),
    )
    after = cur.fetchone()
    if before:  # the cycle before ends where this period starts
        cur.execute(
            "UPDATE cycles SET length_days=%s WHERE id=%s",
            (day.toordinal() - before["start_date"].toordinal(), before["id"]),
        )
    if after and after["start_date"].toordinal() - day.toordinal() <= 3:  # the next period started earlier
        shift = after["start_date"].toordinal() - day.toordinal()
        cur.execute(
            "UPDATE cycles SET start_date=%s, bleed_days=bleed_days+%s,"
            " length_days=CASE WHEN length_days IS NULL THEN NULL ELSE length_days+%s END WHERE id=%s",
            (day, shift, shift, after["id"]),
        )
        return
    length = after["start_date"].toordinal() - day.toordinal() if after else None
    cur.execute(
        "INSERT INTO cycles (profile_id, start_date, bleed_days, length_days) VALUES (%s,%s,1,%s)",
        (profile_id, day, length),
    )
