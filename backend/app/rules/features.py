"""Feature engineering for the rules engine (docs/03 table). Pure Python, deterministic.

Every feature is returned together with the entry ids that support it, so each observation can say
exactly which logged days or events it came from ("Why we noticed").
"""

from __future__ import annotations

import statistics
from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import Any

ANDROGEN = ("acne", "excess hair growth", "scalp hair thinning")
# Both thresholds reuse the 35-day upper bound of a usual adult cycle already in rules/clinical_rules.yaml (2023
# International PCOS Guideline); neither is a new clinical number. Proposed in the #48/#53 PR for Krishna and the
# clinical advisor to approve.
USUAL_CYCLE_MAX_DAYS = 35
# QUESTIONS #53: a period not started for more than this many days counts as late, so pregnancy can't be ruled out.
LATE_PERIOD_DAYS = USUAL_CYCLE_MAX_DAYS
# QUESTIONS #48: "fewer than 8 cycles a year" is only meaningful once the record is long enough for 8 regular cycles
# (7 gaps of up to 35 days = 245 days). Before that, a short record would look like too few cycles.
CYCLES_PER_YEAR_MIN_SPAN_DAYS = 7 * USUAL_CYCLE_MAX_DAYS
VASOMOTOR = ("hot flushes", "night sweats")
IMPACT_DAYS = ("missed work or study", "stayed in bed")


def _d(x: Any) -> date:
    return x if isinstance(x, date) else date.fromisoformat(str(x))


@dataclass
class FeatureSet:
    values: dict[str, Any] = field(default_factory=dict)
    evidence: dict[str, list[str]] = field(default_factory=dict)

    def put(self, name: str, value: Any, ids: list[str] | None = None) -> None:
        self.values[name] = value
        self.evidence[name] = list(dict.fromkeys(ids or []))


def compute(bundle: dict, ref: date) -> FeatureSet:
    p = bundle["profile"]
    cycles = sorted(bundle.get("cycles", []), key=lambda c: str(c["start"]))
    logs = sorted(bundle.get("daily_logs", []), key=lambda x: str(x["date"]))
    events = sorted(bundle.get("events", []), key=lambda x: str(x["date"]))
    labs = bundle.get("labs", [])
    fs = FeatureSet()

    by_date: dict[date, list[dict]] = {}
    for lg in logs:
        by_date.setdefault(_d(lg["date"]), []).append(lg)
    period_logs = [lg for lg in logs if lg.get("flow", "none") != "none"]

    def start_id(c: dict) -> list[str]:
        return [lg["id"] for lg in by_date.get(_d(c["start"]), []) if lg.get("flow", "none") != "none"][:1]

    def period_days(c: dict) -> list[dict]:
        s = _d(c["start"])
        return [lg for lg in period_logs if 0 <= (_d(lg["date"]) - s).days < int(c["bleed_days"])]

    complete = [c for c in cycles if c.get("length_days")]
    lengths = [int(c["length_days"]) for c in complete]
    last6c = complete[-6:]
    last6 = [int(c["length_days"]) for c in last6c]
    irregular6 = [c for c in last6c if int(c["length_days"]) < 21 or int(c["length_days"]) > 35]
    starts = [_d(c["start"]) for c in cycles]
    year_starts = [c for c in cycles if _d(c["start"]) >= ref - timedelta(days=365)]

    fs.put("age", p.get("age"))
    fs.put("years_since_menarche", (p.get("age") or 0) - (p.get("menarche_age") or 0))
    fs.put("cycles_logged", len(lengths), [i for c in complete for i in start_id(c)])
    fs.put("cycle_lengths_last6", last6, [i for c in last6c for i in start_id(c)])
    fs.put("irregular_cycle_count_6", len(irregular6), [i for c in irregular6 for i in start_id(c)])
    # None (a comparison with it is False) until the first logged period is old enough to hold 8 regular cycles.
    long_enough = bool(starts) and (ref - starts[0]).days >= CYCLES_PER_YEAR_MIN_SPAN_DAYS
    fs.put(
        "cycles_per_year",
        len(year_starts) if long_enough else None,
        [i for c in year_starts for i in start_id(c)] if long_enough else [],
    )
    fs.put("cycle_length_sd", round(statistics.pstdev(last6), 1) if len(last6) > 1 else None)
    fs.put("cycle_length_mean_6", round(statistics.mean(last6), 1) if last6 else None)
    fs.put(
        "days_since_last_period", (ref - starts[-1]).days if starts else None, start_id(cycles[-1]) if cycles else []
    )

    d90 = ref - timedelta(days=90)
    recent = [lg for lg in logs if _d(lg["date"]) >= d90]
    andro = [lg for lg in recent if any(s in ANDROGEN for s in lg.get("symptoms", []))]
    fs.put("androgen_symptom_days_90", len(andro), [lg["id"] for lg in andro])
    impact = [lg for lg in recent if lg.get("impact") in IMPACT_DAYS]
    fs.put("pain_impact_days_90", len(impact), [lg["id"] for lg in impact])
    fatigue = [lg for lg in recent if "fatigue" in lg.get("symptoms", [])]
    fs.put("fatigue_days_90", len(fatigue), [lg["id"] for lg in fatigue])
    vaso = [lg for lg in recent if any(s in VASOMOTOR for s in lg.get("symptoms", []))]
    fs.put("vasomotor_days_90", len(vaso), [lg["id"] for lg in vaso])

    severe_ids, bowel_ids, heavy_counts, heavy_ids, pbac_by, pbac_ids, longest = [], [], [], {}, [], {}, (0, [])
    severe_cycles = bowel_cycles = 0
    for i, c in enumerate(cycles[-6:]):
        days = period_days(c)
        if days:
            worst = max(days, key=lambda lg: lg.get("pain", 0))
            if worst.get("pain", 0) >= 7:
                severe_cycles += 1
                severe_ids.append(worst["id"])
        # docs/03: days with "flooding" or clots >= 2.5 cm (large clots on the PBAC chart)
        fl = [
            lg
            for lg in days
            if "flooding" in lg.get("symptoms", [])
            or ((lg.get("pbac_items") or {}).get("clots") or {}).get("large", 0) > 0
        ]
        heavy_counts.append(len(fl))
        heavy_ids[i] = [lg["id"] for lg in fl]
        pbac_by.append(sum(int(lg.get("pbac", 0) or 0) for lg in days))
        pbac_ids[i] = [lg["id"] for lg in days if lg.get("pbac")]
        bw = [
            lg
            for lg in days
            if "pain with bowel movements" in lg.get("symptoms", []) or "pain passing urine" in lg.get("symptoms", [])
        ]
        if bw:
            bowel_cycles += 1
            bowel_ids += [lg["id"] for lg in bw]
        if int(c["bleed_days"]) > longest[0]:
            longest = (int(c["bleed_days"]), [lg["id"] for lg in days])
    fs.put("severe_pain_cycles_6", severe_cycles, severe_ids)
    fs.put("cyclical_bowel_bladder_pain", bowel_cycles >= 2, bowel_ids)
    fs.put("period_duration_max", longest[0], longest[1])
    hmax = max(range(len(heavy_counts)), key=lambda i: heavy_counts[i]) if heavy_counts else None
    fs.put("heavy_flow_days_cycle", heavy_counts[hmax] if hmax is not None else 0, heavy_ids.get(hmax, []))
    pmax = max(range(len(pbac_by)), key=lambda i: pbac_by[i]) if pbac_by else None
    fs.put("pbac_by_cycle_6", pbac_by)
    fs.put("pbac_max_6", pbac_by[pmax] if pmax is not None else 0, pbac_ids.get(pmax, []))

    # pregnancy, birth and questionnaires
    gdm = [e for e in events if e["type"] == "gdm_diagnosis"]
    deliveries = [e for e in events if e["type"] == "delivery"]
    last_delivery = _d(deliveries[-1]["date"]) if deliveries else None
    fs.put("gdm_history", bool(gdm), [e["id"] for e in gdm])
    fs.put(
        "weeks_since_delivery",
        (ref - last_delivery).days // 7 if last_delivery else None,
        [deliveries[-1]["id"]] if deliveries else [],
    )
    pp_tests = [
        lab for lab in labs if lab.get("code") == "OGTT2H" and last_delivery and _d(lab["date"]) > last_delivery
    ]
    fs.put("postpartum_glucose_test_done", bool(pp_tests))
    fs.put(
        "pregnant",
        bool(p.get("pregnant")),
        [e["id"] for e in events if e["type"] in ("pregnancy_confirmed", "antenatal_visit")][-3:],
    )
    fs.put("pregnancy_weeks", int(p.get("pregnancy_weeks") or 0))
    fs.put("ogtt_in_pregnancy_done", bool(p.get("pregnant")) and any(lab.get("code") == "OGTT2H" for lab in labs))
    fs.put("breastfeeding", bool(p.get("breastfeeding")))
    fs.put("on_hormonal_contraception", bool(p.get("on_hormonal_contraception")))
    fs.put("trying_to_conceive", bool(p.get("trying_to_conceive")))
    fs.put("ttc_months", int(p.get("ttc_months") or 0), [e["id"] for e in events if e["type"] == "ttc_started"])
    q = [e for e in events if e["type"] == "questionnaire"]
    epds = [e for e in q if (e.get("details") or {}).get("tool") == "EPDS"]
    mrs = [e for e in q if (e.get("details") or {}).get("tool") == "MRS"]
    fs.put("epds_latest_total", epds[-1]["details"].get("total") if epds else None, [epds[-1]["id"]] if epds else [])
    fs.put("epds_item10", int(epds[-1]["details"].get("item10") or 0) if epds else 0, [epds[-1]["id"]] if epds else [])
    fs.put("mrs_latest_total", mrs[-1]["details"].get("total") if mrs else None, [mrs[-1]["id"]] if mrs else [])
    postmenopausal = p.get("life_stage") == "postmenopause"
    fs.put("postmenopausal", postmenopausal)
    # QUESTIONS #53: nothing ever set profile.possible_pregnancy, so RF2 needed a fever. Pregnancy is possible when she
    # is trying to conceive, already pregnant, or her period is late; never after menopause.
    days_since = (ref - starts[-1]).days if starts else None
    late = days_since is not None and days_since > LATE_PERIOD_DAYS
    ttc, pregnant = bool(p.get("trying_to_conceive")), bool(p.get("pregnant"))
    possible = not postmenopausal and (ttc or pregnant or late)
    why = (
        (fs.evidence["ttc_months"] if ttc else [])
        + (fs.evidence["pregnant"] if pregnant else [])
        + (start_id(cycles[-1]) if late else [])
    )
    fs.put("possible_pregnancy", possible, why if possible else [])

    # display-only helpers (never used to claim a condition)
    fs.put("cycle_change_point", change_point(lengths))
    supporting = sum(len(v) for v in fs.evidence.values())
    n = len(lengths)
    fs.put("record_strength", "strong" if n >= 6 and supporting >= 10 else "building" if n >= 3 else "early")
    fs.put("log_count", len(logs))
    return fs


def change_point(lengths: list[int]) -> dict | None:
    """Largest step in mean cycle length between two halves of the record; shown only if >= 7 days."""
    best = None
    for k in range(2, len(lengths) - 1):
        a, b = statistics.mean(lengths[:k]), statistics.mean(lengths[k:])
        if best is None or abs(b - a) > abs(best["after"] - best["before"]):
            best = {"index": k, "before": round(a, 1), "after": round(b, 1)}
    if best and abs(best["after"] - best["before"]) >= 7:
        return best
    return None


DAY_SYMPTOMS = {
    "heavy_flow_today": lambda lg: lg.get("flow") == "heavy" or "flooding" in lg.get("symptoms", []),
    "dizziness_today": lambda lg: "dizziness" in lg.get("symptoms", []),
    "fainting_today": lambda lg: "fainting" in lg.get("symptoms", []),
    "fever_today": lambda lg: "fever" in lg.get("symptoms", []),
    "bleeding_today": lambda lg: lg.get("flow", "none") != "none" or "bleeding" in lg.get("symptoms", []),
    "sudden_severe_pelvic_pain_today": lambda lg: "sudden severe pain" in lg.get("symptoms", []),
    "severe_abdominal_pain_today": lambda lg: (
        "severe abdominal pain" in lg.get("symptoms", []) or "sudden severe pain" in lg.get("symptoms", [])
    ),
    "reduced_fetal_movements_today": lambda lg: "reduced baby movements" in lg.get("symptoms", []),
    "severe_headache_today": lambda lg: "severe headache" in lg.get("symptoms", []),
    "vision_change_today": lambda lg: "vision changes" in lg.get("symptoms", []),
}


def day_context(log: dict) -> dict[str, bool]:
    return {k: bool(f(log)) for k, f in DAY_SYMPTOMS.items()}
