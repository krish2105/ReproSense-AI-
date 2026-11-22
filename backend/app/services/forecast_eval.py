"""Back-test of the next-period forecast on the fictional personas (docs/31 §G).

    cd backend && uv run python -m app.services.forecast_eval            # prints the result and writes the JSON
    cd backend && uv run python -m app.services.forecast_eval --no-write

For every persona with at least 4 complete cycles, each cycle from the fourth on is predicted from the cycles whose
length was known on the first day of the cycle before it (the same function the app uses, app/services/forecast.py),
then compared with when it really started:
- error: days between the middle of the range and the real start;
- inside: whether the real start fell inside the range.
"Varied" here is a spread over 7 days in the cycles before, or perimenopause (the app also uses the rules' irregular
pattern, which needs the whole record). On fictional data only: a real pilot measures this on real records.
"""

from __future__ import annotations

import argparse
import json
import statistics
from datetime import date, timedelta
from pathlib import Path

from app.config import ROOT
from app.services.forecast import forecast

PERSONAS = ROOT / "data" / "synthetic" / "output" / "personas"
RESULTS = Path(__file__).with_name("forecast_eval.json")


def run() -> dict:
    rows = []
    for f in sorted(PERSONAS.glob("*.json")):
        p = json.loads(f.read_text(encoding="utf-8"))
        stage = (p.get("profile") or {}).get("life_stage")
        cycles = [c for c in p.get("cycles", []) if c.get("length_days")]
        if len(cycles) < 4:
            continue
        for k in range(3, len(cycles)):
            # Predicting when cycle k starts, standing on the first day of cycle k-1: only cycles before k-1 have a
            # known length then (cycle k-1's length IS the answer). An earlier version used cycles[:k] and so leaked
            # the answer into the prediction; its numbers were too good (chief healthcare officer review, 22 Nov).
            before = [c["length_days"] for c in cycles[: k - 1]]
            recent = before[-6:]
            # The app's "varied" uses the rules' irregular pattern (cycles under 21 or over 35 days), a spread over
            # 7 days, or perimenopause; the same three here, from the cycles known at the time.
            varied = (
                stage == "perimenopause"
                or any(x < 21 or x > 35 for x in recent)
                or (len(recent) > 1 and statistics.pstdev(recent) > 7)
            )
            last_start = date.fromisoformat(cycles[k - 1]["start"])
            real = date.fromisoformat(cycles[k]["start"])
            got = forecast(before, last_start, varied=varied)
            if got is None:
                continue
            lo, hi = date.fromisoformat(got["from"]), date.fromisoformat(got["to"])
            mid = lo + timedelta(days=(hi - lo).days / 2)
            rows.append(
                {
                    "persona": f.stem,
                    "kind": got["kind"],
                    "error_days": abs((real - mid).days),
                    "inside": lo <= real <= hi,
                    "width_days": (hi - lo).days,
                }
            )

    def summary(sub: list[dict]) -> dict:
        if not sub:
            return {"predictions": 0}
        return {
            "predictions": len(sub),
            "mean_error_days": round(statistics.mean(r["error_days"] for r in sub), 1),
            "inside_range": f"{sum(r['inside'] for r in sub)} of {len(sub)}",
            "mean_width_days": round(statistics.mean(r["width_days"] for r in sub), 1),
        }

    return {
        "data": "fictional personas only (data/synthetic/output/personas)",
        "method": "each cycle predicted on the first day of the cycle before it, from the lengths known then (app/services/forecast.py)",
        "all": summary(rows),
        "regular": summary([r for r in rows if r["kind"] == "regular"]),
        "varied": summary([r for r in rows if r["kind"] == "varied"]),
        "personas": sorted({r["persona"] for r in rows}),
    }


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--no-write", action="store_true")
    args = ap.parse_args(argv)
    out = run()
    print(json.dumps(out, indent=2))
    if not args.no_write:
        RESULTS.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
