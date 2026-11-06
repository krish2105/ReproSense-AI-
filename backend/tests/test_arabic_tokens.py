"""Arabic punctuation is not part of a word (the ar04 eval miss): "غزيرة؟" must match "غزيرة" and get its expansion."""

from app.rag.embed import tokens
from app.rag.retrieve import expand_query, query_terms


def test_arabic_punctuation_does_not_stick_to_the_word():
    for mark in ("؟", "،", "؛"):
        assert tokens(f"الدورة غزيرة{mark}") == tokens("الدورة غزيرة")


def test_a_question_mark_does_not_block_the_glossary_expansion():
    assert "heavy" in expand_query("متى تُعتبر الدورة غزيرة؟")
    assert query_terms("متى تُعتبر الدورة غزيرة؟") == query_terms("متى تُعتبر الدورة غزيرة")
