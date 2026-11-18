"""Postnatal 6-week pathway (build week K1, 18 Nov 2026).

The steps and their timing come from DoH Abu Dhabi's Postnatal Care Program Standard (DoH/ST/HQS/PCP/V1/2025, May
2025) and its Integrated Postnatal Care Programme (July 2025):
- second check: days 2-3 after discharge, by teleconsultation (a home visit for high-risk mothers);
- third check: days 7-14 after discharge, a visit;
- an assessment at 10-14 days after birth for the maternal blues (Standard 3.1.2.1), done in the app with the EPDS;
- fourth check: 6 weeks after birth, a visit;
- after gestational diabetes, the glucose tolerance test 4-12 weeks after birth (CARE_POSTPARTUM_GLUCOSE_TEST).
(The first check is in hospital before discharge, so the pathway starts after it.)

Two choices are ours, not the Standard's, and are shown as such until a clinician signs them off (CHANGE_LOG):
the discharge date is assumed to be 2 days after the birth unless she records it, and the 6-week visit is shown as due
from week 6 to the end of week 8. These are care steps with dates and sources only: no red flag, no score, no
diagnosis. A step past its window with nothing logged is "not recorded", because the app cannot know what happened.
"""

from __future__ import annotations

from datetime import date, timedelta

from app.rag.kb import sources as kb_sources

STANDARD = "doh_postnatal_standard_2025"
PROGRAMME = "doh_postnatal_programme_2025"
DISCHARGE_ASSUMED_DAYS = 2  # product choice: the Standard's first check is in hospital at days 2-3 after delivery
SHOW_FOR_DAYS = 84  # 12 weeks: the end of the glucose-test window
CHECK_STEPS = ("teleconsult", "visit_2w", "visit_6w")  # steps she records herself ("I had this")


def _d(s) -> date:
    return s if isinstance(s, date) else date.fromisoformat(str(s)[:10])


def pathway(bundle: dict, ref: date) -> dict | None:
    """Her pathway on `ref`, or None when there is no birth in the last 12 weeks."""
    events = bundle.get("events") or []
    births = sorted(_d(e["date"]) for e in events if e.get("type") == "delivery")
    if not births or not 0 <= (ref - births[-1]).days <= SHOW_FOR_DAYS:
        return None
    birth = births[-1]
    after = [e for e in events if _d(e["date"]) >= birth]
    discharges = sorted(_d(e["date"]) for e in after if e.get("type") == "hospital_discharge")
    discharge = discharges[0] if discharges else birth + timedelta(days=DISCHARGE_ASSUMED_DAYS)
    gdm = any(e.get("type") == "gdm_diagnosis" and _d(e["date"]) <= birth for e in events)

    recorded = {}
    for e in after:
        if e.get("type") == "postnatal_check" and (e.get("details") or {}).get("step") in CHECK_STEPS:
            recorded.setdefault(e["details"]["step"], _d(e["date"]))
    mood = sorted(
        _d(e["date"])
        for e in after
        if e.get("type") == "questionnaire"
        and (e.get("details") or {}).get("tool") == "EPDS"
        and (_d(e["date"]) - birth).days >= 10
    )
    if mood:
        recorded["mood"] = mood[0]
    ogtt = sorted(
        _d(lab["date"]) for lab in bundle.get("labs") or [] if lab.get("code") == "OGTT2H" and _d(lab["date"]) > birth
    )
    if ogtt:
        recorded["glucose_test"] = ogtt[0]

    plan = [
        ("teleconsult", discharge + timedelta(days=2), discharge + timedelta(days=3), [STANDARD, PROGRAMME]),
        ("visit_2w", discharge + timedelta(days=7), discharge + timedelta(days=14), [STANDARD, PROGRAMME]),
        ("mood", birth + timedelta(days=10), birth + timedelta(days=14), [STANDARD, "epds_cox_1987"]),
        ("visit_6w", birth + timedelta(weeks=6), birth + timedelta(weeks=8), [STANDARD, PROGRAMME]),
    ]
    if gdm:
        plan.append(
            (
                "glucose_test",
                birth + timedelta(weeks=4),
                birth + timedelta(weeks=12),
                ["ada_standards_pregnancy", "nice_ng3"],
            )
        )

    known = kb_sources()
    steps = []
    for sid, start, end, srcs in plan:
        done = recorded.get(sid)
        status = "done" if done else "upcoming" if ref < start else "due" if ref <= end else "not_recorded"
        steps.append(
            {
                "id": sid,
                "from": start.isoformat(),
                "to": end.isoformat(),
                "status": status,
                "done_on": done.isoformat() if done else None,
                "recordable": sid in CHECK_STEPS,
                "sources": srcs,
                "source_links": [
                    {"source_id": s, "title": known[s].title, "url": known[s].url} for s in srcs if s in known
                ],
            }
        )
    return {
        "birth_date": birth.isoformat(),
        "discharge_date": discharge.isoformat(),
        "discharge_assumed": not discharges,
        "days_since_birth": (ref - birth).days,
        "weeks_since_birth": (ref - birth).days // 7,
        "steps": steps,
        "done": sum(s["status"] == "done" for s in steps),
        "total": len(steps),
    }
