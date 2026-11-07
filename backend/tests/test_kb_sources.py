"""Knowledge-base sources (card A5, issue #42): early-pregnancy pain is retrievable, and every source records when its
link was last checked."""

import yaml

from app.config import SOURCES_PATH
from app.rag.retrieve import search


def test_one_sided_pain_and_a_missed_period_finds_the_ectopic_pregnancy_guideline(seeded):
    top = [p.source_id for p in search("one-sided pain and a missed period", k=4, lang="en")]
    assert "nice_ng126" in top, top


def test_every_source_says_when_its_link_was_checked():
    entries = yaml.safe_load(SOURCES_PATH.read_text(encoding="utf-8"))
    assert all(str(e.get("accessed", "")).startswith("2026-") for e in entries), [
        e["id"] for e in entries if not e.get("accessed")
    ]


def test_search_skips_an_indexed_source_that_is_no_longer_in_sources_yaml(seeded, monkeypatch):
    # The hosted index is built on first boot only, so a removed source (like the withdrawn ACOG opinion) can still be
    # indexed until Reset demo data. It must never be returned, or the assistant would cite it (or fail on it).
    from app.rag import retrieve

    retrieve.idf()  # cached with the full source list, as in the running app
    known = {k: v for k, v in retrieve.sources().items() if k != "nhs_heavy_periods"}
    monkeypatch.setattr(retrieve, "sources", lambda: known)
    found = [p.source_id for p in retrieve.search("signs of heavy periods", k=6, lang="en")]
    assert found and "nhs_heavy_periods" not in found, found


def test_asking_whether_it_is_pmos_is_refused_like_pcos(seeded):
    # The NHS renamed PCOS to PMOS; a diagnosis request under the new name gets the same polite refusal.
    from app.agents.assistant import answer

    assert answer("Is it PMOS?", "en")["refused"] and answer("Is it PCOS?", "en")["refused"]


def test_crisis_sources_are_cite_only():
    # They back the fixed crisis reply. Indexed, their sentences ("Do not drive yourself to the emergency department")
    # attached to unrelated answers by shared words.
    from app.rag.kb import chunks, sources

    for sid in ("nhs_suicidal_thoughts", "nhs_urgent_mental_health"):
        assert sid in sources() and not sources()[sid].answers
        assert not [c for c in chunks() if c.source_id == sid]


def test_a_general_pregnancy_answer_never_quotes_the_early_pregnancy_guideline(seeded):
    # NG126 covers the first 13 weeks, and word matching cannot tell a 6-week question from a 30-week one. Quoted, it
    # put ectopic-pregnancy warnings into answers on caffeine, swollen feet and late pregnancy (42 answers judged worse),
    # so it is indexed and retrievable (above) but never quoted (quote: false).
    from app.agents.assistant import answer
    from app.rag.kb import sources

    assert not sources()["nice_ng126"].quote
    a = answer("Pregnant karak addict: does tea count as caffeine?", "en")
    assert "nice_ng126" not in [c["source_id"] for c in a["citations"]], a["answer"]


def test_pcos_signs_still_answer_after_the_pmos_rename(seeded):
    # The NHS renamed the page. A summary written around the new name lost the signs sentence to word matching.
    from app.agents.assistant import answer

    a = answer("What are common signs of polycystic ovary syndrome?", "en")
    assert "nhs_pcos" in [c["source_id"] for c in a["citations"]] and "acne" in a["answer"], a["answer"]
