"""Blood pressure in pregnancy and after birth (build week K6, 18 Nov 2026).

She can log a reading (systolic/diastolic mmHg, a date and, if she wants, a time) while pregnant and for 12 weeks after
a birth. The urgent warning (RF7) and the "recheck today" card read these readings through the rules engine; the
thresholds live only in rules/clinical_rules.yaml (NICE NG133). This module holds who may log, the plausible range a
reading must fall in, and how readings are shown.

Two product choices, listed in docs/safety/CHANGE_LOG.md for the clinician: the log stays open for 12 weeks after birth
(the end of K1's postnatal view, so readings from a 6-8 week review can be recorded) while RF7 applies to the first 6;
and the plausible range (systolic 70-250, diastolic 40-150, systolic above diastolic) refuses typing slips, not real
readings, so a very high reading is always accepted and warned about.
"""

from __future__ import annotations

from datetime import date

SYSTOLIC = (70, 250)
DIASTOLIC = (40, 150)
LOG_WEEKS_AFTER_BIRTH = 12
RECENT = 5  # readings shown on home and the log screen


def _d(s) -> date:
    return s if isinstance(s, date) else date.fromisoformat(str(s)[:10])


def eligible(bundle: dict, ref: date) -> bool:
    """Pregnant, or a birth in the last 12 weeks."""
    if (bundle.get("profile") or {}).get("pregnant"):
        return True
    births = sorted(_d(e["date"]) for e in bundle.get("events") or [] if e.get("type") == "delivery")
    return bool(births) and 0 <= (ref - births[-1]).days < LOG_WEEKS_AFTER_BIRTH * 7


def ordered(bundle: dict) -> list[dict]:
    """Her readings, oldest first (a reading with a time sorts after one without on the same day)."""
    return sorted(bundle.get("bp_readings") or [], key=lambda r: (str(r["date"]), str(r.get("time") or "")))


def summary(bundle: dict, ref: date) -> dict:
    """What home shows: whether she can log, her latest reading and her last few."""
    rs = ordered(bundle)
    return {"eligible": eligible(bundle, ref), "latest": rs[-1] if rs else None, "recent": rs[-RECENT:][::-1]}
