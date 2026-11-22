"""The one-page pilot proposal PDF (GET /v1/pilot/proposal.pdf, docs/29): public, English and Arabic, one A4 page,
built from the web app's own messages, every source shown, no personal data, and rate limited like every /v1 path."""

from __future__ import annotations

import json
import re
from html import escape, unescape

import pytest
from fastapi.testclient import TestClient

from app.ai.guards import violations
from app.config import DATA_DIR, ROOT, get_settings
from app.rag.kb import sources
from app.reports import pilot_proposal

MESSAGES = ROOT / "apps" / "web" / "messages"


@pytest.fixture(scope="module")
def anon(seeded):
    from app.main import app

    return TestClient(app)  # a fresh client: no cookie and no token, like a clinic manager opening the link


def _messages(lang: str) -> dict:
    return json.loads((MESSAGES / f"{lang}.json").read_text(encoding="utf-8"))["pilotProposal"]


@pytest.mark.parametrize("lang", ["en", "ar"])
def test_the_proposal_pdf_downloads_without_signing_in(anon, lang):
    r = anon.get("/v1/pilot/proposal.pdf", params={"lang": lang})
    assert r.status_code == 200, r.text
    assert r.headers["content-type"] == "application/pdf"
    assert r.content[:5] == b"%PDF-" and len(r.content) > 10_000
    assert r.headers["content-disposition"] == f'attachment; filename="reprosense-pilot-proposal-{lang}.pdf"'


def test_english_is_the_default_and_other_languages_are_refused(anon):
    assert anon.get("/v1/pilot/proposal.pdf").headers["content-disposition"].endswith('-en.pdf"')
    assert anon.get("/v1/pilot/proposal.pdf", params={"lang": "fr"}).status_code == 422


@pytest.mark.parametrize("lang", ["en", "ar"])
def test_it_fits_on_one_a4_page(lang):
    # The fonts are the web app's own files, so the page count does not depend on the fonts the host has installed.
    assert pilot_proposal.page_count(lang) == 1


def test_a_second_download_is_served_from_memory(anon):
    anon.get("/v1/pilot/proposal.pdf", params={"lang": "ar"})
    before = pilot_proposal._pdf.cache_info().hits
    anon.get("/v1/pilot/proposal.pdf", params={"lang": "ar"})
    assert pilot_proposal._pdf.cache_info().hits == before + 1


@pytest.mark.parametrize("lang", ["en", "ar"])
def test_the_words_are_the_web_pages_words(lang):
    m, html = _messages(lang), pilot_proposal.render_html(lang)
    assert f"lang='{lang}' dir='{'rtl' if lang == 'ar' else 'ltr'}'" in html
    for text in (
        m["title"],
        m["kpis"]["k1"]["name"],
        m["kpis"]["k5"]["how"],
        m["price"]["pilot"],
        m["price"]["after"],
        m["exit"]["stop"]["s1"],
        m["timeline"]["p4"]["body"],
        m["data"]["items"]["d5"],
    ):
        assert escape(text) in html, text


def test_every_kpi_and_every_cited_source_is_in_it():
    m, html = _messages("en"), pilot_proposal.render_html("en")
    for k in ("k1", "k2", "k3", "k4", "k5"):
        assert escape(m["kpis"][k]["name"]) in html
    src = sources()
    for sid in pilot_proposal.SOURCE_IDS:
        assert sid in src, sid
        assert escape(src[sid].url) in html
    # no price before the pilot (22 Nov): the offer says the price is agreed from what the pilot measured
    assert "AED" not in html and escape(m["price"]["after"]) in html
    assert escape(m["basis"]["app"]) in html and escape(m["basis"]["source"]) in html


@pytest.mark.parametrize("lang", ["en", "ar"])
def test_no_personal_data_and_no_diagnostic_wording(lang):
    body = pilot_proposal.render_html(lang).split("<body>", 1)[1]  # the words on the page, not the font rules
    text = unescape(re.sub(r"<[^>]+>", " ", body))
    assert violations(text) == []
    names = [
        json.loads(p.read_text(encoding="utf-8")).get("profile", {}).get("alias")
        for p in (DATA_DIR / "personas").glob("*.json")
    ]
    for name in [n for n in names if n] + ["Noura", "Fatima", "Hessa", "@", "+971"]:
        assert name not in text, name
    assert "998" in text  # the safety line, as on every screen


def test_it_counts_against_the_general_rate_limit(anon, monkeypatch):
    monkeypatch.setattr(get_settings(), "rate_limit_per_min", 2)
    codes = [anon.get("/v1/pilot/proposal.pdf").status_code for _ in range(4)]
    assert codes[-1] == 429, codes
    limited = anon.get("/v1/pilot/proposal.pdf", params={"lang": "ar"})
    assert limited.status_code == 429 and limited.headers["retry-after"] == "60"


def test_a_missing_pdf_engine_is_a_clear_503(anon, monkeypatch):
    def broken(_lang):
        raise OSError("cannot load library 'pango'")

    monkeypatch.setattr(pilot_proposal, "pdf", broken)
    r = anon.get("/v1/pilot/proposal.pdf")
    assert r.status_code == 503 and "/pilot" in r.json()["detail"]
