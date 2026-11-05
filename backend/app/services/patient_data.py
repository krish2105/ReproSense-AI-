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
    """Update cycles incrementally when a flow day is logged (seeded cycles are kept exactly as generated).
    A flow day more than 3 days after the end of the last period starts a new cycle."""
    cur.execute(
        "SELECT id, start_date, bleed_days FROM cycles WHERE profile_id=%s ORDER BY start_date DESC LIMIT 1",
        (profile_id,),
    )
    last = cur.fetchone()
    if last:
        end = last["start_date"].toordinal() + last["bleed_days"] - 1
        gap = day.toordinal() - end
        if day < last["start_date"]:
            return
        if gap <= 3:
            new_bleed = max(last["bleed_days"], day.toordinal() - last["start_date"].toordinal() + 1)
            cur.execute("UPDATE cycles SET bleed_days=%s WHERE id=%s", (new_bleed, last["id"]))
            return
        cur.execute(
            "UPDATE cycles SET length_days=%s WHERE id=%s",
            (day.toordinal() - last["start_date"].toordinal(), last["id"]),
        )
    cur.execute(
        "INSERT INTO cycles (profile_id, start_date, bleed_days, length_days) VALUES (%s,%s,1,NULL)", (profile_id, day)
    )
