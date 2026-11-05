"""Rules engine tests: the expression language, all 8 personas, all 6 red flags, the crisis path, copy safety."""

import copy
import json
from datetime import date, timedelta
from pathlib import Path

import pytest
import yaml

from app.config import DATA_DIR, SOURCES_PATH
from app.rules import expr
from app.rules.engine import evaluate, load_rules

REF = date(2026, 11, 22)
PERSONAS = {p.stem: json.loads(p.read_text()) for p in sorted((DATA_DIR / "personas").glob("*.json"))}
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
BANNED = [
    "you have",
    "you are diagnosed",
    "diagnosis of",
    "% chance",
    "probability of",
    "you are infertile",
    "cure",
    "guaranteed",
]


# ---------- expression language ----------
@pytest.mark.parametrize(
    "src,ctx,want",
    [
        ("a and b or c", {"a": True, "b": False, "c": True}, True),  # and binds tighter than or
        ("a and (b or c)", {"a": False, "b": True, "c": True}, False),
        ("not a", {"a": False}, True),
        ("24 <= w <= 28", {"w": 24}, True),
        ("24 <= w <= 28", {"w": 29}, False),
        ("x >= 10", {"x": None}, False),  # missing value never satisfies a comparison
        ("x > 2.5", {"x": 3}, True),
        ("a == true", {"a": True}, True),
        ("w <= 6 and (h and v or f)", {"w": 3, "h": False, "v": True, "f": True}, True),  # RF6 shape
    ],
)
def test_expressions(src, ctx, want):
    assert expr.evaluate(expr.parse(src), ctx) is want


@pytest.mark.parametrize("bad", ["a and", "(a or b", "a ++ b", "import os", "a.b", "__class__()"])
def test_syntax_errors_are_rejected(bad):
    with pytest.raises((expr.RuleSyntaxError, expr.UnknownName)):
        expr.evaluate(expr.parse(bad), {"a": True, "b": True, "import": 1, "os": 1, "__class__": 1})


def test_unknown_name_raises():
    with pytest.raises(expr.UnknownName):
        expr.evaluate(expr.parse("typo_name > 1"), {})


def test_every_rule_parses_and_only_uses_known_names():
    rs = load_rules()
    ev = evaluate(PERSONAS["amina"], REF)
    known = set(ev.features.values) | {r.id for r in rs.red_flags + rs.observations}
    from app.rules.features import DAY_SYMPTOMS

    known |= set(DAY_SYMPTOMS)
    for r in rs.red_flags + rs.observations:
        assert expr.names(r.node) <= known, (r.id, expr.names(r.node) - known)


# ---------- personas ----------
@pytest.mark.parametrize("pid", sorted(EXPECTED))
def test_persona_gets_expected_observations(pid):
    ev = evaluate(PERSONAS[pid], REF)
    assert {h.rule_id for h in ev.all_hits} == EXPECTED[pid]


@pytest.mark.parametrize("pid", sorted(EXPECTED))
def test_engine_matches_generator_self_check(pid):
    """Parity with the generator's own validation (QUESTIONS #26): the two must never silently diverge."""
    assert {h.rule_id for h in evaluate(PERSONAS[pid], REF).all_hits} == set(PERSONAS[pid]["expected_observations"])


def test_observations_explain_themselves():
    """Rule 3: every observation has supporting entries (or the profile values it used), a source and next steps."""
    for pid, p in PERSONAS.items():
        for h in evaluate(p, REF).all_hits:
            assert h.source_ids, (pid, h.rule_id)
            assert h.supporting_entry_ids or h.values, (pid, h.rule_id)
            if h.kind != "red_flag":
                assert h.next_steps, (pid, h.rule_id)


def test_supporting_entries_exist_in_her_record():
    for pid, p in PERSONAS.items():
        ids = {lg["id"] for lg in p["daily_logs"]} | {e["id"] for e in p["events"]}
        for h in evaluate(p, REF).all_hits:
            assert set(h.supporting_entry_ids) <= ids, (pid, h.rule_id)


def test_noura_irregular_evidence_points_at_cycle_starts():
    h = next(h for h in evaluate(PERSONAS["noura"], REF).all_hits if h.rule_id == "OBS_IRREGULAR_CYCLES")
    by_id = {lg["id"]: lg for lg in PERSONAS["noura"]["daily_logs"]}
    assert all(by_id[i]["flow"] != "none" for i in h.supporting_entry_ids if i in by_id)
    assert h.values["irregular_cycle_count_6"] >= 2


# ---------- red flags (run first, day-level, windowed) ----------
def _with_log(pid: str, **log) -> dict:
    p = copy.deepcopy(PERSONAS[pid])
    entry = {
        "id": f"{pid}-test",
        "date": REF.isoformat(),
        "flow": "none",
        "pain": 0,
        "pain_sites": [],
        "symptoms": [],
        "impact": "none",
        "pbac": 0,
    }
    entry.update(log)
    p["daily_logs"].append(entry)
    return p


def _rf(p: dict) -> set[str]:
    return {h.rule_id for h in evaluate(p, REF).red_flags}


def test_rf1_heavy_bleeding_with_dizziness():
    assert "RF1_heavy_bleeding_with_dizziness" in _rf(_with_log("amina", flow="heavy", symptoms=["fainting"]))


def test_rf1_pins_the_entry_date():
    h = next(h for h in evaluate(PERSONAS["sara"], REF).red_flags if h.rule_id.startswith("RF1"))
    assert h.entry_date and h.supporting_entry_ids


def test_rf2_sudden_severe_pain_with_fever():
    assert "RF2_severe_sudden_pain_possible_pregnancy" in _rf(
        _with_log("amina", symptoms=["sudden severe pain", "fever"])
    )


def test_rf3_bleeding_in_pregnancy():
    assert "RF3_postmenopausal_or_pregnancy_bleeding" in _rf(_with_log("hessa", flow="light"))


def test_rf4_self_harm_opens_crisis_path_and_hides_mood_card():
    p = copy.deepcopy(PERSONAS["fatima"])
    p["events"].append(
        {
            "id": "fatima-epds2",
            "type": "questionnaire",
            "date": REF.isoformat(),
            "details": {"tool": "EPDS", "total": 14, "item10": 1},
        }
    )
    ev = evaluate(p, REF)
    assert ev.crisis and "RF4_SELF_HARM_THOUGHTS" in {h.rule_id for h in ev.red_flags}
    assert "OBS_POSTPARTUM_MOOD" not in {h.rule_id for h in ev.observations}
    assert "OBS_POSTPARTUM_MOOD" in ev.suppressed


def test_rf5_pregnancy_warning_signs():
    assert "RF5_PREGNANCY_WARNING_SIGNS" in _rf(_with_log("hessa", symptoms=["reduced baby movements"]))
    assert "RF5_PREGNANCY_WARNING_SIGNS" in _rf(_with_log("hessa", symptoms=["severe headache", "vision changes"]))


def test_rf5_needs_both_headache_and_vision_change():
    assert "RF5_PREGNANCY_WARNING_SIGNS" not in _rf(_with_log("hessa", symptoms=["severe headache"]))


def test_rf6_after_birth_warning_signs_within_six_weeks():
    p = copy.deepcopy(PERSONAS["fatima"])
    for e in p["events"]:
        if e["type"] == "delivery":
            e["date"] = (REF - timedelta(days=20)).isoformat()
    p["daily_logs"].append(
        {
            "id": "f-t",
            "date": REF.isoformat(),
            "flow": "none",
            "pain": 0,
            "symptoms": ["fever"],
            "impact": "none",
            "pbac": 0,
        }
    )
    assert "RF6_POSTPARTUM_WARNING_SIGNS" in _rf(p)


def test_rf6_not_after_six_weeks():
    assert "RF6_POSTPARTUM_WARNING_SIGNS" not in _rf(_with_log("fatima", symptoms=["fever"]))  # Fatima is at 9 weeks


def test_red_flag_outside_window_does_not_fire():
    p = _with_log("amina", flow="heavy", symptoms=["dizziness"], date=(REF - timedelta(days=30)).isoformat())
    assert "RF1_heavy_bleeding_with_dizziness" not in _rf(p)


def test_red_flags_are_listed_before_observations():
    ev = evaluate(PERSONAS["sara"], REF)
    assert ev.all_hits[0].kind == "red_flag"


# ---------- copy safety in the rules file ----------
def test_rule_copy_has_no_banned_phrases():
    from app.ai.guards import violations

    for r in load_rules().red_flags + load_rules().observations:
        for text in [r.title_en, r.message_en, r.explains, *r.next_steps_en]:
            assert not violations(text), (r.id, text, violations(text))


@pytest.mark.parametrize(
    "bad",
    [
        "You have PCOS.",
        "you are diagnosed with endometriosis",
        "73% chance of PCOS",
        "There is a probability of infertility",
        "You are infertile",
        "This will cure it",
        "لديك متلازمة تكيس المبايض",
        "تم تشخيصك",
        "نسبة احتمال الإصابة",
    ],
)
def test_guard_blocks_diagnostic_language(bad):
    from app.ai.guards import violations

    assert violations(bad)


@pytest.mark.parametrize(
    "ok",
    [
        "Tell someone how you have been feeling.",
        "You have logged 6 cycles.",
        "Bring this report; it keeps your data secure.",
        "A pattern worth discussing with a doctor.",
    ],
)
def test_guard_allows_kind_reporting_language(ok):
    from app.ai.guards import violations

    assert not violations(ok)


def test_rule_sources_exist():
    ids = {s["id"] for s in yaml.safe_load(Path(SOURCES_PATH).read_text())}
    for r in load_rules().red_flags + load_rules().observations:
        assert set(r.source_ids) <= ids, r.id


def test_emergency_number_is_uae_998():
    assert load_rules().emergency_number == "998"
