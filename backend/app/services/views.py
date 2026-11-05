"""Screen-shaped views built from her record (every number comes from the data)."""

from __future__ import annotations

import statistics
from datetime import date, timedelta

from app.agents import copy as cp
from app.rules.engine import Evaluation


def _d(s) -> date:
    return s if isinstance(s, date) else date.fromisoformat(str(s))


def cycle_status(bundle: dict, ev: Evaluation, ref: date) -> dict:
    p = bundle["profile"]
    f = ev.features.values
    stage = p.get("life_stage") or "periods"
    if stage == "pregnancy":
        w = int(p.get("pregnancy_weeks") or 0)
        return {
            "mode": "pregnancy",
            "week": w,
            "of": 40,
            "trimester": 1 if w < 14 else 2 if w < 28 else 3,
            "windows": [{"label": "Glucose test window", "from": 24, "to": 28}],
            "estimate": False,
        }
    if stage == "after_birth" and f.get("weeks_since_delivery") is not None:
        return {
            "mode": "after_birth",
            "week": int(f["weeks_since_delivery"]),
            "of": 12,
            "windows": [{"label": "Glucose test window", "from": 4, "to": 12}],
            "estimate": False,
        }
    cycles = bundle["cycles"]
    if not cycles:
        return {"mode": "cycle", "day": None, "length": None, "estimate": True, "phases": []}
    last = cycles[-1]
    lens = [c["length_days"] for c in cycles if c.get("length_days")][-6:]
    usual = int(statistics.median(lens)) if lens else 28
    bleed = int(last["bleed_days"])
    day = (ref - _d(last["start"])).days + 1
    irregular = (
        any(h.rule_id == "OBS_IRREGULAR_CYCLES" for h in ev.observations)
        or (f.get("cycle_length_sd") or 0) > 7
        or stage == "perimenopause"
    )
    ov = max(bleed + 2, usual - 14)
    phases = [
        {"key": "period", "from": 1, "to": bleed},
        {"key": "follicular", "from": bleed + 1, "to": ov - 5},
        {"key": "fertile", "from": ov - 4, "to": ov + 1},
        {"key": "luteal", "from": ov + 2, "to": usual},
    ]
    phases = [ph for ph in phases if ph["to"] >= ph["from"]]
    cur = next((ph["key"] for ph in phases if ph["from"] <= day <= ph["to"]), "late" if day > usual else "luteal")
    return {
        "mode": "cycle",
        "day": day,
        "length": usual,
        "estimate": irregular,
        "phase": cur,
        "phases": phases,
        "next_period_from": (_d(last["start"]) + timedelta(days=usual)).isoformat() if not irregular else None,
    }


def day_pills(bundle: dict, ref: date) -> list[dict]:
    logged = {str(lg["date"]) for lg in bundle["daily_logs"]}
    flow = {str(lg["date"]) for lg in bundle["daily_logs"] if lg.get("flow") != "none"}
    out = []
    for i in range(-3, 4):
        d = ref + timedelta(days=i)
        out.append(
            {
                "date": d.isoformat(),
                "dow": d.strftime("%a"),
                "day": d.day,
                "today": i == 0,
                "past": i < 0,
                "logged": d.isoformat() in logged,
                "flow": d.isoformat() in flow,
            }
        )
    return out


def timeline(bundle: dict, ref: date, months: int = 12) -> dict:
    start = ref - timedelta(days=int(months * 30.5))
    logs = [lg for lg in bundle["daily_logs"] if _d(lg["date"]) >= start]
    return {
        "from": start.isoformat(),
        "to": ref.isoformat(),
        "cycles": [c for c in bundle["cycles"] if _d(c["start"]) >= start - timedelta(days=60)],
        "days": [
            {
                "id": lg["id"],
                "date": str(lg["date"]),
                "flow": lg["flow"],
                "pain": lg["pain"],
                "pbac": lg.get("pbac", 0),
                "symptoms": lg["symptoms"],
                "impact": lg["impact"],
                "sites": lg.get("pain_sites", []),
                "mood": lg.get("mood"),
                "note": lg.get("note", ""),
            }
            for lg in logs
        ],
        "events": [e for e in bundle["events"] if _d(e["date"]) >= start and e["type"] != "lab_test"],
        "labs": [lab for lab in bundle["labs"] if _d(lab["date"]) >= start],
    }


def analytics(bundle: dict, ev: Evaluation, ref: date, months: int = 6) -> dict:
    start = ref - timedelta(days=int(months * 30.5))
    cyc = [c for c in bundle["cycles"] if _d(c["start"]) >= start]
    logs = bundle["daily_logs"]
    rows = []
    for c in cyc:
        s = _d(c["start"])
        days = [lg for lg in logs if 0 <= (_d(lg["date"]) - s).days < (c.get("length_days") or (ref - s).days + 1)]
        period = [lg for lg in days if lg.get("flow") != "none"]
        rows.append(
            {
                "start": c["start"],
                "length": c.get("length_days"),
                "bleed": c["bleed_days"],
                "max_pain": max((lg["pain"] for lg in period), default=0),
                "pbac": sum(lg.get("pbac", 0) or 0 for lg in period),
                "symptom_days": sum(1 for lg in days if lg["symptoms"]),
            }
        )
    lens = [r["length"] for r in rows if r["length"]]
    sym: dict[str, int] = {}
    for lg in logs:
        if _d(lg["date"]) >= start:
            for s in lg["symptoms"]:
                sym[s] = sym.get(s, 0) + 1
    f = ev.features.values
    summary = (
        f"{len(lens)} complete cycles in the last {months} months, average {round(statistics.mean(lens), 1)} days"
        f" (range {min(lens)}–{max(lens)})."
        if lens
        else "No complete cycles in this period yet."
    )
    return {
        "months": months,
        "cycles": rows,
        "avg_length": round(statistics.mean(lens), 1) if lens else None,
        "band": [21, 35],
        "top_symptoms": sorted(sym.items(), key=lambda x: -x[1])[:6],
        "change_point": f.get("cycle_change_point"),
        "summary": summary,
    }


def recommendations(cards: list[dict], lang: str = "en") -> list[dict]:
    top = next((c for c in cards if c["kind"] != "red_flag"), None)
    if not top:
        return [
            {
                "kind": "next_step",
                "text": "Nothing in your record needs discussing right now. Keep logging period start dates."
                if lang == "en"
                else "لا يوجد في سجلك ما يحتاج نقاشاً الآن. استمري في تسجيل تواريخ بدء الدورة.",
                "rule": None,
            }
        ]
    out = [
        {
            "kind": "next_step",
            "text": top["what_to_consider"][0] if top["what_to_consider"] else top["summary"],
            "rule": top["observation_id"],
        }
    ]
    if top.get("questions_for_doctor"):
        out.append({"kind": "question", "text": top["questions_for_doctor"][0], "rule": top["observation_id"]})
    return out


def entry_label(e: dict, lang: str = "en") -> str:
    return cp.entry_text(e, lang)
