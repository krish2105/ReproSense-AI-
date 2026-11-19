"""The one-page pilot proposal for a clinic, as a PDF in English or Arabic (docs/29).

Public and static: no session, no database and no personal data. The words come from the web app's messages
(`apps/web/messages/{lang}.json`, namespace `pilotProposal`), so the page at /pilot#proposal and this PDF can never
say different things; the sources come from knowledge_base/sources.yaml. Rendered with WeasyPrint in the same style
as the doctor report (app/reports/pdf.py), once per language per process, then served from memory.
"""

from __future__ import annotations

import json
import threading
from functools import lru_cache
from html import escape

from app.config import ROOT
from app.rag.kb import sources

MESSAGES_DIR = ROOT / "apps" / "web" / "messages"  # the Docker image copies it to the same place (backend/Dockerfile)
FONTS_DIR = ROOT / "apps" / "web" / "src" / "app" / "fonts"  # the web app's own fonts (OFL), also copied into the image
LANGS = ("en", "ar")
PLUM, INK, INK2, RULE, TINT = "#4B3653", "#2E2233", "#6E5D73", "#EEE5EF", "#F7F1F8"

# Order of the cited sources in the PDF footer; [n] in the KPI table points here.
SOURCE_IDS = (
    "doh_jawda_pc_v7",
    "agarwal_2022_gdm_followup",
    "bashir_2022_gdm_mutabaah",
    "doh_postnatal_standard_2025",
    "lewis_sus_2018",
)
FONT_FILES = (
    ("RS Jakarta", "plus-jakarta-sans-latin-wght.woff2", "200 800"),
    ("RS Plex Arabic", "ibm-plex-sans-arabic-arabic-400.woff2", "400"),
    ("RS Plex Arabic", "ibm-plex-sans-arabic-arabic-700.woff2", "700"),
    ("RS Plex Latin", "ibm-plex-sans-arabic-latin-400.woff2", "400"),
    ("RS Plex Latin", "ibm-plex-sans-arabic-latin-700.woff2", "700"),
)
KPI_SOURCES = {"k1": (1, 2), "k2": (4,), "k3": (), "k4": (), "k5": (5,)}
KPI_BASIS = {"k1": "source", "k2": "source", "k3": "app", "k4": "app", "k5": "source"}
_lock = threading.Lock()


@lru_cache
def messages(lang: str) -> dict:
    """The `pilotProposal` and `chrome` namespaces for one language. Raises OSError if the messages are missing."""
    if lang not in LANGS:
        raise ValueError(f"unsupported language: {lang}")
    data = json.loads((MESSAGES_DIR / f"{lang}.json").read_text(encoding="utf-8"))
    return {"p": data["pilotProposal"], "chrome": data["chrome"]}


def _items(group: dict) -> str:
    return "".join(f"<li>{escape(v)}</li>" for _, v in sorted(group.items()))


def render_html(lang: str) -> str:
    m = messages(lang)
    p, chrome = m["p"], m["chrome"]
    src = sources()
    rtl = lang == "ar"

    def cites(key: str) -> str:
        return "".join(f"<sup>[{n}]</sup>" for n in KPI_SOURCES[key])

    kpis = "".join(
        f"<tr><td><b>{escape(p['kpis'][k]['name'])}</b></td><td>{escape(p['kpis'][k]['how'])}</td>"
        f"<td><span class='tag'>{escape(p['basis'][KPI_BASIS[k]])}</span> {escape(p['kpis'][k]['basis'])}{cites(k)}</td></tr>"
        for k in ("k1", "k2", "k3", "k4", "k5")
    )
    timeline = "".join(
        f"<tr><td class='when'>{escape(p['timeline'][k]['when'])}</td>"
        f"<td><b>{escape(p['timeline'][k]['what'])}.</b> {escape(p['timeline'][k]['body'])}</td></tr>"
        for k in ("p1", "p2", "p3", "p4")
    )
    design = "".join(
        f"<li>{escape(p['design'][k])}{'<sup>[3]</sup>' if k == 'small' else ''}</li>"
        for k in ("women", "clinicians", "length", "roles", "start", "small")
    )
    refs = "".join(
        f"<li>[{i}] {escape(src[s].title)}. <span dir='ltr'>{escape(src[s].url)}</span></li>"
        for i, s in enumerate(SOURCE_IDS, 1)
        if s in src
    )
    # The same files the web app serves, so the page fits on one A4 sheet whatever fonts the host has installed.
    fonts = "".join(
        f"@font-face {{ font-family: '{family}'; src: url('{(FONTS_DIR / file).as_uri()}'); font-weight: {weight}; }}\n"
        for family, file, weight in FONT_FILES
    )
    font = "'RS Plex Arabic', 'RS Plex Latin'" if rtl else "'RS Jakarta', 'RS Plex Arabic'"
    font += ", 'Noto Sans', 'DejaVu Sans', Arial, sans-serif"
    return f"""<!doctype html><html lang='{lang}' dir='{"rtl" if rtl else "ltr"}'><head><meta charset='utf-8'><style>
{fonts}@page {{ size: A4; margin: 8mm 10mm 7mm; }}
body {{ font-family: {font}; color: {INK}; font-size: 6.8pt; line-height: 1.22; margin: 0; }}
h1 {{ font-size: 13pt; margin: 0; color: {PLUM}; }}
h2 {{ font-size: 8.2pt; color: {PLUM}; margin: 5px 0 2px; }}
p {{ margin: 2px 0; }} ul {{ margin: 1px 0; padding-inline-start: 12px; }} li {{ margin: 0.5px 0; }}
.muted {{ color: {INK2}; font-size: 6.9pt; }}
.badge {{ display: inline-block; background: #F9E4F1; color: #8A2E6B; border-radius: 99px; padding: 1px 8px; font-size: 6.8pt; font-weight: 700; }}
.head {{ display: flex; justify-content: space-between; align-items: flex-end; gap: 10px; border-bottom: 2px solid {RULE}; padding-bottom: 5px; }}
.cols {{ display: flex; gap: 12px; }} .cols > div {{ flex: 1; min-width: 0; }}
table {{ width: 100%; border-collapse: collapse; font-size: 6.5pt; }}
td, th {{ border-bottom: 1px solid {RULE}; padding: 1.5px 3px; text-align: start; vertical-align: top; }}
th {{ color: {INK2}; font-size: 6.8pt; }}
td.when {{ white-space: nowrap; font-weight: 700; color: {PLUM}; }}
.tag {{ display: inline-block; background: {TINT}; color: {PLUM}; border-radius: 99px; padding: 0 5px; font-size: 6.4pt; font-weight: 700; }}
.box {{ border: 1px solid {RULE}; border-radius: 8px; padding: 4px 7px; margin-top: 4px; }}
sup {{ font-size: 5.6pt; }}
.refs {{ list-style: none; padding: 0; margin: 2px 0 0; }} .refs li {{ font-size: 5.9pt; color: {INK2}; margin: 0; }}
col.m {{ width: 21%; }} col.h {{ width: 45%; }} col.b {{ width: 34%; }}
</style></head><body>
<div class='head'><div><h1>{escape(p["title"])}</h1><p class='muted'>{escape(p["pdf"]["subtitle"])}</p></div>
<div style='text-align:end'><span class='badge'>{escape(p["eyebrow"])}</span><br><span class='badge'>{escape(chrome["badge"])}</span></div></div>
<p style='margin-top:4px'>{escape(p["intro"])}</p>
<div class='cols'><div>
<h2>{escape(p["who"]["title"])}</h2><p>{escape(p["who"]["body"])}</p>
<h2>{escape(p["scope"]["title"])}</h2><ul>{_items(p["scope"]["items"])}</ul>
<h2>{escape(p["design"]["title"])}</h2><ul>{design}</ul>
<h2>{escape(p["data"]["title"])}</h2><ul>{_items(p["data"]["items"])}</ul>
</div><div>
<h2>{escape(p["timeline"]["title"])}</h2><table>{timeline}</table>
<h2>{escape(p["clinic"]["title"])}</h2><ul>{_items(p["clinic"]["items"])}</ul>
<h2>{escape(p["ours"]["title"])}</h2><ul>{_items(p["ours"]["items"])}</ul>
<div class='box'><h2 style='margin-top:0'>{escape(p["price"]["title"])}</h2><p><b>{escape(p["price"]["pilot"])}</b> {escape(p["price"]["after"])}</p></div>
<h2>{escape(p["exit"]["title"])}</h2><p class='muted'>{escape(p["exit"]["intro"])}</p>
<p><b>{escape(p["exit"]["continueTitle"])}</b></p><ul>{_items(p["exit"]["continue"])}</ul>
<p><b>{escape(p["exit"]["stopTitle"])}</b></p><ul>{_items(p["exit"]["stop"])}</ul>
</div></div>
<h2>{escape(p["kpis"]["title"])}</h2><p>{escape(p["kpis"]["intro"])}</p>
<table><colgroup><col class='m'><col class='h'><col class='b'></colgroup><tr><th>{escape(p["kpis"]["colMeasure"])}</th><th>{escape(p["kpis"]["colHow"])}</th><th>{escape(p["kpis"]["colBasis"])}</th></tr>{kpis}</table>
<p class='muted'>{escape(p["kpis"]["baseline"])}</p>
<h2>{escape(p["sourcesTitle"])}</h2><ul class='refs' lang='en' dir='ltr'>{refs}</ul>
<p class='muted' style='margin-top:5px'>{escape(chrome["footer"])} {escape(p["pdf"]["footer"])}</p>
</body></html>"""


@lru_cache(maxsize=len(LANGS))
def _pdf(lang: str) -> bytes:
    from weasyprint import HTML  # imported lazily: needs Pango (brew install pango; DYLD_FALLBACK_LIBRARY_PATH)

    return HTML(string=render_html(lang)).write_pdf()


def pdf(lang: str) -> bytes:
    """The proposal PDF. The content is fixed per language, so each is rendered once and then served from memory."""
    with _lock:  # one render at a time: two first requests at once must not both pay for it
        return _pdf(lang)


def page_count(lang: str) -> int:
    from weasyprint import HTML

    return len(HTML(string=render_html(lang)).render().pages)
