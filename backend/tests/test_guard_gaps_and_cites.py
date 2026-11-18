"""Gate G2 proposal from the 7 Nov rescore (needs Krishna's approval before merge).

1. The diagnostic-wording guard missed the app's own diacritised feminine Arabic (لديكِ, أنتِ), Gulf عندكِ, and hedged
   English ("you likely have PCOS", "this looks like PCOS"). It is latent while the model is off and goes live with B2.
2. Urgent replies cite a source that covers their text: NG126 for a pregnancy loss, and the NHS crisis pages for the
   "too many tablets" line (QUESTIONS #52, #59).
"""

import pytest

from app.agents import assistant
from app.ai.guards import violations

BLOCKED = [
    "لديكِ متلازمة تكيس المبايض.",
    "أنتِ مصابة بالانتباذ البطاني الرحمي.",
    "انتي مصابة بفقر الدم.",
    "عندكِ متلازمة تكيس المبايض.",
    "عندك تكيس على المبايض.",
    "You likely have PCOS.",
    "You probably have endometriosis.",
    "You may have polycystic ovary syndrome.",
    "This looks like PCOS.",
    "It sounds like endometriosis to me.",
]
ALLOWED = [
    "You have been logging for 7 cycles.",
    "You may have noticed your cycles getting longer.",
    "You might have questions for your doctor.",
    "This looks like a pattern worth discussing with a doctor.",
    "It sounds like your periods have been painful.",
    "لديكِ سؤال جيد.",
    "عندكِ موعد مع الطبيبة الأسبوع القادم.",
    "يمكنكِ مناقشة هذا النمط مع طبيبة نساء.",
]


@pytest.mark.parametrize("text", BLOCKED)
def test_diagnostic_wordings_are_blocked(text):
    assert violations(text), text


@pytest.mark.parametrize("text", ALLOWED)
def test_kind_reporting_wordings_pass(text):
    assert violations(text) == [], text


def test_the_crisis_reply_cites_the_crisis_pages():
    out = assistant.answer("I took too many tablets and I want to die", "en")
    assert out["crisis"]
    ids = [c["source_id"] for c in out["citations"]]
    assert ids == ["nhs_urgent_mental_health", "nhs_suicidal_thoughts", "nice_cg192"]


def test_the_pregnancy_loss_reply_cites_ng126():
    out = assistant.answer("I had a miscarriage last week and now I have a fever", "en")
    assert out["urgent"]["kind"] == "postnatal"
    ids = [c["source_id"] for c in out["citations"]]
    assert ids[:2] == ["nice_ng194", "nice_ng126"]
    assert out["answer"].startswith(assistant.URGENT_TEXT["en"]["postnatal"] + " [1][2]") or not out["sentences"]
