"""What the rules checked and did not show (showcase day, 22 Nov 2026).

A pattern card says why it appeared. This list says why one did not: her own numbers next to the threshold the rule
uses, for the period rules (cycle length, skin and hair changes, period pain, bleeding). It answers "why didn't my acne
become a PCOS card?": the rule needs irregular cycles as well, as the 2023 international PCOS guideline describes.

No new clinical logic: every threshold here is the one already in rules/clinical_rules.yaml (the test checks they
match). No reassurance and no verdict: the screen says that not being shown is not a sign that nothing is wrong.
Not shown in pregnancy, while breastfeeding, in the year after a birth or on the crisis path, where period rules do
not apply. Arabic: draft, AR-REVIEW (docs/AR_REVIEW.md).
"""

from __future__ import annotations

from app.agents.copy import DAYS_AR, _ar_n
from app.rag.kb import sources as kb_sources
from app.rules.engine import Evaluation, load_rules

# id -> the rule whose threshold the line quotes (and whose sources it cites)
CHECKS = {
    "cycles": "OBS_IRREGULAR_CYCLES",
    "skin_hair": "OBS_IRREGULAR_PLUS_ANDROGEN",
    "pain": "OBS_SEVERE_CYCLICAL_PAIN",
    "bleeding": "OBS_HEAVY_OR_LONG_PERIODS",
}
MIN_CYCLES = 4  # cycles_logged >= 4
IRREGULAR_FROM = 2  # irregular_cycle_count_6 >= 2
ANDROGEN_DAYS_FROM = 10  # androgen_symptom_days_90 >= 10
SEVERE_CYCLES_FROM = 3  # severe_pain_cycles_6 >= 3
IMPACT_DAYS_FROM = 2  # pain_impact_days_90 >= 2
LONG_PERIOD_OVER = 7  # period_duration_max > 7
PBAC_FROM = 100  # pbac_max_6 >= 100

LABELS = {
    "cycles": ("Cycle length", "طول الدورة"),
    "skin_hair": ("Skin and hair changes", "تغيّرات البشرة والشعر"),
    "pain": ("Period pain", "ألم الدورة"),
    "bleeding": ("Bleeding", "النزيف"),
}


def _lines(f: dict, fired: set[str], ar: bool) -> dict[str, str]:
    """One sentence per check that did not become a card: her numbers, then the threshold."""
    out: dict[str, str] = {}
    n_cycles = int(f.get("cycles_logged") or 0)
    lens = f.get("cycle_lengths_last6") or []
    adult = (f.get("years_since_menarche") or 0) >= 3 and (f.get("age") or 0) < 45

    if "OBS_IRREGULAR_CYCLES" not in fired and adult:
        if n_cycles < MIN_CYCLES:
            out["cycles"] = (
                f"عدد الدورات المكتملة المسجّلة حتى الآن: {n_cycles}. يُفحص طول الدورة ابتداءً من {MIN_CYCLES} دورات،"
                " لذا لا يمكن عرض نمط لطول الدورة بعد."
                if ar
                else f"Complete cycles logged so far: {n_cycles}. Cycle length is checked from {MIN_CYCLES} cycles,"
                " so no cycle pattern can be shown yet."
            )
        elif lens:
            n, k, rng = int(f.get("irregular_cycle_count_6") or 0), len(lens), f"{min(lens)}–{max(lens)}"
            out["cycles"] = (
                f"{n} من آخر {k} دورات كانت أقصر من 21 يوماً أو أطول من 35 يوماً (تراوحت بين {rng} يوماً)."
                " يُعرض النمط ابتداءً من دورتين من هذا النوع، أو عند أقل من 8 دورات في السنة."
                if ar
                else f"{n} of your last {k} cycles were shorter than 21 or longer than 35 days (they ranged from {rng}"
                f" days). A pattern is shown from {IRREGULAR_FROM} such cycles, or with fewer than 8 cycles a year."
            )

    days = int(f.get("androgen_symptom_days_90") or 0)
    if "OBS_IRREGULAR_PLUS_ANDROGEN" not in fired and days > 0:
        if "OBS_IRREGULAR_CYCLES" in fired:  # irregular cycles are shown; the skin and hair days are below the line
            out["skin_hair"] = (
                f"سجّلتِ حب الشباب أو تغيّرات الشعر في {days} من آخر 90 يوماً. تُعرض مع الدورات غير المنتظمة ابتداءً من"
                f" {ANDROGEN_DAYS_FROM} أيام."
                if ar
                else f"You logged acne or hair changes on {days} of the last 90 days. They are shown together with"
                f" irregular cycles from {ANDROGEN_DAYS_FROM} days."
            )
        else:
            out["skin_hair"] = (
                f"سجّلتِ حب الشباب أو تغيّرات الشعر في {days} من آخر 90 يوماً. لا تُعرض هذه التغيّرات كنمط بمفردها:"
                " الإرشاد الدولي لمتلازمة تكيس المبايض لعام 2023 ينظر إليها مع الدورات غير المنتظمة، ولا يستطيع"
                " تقييمها إلا الطبيب."
                if ar
                else f"You logged acne or hair changes on {days} of the last 90 days. On their own they are not shown"
                " as a pattern: the 2023 international PCOS guideline looks at them together with irregular cycles,"
                " and only a doctor can assess them."
            )

    # The pain rule reads her last 6 periods, the one in progress included, so the line counts the same ones.
    k = len(f.get("pbac_by_cycle_6") or [])
    if "OBS_SEVERE_CYCLICAL_PAIN" not in fired and k:
        n, d = int(f.get("severe_pain_cycles_6") or 0), int(f.get("pain_impact_days_90") or 0)
        span_ar = (
            "الدورة الوحيدة المسجّلة حتى الآن" if k == 1 else "آخر دورتين" if k == 2 else f"آخر {k} دورات"
        )
        span_en = "the 1 period logged so far" if k == 1 else f"your last {k} periods"
        out["pain"] = (
            f"وصل ألم الدورة إلى 7 من 10 أو أكثر في {n} من {span_ar}، وسجّلتِ الغياب عن العمل أو الدراسة أو البقاء في"
            f" السرير في {d} من آخر 90 يوماً. يُعرض النمط ابتداءً من {SEVERE_CYCLES_FROM} دورات من هذا النوع مع يومين"
            " من هذه الأيام."
            if ar
            else f"Period pain reached 7 out of 10 or more in {n} of {span_en}, and you logged missed work or"
            f" study or a day in bed on {d} of the last 90 days. A pattern is shown from {SEVERE_CYCLES_FROM} such"
            f" periods together with {IMPACT_DAYS_FROM} such days."
        )

    longest = int(f.get("period_duration_max") or 0)
    if "OBS_HEAVY_OR_LONG_PERIODS" not in fired and longest > 0:
        pbac = int(f.get("pbac_max_6") or 0)
        if ar:
            score = f"، وأعلى مجموع لفقدان الدم (PBAC) كان {pbac}" if pbac else ""
            out["bleeding"] = (
                f"أطول دورة حديثة استمرت {_ar_n(longest, *DAYS_AR)}{score}. يُعرض النمط إذا زادت المدة على"
                f" {LONG_PERIOD_OVER} أيام، أو بلغ المجموع {PBAC_FROM}، أو سُجّل يومان أو أكثر من النزيف الغزير جداً أو"
                " الجلطات الكبيرة في دورة واحدة."
            )
        else:
            score = f", and your highest bleeding score (PBAC) was {pbac}" if pbac else ""
            out["bleeding"] = (
                f"Your longest recent period lasted {longest} days{score}. A pattern is shown above {LONG_PERIOD_OVER}"
                f" days, from a score of {PBAC_FROM}, or with 2 or more days of flooding or large clots in one period."
            )
    return out


def checked(ev: Evaluation, lang: str = "en", crisis: bool = False) -> list[dict]:
    """The period checks that did not become a card, each with her numbers, the rule's threshold and its sources."""
    f = ev.features.values
    weeks = f.get("weeks_since_delivery")
    if crisis or f.get("pregnant") or f.get("breastfeeding") or (weeks is not None and weeks < 52):
        return []
    ar = lang == "ar"
    rules, known = load_rules(), kb_sources()
    out = []
    for cid, text in _lines(f, {h.rule_id for h in ev.all_hits}, ar).items():
        rule = rules.by_id(CHECKS[cid])
        srcs = [s for s in (rule.source_ids if rule else []) if s in known]
        out.append(
            {
                "id": cid,
                "rule_id": CHECKS[cid],
                "label": LABELS[cid][ar],
                "text": text,
                "sources": srcs,
                "source_links": [{"source_id": s, "title": known[s].title, "url": known[s].url} for s in srcs],
            }
        )
    return out
