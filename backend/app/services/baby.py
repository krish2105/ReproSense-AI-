"""Baby's first-year schedule (build week D1, 19 Nov 2026): the newborn half of the HealthX theme.

Every step and its timing come from DoH Abu Dhabi's own documents (read on 19 Nov 2026; knowledge_base/sources.yaml):
- Newborn screening in hospital, Standard for Newborn Screening Requirements (DOH/NBSC/SD/V4/2024, January 2025): a
  full newborn examination within the first 24 hours (3.1.1); hearing within 48 hours, preferably after 12 hours
  (3.1.2, appendix 2); the pulse-oximetry heart screen from 24 hours (3.1.3, appendix 3: 24-36 hours); the heel prick
  (blood spot) at 24-48 hours (3.1.4, appendix 4).
- Vaccinations, the Abu Dhabi immunisation schedule updated April 2026 (Circular 2026/77, 14 May 2026, appendix 1):
  BCG and hepatitis B at birth; hexavalent, PCV20 and RV1 at the end of months 2 and 4; hexavalent and bOPV at the end
  of month 6. The RSV antibody at birth for babies born 1 September to 1 March (Circular 2026/37, 3 March 2026).
- Well-child visits at 1, 2, 4, 6 and 9 months (Standard for Well-Child Visits, DOH/WCV/SD/10/2025, December 2025).

The schedule covers the first 12 months, so it stops before the 12-month visit and vaccinations (the Well-Child
Standard counts 12 months as early childhood). Two choices are ours, not the documents', and are shown as such until a
clinician signs them off (CHANGE_LOG, QUESTIONS): an item given "at" an age is shown as due from that age for 4 weeks
(the ADPHC recall circular 2022/257 follows up children 4 weeks or more behind the schedule), and the hospital
screenings are shown in whole days. Dates and sources only: no advice, no score, no red flag, no diagnosis. An item
past its window with nothing logged is "not recorded": the app cannot know what happened.

She records an item as done ("I had this"); it is stored as an event (`baby_check`, details `{item}`), so the schedule
needs no new table. The baby has no name in the record, only "your baby".
"""

from __future__ import annotations

import calendar
from dataclasses import dataclass
from datetime import date, timedelta

from app.rag.kb import sources as kb_sources

SCREENING = "doh_newborn_screening_2025"
WELL_CHILD = "doh_well_child_visits_2025"
VACCINES = "doh_immunization_schedule_2026"
RSV = "doh_rsv_antibody_2026"
RECALL = "doh_immunization_recall_2022"
SOURCE_IDS = (SCREENING, WELL_CHILD, VACCINES, RSV, RECALL)
EVENT = "baby_check"
DUE_DAYS = 28  # product choice: an item given at an age is "due" for 4 weeks from it (ADPHC recalls at 4 weeks behind)
SHOW_FOR_MONTHS = 12


@dataclass(frozen=True)
class Item:
    id: str
    kind: str  # screening | vaccination | check
    months: int  # the published age in months (0: at birth)
    start: int  # days after that age when the window opens
    end: int  # days after that age when it closes
    sources: tuple[str, ...]
    vaccines: tuple[str, ...] = ()


_V = (VACCINES, RECALL)
ITEMS: tuple[Item, ...] = (
    Item("newborn_exam", "screening", 0, 0, 1, (SCREENING,)),
    Item("hearing_screen", "screening", 0, 0, 2, (SCREENING,)),
    Item("heart_screen", "screening", 0, 1, 2, (SCREENING,)),
    Item("heel_prick", "screening", 0, 1, 2, (SCREENING,)),
    Item("vaccines_birth", "vaccination", 0, 0, DUE_DAYS, _V, ("BCG", "HepB")),
    Item("rsv_antibody", "vaccination", 0, 0, DUE_DAYS, (RSV, *_V), ("RSV mAb",)),
    Item("check_1m", "check", 1, 0, DUE_DAYS, (WELL_CHILD,)),
    Item("check_2m", "check", 2, 0, DUE_DAYS, (WELL_CHILD,)),
    Item("vaccines_2m", "vaccination", 2, 0, DUE_DAYS, _V, ("Hexavalent", "PCV20", "RV1")),
    Item("check_4m", "check", 4, 0, DUE_DAYS, (WELL_CHILD,)),
    Item("vaccines_4m", "vaccination", 4, 0, DUE_DAYS, _V, ("Hexavalent", "PCV20", "RV1")),
    Item("check_6m", "check", 6, 0, DUE_DAYS, (WELL_CHILD,)),
    Item("vaccines_6m", "vaccination", 6, 0, DUE_DAYS, _V, ("Hexavalent", "bOPV")),
    Item("check_9m", "check", 9, 0, DUE_DAYS, (WELL_CHILD,)),
)
IDS = tuple(i.id for i in ITEMS)

# What she reads. Plain words first, then the name her baby's clinic uses. Arabic: draft, AR-REVIEW (docs/AR_REVIEW.md).
LABELS: dict[str, tuple[str, str]] = {
    "newborn_exam": (
        "Newborn examination by a paediatrician, in the first 24 hours",
        "فحص المولود الشامل لدى طبيب الأطفال، خلال أول 24 ساعة",
    ),
    "hearing_screen": (
        "Hearing screening, in the first 48 hours",
        "فحص السمع، خلال أول 48 ساعة",
    ),
    "heart_screen": (
        "Heart screening with a pulse oximeter, 24–36 hours after birth",
        "فحص القلب بجهاز قياس الأكسجين، بعد 24 إلى 36 ساعة من الولادة",
    ),
    "heel_prick": (
        "Heel prick blood spot test, 24–48 hours after birth",
        "فحص وخز الكعب (بقعة الدم)، بعد 24 إلى 48 ساعة من الولادة",
    ),
    "vaccines_birth": ("Vaccinations at birth", "تطعيمات الولادة"),
    "rsv_antibody": (
        "RSV antibody at birth, for babies born 1 September to 1 March",
        "الجسم المضاد للفيروس التنفسي المخلوي عند الولادة، للمولودين من 1 سبتمبر إلى 1 مارس",
    ),
    "check_1m": ("Well-baby visit at 1 month", "زيارة الطفل السليم بعمر شهر"),
    "check_2m": ("Well-baby visit at 2 months", "زيارة الطفل السليم بعمر شهرين"),
    "vaccines_2m": ("Vaccinations at 2 months", "تطعيمات عمر شهرين"),
    "check_4m": ("Well-baby visit at 4 months", "زيارة الطفل السليم بعمر 4 أشهر"),
    "vaccines_4m": ("Vaccinations at 4 months", "تطعيمات عمر 4 أشهر"),
    "check_6m": ("Well-baby visit at 6 months", "زيارة الطفل السليم بعمر 6 أشهر"),
    "vaccines_6m": ("Vaccinations at 6 months", "تطعيمات عمر 6 أشهر"),
    "check_9m": ("Well-baby visit at 9 months", "زيارة الطفل السليم بعمر 9 أشهر"),
}
VACCINE_NAMES: dict[str, tuple[str, str]] = {
    "BCG": ("BCG, against tuberculosis", "لقاح السل (BCG)"),
    "HepB": ("Hepatitis B (HepB)", "التهاب الكبد ب (HepB)"),
    "RSV mAb": ("Long-acting RSV antibody", "جسم مضاد طويل المفعول للفيروس التنفسي المخلوي (RSV)"),
    "Hexavalent": (
        "6-in-1 (hexavalent): diphtheria, tetanus, whooping cough, Hib, hepatitis B, polio",
        "اللقاح السداسي: الدفتيريا والكزاز والسعال الديكي والمستدمية النزلية ب والتهاب الكبد ب وشلل الأطفال",
    ),
    "PCV20": ("Pneumococcal (PCV20)", "المكورات الرئوية (PCV20)"),
    "RV1": ("Rotavirus drops (RV1)", "قطرات فيروس الروتا (RV1)"),
    "bOPV": ("Polio drops (bOPV)", "قطرات شلل الأطفال (bOPV)"),
}


def _d(s) -> date:
    return s if isinstance(s, date) else date.fromisoformat(str(s)[:10])


def add_months(d: date, months: int) -> date:
    """The same day `months` later, kept inside the month (31 Dec + 2 months = 28 Feb)."""
    y, m = divmod(d.month - 1 + months, 12)
    y, m = d.year + y, m + 1
    return date(y, m, min(d.day, calendar.monthrange(y, m)[1]))


def in_rsv_season(birth: date) -> bool:
    """Born 1 September to 1 March (Circular 2026/37), the babies offered the RSV antibody at birth."""
    return birth.month >= 9 or birth.month <= 2 or (birth.month, birth.day) == (3, 1)


def latest_birth(bundle: dict) -> date | None:
    births = sorted(_d(e["date"]) for e in bundle.get("events") or [] if e.get("type") == "delivery")
    return births[-1] if births else None


def items_for(birth: date) -> tuple[Item, ...]:
    return tuple(i for i in ITEMS if i.id != "rsv_antibody" or in_rsv_season(birth))


def schedule(bundle: dict, ref: date, lang: str = "en") -> dict | None:
    """Her baby's first-year schedule on `ref`, or None when there is no birth in the last 12 months."""
    birth = latest_birth(bundle)
    if birth is None or not birth <= ref < add_months(birth, SHOW_FOR_MONTHS):
        return None
    ar = lang == "ar"
    recorded: dict[str, date] = {}
    for e in sorted(bundle.get("events") or [], key=lambda x: str(x["date"])):
        item = (e.get("details") or {}).get("item")
        if e.get("type") == EVENT and item in IDS and _d(e["date"]) >= birth:
            recorded.setdefault(item, _d(e["date"]))

    known = kb_sources()
    out = []
    for it in items_for(birth):
        age = add_months(birth, it.months)
        start, end = age + timedelta(days=it.start), age + timedelta(days=it.end)
        done = recorded.get(it.id)
        status = "done" if done else "upcoming" if ref < start else "due" if ref <= end else "not_recorded"
        out.append(
            {
                "id": it.id,
                "kind": it.kind,
                "age_months": it.months,
                "label": LABELS[it.id][ar],
                "vaccine_codes": list(it.vaccines),
                "vaccines": [VACCINE_NAMES[v][ar] for v in it.vaccines],
                "due_from": start.isoformat(),
                "due_to": end.isoformat(),
                "status": status,
                "done_on": done.isoformat() if done else None,
                "sources": list(it.sources),
                "source_links": [
                    {"source_id": s, "title": known[s].title, "url": known[s].url} for s in it.sources if s in known
                ],
            }
        )
    due = [i["id"] for i in out if i["status"] == "due"]
    if not due:  # nothing due today: the nearest items still to come
        upcoming = [i for i in out if i["status"] == "upcoming"]
        first = min((i["due_from"] for i in upcoming), default=None)
        due = [i["id"] for i in upcoming if i["due_from"] == first]
    age_days = (ref - birth).days
    return {
        "birth_date": birth.isoformat(),
        "age_days": age_days,
        "age_weeks": age_days // 7,
        "age_months": next(m for m in range(SHOW_FOR_MONTHS, -1, -1) if add_months(birth, m) <= ref),
        "items": out,
        "next": due,
        "done": sum(i["status"] == "done" for i in out),
        "total": len(out),
    }
