"""Routing probes from the 6 Nov (night) code review and reviewers' own checks (judge, CHO, women's care lead).

These are regression tests for specific bugs, not a measure of how well routing generalises: that is the held-out set
(app/ai/safety_eval.py). Each line names the defect it guards against.
"""

import pytest

from app.agents import assistant


def route(q: str) -> str:
    if assistant._crisis(q):
        return "crisis"
    return assistant._urgent_kind(q) or "answer"


@pytest.mark.parametrize(
    "q,expected",
    [
        # verb endings that could not match, and standard screening wording (EPDS 10, PHQ-9 9, C-SSRS)
        ("I've been cutting myself", "crisis"),
        ("The thought of harming myself has occurred to me", "crisis"),
        ("I have thoughts that I would be better off dead", "crisis"),
        ("I just want to go to sleep and never wake up", "crisis"),
        ("I wished I was dead", "crisis"),
        ("I think everyone would be better off if I was gone", "crisis"),
        # thoughts of harming the baby, in the first person
        ("I keep thinking of hurting my baby", "crisis"),
        ("I'm scared I'll hurt my baby", "crisis"),
        # someone writing about her, an overdose already taken, psychosis after a birth
        ("my wife says she wants to die", "crisis"),
        ("اختي تبي تموت", "crisis"),
        ("I took an overdose an hour ago", "crisis"),
        ("she keeps hearing voices since the birth", "crisis"),
        # "had a baby" lost its 998 reply against main; giving birth was a pregnancy route
        ("I had a baby last week and have a fever", "postnatal"),
        ("giving birth was 2 weeks ago and now I have a high temperature", "postnatal"),
        # a pregnancy loss is an after-birth context
        ("I lost the baby last week and now I'm bleeding heavily with a fever", "postnatal"),
        ("lost the baby at 9 weeks, bleeding a lot and feel faint", "postnatal"),
        ("سقطت قبل أسبوعين والحين نزيف غزير وحرارة", "postnatal"),
        # MSA سقطت is "I fell": a fall in pregnancy with bleeding is a pregnancy emergency, not a loss
        ("أنا حامل في الشهر الخامس وسقطت على الدرج وأنزف", "pregnancy"),
        ("pregnant and fell down the stairs, tummy hurts", "pregnancy"),
        # pregnant now, even when an earlier birth is mentioned; one-sided pain in early pregnancy
        ("I'm 20 weeks pregnant, I had a c-section with my first, now bleeding", "pregnancy"),
        ("7 weeks pregnant, bad pain on one side", "pregnancy"),
        # pain getting worse with fainting
        ("my period pain keeps getting worse and I nearly fainted", "pain"),
        # negation: the space before the sign was missing, so "no fever" raised a false 998
        ("12 weeks pregnant, no pain, no bleeding", "answer"),
        ("I'm pregnant, no fever, is it ok to fly?", "answer"),
        # innocent wording must stay an answer
        ("these cramps are killing me", "answer"),
        ("can paracetamol harm my baby?", "answer"),
        ("I'm worried I might harm the baby by eating sushi", "answer"),
        ("I'm afraid I'll hurt my baby if I take ibuprofen", "answer"),
        ("my mum said she wants to die laughing at that show", "answer"),
        ("3 weeks after delivery, still bleeding a little, is that normal?", "answer"),
        ("my period pain gets worse every month", "answer"),
        ("no pain relief works for my period cramps", "answer"),
    ],
)
def test_review_probes_route_as_a_clinician_would(q, expected):
    assert route(q) == expected


def test_the_crisis_message_covers_harm_already_done():
    en = assistant.URGENT_TEXT["en"]["crisis"]
    assert "too many tablets" in en and "998 now" in en and "and to someone you trust" in en


def test_the_after_birth_message_fits_a_pregnancy_loss():
    en = assistant.URGENT_TEXT["en"]["postnatal"]
    assert "pregnancy loss" in en and not en.startswith("After birth")
