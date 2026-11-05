#!/usr/bin/env python3
"""Inject the synthetic demo data into the mockup template.

Reads data/synthetic/output (run the generator first) and writes mockup/reprosense-mockup.html
from mockup/template.html by replacing the /*__DATA__*/ marker with a compact JSON object.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "synthetic" / "output"
RULE_TITLES = {
    "RF1_heavy_bleeding_with_dizziness": "Very heavy bleeding with dizziness",
    "OBS_IRREGULAR_CYCLES": "Your cycle lengths have been irregular",
    "OBS_IRREGULAR_PLUS_ANDROGEN": "Irregular cycles together with skin and hair changes",
    "OBS_SEVERE_CYCLICAL_PAIN": "Period pain has been severe and is affecting daily life",
    "OBS_CYCLICAL_BOWEL_BLADDER_PAIN": "Pain with bowel movements during periods",
    "OBS_HEAVY_OR_LONG_PERIODS": "Periods have been heavy or long",
    "CARE_POSTPARTUM_GLUCOSE_TEST": "Your after-birth glucose test may be due",
    "OBS_TTC_FERTILITY_ASSESSMENT": "It may be time to ask about a fertility check",
    "OBS_HEAVY_WITH_FATIGUE": "Heavy periods together with tiredness",
    "CARE_PREGNANCY_GLUCOSE_SCREEN": "Your pregnancy glucose test window is open",
    "OBS_POSTPARTUM_MOOD": "Your mood check suggests talking to someone",
    "OBS_PERIMENOPAUSE_SYMPTOMS": "Symptoms that often come with perimenopause",
    "RF4_SELF_HARM_THOUGHTS": "You deserve support right now",
}


def compact(p: dict) -> dict:
    logs = p["daily_logs"]
    cycles = []
    for c in p["cycles"]:
        days = [l for l in logs if l["flow"] != "none" and l["date"] >= c["start"]][: c["bleed_days"]]
        cycles.append({"start": c["start"], "len": c["length_days"], "bleed": c["bleed_days"],
                       "maxPain": max((l["pain"] for l in days), default=0),
                       "heavy": sum(1 for l in days if "flooding" in l["symptoms"]),
                       "pbac": sum(l.get("pbac", 0) for l in days)})
    # evidence entries: the most telling log lines (notes, flooding, androgen, impact)
    def telling(l):
        s = l["symptoms"]
        return bool(l["note"]) or "flooding" in s or l["impact"] == "missed work or study" or \
            any(x in s for x in ("acne", "excess hair growth", "scalp hair thinning", "pain with bowel movements", "dizziness"))
    evidence = [{"id": l["id"], "date": l["date"], "pain": l["pain"], "flow": l["flow"],
                 "symptoms": l["symptoms"], "impact": l["impact"], "note": l["note"]}
                for l in logs if telling(l)][-24:]
    return {
        "profile": p["profile"], "cycles": cycles, "features": p["features"], "labs": p["labs"],
        "events": [e for e in p["events"] if e["type"] != "lab_test"],
        "observations": [{"id": o, "title": RULE_TITLES[o]} for o in p["expected_observations"]],
        "evidence": evidence, "logCount": len(logs),
        "impactDays": [l["date"] for l in logs if l["impact"] == "missed work or study"],
        "sites": {s: sum(1 for l in logs if s in l.get("pain_sites", []) and l["pain"] >= 3) for s in ("lower abdomen", "lower back")},
        "bowelDays": sum(1 for l in logs if "pain with bowel movements" in l["symptoms"]),
        "vaso": [l["date"] for l in logs if any(s in ("hot flushes", "night sweats") for s in l["symptoms"])][-40:],
        "sleep": round(sum(l.get("sleep_h", 0) for l in logs[-30:]) / max(len(logs[-30:]), 1), 1),
    }


def main() -> None:
    personas = {}
    for f in sorted((OUT / "personas").glob("*.json")):
        personas[f.stem] = compact(json.loads(f.read_text()))
    import csv
    gbr = {}
    with (OUT / "cohort.csv").open() as fh:
        for row in csv.DictReader(fh):
            if row["care_gap_status"]:
                g = gbr.setdefault(row["region"], {"open": 0, "in_progress": 0, "closed": 0})
                g[row["care_gap_status"]] += 1
    data = {"personas": personas, "cohort": json.loads((OUT / "cohort_summary.json").read_text()), "gapsByRegion": gbr}
    tpl = (Path(__file__).parent / "template.html").read_text()
    html = tpl.replace("/*__DATA__*/null", json.dumps(data, ensure_ascii=False, separators=(",", ":")))
    target = Path(__file__).parent / "reprosense-mockup.html"
    target.write_text(html)
    print(f"wrote {target} ({len(html)//1024} KB)")


if __name__ == "__main__":
    main()
