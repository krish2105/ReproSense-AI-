"""Her next period as an honest date range from her own cycles (docs/31 §G).

A transparent statistical model on her own record, not a fixed 28 days and never a percentage:
- regular cycles: centred on the median of her last 6 complete cycle lengths, half-width
  max(2, ceil(1.4826 x median absolute deviation)) days, at most 7. 1.4826 x MAD estimates one standard deviation
  without letting one odd cycle stretch the range;
- cycles that vary (the rules' irregular-cycles pattern, a spread over 7 days, or perimenopause): the range runs from
  her shortest to her longest recent cycle, and the screen says her cycles have varied;
- fewer than 2 complete cycles: no date at all ("log one more period").
Phases and the fertile window are unchanged and stay in app/services/views.py (never contraceptive advice).
Back-tested on the fictional personas by app/services/forecast_eval.py.
"""

from __future__ import annotations

import math
import statistics
from datetime import date, timedelta

MIN_CYCLES = 2
LOOKBACK = 6
MIN_HALF_WIDTH = 2
MAX_HALF_WIDTH = 7


def forecast(lengths: list[int | None], last_start: date, varied: bool) -> dict | None:
    lens = [int(x) for x in lengths if x][-LOOKBACK:]
    if len(lens) < MIN_CYCLES:
        return None
    if varied:
        lo, hi, kind = min(lens), max(lens), "varied"
    else:
        centre = statistics.median(lens)
        mad = statistics.median([abs(x - centre) for x in lens])
        half = min(MAX_HALF_WIDTH, max(MIN_HALF_WIDTH, math.ceil(1.4826 * mad)))
        mid = math.floor(centre + 0.5)
        lo, hi, kind = mid - half, mid + half, "regular"
    return {
        "from": (last_start + timedelta(days=lo)).isoformat(),
        "to": (last_start + timedelta(days=hi)).isoformat(),
        "kind": kind,
        "cycles_used": len(lens),
        "shortest": min(lens),
        "longest": max(lens),
    }
