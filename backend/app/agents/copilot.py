"""Clinician copilot: SBAR handover and 'Ask the record'. Answers come ONLY from her entries, with dated evidence."""

from __future__ import annotations

import re
from datetime import date

from app.agents import copy as cp
from app.rules.engine import Evaluation

TOPICS = {  # question keywords -> entry filter
    "pain": (r"pain|cramp|hurt", lambda e: (e.get("pain") or 0) >= 7),
    "bleeding": (
        r"bleed|heavy|flood|clot|pbac|flow",
        lambda e: "flooding" in e.get("symptoms", []) or (e.get("pbac") or 0) >= 20,
    ),
    "skin_hair": (
        r"acne|hair|skin|androgen",
        lambda e: any(s in e.get("symptoms", []) for s in ("acne", "excess hair growth", "scalp hair thinning")),
    ),
    "bowel": (r"bowel|bladder|urin|stool", lambda e: any("bowel" in s or "urine" in s for s in e.get("symptoms", []))),
    "impact": (
        r"work|school|study|missed|bed|daily life",
        lambda e: e.get("impact") in ("missed work or study", "stayed in bed"),
    ),
    "mood": (
        r"mood|sad|low|anx|depress|epds",
        lambda e: "low mood" in e.get("symptoms", []) or e.get("type") == "questionnaire",
    ),
    "tired": (r"tired|fatigue|energy|exhaust", lambda e: "fatigue" in e.get("symptoms", [])),
    "dizzy": (r"dizz|faint", lambda e: any(s in e.get("symptoms", []) for s in ("dizziness", "fainting"))),
    "flushes": (
        r"flush|sweat|menopaus",
        lambda e: any(s in e.get("symptoms", []) for s in ("hot flushes", "night sweats")),
    ),
    "pregnancy": (
        r"pregnan|antenatal|birth|deliver|glucose|ogtt|gdm|diabet",
        lambda e: (
            e.get("type")
            in ("pregnancy_confirmed", "antenatal_visit", "gdm_diagnosis", "delivery", "appointment_planned")
        ),
    ),
}


def ask_record(bundle: dict, question: str) -> dict:
    q = (question or "").lower()
    entries = bundle["daily_logs"] + bundle["events"]
    matched_topics = [k for k, (pat, _) in TOPICS.items() if re.search(pat, q)]
    if "cycle" in q or "period" in q and not matched_topics:
        lens = [c["length_days"] for c in bundle["cycles"] if c.get("length_days")]
        if lens:
            ev = [
                {
                    "entry_id": None,
                    "date": c["start"],
                    "text": f"{cp._fmt_day(c['start'])} · cycle of {c['length_days']} days",
                }
                for c in bundle["cycles"]
                if c.get("length_days")
            ][-8:]
            return {
                "answer": f"{len(lens)} complete cycles are logged; lengths ranged from {min(lens)} to {max(lens)} days"
                f" (most recent: {lens[-1]} days).",
                "evidence": ev,
                "from_entries_only": True,
            }
    if not matched_topics:
        return {
            "answer": "I can only answer from her own entries. Try asking about pain, bleeding, cycles, mood, tiredness,"
            " skin and hair, bowel or bladder symptoms, or pregnancy events.",
            "evidence": [],
            "from_entries_only": True,
        }
    hits = [e for e in entries if any(TOPICS[t][1](e) for t in matched_topics)]
    hits.sort(key=lambda e: str(e["date"]))
    if not hits:
        return {"answer": "Her record has no entries about that.", "evidence": [], "from_entries_only": True}
    first, last = hits[0]["date"], hits[-1]["date"]
    ev = [{"entry_id": e["id"], "date": str(e["date"]), "text": cp.entry_text(e)} for e in hits[-10:]]
    return {
        "answer": f"{len(hits)} matching entries between {cp._fmt_day(str(first))} and {cp._fmt_day(str(last))}."
        f" The most recent are listed below with their dates.",
        "evidence": ev,
        "from_entries_only": True,
    }


def sbar(bundle: dict, ev: Evaluation, ref: date) -> dict:
    p = bundle["profile"]
    f = ev.features.values
    stage = (p.get("life_stage") or "periods").replace("_", " ")
    lens = f.get("cycle_lengths_last6") or []
    s = f"{p.get('age')}-year-old ({p.get('alias')}), life stage: {stage}. "
    s += (
        ("Red flag logged: " + "; ".join(cp.title(h.rule_id) or h.rule_id for h in ev.red_flags) + ". ")
        if ev.red_flags
        else ""
    )
    s += (
        ("Shared record shows " + ", ".join(h.title.lower() for h in ev.observations) + ".")
        if ev.observations
        else "No patterns flagged."
    )
    b_parts = []
    if lens:
        b_parts.append(f"Last {len(lens)} cycle lengths: {', '.join(map(str, lens))} days")
    if f.get("pbac_max_6"):
        b_parts.append(f"highest PBAC {f['pbac_max_6']}")
    if f.get("gdm_history"):
        b_parts.append(f"gestational diabetes in last pregnancy, delivery {f.get('weeks_since_delivery')} weeks ago")
    if p.get("pregnant"):
        b_parts.append(f"currently {p.get('pregnancy_weeks')} weeks pregnant")
    if f.get("ttc_months"):
        b_parts.append(f"trying to conceive for {f['ttc_months']} months")
    flagged = [lab for lab in bundle["labs"] if lab.get("flag")]
    if flagged:
        b_parts.append(
            "flagged labs: "
            + ", ".join(f"{lab['test']} {lab['value']} {lab['unit']} ({lab['flag']})" for lab in flagged)
        )
    a = [f"{h.title} — {cp.detail(h.rule_id, h.values, f)}" for h in ev.observations]
    r = [step for h in ev.observations for step in h.next_steps[:2]]
    return {
        "situation": s.strip(),
        "background": "; ".join(b_parts) + "." if b_parts else "No background entries.",
        "assessment": a or ["No rule-based patterns in the shared record."],
        "recommendation": list(dict.fromkeys(r)) or ["Routine care; encourage continued logging."],
        "note": "Rule-based summary of her own entries. Patterns are worth discussing, not diagnoses.",
        "ref_date": ref.isoformat(),
    }


def visit_note_draft(bundle: dict, ev: Evaluation, ref: date) -> str:
    sb = sbar(bundle, ev, ref)
    lines = [
        "VISIT NOTE (draft for clinician editing — rule-based summary, not a diagnosis)",
        f"S: {sb['situation']}",
        f"B: {sb['background']}",
        "A: " + " | ".join(sb["assessment"]),
        "P: " + " | ".join(sb["recommendation"]),
        "Clinician notes: ",
    ]
    return "\n".join(lines)
