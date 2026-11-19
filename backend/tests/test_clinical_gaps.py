"""Clinical gaps found in the 19 Nov audit (issues #98 and #99, QUESTIONS #49 R4). Gate G2, awaiting clinician sign-off.

1. The output guard let diagnostic wording through (#99): "your results suggest PCOS", "you seem to have PCOS",
   "consistent with", "you're suffering from", Arabic «يبدو أنك مصابة», Gulf «فيك تكيس», «تدل على». CLAUDE.md rule 1.
2. The assistant gave no urgent reply to a late or missed period with severe, sharp or one-sided pain (#98): a possible
   ectopic pregnancy, an emergency (NICE NG126). Routed to the pain reply (emergency department, 998), because the
   pregnancy reply's "maternity unit" may not fit an early, unconfirmed pregnancy. After a birth, a vision change or
   sudden swelling of her face, hands or feet (pre-eclampsia can start after the birth, nhs_pre_eclampsia) now gets
   the after-birth reply. Reviewed by the CHO agent on 19 Nov; its findings M1–M5, C1–C3 and C6 are applied here.
3. RF5 and RF6 counted a severe headache only together with a vision change. NICE NG133 1.1.1 lists severe headache,
   problems with vision and sudden swelling each as pre-eclampsia symptoms needing a healthcare professional
   immediately; NG194 (1.2.4, number to confirm) says a persistent or severe headache after birth needs advice without delay. RF5 also now
   counts fever in pregnancy (nhs_pregnancy_urgent). These are the 6 Nov clinical reviewer's R4 proposals.
"""

import copy
import json
from datetime import date, timedelta
from pathlib import Path

import pytest

from app.agents import assistant
from app.ai.guards import violations
from app.config import DATA_DIR
from app.rules.engine import evaluate

REF = date(2026, 11, 22)
PERSONAS = {p.stem: json.loads(p.read_text()) for p in sorted((DATA_DIR / "personas").glob("*.json"))}
KB = Path(__file__).resolve().parents[2] / "knowledge_base" / "summaries"


# ------------------------------------------------------------------------------------------------ 1. guard (#99)
@pytest.mark.parametrize(
    "text",
    [
        "Your results suggest PCOS.",
        "These symptoms suggest endometriosis.",
        "Your entries indicate polycystic ovary syndrome.",
        "This is consistent with PCOS.",
        "Your cycles are typical of PCOS.",
        "You seem to have PCOS.",
        "You appear to have endometriosis.",
        "It is likely PCOS.",
        "It's probably endometriosis.",
        "You're suffering from endometriosis.",
        "You are suffering from postnatal depression.",
        "يبدو أنك مصابة بتكيس المبايض",
        "يبدو انكِ مصابة ببطانة الرحم المهاجرة",
        "فيك تكيس",
        "عندج تكيس",
        "أعراضك تدل على بطانة الرحم المهاجرة",
        "نتائجك تشير إلى تكيس المبايض",
        # clinical review (G1): tied to a condition name
        "You've got PCOS.",
        "This could be endometriosis.",
        "You might be suffering from endometriosis.",
        "It may be pre-eclampsia.",
        "تعانين من تكيس المبايض",
        "قد تكونين مصابة بتسمم الحمل",
    ],
)
def test_more_diagnostic_wordings_are_blocked(text):
    assert violations(text), text


@pytest.mark.parametrize(
    "text",
    [
        "A pattern worth discussing with a doctor.",
        "Irregular cycles are one feature doctors look at when considering PCOS.",
        "PCOS is a common condition that affects how the ovaries work.",
        "Endometriosis is one possible cause.",
        "Only a doctor can assess this.",
        "Your entries suggest it is worth booking an appointment.",
        "Symptoms that suggest heavy bleeding include flooding and large clots.",
        "A score of 10 or more suggests it is worth a conversation with a doctor.",
        "This is not a diagnosis.",
        "قد يكون من المفيد مناقشة هذا مع طبيبة.",
        "You've got this.",
        "If you suffer from heavy periods, see a doctor.",
        "It could be worth asking your doctor.",
        "Pre-eclampsia can start in the weeks after the birth.",
    ],
)
def test_teaching_and_reporting_wordings_still_pass(text):
    assert not violations(text), (text, violations(text))


def test_no_knowledge_base_summary_trips_the_guard():
    """The assistant quotes these summaries; the new patterns must not block a sentence in them."""
    for f in sorted(KB.glob("*.md")):
        for line in f.read_text(encoding="utf-8").splitlines():
            if line.strip() and not line.startswith("#"):
                assert not violations(line), (f.name, line, violations(line))


# ------------------------------------------------------------------------------------- 2. assistant routing (#98)
def route(q: str) -> str:
    if assistant._crisis(q):
        return "crisis"
    return assistant._urgent_kind(q) or "answer"


@pytest.mark.parametrize(
    "q,expected",
    [
        # a late or missed period with severe, sharp or one-sided pain: possible ectopic pregnancy (NG126)
        ("my period is late and I have severe pain on one side", "pain"),
        ("I missed my period and the cramps are unbearable", "pain"),
        ("my period is late and I have sharp pain on my right side", "pain"),
        ("period late, stabbing pain low on the left", "pain"),
        ("دورتي متأخرة وعندي ألم شديد في جهة واحدة", "pain"),
        ("الدورة ما نزلت وعندي مغص قوي في الجنب اليمين", "pain"),
        # "might be pregnant" with severe pain keeps the pregnancy reply Krishna approved in #95 (G2); whether it should be
        # the emergency reply like a late period is a question for the clinical advisor (review C4)
        ("I might be pregnant and my pain is really bad", "pregnancy"),
        # saying "ectopic" must not switch the route off (M1); any pain with feeling faint (M2); shoulder tip (C6)
        ("My period is late and I have sharp pain on one side, could it be ectopic?", "pain"),
        ("period is late, I have cramps and feel faint", "pain"),
        ("my period is late and I have shoulder tip pain", "pain"),
        ("a confirmed pregnancy keeps the maternity-unit reply: I am 8 weeks pregnant and the pain is severe", "pregnancy"),
        # after the birth, pre-eclampsia signs (NG133 1.1.1)
        ("2 weeks postpartum and my vision is blurry", "postnatal"),
        ("I gave birth 10 days ago and my face suddenly swelled up", "postnatal"),
        # near misses that stay ordinary answers
        ("my period is late", "answer"),
        ("my period is late, what could cause that?", "answer"),
        ("I have bad period pain", "answer"),
        ("I have severe period pain again this month", "answer"),
        ("my period is late and I have mild cramps", "answer"),
        ("after birth my legs are a bit swollen", "answer"),
        ("period is late, cramps are mild, not severe", "answer"),  # negated severity (C3)
        # everyday new-mother questions that must not get the 998 reply (M3)
        ("2 weeks after birth, can my baby watch television?", "answer"),
        ("my baby was born 2 weeks ago and has little spots on his face", "answer"),
        ("I gave birth 5 days ago and have dark spots on my face", "answer"),
        ("since the birth my breasts suddenly swelled", "answer"),
    ],
)
def test_late_period_with_severe_pain_and_after_birth_signs(q, expected):
    assert route(q) == expected


# --------------------------------------------------------------------------------------------- 3. RF5 and RF6 (R4)
def _with_log(pid: str, **log) -> dict:
    p = copy.deepcopy(PERSONAS[pid])
    entry = {"id": f"{pid}-gap", "date": REF.isoformat(), "flow": "none", "pain": 0, "pain_sites": [], "symptoms": [], "impact": "none", "pbac": 0}
    entry.update(log)
    p["daily_logs"].append(entry)
    return p


def _rf(p: dict) -> set[str]:
    return {h.rule_id for h in evaluate(p, REF).red_flags}


def _birth_days_ago(pid: str, days: int, **log) -> dict:
    p = _with_log(pid, **log)
    for e in p["events"]:
        if e["type"] == "delivery":
            e["date"] = (REF - timedelta(days=days)).isoformat()
    return p


@pytest.mark.parametrize("sign", ["severe headache", "vision changes", "sudden swelling", "fever"])
def test_rf5_each_warning_sign_alone_in_pregnancy(sign):
    assert "RF5_PREGNANCY_WARNING_SIGNS" in _rf(_with_log("hessa", symptoms=[sign]))


@pytest.mark.parametrize("sign", ["severe headache", "vision changes", "sudden swelling"])
def test_rf6_each_pre_eclampsia_sign_alone_after_birth(sign):
    assert "RF6_POSTPARTUM_WARNING_SIGNS" in _rf(_birth_days_ago("fatima", 20, symptoms=[sign]))


def test_rf5_and_rf6_stay_quiet_outside_pregnancy_and_the_six_weeks():
    assert not _rf(_with_log("noura", symptoms=["severe headache"])) & {"RF5_PREGNANCY_WARNING_SIGNS", "RF6_POSTPARTUM_WARNING_SIGNS"}
    assert "RF6_POSTPARTUM_WARNING_SIGNS" not in _rf(_with_log("fatima", symptoms=["severe headache"]))  # 9 weeks after
    assert "RF5_PREGNANCY_WARNING_SIGNS" not in _rf(_with_log("hessa", symptoms=["headache"]))  # an ordinary headache


def test_the_after_birth_reply_names_vision_and_swelling_and_cites_pre_eclampsia():
    for lang, words in (("en", ("vision", "face, hands or feet")), ("ar", ("الرؤية", "الوجه أو اليدين أو القدمين"))):
        text = assistant.URGENT_TEXT[lang]["postnatal"]
        assert all(w in text for w in words), (lang, text)
    assert "nhs_pre_eclampsia" in assistant.URGENT_SOURCES["postnatal"]
