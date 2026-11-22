"""Her care plan after a diagnosis (22 Nov 2026). Once her doctor has diagnosed a condition (in the demo: Salma, PCOS),
she keeps using the record for the plan her doctor set: a daily medicine with a reminder, a monthly symptom check-in,
and the checks the condition needs.

- ReproSense never diagnoses and never chooses a medicine: the condition, the medicine and its dose come from her
  doctor's plan, stored as an event in her record (`care_plan`, details as recorded). The screens say so.
- She ticks "taken" each day; a tick is an event (`medicine_taken`) and can be undone the same day.
- The checks and their sources: the PCOS guideline (2023) asks for regular glucose and blood-pressure checks because
  PCOS raises cardiometabolic risk; her doctor's own review date is shown as her doctor set it.
- Watch-for lines are fixed, sourced text: three months without a period (NHS), and 998 in an emergency.
Information only: nothing here is a rule hit, a score or a diagnosis.
"""

from __future__ import annotations

from datetime import date, timedelta

from app.rag.kb import sources as kb_sources

PLAN_EVENT = "care_plan"
TAKEN_EVENT = "medicine_taken"
WATCH = (("no_period_90", ["nhs_absent_periods"]), ("checks_matter", ["pcos_guideline_2023"]), ("emergency", []))


def _d(x) -> date:
    return x if isinstance(x, date) else date.fromisoformat(str(x)[:10])


def _add_months(d: date, months: int) -> date:
    y, m = divmod(d.month - 1 + months, 12)
    day = min(d.day, 28)
    return date(d.year + y, m + 1, day)


def current_plan(bundle: dict) -> dict | None:
    """The latest care plan her doctor recorded, or None."""
    plans = [e for e in bundle.get("events") or [] if e.get("type") == PLAN_EVENT]
    if not plans:
        return None
    return max(plans, key=lambda e: str(e["date"]))


def taken_days(bundle: dict, medicine: str) -> set[date]:
    return {
        _d(e["date"])
        for e in bundle.get("events") or []
        if e.get("type") == TAKEN_EVENT and (e.get("details") or {}).get("medicine") == medicine
    }


def medicine_ids(bundle: dict) -> set[str]:
    plan = current_plan(bundle)
    return {m["id"] for m in (plan or {}).get("details", {}).get("medicines", [])}


def summary(bundle: dict, ref: date, lang: str = "en") -> dict | None:
    """Her care plan for the Home card and the clinician's panel, or None when she has none."""
    plan = current_plan(bundle)
    if not plan:
        return None
    d = plan.get("details") or {}
    known = kb_sources()

    def links(ids: list[str]) -> list[dict]:
        return [{"source_id": s, "title": known[s].title, "url": known[s].url} for s in ids if s in known]

    meds = []
    for m in d.get("medicines", []):
        days = taken_days(bundle, m["id"])
        week = [ref - timedelta(days=k) for k in range(1, 8)]
        when = m.get("when") or {}
        meds.append(
            {
                "id": m["id"],
                "name": m["name"],
                "dose": m["dose"],
                "when": when.get(lang) or when.get("en") if isinstance(when, dict) else when,
                "reminder": m.get("reminder"),
                "since": m.get("since"),
                "taken_today": ref in days,
                "taken_last_7": sum(1 for x in week if x in days),
            }
        )
    checks = []
    for c in d.get("monitoring", []):
        due = _d(c["due"]) if c.get("due") else _add_months(_d(c["last"]), int(c.get("every_months") or 12))
        status = "overdue" if due < ref else "due_soon" if (due - ref).days <= 30 else "planned"
        checks.append(
            {
                "id": c["id"],
                "due": due.isoformat(),
                "last": c.get("last"),
                "every_months": c.get("every_months"),
                "status": status,
                "source_links": links([c["source_id"]] if c.get("source_id") else []),
            }
        )
    checks.sort(key=lambda c: c["due"])
    ci = d.get("checkin") or {}
    checkin = None
    if ci.get("last"):
        nxt = _d(ci["last"]) + timedelta(days=int(ci.get("every_days") or 30))
        checkin = {"last": ci["last"], "next": nxt.isoformat(), "due": nxt <= ref + timedelta(days=3)}
    return {
        "condition": d.get("condition"),
        "recorded_by": d.get("recorded_by"),
        "since": str(plan["date"])[:10],
        "medicines": meds,
        "checks": checks,
        "checkin": checkin,
        "watch": [{"id": w, "source_links": links(ids)} for w, ids in WATCH],
        "sources": links(["pcos_guideline_2023", "nhs_absent_periods"]),
    }
