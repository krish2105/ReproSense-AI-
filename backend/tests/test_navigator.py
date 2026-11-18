"""The care navigator's appointment request is written as her (issue #66).

The generic template says "I would like an appointment to discuss a pattern I noticed in my record: {pattern}". The card
titles speak to her ("Your cycle lengths have been irregular", Arabic "أطوال دوراتك"), so pasting a title into her own
message mixed the two voices. Every pattern that uses the generic template must read in her voice, in both languages.
"""

import re
from types import SimpleNamespace

import pytest

from app.agents import navigator
from app.rules.engine import Hit, load_rules

GENERIC_RULES = [r for r in load_rules().observations if r.id not in navigator.TEMPLATES]
_DIAC = re.compile(r"[ً-ْٰـ]")


def _draft(rule) -> dict:
    hit = Hit(
        rule_id=rule.id,
        kind=rule.kind,
        urgency=rule.urgency,
        title=rule.title_en,
        message="",
        explains="",
        next_steps=[],
        source_ids=rule.source_ids,
        supporting_entry_ids=[],
        values={},
    )
    ev = SimpleNamespace(features=SimpleNamespace(values={}))
    return navigator.draft(hit, ev, "Test Clinic")


def test_the_generic_template_covers_the_patterns_that_need_it():
    assert {r.id for r in GENERIC_RULES} >= {"OBS_IRREGULAR_CYCLES", "OBS_SEVERE_CYCLICAL_PAIN", "OBS_POSTPARTUM_MOOD"}


@pytest.mark.parametrize("rule", GENERIC_RULES, ids=lambda r: r.id)
def test_her_appointment_request_is_in_her_own_voice(rule):
    d = _draft(rule)
    assert not re.search(r"\byour\b", d["message_en"], re.I), d["message_en"]
    # Arabic second person ("دوراتك", "حياتك", "يفيدك"): no word of her message ends in كَ/كِ
    words = re.findall(r"[؀-ۿ]+", _DIAC.sub("", d["message_ar"]))
    assert not [w for w in words if w.endswith("ك")], d["message_ar"]


def test_the_irregular_cycles_request_reads_naturally():
    d = _draft(next(r for r in GENERIC_RULES if r.id == "OBS_IRREGULAR_CYCLES"))
    assert "a pattern I noticed in my record: my cycle lengths have been irregular." in d["message_en"]
    assert "أطوال دوراتي كانت غير منتظمة" in d["message_ar"]
