#!/usr/bin/env python3
"""
ReproSense AI — synthetic demo data generator.

ALL DATA PRODUCED HERE IS FICTIONAL. No real person, record or clinic is represented.
Rates are loosely calibrated to published figures (see docs/04_DATA_PLAN.md) so the demo
looks realistic, but nothing here is a clinical estimate.

Outputs (in data/synthetic/output/):
  personas/<id>.json        5 rich personas with ~12 months of logs, events, labs
  lab_reports/<id>.txt      synthetic lab report text for the Document AI demo
  cohort.csv                1,200-woman synthetic clinic cohort for the admin dashboard
  cohort_summary.json       aggregate numbers the admin dashboard shows
  manifest.json             what was generated, seed, reference date

Run:  python3 data/synthetic/generate_synthetic.py [--seed 2026] [--ref-date 2026-11-22] [--cohort 1200]
Uses only the Python standard library.
"""
from __future__ import annotations

import argparse
import csv
import json
import random
import statistics
from dataclasses import dataclass, field
from datetime import date, timedelta
from pathlib import Path

OUT = Path(__file__).resolve().parent / "output"
SYNTHETIC_TAG = "SYNTHETIC — fictional demo data, not a real person"

# ---------------------------------------------------------------------------
# Persona definitions: each describes how her cycles and symptoms behave.
# ---------------------------------------------------------------------------
@dataclass
class PersonaSpec:
    id: str
    alias: str                      # fictional display name
    age: int
    region: str
    language: str
    menarche_age: int
    cycle_len: tuple[int, int]      # min/max cycle length in days (uniform draw)
    period_len: tuple[int, int]     # min/max bleeding days
    max_pain: tuple[int, int]       # min/max worst pain score during a period (0-10)
    pain_impact_prob: float         # chance a severe-pain period includes a "missed work/study" day
    androgen_prob: float            # chance on any day of logging acne / excess hair growth
    heavy_prob: float               # chance a period has 2+ heavy/flooding days
    bowel_bladder_pain_prob: float  # chance a period includes pain with bowel movements/urination
    story: str
    events: list[dict] = field(default_factory=list)
    pregnant_until_days_ago: int | None = None   # for the postpartum persona: no periods before this
    ttc_months: int | None = None                # months trying to conceive (fertility persona)
    pregnant_weeks: int | None = None            # pregnancy persona: weeks since last menstrual period (gestational age)
    perimenopause: bool = False                  # perimenopause persona: vasomotor symptoms + lengthening, irregular cycles


PERSONAS = [
    PersonaSpec("amina", "Amina R. (fictional)", 27, "Abu Dhabi City", "en", 12,
                (26, 30), (4, 5), (2, 4), 0.0, 0.01, 0.0, 0.0,
                "Regular cycles, mild cramps. Shows the calm state of the app."),
    PersonaSpec("noura", "Noura A. (fictional)", 24, "Al Ain", "ar", 12,
                (36, 62), (4, 7), (3, 6), 0.05, 0.25, 0.05, 0.0,
                "Long and irregular cycles with acne and excess hair growth logged often."),
    PersonaSpec("priya", "Priya S. (fictional)", 31, "Abu Dhabi City", "en", 11,
                (25, 31), (5, 7), (7, 9), 0.7, 0.02, 0.2, 0.5,
                "Severe period pain each month, missing work, pain with bowel movements during periods."),
    PersonaSpec("fatima", "Fatima K. (fictional)", 33, "Al Dhafra", "ar", 13,
                (27, 32), (4, 6), (3, 5), 0.0, 0.02, 0.1, 0.0,
                "Gave birth 9 weeks ago after gestational diabetes; no glucose test logged since.",
                pregnant_until_days_ago=63),
    PersonaSpec("sara", "Sara M. (fictional)", 35, "Abu Dhabi City", "en", 12,
                (24, 29), (8, 10), (4, 6), 0.2, 0.02, 0.9, 0.0,
                "Long, very heavy periods with clots; one recent day of dizziness (red-flag demo)."),
    PersonaSpec("mariam", "Mariam H. (fictional)", 36, "Abu Dhabi City", "ar", 12,
                (27, 31), (4, 6), (2, 4), 0.0, 0.02, 0.0, 0.0,
                "Trying to conceive for 7 months with regular cycles; wants to know when to ask for help.",
                ttc_months=7),
    PersonaSpec("hessa", "Hessa S. (fictional)", 29, "Abu Dhabi City", "ar", 13,
                (27, 30), (4, 6), (2, 4), 0.0, 0.01, 0.0, 0.0,
                "24 weeks pregnant with her first baby; the glucose screening window (24-28 weeks) is open and not yet booked.",
                pregnant_weeks=24),
    PersonaSpec("layla", "Layla M. (fictional)", 47, "Al Ain", "en", 12,
                (21, 60), (3, 7), (2, 4), 0.0, 0.0, 0.0, 0.0,
                "Periods have become unpredictable over the past year, with hot flushes and night sweats most weeks.",
                perimenopause=True),
]
VASOMOTOR = ["hot flushes", "night sweats"]

SYMPTOMS_GENERAL = ["bloating", "fatigue", "headache", "breast tenderness", "low mood", "back pain", "cravings"]
ANDROGEN = ["acne", "excess hair growth", "scalp hair thinning"]


def iso(d: date) -> str:
    return d.isoformat()


# ---------------------------------------------------------------------------
# Persona simulation
# ---------------------------------------------------------------------------
def simulate_persona(spec: PersonaSpec, ref: date, rng: random.Random) -> dict:
    start_window = ref - timedelta(days=365)
    logs: list[dict] = []
    cycles: list[dict] = []
    events: list[dict] = []
    # Pad counts draw from their own stream (issue #43 d), so cycle lengths, pain and the days logged, which the demo
    # script and docs quote, come out exactly as before. A str-free seed keeps it the same in every process (rule 6).
    pad_rng = random.Random(sum(map(ord, "pads:" + spec.id)))
    entry_no = 0

    def new_id() -> str:
        nonlocal entry_no
        entry_no += 1
        return f"{spec.id}-e{entry_no:04d}"

    # Postpartum persona: pregnancy covers most of the window; periods resume only recently (or not at all).
    if spec.pregnant_until_days_ago is not None:
        delivery = ref - timedelta(days=spec.pregnant_until_days_ago)
        conception = delivery - timedelta(days=266)
        gdm_dx = conception + timedelta(days=26 * 7)
        events += [
            {"id": new_id(), "type": "pregnancy_confirmed", "date": iso(conception + timedelta(days=35))},
            {"id": new_id(), "type": "gdm_diagnosis", "date": iso(gdm_dx),
             "details": {"test": "75 g OGTT at 26 weeks", "note": "managed with diet; synthetic"}},
            {"id": new_id(), "type": "delivery", "date": iso(delivery), "details": {"mode": "vaginal", "baby": "healthy"}},
            {"id": new_id(), "type": "breastfeeding", "date": iso(delivery), "details": {"status": "ongoing"}},
        ]
        # A few postpartum symptom logs, no periods yet (breastfeeding).
        d = delivery + timedelta(days=10)
        while d <= ref:
            if rng.random() < 0.25:
                logs.append({"id": new_id(), "date": iso(d), "flow": "none", "pain": rng.randint(0, 2),
                             "pain_sites": [], "symptoms": rng.sample(["fatigue", "low mood", "back pain"], k=1),
                             "impact": "none", "sleep_h": round(rng.uniform(4, 6.5), 1),
                             "note": rng.choice(["Tired, baby waking at night", "Feeling okay today", ""])})
            d += timedelta(days=1)
        # Pre-pregnancy cycles before conception (if inside window).
        cursor = start_window
        stop_at = conception
    elif spec.pregnant_weeks is not None:
        lmp = ref - timedelta(days=spec.pregnant_weeks * 7)
        events += [
            {"id": new_id(), "type": "pregnancy_confirmed", "date": iso(lmp + timedelta(days=38))},
            {"id": new_id(), "type": "antenatal_visit", "date": iso(lmp + timedelta(weeks=10)), "details": {"visit": "booking visit, week 10"}},
            {"id": new_id(), "type": "antenatal_visit", "date": iso(lmp + timedelta(weeks=12, days=3)), "details": {"visit": "dating scan, week 12"}},
            {"id": new_id(), "type": "antenatal_visit", "date": iso(lmp + timedelta(weeks=20, days=2)), "details": {"visit": "anomaly scan, week 20"}},
            {"id": new_id(), "type": "appointment_planned", "date": iso(ref + timedelta(days=4)), "details": {"visit": "antenatal check, week 24"}},
        ]
        d = lmp + timedelta(days=30)
        while d <= ref:
            wk = (d - lmp).days // 7
            if rng.random() < 0.35:
                pool = ["nausea", "fatigue"] if wk < 14 else (["back pain", "heartburn", "fatigue"] if wk < 22 else ["back pain", "baby moving well", "heartburn"])
                logs.append({"id": new_id(), "date": iso(d), "flow": "none", "pain": rng.randint(0, 2), "pain_sites": [],
                             "symptoms": rng.sample(pool, k=1), "impact": "none", "sleep_h": round(rng.uniform(6, 8), 1),
                             "note": "", "pregnancy_week": wk})
            d += timedelta(days=1)
        cursor = start_window + timedelta(days=rng.randint(0, 10))
        stop_at = lmp
    else:
        cursor = start_window + timedelta(days=rng.randint(0, 10))
        stop_at = ref

    dizzy_logged = False
    while cursor < stop_at:
        clen = rng.randint(*spec.cycle_len)
        plen = rng.randint(*spec.period_len)
        worst = rng.randint(*spec.max_pain)
        heavy = rng.random() < spec.heavy_prob
        bowel = rng.random() < spec.bowel_bladder_pain_prob
        impact_needed = worst >= 7 and rng.random() < spec.pain_impact_prob
        period_start = cursor
        cycles.append({"start": iso(period_start), "bleed_days": plen})

        for day in range(plen):
            d = period_start + timedelta(days=day)
            if d > ref:
                break
            if day == 0:
                flow = "medium"
            elif day < 3:
                flow = "heavy" if heavy else "medium"
            else:
                flow = "light"
            flooding = heavy and day in (1, 2)
            pain = max(0, worst - day * 2 + rng.randint(-1, 1)) if day < 3 else rng.randint(0, 2)
            symptoms = rng.sample(SYMPTOMS_GENERAL, k=rng.randint(0, 2))
            if flooding:
                symptoms += ["flooding", "clots larger than a coin"]
                if spec.id == "sara":
                    symptoms.append("fatigue")
            sites = ["lower abdomen"] + (["lower back"] if pain >= 5 else [])
            if bowel and day in (0, 1):
                symptoms.append("pain with bowel movements")
            impact = "missed work or study" if (impact_needed and day == 1) else ("reduced activity" if pain >= 6 else "none")
            # Pads vary inside each flow band (PBAC was 11 on every medium day). Light days keep their one draw from the
            # main stream, so it stays in step, and add 0-1 from the pad stream: 1-3 pads.
            if flow == "light":
                pads = {"light": rng.randint(1, 2) + pad_rng.randint(0, 1)}
            elif flow == "medium":
                pads = {"moderate": pad_rng.randint(1, 3), "light": pad_rng.randint(0, 2)}
            else:
                pads = {"soaked": pad_rng.randint(1, 3), "moderate": pad_rng.randint(0, 2)}
            pads = {k: n for k, n in pads.items() if n}
            clots = {}
            if flooding:
                pads["soaked"] = pads.get("soaked", 0) + 1
                clots = {"large": 1}
            pbac = (pads.get("light", 0) * 1 + pads.get("moderate", 0) * 5 + pads.get("soaked", 0) * 20
                    + clots.get("small", 0) * 1 + clots.get("large", 0) * 5)
            log = {"id": new_id(), "date": iso(d), "flow": flow, "pain": pain, "pain_sites": sites,
                   "symptoms": symptoms, "impact": impact, "sleep_h": round(rng.uniform(5.5, 8), 1), "note": "",
                   "pbac_items": {"pads": pads, "clots": clots}, "pbac": pbac}
            # Sara: one recent heavy day with dizziness → red flag demo
            if spec.id == "sara" and not dizzy_logged and (ref - d).days <= 30 and flooding:
                log["symptoms"].append("dizziness")
                log["note"] = "Soaked through a pad every hour this morning and felt dizzy standing up."
                dizzy_logged = True
            if spec.id == "priya" and impact == "missed work or study":
                log["note"] = rng.choice(["Cramps so bad I missed work again", "Had to leave the office, pain 9/10",
                                          "Painkillers barely helped today"])
            logs.append(log)

        # non-period days: occasional logs (androgen symptoms, general)
        for day in range(plen, clen):
            d = period_start + timedelta(days=day)
            if d > ref or d >= stop_at:
                break
            if spec.perimenopause and rng.random() < 0.45:
                logs.append({"id": new_id(), "date": iso(d), "flow": "none", "pain": rng.randint(0, 2), "pain_sites": [],
                             "symptoms": rng.sample(VASOMOTOR, k=rng.randint(1, 2)) + (["poor sleep"] if rng.random() < 0.5 else []),
                             "impact": "reduced activity" if rng.random() < 0.15 else "none",
                             "sleep_h": round(rng.uniform(4.5, 6.5), 1), "note": rng.choice(["", "Woke up drenched twice", "Hot flush in a meeting"])})
                continue
            if rng.random() < 0.18 or rng.random() < spec.androgen_prob:
                symptoms = []
                if rng.random() < spec.androgen_prob * 2.5:
                    symptoms += rng.sample(ANDROGEN, k=rng.randint(1, 2))
                if rng.random() < 0.4:
                    symptoms += rng.sample(SYMPTOMS_GENERAL, k=1)
                if symptoms:
                    logs.append({"id": new_id(), "date": iso(d), "flow": "none", "pain": rng.randint(0, 2),
                                 "pain_sites": [], "symptoms": symptoms, "impact": "none",
                                 "sleep_h": round(rng.uniform(5.5, 8), 1), "note": ""})
        cursor = period_start + timedelta(days=clen)

    # cycle lengths from consecutive starts
    starts = [date.fromisoformat(c["start"]) for c in cycles]
    for i, c in enumerate(cycles):
        c["length_days"] = (starts[i + 1] - starts[i]).days if i + 1 < len(starts) else None

    labs = synthetic_labs(spec, ref, rng)
    for lab in labs:
        events.append({"id": new_id(), "type": "lab_test", "date": lab["date"], "details": {"test": lab["test"]}})

    if spec.id == "fatima":
        delivery = [e for e in events if e["type"] == "delivery"][0]
        events.append({"id": new_id(), "type": "questionnaire", "date": iso(date.fromisoformat(delivery["date"]) + timedelta(weeks=8)),
                       "details": {"tool": "EPDS", "total": 11, "item10": 0, "note": "self-completed in app; synthetic"}})
    if spec.perimenopause:
        for m in (3, 2, 1):
            events.append({"id": new_id(), "type": "questionnaire", "date": iso(ref - timedelta(days=30 * m - 3)),
                           "details": {"tool": "MRS", "total": 17 + (3 - m) * 2, "note": "Menopause Rating Scale; synthetic"}})
    if spec.ttc_months:
        events.append({"id": new_id(), "type": "ttc_started",
                       "date": iso(ref - timedelta(days=round(spec.ttc_months * 30.4))),
                       "details": {"note": "stopped contraception; trying to conceive"}})
    profile = {
        "id": spec.id, "alias": spec.alias, "age": spec.age, "region": spec.region, "language": spec.language,
        "menarche_age": spec.menarche_age, "story": spec.story, "is_synthetic": True, "tag": SYNTHETIC_TAG,
        "pregnant": spec.pregnant_weeks is not None,
        "pregnancy_weeks": spec.pregnant_weeks or 0,
        "life_stage": ("pregnancy" if spec.pregnant_weeks else "after_birth" if spec.pregnant_until_days_ago else
                       "perimenopause" if spec.perimenopause else "trying_to_conceive" if spec.ttc_months else "periods"),
        "breastfeeding": spec.pregnant_until_days_ago is not None,
        "on_hormonal_contraception": False,
        "trying_to_conceive": bool(spec.ttc_months),
        "ttc_months": spec.ttc_months or 0,
    }
    data = {"profile": profile, "cycles": cycles, "daily_logs": sorted(logs, key=lambda x: x["date"]),
            "events": sorted(events, key=lambda x: x["date"]), "labs": labs}
    data["features"] = compute_features(data, ref)
    data["expected_observations"] = evaluate_rules(data["features"])
    return data


def synthetic_labs(spec: PersonaSpec, ref: date, rng: random.Random) -> list[dict]:
    """Synthetic lab values. Reference ranges are illustrative and printed 'as on the report'."""
    d = iso(ref - timedelta(days=rng.randint(20, 60)))
    base = [
        {"test": "Haemoglobin", "code": "HGB", "value": round(rng.uniform(12.4, 13.8), 1), "unit": "g/dL", "ref_low": 12.0, "ref_high": 15.5},
        {"test": "TSH", "code": "TSH", "value": round(rng.uniform(1.0, 2.8), 2), "unit": "mIU/L", "ref_low": 0.4, "ref_high": 4.0},
    ]
    extra: list[dict] = []
    if spec.id == "noura":
        extra = [
            {"test": "Total testosterone", "code": "TESTO", "value": 2.4, "unit": "nmol/L", "ref_low": 0.3, "ref_high": 1.7},
            {"test": "Anti-Mullerian hormone", "code": "AMH", "value": 9.8, "unit": "ng/mL", "ref_low": 1.0, "ref_high": 6.8},
            {"test": "Prolactin", "code": "PRL", "value": 14.2, "unit": "ng/mL", "ref_low": 4.8, "ref_high": 23.3},
        ]
    elif spec.id == "sara":
        base[0] = {"test": "Haemoglobin", "code": "HGB", "value": 10.4, "unit": "g/dL", "ref_low": 12.0, "ref_high": 15.5}
        extra = [{"test": "Ferritin", "code": "FERR", "value": 8, "unit": "ng/mL", "ref_low": 15, "ref_high": 150}]
    elif spec.id == "fatima":
        d = iso(ref - timedelta(days=63 + 90))  # during pregnancy
        extra = [
            {"test": "75 g OGTT — 2 hour glucose (pregnancy, 26 weeks)", "code": "OGTT2H", "value": 9.1, "unit": "mmol/L", "ref_low": None, "ref_high": 8.5},
            {"test": "HbA1c (pregnancy)", "code": "HBA1C", "value": 5.6, "unit": "%", "ref_low": None, "ref_high": 5.7},
        ]
    elif spec.id == "hessa":
        extra = [{"test": "Blood group", "code": "ABO", "value": "O positive", "unit": "", "ref_low": None, "ref_high": None},
                 {"test": "Fasting glucose (booking, week 10)", "code": "FPG", "value": 4.6, "unit": "mmol/L", "ref_low": None, "ref_high": 5.1}]
    elif spec.id == "priya":
        extra = [{"test": "Pelvic ultrasound (report text)", "code": "US_PELVIS", "value": "No abnormality seen", "unit": "", "ref_low": None, "ref_high": None}]
    for lab in base + extra:
        lab["date"] = d
        v, lo, hi = lab["value"], lab["ref_low"], lab["ref_high"]
        lab["flag"] = ("H" if isinstance(v, (int, float)) and hi is not None and v > hi else
                       "L" if isinstance(v, (int, float)) and lo is not None and v < lo else "")
    return base + extra


# ---------------------------------------------------------------------------
# Feature computation + rule evaluation (mirror of rules/clinical_rules.yaml, used to validate the data)
# ---------------------------------------------------------------------------
def compute_features(data: dict, ref: date) -> dict:
    p, cycles, logs, events = data["profile"], data["cycles"], data["daily_logs"], data["events"]
    lengths = [c["length_days"] for c in cycles if c["length_days"]]
    last6 = lengths[-6:]
    d90 = ref - timedelta(days=90)
    recent = [l for l in logs if date.fromisoformat(l["date"]) >= d90]
    period_logs = [l for l in logs if l["flow"] != "none"]

    # per-cycle aggregates for the last 6 cycles
    severe_cycles, heavy_days_by_cycle, bowel_cycles, pbac_by_cycle = 0, [], 0, []
    for c in cycles[-6:]:
        s = date.fromisoformat(c["start"])
        days = [l for l in period_logs if 0 <= (date.fromisoformat(l["date"]) - s).days < c["bleed_days"]]
        if days and max(l["pain"] for l in days) >= 7:
            severe_cycles += 1
        heavy_days_by_cycle.append(sum(1 for l in days if "flooding" in l["symptoms"]))
        pbac_by_cycle.append(sum(l.get("pbac", 0) for l in days))
        if any("pain with bowel movements" in l["symptoms"] for l in days):
            bowel_cycles += 1

    starts = [date.fromisoformat(c["start"]) for c in cycles]
    gdm = any(e["type"] == "gdm_diagnosis" for e in events)
    delivery = [date.fromisoformat(e["date"]) for e in events if e["type"] == "delivery"]
    weeks_since_delivery = (ref - delivery[-1]).days // 7 if delivery else None
    pp_test = any(l["code"] == "OGTT2H" and delivery and date.fromisoformat(l["date"]) > delivery[-1] for l in data["labs"])

    return {
        "years_since_menarche": p["age"] - p["menarche_age"],
        "cycles_logged": len(lengths),
        "cycle_lengths_last6": last6,
        "irregular_cycle_count_6": sum(1 for x in last6 if x < 21 or x > 35),
        "cycles_per_year": sum(1 for s in starts if s >= ref - timedelta(days=365)),
        "cycle_length_sd": round(statistics.pstdev(last6), 1) if len(last6) > 1 else None,
        "days_since_last_period": (ref - starts[-1]).days if starts else None,
        "androgen_symptom_days_90": sum(1 for l in recent if any(s in ANDROGEN for s in l["symptoms"])),
        "severe_pain_cycles_6": severe_cycles,
        "pain_impact_days_90": sum(1 for l in recent if l["impact"] == "missed work or study"),
        "cyclical_bowel_bladder_pain": bowel_cycles >= 2,
        "period_duration_max": max((c["bleed_days"] for c in cycles[-6:]), default=0),
        "heavy_flow_days_cycle": max(heavy_days_by_cycle, default=0),
        "pbac_by_cycle_6": pbac_by_cycle,
        "pbac_max_6": max(pbac_by_cycle, default=0),
        "age": p["age"],
        "ttc_months": p.get("ttc_months", 0),
        "red_flag_heavy_with_dizziness": any("dizziness" in l["symptoms"] and "flooding" in l["symptoms"] for l in recent),
        "gdm_history": gdm,
        "weeks_since_delivery": weeks_since_delivery,
        "postpartum_glucose_test_done": pp_test,
        "pregnant": p["pregnant"], "breastfeeding": p["breastfeeding"],
        "pregnancy_weeks": p.get("pregnancy_weeks", 0),
        "ogtt_in_pregnancy_done": any(l["code"] == "OGTT2H" for l in data["labs"]) and p["pregnant"],
        "vasomotor_days_90": sum(1 for l in recent if any(s in ("hot flushes", "night sweats") for s in l["symptoms"])),
        "fatigue_days_90": sum(1 for l in recent if "fatigue" in l["symptoms"]),
        "epds_latest_total": next((e["details"]["total"] for e in reversed(events) if e["type"] == "questionnaire" and e["details"]["tool"] == "EPDS"), None),
        "epds_item10": next((e["details"]["item10"] for e in reversed(events) if e["type"] == "questionnaire" and e["details"]["tool"] == "EPDS"), 0),
        "mrs_latest_total": next((e["details"]["total"] for e in reversed(events) if e["type"] == "questionnaire" and e["details"]["tool"] == "MRS"), None),
        "on_hormonal_contraception": p["on_hormonal_contraception"],
    }


def evaluate_rules(f: dict) -> list[str]:
    hits: list[str] = []
    if f["red_flag_heavy_with_dizziness"]:
        hits.append("RF1_heavy_bleeding_with_dizziness")
    if f["epds_item10"]:
        hits.append("RF4_SELF_HARM_THOUGHTS")
    irregular = (f["age"] < 45 and not f["pregnant"] and f["years_since_menarche"] >= 3 and f["cycles_logged"] >= 4 and
                 (f["irregular_cycle_count_6"] >= 2 or f["cycles_per_year"] < 8))
    if irregular:
        hits.append("OBS_IRREGULAR_CYCLES")
        if f["androgen_symptom_days_90"] >= 10:
            hits.append("OBS_IRREGULAR_PLUS_ANDROGEN")
    if f["severe_pain_cycles_6"] >= 3 and f["pain_impact_days_90"] >= 2:
        hits.append("OBS_SEVERE_CYCLICAL_PAIN")
    if f["cyclical_bowel_bladder_pain"]:
        hits.append("OBS_CYCLICAL_BOWEL_BLADDER_PAIN")
    if f["period_duration_max"] > 7 or f["heavy_flow_days_cycle"] >= 2 or f["pbac_max_6"] >= 100:
        hits.append("OBS_HEAVY_OR_LONG_PERIODS")
        if f["fatigue_days_90"] >= 3:
            hits.append("OBS_HEAVY_WITH_FATIGUE")
    if (f["days_since_last_period"] or 0) >= 90 and f["age"] < 45 and not (f["pregnant"] or f["breastfeeding"] or f["on_hormonal_contraception"]):
        hits.append("OBS_NO_PERIOD_90_DAYS")
    if f["gdm_history"] and (f["weeks_since_delivery"] or 0) >= 4 and not f["postpartum_glucose_test_done"]:
        hits.append("CARE_POSTPARTUM_GLUCOSE_TEST")
    if f["ttc_months"] and (f["ttc_months"] >= 12 or (f["age"] >= 35 and f["ttc_months"] >= 6)):
        hits.append("OBS_TTC_FERTILITY_ASSESSMENT")
    if f["pregnant"] and 24 <= f["pregnancy_weeks"] <= 28 and not f["ogtt_in_pregnancy_done"]:
        hits.append("CARE_PREGNANCY_GLUCOSE_SCREEN")
    if f["epds_latest_total"] is not None and f["epds_latest_total"] >= 10:
        hits.append("OBS_POSTPARTUM_MOOD")
    if f["age"] >= 45 and f["vasomotor_days_90"] >= 10:
        hits.append("OBS_PERIMENOPAUSE_SYMPTOMS")
    return hits


EXPECTED = {
    "amina": set(),
    "noura": {"OBS_IRREGULAR_CYCLES", "OBS_IRREGULAR_PLUS_ANDROGEN"},
    "priya": {"OBS_SEVERE_CYCLICAL_PAIN", "OBS_CYCLICAL_BOWEL_BLADDER_PAIN"},
    "fatima": {"CARE_POSTPARTUM_GLUCOSE_TEST", "OBS_POSTPARTUM_MOOD"},
    "sara": {"RF1_heavy_bleeding_with_dizziness", "OBS_HEAVY_OR_LONG_PERIODS", "OBS_HEAVY_WITH_FATIGUE"},
    "mariam": {"OBS_TTC_FERTILITY_ASSESSMENT"},
    "hessa": {"CARE_PREGNANCY_GLUCOSE_SCREEN"},
    "layla": {"OBS_PERIMENOPAUSE_SYMPTOMS"},
}


# ---------------------------------------------------------------------------
# Lab report text (Document AI demo input)
# ---------------------------------------------------------------------------
def lab_report_text(persona: dict) -> str:
    p = persona["profile"]
    lines = [
        "=" * 64,
        "  EXAMPLE DIAGNOSTICS LAB — ABU DHABI (FICTIONAL)",
        "  " + SYNTHETIC_TAG,
        "=" * 64,
        f"Patient alias : {p['alias']}",
        f"Age           : {p['age']}",
        f"Sample date   : {persona['labs'][0]['date']}",
        "Referring dr. : Dr. Example (fictional)",
        "-" * 64,
        f"{'TEST':<44}{'RESULT':>8}  {'UNIT':<8}{'REF RANGE':<14}FLAG",
    ]
    for lab in persona["labs"]:
        rr = (f"{lab['ref_low']}-{lab['ref_high']}" if lab["ref_low"] is not None and lab["ref_high"] is not None
              else (f"< {lab['ref_high']}" if lab["ref_high"] is not None else "—"))
        lines.append(f"{lab['test']:<44}{str(lab['value']):>8}  {lab['unit']:<8}{rr:<14}{lab['flag']}")
    lines += ["-" * 64, "Reference ranges are illustrative for this demo and vary by laboratory.",
              "End of report."]
    return "\n".join(lines) + "\n"


# ---------------------------------------------------------------------------
# Cohort for the clinic / payer dashboard
# ---------------------------------------------------------------------------
REGIONS = [("Abu Dhabi City", 0.55), ("Al Ain", 0.30), ("Al Dhafra", 0.15)]
CLINICS = ["clinic_north", "clinic_corniche", "clinic_alain", "clinic_dhafra"]
NAT_GROUPS = [("Emirati", 0.35), ("Other Arab", 0.20), ("South Asian", 0.30), ("Other", 0.15)]


def weighted(rng: random.Random, options: list[tuple[str, float]]) -> str:
    return rng.choices([o for o, _ in options], weights=[w for _, w in options], k=1)[0]


def build_cohort(n: int, ref: date, rng: random.Random) -> tuple[list[dict], dict]:
    rows = []
    for i in range(1, n + 1):
        age = rng.randint(18, 45)
        region = weighted(rng, REGIONS)
        clinic = {"Al Ain": "clinic_alain", "Al Dhafra": "clinic_dhafra"}.get(region, rng.choice(CLINICS[:2]))
        irregular = rng.random() < 0.20
        androgen = irregular and rng.random() < 0.50
        severe_pain = rng.random() < 0.12
        heavy = rng.random() < 0.15
        recent_delivery = 22 <= age <= 42 and rng.random() < 0.10
        gdm = recent_delivery and rng.random() < 0.18
        pp_test_done = gdm and rng.random() < 0.40
        ttc = 25 <= age <= 42 and not recent_delivery and rng.random() < 0.10
        ttc_months = rng.randint(1, 24) if ttc else 0
        ttc_flag = ttc and (ttc_months >= 12 or (age >= 35 and ttc_months >= 6))
        consented = rng.random() < 0.82
        shared = consented and (irregular or severe_pain or heavy or gdm or ttc_flag) and rng.random() < 0.65
        gap = "postpartum_glucose_test" if gdm else ("gyn_review" if (androgen or severe_pain) else "")
        if not gap:
            gap_status = ""
        elif gdm:
            gap_status = "closed" if pp_test_done else ("in_progress" if rng.random() < 0.3 else "open")
        else:  # gyn review: a clinic using ReproSense closes many of these
            gap_status = weighted(rng, [("closed", 0.38), ("in_progress", 0.24), ("open", 0.38)])
        rows.append({
            "patient_id": f"SYN-{i:05d}", "is_synthetic": True, "age": age, "age_band": f"{(age // 5) * 5}-{(age // 5) * 5 + 4}",
            "region": region, "clinic_id": clinic, "nationality_group": weighted(rng, NAT_GROUPS),
            "obs_irregular_cycles": irregular, "obs_irregular_plus_androgen": androgen,
            "obs_severe_cyclical_pain": severe_pain, "obs_heavy_periods": heavy,
            "recent_delivery": recent_delivery, "gdm_history": gdm,
            "trying_to_conceive": ttc, "ttc_months": ttc_months, "obs_ttc_fertility_assessment": ttc_flag, "postpartum_glucose_test_done": pp_test_done,
            "consented_care_share": consented, "report_shared": shared,
            "care_gap_type": gap, "care_gap_status": gap_status,
            "days_overdue": rng.randint(0, 120) if gap_status == "open" else 0,
            "last_log_date": iso(ref - timedelta(days=rng.randint(0, 45))),
        })

    def pct(k: str) -> float:
        return round(100 * sum(1 for r in rows if r[k]) / n, 1)

    gaps = [r for r in rows if r["care_gap_type"]]
    summary = {
        "tag": SYNTHETIC_TAG, "n": n, "reference_date": iso(ref),
        "pct_irregular_cycle_pattern": pct("obs_irregular_cycles"),
        "pct_irregular_plus_androgen_pattern": pct("obs_irregular_plus_androgen"),
        "pct_severe_pain_pattern": pct("obs_severe_cyclical_pain"),
        "pct_heavy_period_pattern": pct("obs_heavy_periods"),
        "recent_deliveries": sum(r["recent_delivery"] for r in rows),
        "gdm_history": sum(r["gdm_history"] for r in rows),
        "reports_shared": sum(r["report_shared"] for r in rows),
        "care_gaps_total": len(gaps),
        "care_gaps_open": sum(1 for r in gaps if r["care_gap_status"] == "open"),
        "care_gaps_in_progress": sum(1 for r in gaps if r["care_gap_status"] == "in_progress"),
        "care_gaps_closed": sum(1 for r in gaps if r["care_gap_status"] == "closed"),
        "by_region": {reg: sum(1 for r in rows if r["region"] == reg) for reg, _ in REGIONS},
        "pct_ttc_assessment_pattern": pct("obs_ttc_fertility_assessment"),
        "equity": equity_table(rows),
        "note": "Synthetic proportions chosen to look plausible for a demo; they are not epidemiological estimates.",
    }
    return rows, summary


def equity_table(rows: list[dict]) -> dict:
    """Responsible-AI check (DoH AI standard): are observations and sharing similar across groups?"""
    obs_keys = ["obs_irregular_cycles", "obs_severe_cyclical_pain", "obs_heavy_periods",
                "gdm_history", "obs_ttc_fertility_assessment"]
    out: dict = {}
    for key in ("nationality_group", "age_band"):
        groups: dict = {}
        for r in rows:
            groups.setdefault(r[key], []).append(r)
        out[key] = {g: {"n": len(rs),
                        "pct_any_observation": round(100 * sum(1 for r in rs if any(r[k] for k in obs_keys)) / len(rs), 1),
                        "pct_report_shared": round(100 * sum(1 for r in rs if r["report_shared"]) / len(rs), 1)}
                    for g, rs in sorted(groups.items())}
    return out


# ---------------------------------------------------------------------------
def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--seed", type=int, default=2026)
    ap.add_argument("--ref-date", default="2026-11-22", help="'today' inside the demo (showcase day)")
    ap.add_argument("--cohort", type=int, default=1200)
    args = ap.parse_args()

    rng = random.Random(args.seed)
    ref = date.fromisoformat(args.ref_date)
    (OUT / "personas").mkdir(parents=True, exist_ok=True)
    (OUT / "lab_reports").mkdir(parents=True, exist_ok=True)

    ok = True
    for spec in PERSONAS:
        # Re-simulate with a derived seed until the persona shows its intended story (keeps the demo stable).
        for attempt in range(50):
            persona = simulate_persona(spec, ref, random.Random(args.seed * 100 + attempt + sum(map(ord, spec.id))))
            if set(persona["expected_observations"]) == EXPECTED[spec.id]:
                break
        else:
            ok = False
        persona["generation"] = {"seed": args.seed, "attempt": attempt}
        (OUT / "personas" / f"{spec.id}.json").write_text(json.dumps(persona, indent=2, ensure_ascii=False))
        (OUT / "lab_reports" / f"{spec.id}_lab_report.txt").write_text(lab_report_text(persona))
        status = "OK " if set(persona["expected_observations"]) == EXPECTED[spec.id] else "MISMATCH"
        print(f"[{status}] {spec.id:<7} logs={len(persona['daily_logs']):>3} cycles={len(persona['cycles']):>2} "
              f"observations={persona['expected_observations']}")

    rows, summary = build_cohort(args.cohort, ref, rng)
    with (OUT / "cohort.csv").open("w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)
    (OUT / "cohort_summary.json").write_text(json.dumps(summary, indent=2))
    (OUT / "manifest.json").write_text(json.dumps({
        "tag": SYNTHETIC_TAG, "seed": args.seed, "reference_date": iso(ref),
        "personas": [p.id for p in PERSONAS], "cohort_size": args.cohort,
        "files": ["personas/*.json", "lab_reports/*.txt", "cohort.csv", "cohort_summary.json"]}, indent=2))
    print(f"[OK ] cohort  n={summary['n']} care_gaps={summary['care_gaps_total']} "
          f"(open {summary['care_gaps_open']}, closed {summary['care_gaps_closed']})")
    print(f"Output written to {OUT}")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
