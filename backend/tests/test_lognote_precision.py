"""docs/31 §F: her words, read precisely, by the rule-based reader alone (no model).

tests/lognote_cases.jsonl holds labelled sentences in English and Gulf and standard Arabic: what she has, what she
says she does NOT have, words that only look like a symptom, which day she means, when to ask instead of guessing, and
questions that belong with the assistant. Every case must read exactly as labelled. Arabic cases are AR-REVIEW: written
with AI help, native check pending (docs/AR_REVIEW.md).

The urgent and crisis word checks are not part of this reader: they run on her raw words first (app/agents/safety.py),
so a "no" in a sentence can never hide an urgent sign; the last test proves it.
"""

import json
from pathlib import Path

import pytest

from app.services.lognote import parse, rule_parse

CASES = [
    json.loads(line)
    for line in Path(__file__).with_name("lognote_cases.jsonl").read_text(encoding="utf-8").splitlines()
    if line
]


def test_the_labelled_set_is_big_enough_and_in_both_languages():
    assert len(CASES) >= 120
    arabic = [c for c in CASES if any("؀" <= ch <= "ۿ" for ch in c["text"])]
    assert len(arabic) >= 30


@pytest.mark.parametrize("case", CASES, ids=[c["text"][:40] for c in CASES])
def test_each_sentence_reads_exactly_as_labelled(case):
    got = rule_parse(case["text"])
    assert sorted(got["symptoms"]) == sorted(case["symptoms"]), "symptoms"
    assert got["flow"] == case["flow"], "flow"
    assert got["impact"] == case["impact"], "impact"
    assert got["pain"] == case["pain"], "pain"
    assert sorted(got["negated"]) == sorted(case["negated"]), "said she does not have"
    assert got["day_offset"] == case["day_offset"], "which day"
    assert sorted(got["asks"]) == sorted(case["asks"]), "what to ask her"
    assert got["intent"] == case["intent"], "log or question"


def test_a_no_never_hides_an_urgent_sign():
    out = parse("no cramps, but I'm bleeding through a pad every hour and feel light-headed")
    assert out["urgent"] is not None and out["urgent"]["number"] == "998"
    assert out["intent"] == "urgent"
    assert "cramps" in out["negated"]


def test_the_model_never_logs_what_she_said_she_does_not_have():
    class Model:
        name = "fake"

        def complete_json(self, system, user, max_tokens):
            assert "does NOT have" in system  # the prompt carries the same rule
            return {"flow": None, "pain": None, "symptoms": ["cramps", "bloating"], "impact": None}

    out = parse("no cramps today, a bit off", model=Model())
    assert out["symptoms"] == ["bloating"] and out["negated"] == ["cramps"]
