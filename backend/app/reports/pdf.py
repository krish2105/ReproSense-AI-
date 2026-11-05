"""Doctor-ready report: a two-page summary built only from her data and the rules file, rendered with WeasyPrint."""

from __future__ import annotations

from datetime import date
from html import escape

from app.agents import copy as cp
from app.rag.kb import sources
from app.rules.engine import Evaluation

PLUM, MAGENTA, LAV, OK, INK2, RULE = "#4B3653", "#D35FA8", "#B88BE3", "#3A9886", "#6E5D73", "#EEE5EF"


def build_payload(bundle: dict, ev: Evaluation, cards: list[dict], ref: date) -> dict:
    p = bundle["profile"]
    f = ev.features.values
    cycles = [c for c in bundle["cycles"] if c.get("length_days")][-12:]
    period_logs = [lg for lg in bundle["daily_logs"] if lg.get("flow") != "none"]
    severe = [lg for lg in bundle["daily_logs"] if (lg.get("pain") or 0) >= 7]
    return {
        "generated": ref.isoformat(),
        "alias": p.get("alias"),
        "age": p.get("age"),
        "region": p.get("region"),
        "life_stage": p.get("life_stage"),
        "pregnancy_weeks": p.get("pregnancy_weeks"),
        "cycles": [{"start": c["start"], "length": c["length_days"], "bleed": c["bleed_days"]} for c in cycles],
        "stats": {
            "logs": len(bundle["daily_logs"]),
            "period_days": len(period_logs),
            "severe_pain_days": len(severe),
            "pbac_by_cycle": f.get("pbac_by_cycle_6"),
            "record_strength": f.get("record_strength"),
            "cycle_change": f.get("cycle_change_point"),
        },
        "red_flags": [c for c in cards if c["kind"] == "red_flag"],
        "patterns": [c for c in cards if c["kind"] != "red_flag"],
        "labs": bundle["labs"],
        "questions": list(dict.fromkeys(q for c in cards for q in c.get("questions_for_doctor", [])))[:5],
        "sources": list(dict.fromkeys(s["source_id"] for c in cards for s in c.get("sources", []))),
        "is_synthetic": True,
    }


def cycle_chart_svg(cycles: list[dict], w: int = 520, h: int = 150) -> str:
    if not cycles:
        return "<p class='muted'>No complete cycles logged yet.</p>"
    top, left, bottom = 14, 34, 24
    maxd = max(65, max(c["length"] for c in cycles) + 5)
    y = lambda d: top + (h - top - bottom) * (1 - d / maxd)  # noqa: E731
    bw = (w - left - 10) / len(cycles)
    out = [
        f"<svg xmlns='http://www.w3.org/2000/svg' width='{w}' height='{h}' viewBox='0 0 {w} {h}' role='img'"
        f" aria-label='Cycle lengths, last {len(cycles)} cycles'>",
        f"<rect x='{left}' y='{y(35):.1f}' width='{w - left - 10}' height='{y(21) - y(35):.1f}' fill='{OK}' opacity='0.12'/>",
        f"<text x='{left - 4}' y='{y(35) + 4:.1f}' font-size='9' text-anchor='end' fill='{OK}'>35</text>",
        f"<text x='{left - 4}' y='{y(21) + 4:.1f}' font-size='9' text-anchor='end' fill='{OK}'>21</text>",
    ]
    for i, c in enumerate(cycles):
        x = left + i * bw + bw * 0.18
        irregular = c["length"] < 21 or c["length"] > 35
        out.append(
            f"<rect x='{x:.1f}' y='{y(c['length']):.1f}' width='{bw * 0.64:.1f}' height='{h - bottom - y(c['length']):.1f}'"
            f" rx='3' fill='{MAGENTA if irregular else LAV}'/>"
        )
        out.append(
            f"<text x='{x + bw * 0.32:.1f}' y='{y(c['length']) - 3:.1f}' font-size='9' text-anchor='middle' fill='{PLUM}'>{c['length']}</text>"
        )
        out.append(
            f"<text x='{x + bw * 0.32:.1f}' y='{h - 8}' font-size='8' text-anchor='middle' fill='{INK2}'>"
            f"{escape(cp._fmt_day(c['start']))}</text>"
        )
    out.append("</svg>")
    return "".join(out)


def render_html(pl: dict) -> str:
    src = sources()
    stage = (pl["life_stage"] or "periods").replace("_", " ")
    rf = "".join(
        f"<div class='urgent'><b>{escape(c['title'])}</b><br>{escape(c['summary'])} "
        f"{escape(cp.detail(c['observation_id'], {}, {}, 'en', c.get('entry_date')))}</div>"
        for c in pl["red_flags"]
    )
    pats = ""
    for c in pl["patterns"]:
        srcs = ", ".join(escape(s["title"]) for s in c["sources"])
        pats += (
            f"<div class='card'><h3>{escape(c['title'])}</h3><p>{escape(c['summary'])}</p>"
            f"<p class='muted'>Rule: {escape(c['observation_id'])} · Source: {srcs}</p></div>"
        )
    if not pats:
        pats = "<p>No rule-based patterns in this record. Logging continues.</p>"
    ev_rows = ""
    for c in pl["patterns"] + pl["red_flags"]:
        for e in c.get("why_we_noticed", [])[:6]:
            ev_rows += f"<tr><td>{escape(c['observation_id'])}</td><td>{escape(e['text'])}</td></tr>"
    labs = (
        "".join(
            f"<tr><td>{escape(str(lab['date']))}</td><td>{escape(lab['test'])}</td><td>{escape(str(lab['value']))} {escape(lab['unit'] or '')}</td>"
            f"<td>{'' if lab['ref_low'] is None else lab['ref_low']}–{'' if lab['ref_high'] is None else lab['ref_high']}</td>"
            f"<td><b>{escape(lab['flag'] or '')}</b></td></tr>"
            for lab in pl["labs"]
        )
        or "<tr><td colspan=5>No confirmed lab results.</td></tr>"
    )
    qs = "".join(f"<li>{escape(q)}</li>" for q in pl["questions"]) or "<li>No questions added.</li>"
    srcs = "".join(f"<li>{escape(src[s].title)} — {escape(src[s].url)}</li>" for s in pl["sources"] if s in src)
    st = pl["stats"]
    change = st.get("cycle_change")
    change_txt = (
        f"Cycle change detected: average {change['before']} days before, {change['after']} days after."
        if change
        else ""
    )
    return f"""<!doctype html><html><head><meta charset='utf-8'><style>
@page {{ size: A4; margin: 16mm 15mm 18mm; @bottom-center {{ content: "ReproSense gives information, not a diagnosis. In an emergency call 998. Demo data — fictional. Built with AI tools. Page " counter(page) " of " counter(pages); font-size: 7.5pt; color: {INK2}; }} }}
body {{ font-family: 'Plus Jakarta Sans', 'Helvetica Neue', Arial, sans-serif; color: #2E2233; font-size: 9.6pt; line-height: 1.42; }}
h1 {{ font-size: 17pt; margin: 0; color: {PLUM}; }} h2 {{ font-size: 11.5pt; color: {PLUM}; margin: 14px 0 6px; }}
h3 {{ font-size: 10pt; margin: 0 0 2px; }} .muted {{ color: {INK2}; font-size: 8.4pt; }} p {{ margin: 3px 0; }}
.badge {{ display: inline-block; background: #F9E4F1; color: #8A2E6B; border-radius: 99px; padding: 2px 9px; font-size: 8pt; font-weight: 700; }}
.head {{ display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid {RULE}; padding-bottom: 8px; }}
.card {{ border: 1px solid {RULE}; border-radius: 10px; padding: 8px 10px; margin: 6px 0; break-inside: avoid; }}
.urgent {{ border: 1.5px solid #C0352B; background: #FCECEA; border-radius: 10px; padding: 8px 10px; margin: 6px 0; }}
table {{ width: 100%; border-collapse: collapse; font-size: 8.6pt; }} td, th {{ border-bottom: 1px solid {RULE}; padding: 3px 4px; text-align: left; vertical-align: top; }}
.grid {{ display: flex; gap: 14px; }} .grid > div {{ flex: 1; }} .pb {{ break-before: page; }}
</style></head><body>
<div class='head'><div><h1>Doctor-ready summary</h1><div class='muted'>{escape(pl["alias"] or "")} · {pl["age"]} years · {escape(stage)}{f" · {pl['pregnancy_weeks']} weeks pregnant" if pl["pregnancy_weeks"] else ""} · {escape(pl["region"] or "")}</div></div>
<div style='text-align:right'><span class='badge'>Demo data — fictional</span><div class='muted'>Generated {escape(pl["generated"])} · {st["logs"]} entries · record strength: {escape(st["record_strength"] or "")}</div></div></div>
{("<h2>Urgent</h2>" + rf) if rf else ""}
<h2>Patterns worth discussing</h2>{pats}
<h2>Cycle lengths</h2>{cycle_chart_svg(pl["cycles"])}
<p class='muted'>Shaded band: 21–35 days. Magenta bars are outside it. {escape(change_txt)} Severe pain days (7/10 or more): {st["severe_pain_days"]}. Bleeding scores (PBAC) for the last 6 periods: {escape(", ".join(map(str, st["pbac_by_cycle"] or [])) or "not logged")}.</p>
<div class='pb'></div>
<h2>Entries behind each pattern</h2><table><tr><th>Rule</th><th>Entry</th></tr>{ev_rows or "<tr><td colspan=2>None</td></tr>"}</table>
<h2>Lab results (as entered or confirmed by her)</h2><table><tr><th>Date</th><th>Test</th><th>Result</th><th>Reference</th><th>Flag</th></tr>{labs}</table>
<div class='grid'><div><h2>Her questions for you</h2><ol>{qs}</ol></div><div><h2>Sources</h2><ul class='muted'>{srcs}</ul></div></div>
<p class='muted'>How this was produced: transparent rules (rules/clinical_rules.yaml, version shown in the app) evaluated her own entries; wording comes from the rules file and cited guideline summaries. ReproSense does not diagnose and gives no probabilities. All people and data in this demo are fictional.</p>
</body></html>"""


def render_pdf(pl: dict) -> bytes:
    from weasyprint import HTML  # imported lazily: needs Pango (brew install pango; DYLD_FALLBACK_LIBRARY_PATH)

    return HTML(string=render_html(pl)).write_pdf()
