"""Feeding log after a birth (build week D2, 20 Nov 2026).

She taps a feed: breast, expressed milk or formula, with the time, and can mark a worry (latch, pain, fewer wet
nappies). Home shows her last 7 days. A worry logged in those 7 days gets a fixed line to talk to her midwife, nurse
or doctor, with its source (knowledge_base/sources.yaml, both NHS pages read on 20 Nov 2026):
- "Common breastfeeding problems": latch and nipple pain are common and help is there; ask early.
- "Breastfeeding: is my baby getting enough milk?": from day 5, at least 6 heavy wet nappies every 24 hours.

Information only: no amounts, no targets, no score, no verdict on whether the baby is getting enough, and no red flag
for the baby (a new urgent rule would need the clinical lead, CHANGE_LOG). Open for 12 months after the birth, like the
baby's first-year schedule. Arabic: draft, AR-REVIEW (docs/AR_REVIEW.md).
"""

from __future__ import annotations

from datetime import date, timedelta

from app.rag.kb import sources as kb_sources
from app.services.baby import SHOW_FOR_MONTHS, add_months, latest_birth

PROBLEMS = "nhs_breastfeeding_problems"
ENOUGH_MILK = "nhs_breastfeeding_enough_milk"
SOURCE_IDS = (PROBLEMS, ENOUGH_MILK)
KINDS = ("breast", "expressed", "formula")
WORRIES = ("latch", "pain", "few_wet_nappies")
DAYS = 7

SUPPORT: dict[str, tuple[str, str, tuple[str, ...]]] = {
    "latch": (
        "Latching can take practice for you and your baby. A midwife, nurse or breastfeeding specialist can watch a"
        " feed and help with positioning, and it helps to ask early.",
        "قد يحتاج التقام الثدي إلى بعض التمرّن منكِ ومن طفلكِ. تستطيع القابلة أو الممرضة أو أخصائية الرضاعة"
        " الطبيعية مشاهدة رضعة ومساعدتكِ في وضعية الرضاعة، ومن الأفضل أن تطلبي المساعدة مبكراً.",
        (PROBLEMS,),
    ),
    "pain": (
        "Pain during feeds is common in the first weeks but it should not be ignored. A midwife, nurse or"
        " breastfeeding specialist can check how your baby latches. If a breast stays red, hot and painful, talk to"
        " your doctor.",
        "الألم أثناء الرضاعة شائع في الأسابيع الأولى، لكن لا ينبغي تجاهله. تستطيع القابلة أو الممرضة أو أخصائية"
        " الرضاعة الطبيعية التحقق من طريقة التقام طفلكِ للثدي. وإذا بقي الثدي أحمر وساخناً ومؤلماً، تحدّثي مع طبيبتكِ"
        " أو طبيبكِ.",
        (PROBLEMS,),
    ),
    "few_wet_nappies": (
        "From day 5, babies usually have at least 6 heavy wet nappies every 24 hours. If you are seeing fewer, talk to"
        " your midwife, nurse or your baby's doctor.",
        "بدءاً من اليوم الخامس، يبلّل الطفل عادةً 6 حفاضات ثقيلة على الأقل كل 24 ساعة. إذا لاحظتِ عدداً أقل، تحدّثي"
        " مع القابلة أو الممرضة أو طبيب طفلكِ.",
        (ENOUGH_MILK,),
    ),
}
NOTE = (
    "This log is for you and your care team. It does not tell whether your baby is getting enough milk; your baby's"
    " weight checks and your midwife, nurse or doctor do.",
    "هذا السجل لكِ ولفريق رعايتكِ. وهو لا يحدد ما إذا كان طفلكِ يحصل على ما يكفيه من الحليب؛ فهذا ما يبيّنه قياس وزن"
    " طفلكِ والقابلة أو الممرضة أو الطبيب.",
)


def _d(s) -> date:
    return s if isinstance(s, date) else date.fromisoformat(str(s)[:10])


def eligible(bundle: dict, ref: date) -> bool:
    """A birth in the last 12 months (the same window as the baby's first-year schedule)."""
    birth = latest_birth(bundle)
    return birth is not None and birth <= ref < add_months(birth, SHOW_FOR_MONTHS)


def summary(bundle: dict, ref: date, lang: str = "en") -> dict | None:
    """Her last 7 days of feeds, counted by kind (oldest day first), and a sourced line for each worry she marked in
    them. None when there is no birth in the last 12 months."""
    if not eligible(bundle, ref):
        return None
    ar = lang == "ar"
    start = ref - timedelta(days=DAYS - 1)
    week = sorted(
        (f for f in bundle.get("feeds") or [] if start <= _d(f["date"]) <= ref),
        key=lambda f: (str(f["date"]), str(f.get("time") or "")),
    )
    days = []
    for i in range(DAYS):
        day = start + timedelta(days=i)
        counts = {k: sum(1 for f in week if _d(f["date"]) == day and f["kind"] == k) for k in KINDS}
        days.append({"date": day.isoformat(), **counts, "total": sum(counts.values())})
    known = kb_sources()
    worries = []
    for w in WORRIES:
        hits = [f for f in week if w in (f.get("worries") or [])]
        if hits:
            text, srcs = SUPPORT[w][ar], SUPPORT[w][2]
            worries.append(
                {
                    "id": w,
                    "times": len(hits),
                    "last_on": str(hits[-1]["date"])[:10],
                    "text": text,
                    "sources": list(srcs),
                    "source_links": [
                        {"source_id": s, "title": known[s].title, "url": known[s].url} for s in srcs if s in known
                    ],
                }
            )
    return {
        "days": days,
        "today": days[-1]["total"],
        "last": week[-1] if week else None,
        "worries": worries,
        "note": NOTE[ar],
    }
