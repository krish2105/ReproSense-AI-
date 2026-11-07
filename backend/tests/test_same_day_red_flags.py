"""Red flags read every row for a date together (Atharva's 7 Nov handoff, step 4a).

A second browser tab, the phone app, or a seeded row plus her own entry can leave two rows on one date. RF1 needs heavy
flow and dizziness on the same day; split across two rows, the engine used to check each row alone and miss it."""

import copy
import json
from datetime import date

from app.config import DATA_DIR
from app.rules.engine import evaluate

REF = date(2026, 11, 22)
AMINA = json.loads((DATA_DIR / "personas" / "amina.json").read_text())


def _row(rid: str, day: str, **kw) -> dict:
    row = {"id": rid, "date": day, "flow": "none", "pain": 0, "pain_sites": [], "symptoms": [], "impact": "none", "pbac": 0}
    row.update(kw)
    return row


def _with(*rows: dict) -> dict:
    p = copy.deepcopy(AMINA)
    p["daily_logs"].extend(rows)
    return p


def _rf1(p: dict):
    return next((h for h in evaluate(p, REF).red_flags if h.rule_id == "RF1_heavy_bleeding_with_dizziness"), None)


def test_heavy_flow_and_dizziness_in_two_rows_on_one_date_raise_rf1():
    hit = _rf1(_with(_row("a-app", "2026-11-22", flow="heavy"), _row("a-phone", "2026-11-22", symptoms=["dizziness"])))
    assert hit is not None
    assert set(hit.supporting_entry_ids) == {"a-app", "a-phone"}
    assert hit.entry_date == "2026-11-22"


def test_the_same_two_signs_on_different_dates_do_not_raise_rf1():
    assert _rf1(_with(_row("a-1", "2026-11-21", flow="heavy"), _row("a-2", "2026-11-22", symptoms=["dizziness"]))) is None


def test_one_row_with_both_signs_still_raises_rf1_and_cites_only_that_row():
    hit = _rf1(_with(_row("a-1", "2026-11-22", flow="heavy", symptoms=["dizziness"]), _row("a-2", "2026-11-22", mood="calm")))
    assert hit is not None and hit.supporting_entry_ids == ["a-1"]
