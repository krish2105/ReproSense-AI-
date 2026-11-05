"""Team scorecard data: AI test results (from the last eval run) and live rule accuracy on the 8 personas."""

from __future__ import annotations

import json
from pathlib import Path

from fastapi import APIRouter

from app.config import get_settings
from app.db import SYSTEM, session
from app.rules.engine import evaluate, load_rules
from app.services.patient_data import load_bundle

router = APIRouter(prefix="/v1/quality", tags=["quality"])
RESULTS = Path(__file__).resolve().parents[1] / "ai" / "eval_results.json"
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


@router.get("")
def quality():
    ok = 0
    detail = []
    with session(SYSTEM) as cur:
        for pid, exp in EXPECTED.items():
            b = load_bundle(cur, pid, include_notes=False)
            if not b:
                continue
            got = {h.rule_id for h in evaluate(b, get_settings().demo_ref_date).all_hits}
            ok += got == exp
            detail.append({"persona": pid, "expected": sorted(exp), "got": sorted(got), "pass": got == exp})
    evals = json.loads(RESULTS.read_text()) if RESULTS.exists() else None
    return {
        "rules_version": load_rules().version,
        "rule_accuracy": {"pass": ok, "of": len(EXPECTED), "detail": detail},
        "ai_eval": evals,
        "note": "Rule accuracy is computed live on the seeded data; AI eval numbers come from the last"
        " `pytest tests/test_rag_eval.py` run. Personas may change after demo edits; reset restores them.",
    }
