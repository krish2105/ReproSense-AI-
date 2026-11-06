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
