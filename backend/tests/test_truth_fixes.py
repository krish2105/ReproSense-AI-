"""Truth fixes found in the 7 Nov rescore: numbers she sees must match what she logged or what the lab printed."""

from app.agents import copy as cp
from app.services.documents import extract


def _row(text: str) -> dict:
    rows = extract(text)["rows"]
    assert len(rows) == 1, rows
    return rows[0]


def test_a_converted_value_keeps_its_reference_range_in_the_same_unit():
    r = _row("Haemoglobin    130 g/L    120-150")
    assert (r["value"], r["unit"]) == (13.0, "g/dL")
    assert (r["ref_low"], r["ref_high"], r["flag"]) == (12.0, 15.0, "")  # was 120-150 and flagged L


def test_the_flag_is_set_in_the_printed_unit_before_rounding():
    # CHO review: 101 and 100 mg/dL both round to 5.6 mmol/L, so a flag set after rounding lost the H at the cut-off.
    assert _row("Fasting plasma glucose    101 mg/dL    <100")["flag"] == "H"
    assert _row("OGTT 2h glucose    141 mg/dL    <140")["flag"] == "H"


def test_glucose_conversion_still_converts_its_range():
    r = _row("Fasting plasma glucose    99 mg/dL    70-99")
    assert (r["value"], r["unit"], r["ref_low"], r["ref_high"]) == (5.5, "mmol/L", 3.9, 5.5)


def test_a_value_printed_with_a_comparator_keeps_it():
    r = _row("Ferritin    <5 ng/mL    15-150")
    assert r["value"] == "<5" and r["flag"] == "L"  # below 5 is below 15: low, but never stored as exactly 5
    r = _row("TSH    >100 mIU/L    0.4-4.0")
    assert r["value"] == ">100" and r["flag"] == "H"
    r = _row("Prolactin    <5 ng/mL    <25")
    assert r["value"] == "<5" and r["flag"] == ""  # inside the range


def test_the_pain_card_names_every_kind_of_day_it_counts():
    f = {"severe_pain_cycles_6": 4, "pain_impact_days_90": 6}
    en = cp.detail("OBS_SEVERE_CYCLICAL_PAIN", {}, f, "en")
    ar = cp.detail("OBS_SEVERE_CYCLICAL_PAIN", {}, f, "ar")
    doc = cp.clinician_detail("OBS_SEVERE_CYCLICAL_PAIN", f)
    assert "you missed work or study or stayed in bed" in en and "stayed in bed" in doc
    assert "غبتِ عن العمل أو الدراسة أو بقيتِ في السرير" in ar
    assert "6 من آخر 90 يوماً" in ar  # "n من آخر 90 يوماً" reads right for any n (no أيام/يوماً agreement)
