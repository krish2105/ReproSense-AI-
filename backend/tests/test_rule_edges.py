"""Card A9 rule edge cases: an adolescent, perimenopause, breastfeeding, a new record, hormonal contraception.

Each case deep-copies a persona, changes her profile, cycles or logs, and pins every rule id she gets (all_hits).
Where that differs from the card, the row says so; rules/clinical_rules.yaml changes need the clinical advisor.
"""

import copy
import json
from datetime import date

import pytest

from app.config import DATA_DIR
from app.rules.engine import evaluate

REF = date(2026, 11, 22)
PERSONAS = {p.stem: json.loads(p.read_text()) for p in sorted((DATA_DIR / "personas").glob("*.json"))}


def _adolescent() -> dict:
    p = copy.deepcopy(PERSONAS["noura"])  # irregular cycles, normally fires
    p["profile"].update(age=15, menarche_age=13)  # 2 years after her first period
    return p


def _perimenopause_late_period_with_pain() -> dict:
    p = copy.deepcopy(PERSONAS["layla"])  # 47, perimenopause, not trying to conceive
    gone = p["cycles"].pop()  # drop her period of 13 days ago: the last one started 65 days ago, so it is late (> 35)
    p["daily_logs"] = [lg for lg in p["daily_logs"] if lg["flow"] == "none" or lg["date"] < gone["start"]]
    p["daily_logs"].append(
        {"id": "layla-test", "date": REF.isoformat(), "flow": "none", "pain": 9, "symptoms": ["sudden severe pain"]}
    )
    return p


def _breastfeeding_no_periods() -> dict:
    p = copy.deepcopy(PERSONAS["fatima"])  # breastfeeding 9 weeks after birth, no period since Dec 2025
    # Her own record has 1 complete cycle (the rule needs 4). Add 4 regular cycles logged before it, as a woman who used
    # the app before she conceived would have, so the rule's other gates are open.
    early = ["2025-07-29", "2025-08-27", "2025-09-25", "2025-10-24"]
    p["cycles"] = [{"start": s, "bleed_days": 5, "length_days": 29} for s in early] + p["cycles"]
    return p


def _new_record_5_regular_cycles() -> dict:
    p = copy.deepcopy(PERSONAS["amina"])  # regular cycles
    p["cycles"] = p["cycles"][-5:]  # 5 period starts over 137 days, 4 complete cycles (the QUESTIONS #48 case)
    p["daily_logs"] = [lg for lg in p["daily_logs"] if lg["date"] >= p["cycles"][0]["start"]]  # nothing before
    return p


def _hormonal_contraception_irregular_bleeding() -> dict:
    p = copy.deepcopy(PERSONAS["noura"])  # irregular cycles, acne and hair growth logged
    p["profile"]["on_hormonal_contraception"] = True
    return p


@pytest.mark.parametrize(
    "build,want",
    [
        pytest.param(_adolescent, set(), id="age-15-two-years-after-menarche"),
        pytest.param(
            _perimenopause_late_period_with_pain,
            {"RF2_severe_sudden_pain_possible_pregnancy", "OBS_PERIMENOPAUSE_SYMPTOMS"},
            id="perimenopause-47-late-period-sudden-pain",
        ),
        # Differs from card A9, which expects no irregular card. The rule has no breastfeeding gate: 5 complete cycles
        # before her pregnancy open cycles_logged >= 4, and 2 period starts in the last year make cycles_per_year < 8.
        pytest.param(
            _breastfeeding_no_periods,
            {"OBS_IRREGULAR_CYCLES", "CARE_POSTPARTUM_GLUCOSE_TEST", "OBS_POSTPARTUM_MOOD"},
            id="breastfeeding-no-periods",
        ),
        pytest.param(_new_record_5_regular_cycles, set(), id="new-record-5-regular-cycles"),
        # Records behaviour for the clinical advisor: only OBS_NO_PERIOD_90_DAYS reads on_hormonal_contraception, so
        # bleeding on hormonal contraception still gets the irregular card, and the androgen card with it.
        pytest.param(
            _hormonal_contraception_irregular_bleeding,
            {"OBS_IRREGULAR_CYCLES", "OBS_IRREGULAR_PLUS_ANDROGEN"},
            id="hormonal-contraception-irregular-bleeding",
        ),
    ],
)
def test_edge_case_rule_ids(build, want):
    assert {h.rule_id for h in evaluate(build(), REF).all_hits} == want
