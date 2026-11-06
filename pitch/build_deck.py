"""Build pitch/deck.html: the 3-minute HealthX Ajyal deck, drawn from the product's own data.

Run: python3 pitch/build_deck.py   (screenshots first: cd apps/web && node scripts/pitch-shots.mjs)

Every number on a slide comes from a file in this repo or from a source named on that slide:
- Noura's ring: data/synthetic/output/personas/noura.json (fictional persona)
- AI test results: backend/app/ai/eval_results.json
- Local evidence and market: research/2026-11-06/02 and 04 (each with its rating)
Design: E · Mauve Pro (docs/06). Offline: fonts and images sit next to the deck. Print: one slide per page.
"""

from __future__ import annotations

import html
import re
import json
import math
from datetime import date
from pathlib import Path

# Fill these only with true facts before the pitch. A value left as None hides its line (judge panel, 6 Nov 2026).
TEAM = None  # e.g. "Krishna (tech) · Atharva (product) · Yash (regulatory) · Dr … (clinical advisor)"
EVIDENCE = None  # e.g. "6 clinicians and 3 clinic managers interviewed · letter of intent from … Clinic"
IMAGE_TOOL = "ChatGPT"  # ASSET_INTEGRATION_REPORT.md: "AI-generated images (ChatGPT)"

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "pitch" / "deck.html"
REF = date(2026, 11, 22)  # the demo's reference date (showcase day)

# ---------------------------------------------------------------- data
noura = json.loads((ROOT / "data/synthetic/output/personas/noura.json").read_text())
cycles = noura["cycles"]
evals = json.loads((ROOT / "backend/app/ai/eval_results.json").read_text())
done = [c for c in cycles if c.get("length_days")]
lens = [c["length_days"] for c in done]
current = next((c for c in cycles if not c.get("length_days")), None)
current_days = (REF - date.fromisoformat(current["start"])).days if current else 0


# ---------------------------------------------------------------- the cycle ring (signature)
def arc(cx: float, cy: float, r: float, a0: float, a1: float) -> str:
    """SVG path for an arc from angle a0 to a1 (degrees, 0 = top, clockwise)."""
    def pt(a: float) -> tuple[float, float]:
        rad = math.radians(a - 90)
        return cx + r * math.cos(rad), cy + r * math.sin(rad)

    (x0, y0), (x1, y1) = pt(a0), pt(a1)
    large = 1 if a1 - a0 > 180 else 0
    return f"M{x0:.2f},{y0:.2f} A{r},{r} 0 {large} 1 {x1:.2f},{y1:.2f}"


def noura_ring() -> str:
    cx = cy = 300
    r, w, gap = 220, 36, 1.4  # gap in days between cycles (the 2px surface gap)
    total = 365
    deg = 360 / total
    parts, labels = [], []
    day = 0.0
    for c in done:
        n, bleed = c["length_days"], c["bleed_days"]
        segs = [(0, bleed, "var(--ph-m)", 1), (bleed, min(n, 35), "var(--ph-l)", 0.45), (35, n, "var(--plum)", 1)]
        for s0, s1, color, op in segs:
            if s1 <= s0:
                continue
            a0, a1 = (day + s0) * deg, (day + s1 - (gap if s1 == n else 0)) * deg
            parts.append(
                f'<path d="{arc(cx, cy, r, a0, a1)}" stroke="{color}" stroke-opacity="{op}" stroke-width="{w}" fill="none"/>'
            )
        mid = math.radians((day + n / 2) * deg - 90)
        lx, ly = cx + (r + 50) * math.cos(mid), cy + (r + 50) * math.sin(mid)
        labels.append(f'<text x="{lx:.1f}" y="{ly:.1f}" class="ring-n">{n}</text>')
        day += n
    if current:  # the cycle she is in now: a faint segment up to today
        a0, a1 = day * deg, (day + current_days) * deg
        parts.append(
            f'<path d="{arc(cx, cy, r, a0, a1)}" stroke="var(--ph-l)" stroke-opacity=".2" stroke-width="{w}" fill="none"/>'
        )
    title = f"Noura's last {len(done)} cycles as one year: {', '.join(map(str, lens))} days"
    return (
        f'<svg viewBox="0 0 600 600" role="img" aria-label="{html.escape(title)}" class="ring">'
        f'<circle cx="{cx}" cy="{cy}" r="{r}" stroke="var(--rule)" stroke-width="{w}" fill="none"/>'
        + "".join(parts)
        + "".join(labels)
        + f'<text x="{cx}" y="{cy - 14}" class="ring-big">{len(done)} cycles</text>'
        + f'<text x="{cx}" y="{cy + 30}" class="ring-sub">{min(lens)}–{max(lens)} days each</text>'
        + f'<text x="{cx}" y="{cy + 60}" class="ring-sub ring-faint">usual range 21–35</text>'
        + "</svg>"
    )


# ---------------------------------------------------------------- the 1,043 women (unit chart)
def waffle(total: int = 1043, came: int = 265, cols: int = 47) -> str:
    step, rad = 13, 4.6
    rows = math.ceil(total / cols)
    dots = []
    for i in range(total):
        x, y = 8 + (i % cols) * step, 8 + (i // cols) * step
        if i < came:
            dots.append(f'<circle cx="{x}" cy="{y}" r="{rad}" class="w-on"/>')
        else:
            dots.append(f'<circle cx="{x}" cy="{y}" r="{rad - 0.8}" class="w-off"/>')
    w, h = 16 + (cols - 1) * step, 16 + (rows - 1) * step
    label = f"{came} of {total} women came back for the glucose test after birth"
    return f'<svg viewBox="0 0 {w} {h}" role="img" aria-label="{label}" class="waffle">{"".join(dots)}</svg>'


# ---------------------------------------------------------------- progress arc (every slide)
PHASES = ["var(--ph-m)", "var(--ph-f)", "var(--ph-o)", "var(--ph-l)"]


def progress(i: int, n: int) -> str:
    cx = cy = 22
    r = 16
    seg = 360 / n
    paths = []
    for k in range(n):
        color = PHASES[k % 4] if k <= i else "var(--rule-2)"
        paths.append(f'<path d="{arc(cx, cy, r, k * seg + 2, (k + 1) * seg - 2)}" stroke="{color}" stroke-width="5" fill="none" stroke-linecap="round"/>')
    return f'<svg viewBox="0 0 44 44" class="prog" aria-hidden="true">{"".join(paths)}</svg>'


e = evals


def heldout_rows() -> str:
    """Rows for the held-out test (questions written by reviewers who never saw the code), if it has run."""
    h = e.get("heldout")
    if not h:
        return ""
    names = {"crisis": "Crisis messages given the support path", "urgent": "Emergencies given 998 first",
             "refuse": "Diagnosis requests refused", "medicine": "Medicine questions sent to a doctor",
             "answer": "Everyday questions answered normally"}
    n = sum(h[k]["of"] for k in names if k in h)
    head = f'<tr class="grp"><th colspan="2">Held-out: {n} new questions by reviewers who never saw the code</th></tr>'
    return '</tbody><tbody>' + head + "".join(
        f"<tr><td>{names[k]}</td><td>{h[k]['pass']} of {h[k]['of']}</td></tr>" for k in names if k in h
    )


SLIDES: list[dict] = [
    {
        "title": "ReproSense",
        "synthetic": True,
        "body": f"""
<div class="cols c-hero">
  <div>
    <p class="eyebrow">HealthX Ajyal 2026 · Fertility and Women's Health</p>
    <h1 class="mega">ReproSense</h1>
    <p class="lede">A woman's cycle, pregnancy and lab history as one record her doctor can read in a minute.
    It points out patterns worth checking, shows the days behind each one, and never diagnoses.</p>
    <p class="tag">Understand your body. Recognise the patterns. Take informed action.</p>
  </div>
  <figure class="hero-fig">
    {noura_ring()}
    <figcaption>
      <span class="key"><i style="background:var(--ph-m)"></i>period days</span>
      <span class="key"><i style="background:var(--ph-l);opacity:.45"></i>days 1–35</span>
      <span class="key"><i style="background:var(--plum)"></i>past day 35</span>
      <span class="cap">Noura (fictional), 24, Al Ain: a year of her logs. Every cycle ran past day 35.</span>
    </figcaption>
  </figure>
</div>""",
        "source": "Noura is a synthetic persona (data/synthetic/output/personas/noura.json). Usual adult range 21–35 days: 2023 International PCOS Guideline.",
        "notes": "ReproSense turns a woman's scattered cycle, pregnancy and lab history into a sourced two-page summary for her doctor, and shows clinics which follow-ups are slipping.",
    },
    {
        "title": "One in four came back.",
        "body": f"""
<div class="cols c-split">
  <div>
    <h2>One in four came back.</h2>
    <p class="big-line">At one Al Ain hospital, <b>265 of 1,043</b> women who had diabetes in pregnancy came back for the glucose test after birth.</p>
    <p class="sub">That test catches type 2 diabetes early. About <b>1 in 5</b> pregnancies in Al Ain's Mutaba'ah study had gestational diabetes.</p>
  </div>
  <figure class="waffle-fig">{waffle()}
    <figcaption><span class="key"><i style="background:var(--ok)"></i>came back (265)</span>
    <span class="key"><i class="ring-i"></i>did not (778)</span></figcaption>
  </figure>
</div>""",
        "source": "Agarwal et al., IJERPH 2022 (one Al Ain hospital, 2013–2014 data) · Bashir et al., Frontiers in Endocrinology 2022 (21.3% by IADPSG, 2017–2021).",
        "notes": "At one Al Ain hospital only one in four women who had diabetes in pregnancy came back for the glucose test after birth. Qualifier ready: one hospital, 2013–14 data.",
    },
    {
        "title": "Her story arrives in pieces.",
        "body": """
<h2>Her story arrives in pieces.</h2>
<div class="cols c-pieces">
  <div class="said">
    <p><b>Up to 70%</b> of women with PCOS do not know they have it.<em>WHO fact sheet, January 2026</em></p>
    <p>In a UAE study of 518 women, endometriosis took <b>11.6 years</b> to diagnose.<em>Mousa et al., Frontiers in Global Women's Health 2021</em></p>
  </div>
  <svg viewBox="0 0 460 300" class="pieces" role="img" aria-label="A period app, lab reports and visit notes, joined into one record she controls">
    <path d="M150 52 C 250 52, 250 150, 330 150" /><path d="M150 150 L 330 150" /><path d="M150 248 C 250 248, 250 150, 330 150" />
    <g class="chip"><rect x="0" y="30" width="150" height="44" rx="22"/><text x="75" y="58">Period app</text></g>
    <g class="chip"><rect x="0" y="128" width="150" height="44" rx="22"/><text x="75" y="156">Lab reports</text></g>
    <g class="chip"><rect x="0" y="226" width="150" height="44" rx="22"/><text x="75" y="254">Visit notes</text></g>
    <g class="chip one"><rect x="300" y="118" width="160" height="64" rx="32"/><text x="380" y="146">One record</text><text x="380" y="168" class="small">she controls</text></g>
  </svg>
</div>""",
        "source": "WHO PCOS fact sheet (22 Jan 2026) · Mousa et al. 2021 (women of Arab ancestry, recruited 2018–19). Checked 6 Nov 2026: research/2026-11-06/02.",
        "notes": "Endometriosis can still take years to be recognised, because her story reaches a short visit in pieces.",
    },
    {
        "title": "One record, three views.",
        "synthetic": True,
        "body": """
<h2>One record, three views.</h2>
<div class="shots">
  <figure class="phone"><img src="img/noura-insights.jpg" alt="Noura's Patterns screen: irregular cycles, with the days behind the pattern"><figcaption>She sees the pattern and the days behind it.</figcaption></figure>
  <figure class="paper"><img src="img/report-page1.jpg" alt="Page 1 of the doctor-ready summary PDF with the cycle-length chart"><figcaption>Her doctor gets two pages, shared only if she says yes.</figcaption></figure>
  <figure class="desk"><img src="img/clinic-record.jpg" alt="The clinician's pre-visit summary: a handover in clinician voice"><figcaption>The clinician reads a handover, then decides.</figcaption></figure>
</div>""",
        "source": "Screenshots of the working build, 6 Nov 2026. All records are fictional.",
        "notes": "Noura is fictional, like all our data: twelve months of her own logs in one view, and several of her cycles ran longer than 35 days.",
    },
    {
        "title": "The demo, in three minutes.",
        "synthetic": True,
        "body": """
<div class="cols c-demo">
  <div>
    <h2>The demo, in three minutes.</h2>
    <ol class="steps">
      <li><b>Noura's patterns</b> each show the days and the guideline behind them.</li>
      <li><b>Asked in Arabic,</b> the assistant answers with its source.</li>
      <li><b>A two-page PDF,</b> shared through a link that expires.</li>
      <li><b>The clinician view</b> is separate: handover, evidence, visit-note draft.</li>
      <li><b>Fatima's follow-up is marked done</b> and the glucose part of DoH's PC008 measure moves.</li>
    </ol>
  </div>
  <figure class="panel-shot"><img src="img/admin-pc008.jpg" alt="Network dashboard panel: DoH Jawda PC008, glucose test after gestational diabetes, 3 of 10 done before Fatima's follow-up closes">
    <figcaption>Before: 3 of 10. After Fatima's test: 4 of 10. Synthetic 1,200-woman cohort.</figcaption></figure>
</div>""",
        "source": "PC008: DoH Jawda primary-care quality indicators, version 7. Counts are from the synthetic cohort plus the live demo.",
        "notes": "For the clinic, missed follow-ups become a worklist: Fatima's after-birth glucose test is due, we book it, the gap closes and the network count moves, all on our synthetic cohort.",
    },
    {
        "title": "Rules decide. AI only words.",
        "body": f"""
<h2>Rules decide. AI only words.</h2>
<div class="cols c-ai">
  <div>
  <ol class="pipe">
    <li><b>Her entries</b><span>periods, pain, labs, mood checks</span></li>
    <li><b>Rules with sources</b><span>one versioned file; each rule names its guideline</span></li>
    <li><b>Pattern + the days behind it</b><span>no probabilities, no diagnosis</span></li>
    <li><b>AI wording, if she allows it</b><span>one switch in Privacy turns it off</span></li>
    <li><b>Verifier</b><span>drops any sentence it cannot support</span></li>
  </ol>
  <p class="sub held-note">The held-out set was measured once and never used to tune the checks. Word checks alone miss many crisis messages, so the 998 button is on screen in every chat. A second check by a language model is built but not yet scored.</p>
  </div>
  <table class="rai test">
    <caption>Acceptance test: {e['questions']} fixed questions, English and Arabic</caption>
    <tbody>
      <tr><td>Answers grounded in a source</td><td>{e['grounded']['pass']} of {e['grounded']['of']}</td></tr>
      <tr><td>Diagnosis questions refused</td><td>{e['refusals']['pass']} of {e['refusals']['of']}</td></tr>
      <tr><td>Red-flag questions given 998 first</td><td>{e['red_flags']['pass']} of {e['red_flags']['of']}</td></tr>
      <tr><td>Banned phrases in answers</td><td>{e['banned_phrases']}</td></tr>
      {heldout_rows()}
    </tbody>
  </table>
</div>
""",
        "source": f"backend/app/ai/eval_results.json, mode: {e.get('mode', '')}; failures are listed by id ({', '.join(f['id'] for f in e['failures']) or 'none'}). Runs in CI on every change.",
        "notes": "ReproSense never diagnoses: each card names the pattern, shows the exact days behind it, links the guideline rule it comes from. The held-out rows are our weakest numbers and we show them on purpose: messages in people's own words slip past word checks. So 998 is one tap in every chat: help never waits for the app to notice her. We show counts, not an accuracy percentage.",
    },
    {
        "title": "Built for DoH's AI standard.",
        "body": """
<h2>Built for DoH's AI standard.</h2>
<table class="rai">
  <thead><tr><th>Clause</th><th>What it asks</th><th>ReproSense</th><th>Status</th></tr></thead>
  <tbody>
    <tr><td>3.1.1.2</td><td>Human oversight</td><td>Clinicians decide; the navigator only drafts; red flags first, with 998</td><td><span class="st ok">Built</span></td></tr>
    <tr><td>3.1.6.1</td><td>Patients may opt out of AI</td><td>Privacy switch closes the assistant; cards keep fixed wording</td><td><span class="st ok">Built</span></td></tr>
    <tr><td>3.1.6.2</td><td>Traceability</td><td>Each card shows its rule, source and days; audit log she can read</td><td><span class="st ok">Built</span></td></tr>
    <tr><td>3.1.5</td><td>Fairness checks</td><td>Rates by nationality and age band; groups under 10 hidden</td><td><span class="st part">Partly built</span></td></tr>
    <tr><td>3.1.4.5.1</td><td>UAE hosting, recovery included</td><td>Synthetic data now; UAE cloud and a UAE-hosted model for the pilot</td><td><span class="st plan">Planned</span></td></tr>
    <tr><td>3.3.1.2</td><td>Risk register</td><td>Before the pilot; device status is the Emirates Drug Establishment's call</td><td><span class="st plan">Planned</span></td></tr>
  </tbody>
</table>
<p class="sub">All 13 clauses, each with its status: the Trust centre at /trust.</p>""",
        "source": "DoH Responsible AI Standard V1 (October 2025), summarised in our words. research/2026-11-06/01 §5.1.",
        "notes": "Speak the regulator's language. Never say it is not a medical device: classification is the regulator's decision.",
    },
    {
        "title": "Women free. Clinics pay per seat.",
        "body": f"""
<h2>Women free. Clinics pay per seat.</h2>
<ul class="tiers">
  <li><b>Free</b><span>Women: app, record, doctor report</span></li>
  <li><b>AED 399</b><span>per clinician a month</span></li>
  <li><b>AED 1,990</b><span>a month, small clinic up to 5</span></li>
  <li><b>AED 150,000+</b><span>a year, clinic networks</span></li>
</ul>
<div class="cols c-biz">
  <p><b>First buyers:</b> women's health and IVF clinics, and primary-care networks, where DoH's PC008 measure applies.
  Abu Dhabi has 14 fertility centres, 45 women's health facilities and about 700 OB-GYN specialists.</p>
  <p><b>Cost to serve (hypothesis):</b> a pilot stack in a UAE cloud region lists at about AED 122 a month, and rules
  need no model. A small clinic at AED 1,990 would keep about 94% before support. The pilot measures the real margin.</p>
  {f'<p class="proof">{html.escape(EVIDENCE)}</p>' if EVIDENCE else ''}
</div>""",
        "source": "Prices are hypotheses to test in interviews (research/2026-11-06/04 §9). Market: Abu Dhabi Media Office, 30 Jul 2025. Costs: AWS me-central-1 list prices, 6 Nov 2026, with 5% VAT (docs/12 unit economics).",
        "notes": "Women use it free and clinics pay per clinician seat. Say the interview and LOI numbers only if they are true; drop the bracket otherwise.",
    },
    {
        "title": "Six months, matched to the grant.",
        "body": """
<h2>Six months, matched to the grant.</h2>
<ol class="time">
  <li><b>Months 0–1</b><span>Intended use and claims frozen. Classification enquiry to the Emirates Drug Establishment, DoH software pre-evaluation, one clinic letter of intent, UAE hosting chosen.</span><em>Grant 50% + 10% · regulatory and tech leads</em></li>
  <li><b>Months 2–3</b><span>Pilot agreement, consent forms in Arabic and English, rules signed by a clinician, UAE stack live and tested, usability sessions on synthetic records.</span><em>Grant 15% · tech lead and clinical advisor</em></li>
  <li><b>Months 4–6</b><span>Gate review, then a consented pilot: up to 20 women and 3 clinicians at one clinic. Pilot report with measured results only, licensed company, paid contract.</span><em>Grant 25% · whole team</em></li>
</ol>""",
        "source": "Grant tranches: docs/12. Steps and gates: research/2026-11-06/03 §7 (real data only after the month-4 gate review).",
        "notes": "Commitment to continue: who keeps working after Sunday, tied to the grant milestones.",
    },
    {
        "title": "One pilot. One measure.",
        "body": f"""
<div class="cols c-ask">
  <div>
    <h2 class="ask">One pilot. One measure.</h2>
    <p class="big-line">Three months with one Abu Dhabi clinic, judged on how many women complete the follow-ups they are due.</p>
    {f'<p class="proof">{html.escape(TEAM)}</p>' if TEAM else ''}
  </div>
  <div class="disclose">
    <p><b>AI use.</b> Built with Claude (research, specification and code assistance){f" and {IMAGE_TOOL} for illustrations" if IMAGE_TOOL else ""}.</p>
    <p><b>Earlier work, disclosed.</b> Research, design and code from 5–6 Nov 2026, before selection, are listed in our disclosure note.</p>
    <p><b>Data.</b> Every record in the demo is fictional.</p>
  </div>
</div>""",
        "source": "Understand your body. Recognise the patterns. Take informed action.",
        "notes": "Our ask is one three-month pilot with one Abu Dhabi clinic. Then the tagline. Stop speaking by 2:55.",
    },
]

CSS = """
@font-face{font-family:"Plus Jakarta Sans";src:url(fonts/plus-jakarta-sans-latin-wght.woff2) format("woff2");font-weight:200 800;font-display:swap}
:root{--paper:#F6F1F4;--sheet:#FFFFFF;--tint:#F4EDF4;--ink:#2E2233;--ink-2:#6E5D73;--faint:#746479;--rule:#EEE5EF;--rule-2:#DFD2E2;
--plum:#4B3653;--accent:#C9559F;--accent-text:#A24884;--ph-m:#D35FA8;--ph-f:#EAB09D;--ph-o:#EFB5D3;--ph-l:#B88BE3;--ok:#3A9886;--ok-text:#37776F;
--warn:#A5680F;--warn-text:#986013;--shadow:0 18px 50px rgba(75,54,83,.12);--f:"Plus Jakarta Sans",ui-sans-serif,system-ui,sans-serif}
*{box-sizing:border-box}
html,body{margin:0;height:100%;background:#1d1520;font-family:var(--f);color:var(--ink);font-variant-numeric:tabular-nums}
.deck{position:fixed;inset:0;display:grid;place-items:center;overflow:hidden}
.slide{width:1280px;height:720px;position:absolute;left:50%;top:50%;transform-origin:center;background:var(--paper);
  background-image:radial-gradient(900px 500px at 92% -10%,rgba(233,176,214,.45),transparent 60%),radial-gradient(700px 420px at -5% 110%,rgba(196,168,236,.35),transparent 60%);
  border-radius:24px;padding:56px 72px 64px;display:flex;flex-direction:column;overflow:hidden}
.slide[hidden]{display:none}
h1,h2{margin:0;font-weight:800;letter-spacing:-.035em;line-height:1.02;text-wrap:balance}
h2{font-size:56px;max-width:15em}
.mega{font-size:112px;letter-spacing:-.05em;margin-top:10px}
.eyebrow{margin:0;font-size:17px;font-weight:700;color:var(--accent-text);letter-spacing:.01em}
.lede{font-size:23px;line-height:1.45;color:var(--ink-2);max-width:21em;margin:22px 0 0}
.tag{font-size:19px;font-weight:700;color:var(--plum);margin:26px 0 0}
.cols{display:grid;gap:44px;align-items:center;flex:1}
.c-hero{grid-template-columns:1.05fr .95fr}
.c-split{grid-template-columns:1fr 1fr}
.c-demo{grid-template-columns:.9fr 1.1fr}
.c-ask{grid-template-columns:1.1fr .9fr}
.c-biz{grid-template-columns:1.3fr 1fr;align-items:start;margin-top:22px}
.c-pieces{grid-template-columns:1.15fr .85fr;align-items:center}
.said p{font-size:34px;line-height:1.25;letter-spacing:-.015em;margin:0 0 30px;max-width:17em}
.said b{color:var(--plum);font-weight:800}
.said em{display:block;font-style:normal;font-size:15px;color:var(--faint);margin-top:8px;letter-spacing:0}
.pieces{width:100%}.pieces path{fill:none;stroke:var(--rule-2);stroke-width:3}
.pieces .chip rect{fill:var(--sheet);stroke:var(--rule-2)}.pieces text{font-family:var(--f);font-size:17px;font-weight:700;text-anchor:middle;fill:var(--ink)}
.pieces .one rect{fill:var(--plum);stroke:none}.pieces .one text{fill:#fff;font-size:19px}.pieces .one .small{font-size:14px;font-weight:600;fill:#EBD7F0}
.c-ai{grid-template-columns:1fr 1fr;align-items:start;margin-top:24px;flex:none}
.pipe{margin:0;padding-inline-start:30px;display:flex;flex-direction:column;gap:12px}
.pipe li{font-size:20px;line-height:1.3}.pipe li::marker{font-weight:800;color:var(--accent-text)}
.pipe b{display:block}.pipe span{display:block;font-size:16px;color:var(--ink-2)}
.test{margin-top:0}.test caption{caption-side:top;text-align:start;font-size:15px;font-weight:700;color:var(--ink-2);padding:16px 18px 6px}
.rai.test td{padding:7px 18px}.rai.test td:last-child{font-size:20px}.rai.test .grp th{font-size:15px;font-weight:700;color:var(--ink-2);padding:14px 18px 6px;border-top:1px solid var(--rule-2)}.held-note{font-size:17px;margin-top:22px}.test td:first-child{color:var(--ink);font-weight:500;white-space:normal}.test td:last-child{font-weight:800;font-size:22px;text-align:end;white-space:nowrap;color:var(--plum)}
.hero-fig{margin:0;display:flex;flex-direction:column;align-items:center;gap:10px}
.ring{width:440px;height:440px}
.ring-n{font-size:20px;font-weight:700;fill:var(--ink-2);text-anchor:middle;dominant-baseline:middle}
.ring-big{font-size:46px;font-weight:800;fill:var(--ink);text-anchor:middle;letter-spacing:-.03em}
.ring-sub{font-size:22px;font-weight:600;fill:var(--ink-2);text-anchor:middle}
.ring-faint{font-size:18px;fill:var(--faint)}
.ring-guide{stroke:var(--ink);stroke-width:2;stroke-dasharray:3 3}
figcaption{font-size:15px;color:var(--ink-2);display:flex;flex-wrap:wrap;gap:8px 16px;justify-content:center;max-width:34em;text-align:center}
.key{display:inline-flex;align-items:center;gap:7px;font-weight:600}
.key i{width:14px;height:14px;border-radius:99px;display:inline-block}
.ring-i{border:2px solid var(--rule-2);background:transparent}
.cap{flex-basis:100%;margin-top:2px}
.big-line{font-size:30px;line-height:1.3;margin:24px 0 0;max-width:17em;letter-spacing:-.01em}
.big-line b{color:var(--plum)}
.sub{font-size:19px;line-height:1.45;color:var(--ink-2);margin:18px 0 0;max-width:34em}
.waffle-fig{margin:0;display:flex;flex-direction:column;gap:14px;align-items:center}
.waffle{width:560px}
.w-on{fill:var(--ok)} .w-off{fill:none;stroke:var(--rule-2);stroke-width:1.4}
.facts{list-style:none;padding:0;margin:34px 0 0;display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.facts li{background:var(--sheet);border-radius:24px;padding:26px;box-shadow:var(--shadow);display:flex;flex-direction:column;gap:10px}
.facts b{font-size:46px;font-weight:800;letter-spacing:-.04em;color:var(--plum)}
.facts span{font-size:20px;line-height:1.4}
.facts em{font-style:normal;font-size:14px;color:var(--faint);margin-top:auto}
.shots{display:grid;grid-template-columns:200px 236px 1fr;gap:26px;align-items:start;margin-top:28px;flex:1;min-height:0}
.shots figure{margin:0;display:flex;flex-direction:column;gap:10px;min-height:0}
.shots img{width:100%;display:block;border-radius:18px;box-shadow:var(--shadow);object-fit:cover;object-position:top}
.phone img{height:420px;border-radius:28px;border:6px solid var(--plum)}
.paper img{height:334px;border-radius:6px}
.desk img{height:420px}
.shots figcaption{justify-content:flex-start;text-align:start;font-size:16px}
.steps{margin:24px 0 0;padding-inline-start:26px;display:flex;flex-direction:column;gap:12px;font-size:21px;line-height:1.35}
.steps li::marker{font-weight:800;color:var(--accent-text)}
.panel-shot{margin:0;display:flex;flex-direction:column;gap:12px}
.panel-shot img{width:100%;border-radius:20px;box-shadow:var(--shadow)}
.panel-shot figcaption{justify-content:flex-start;text-align:start;font-size:17px}
.flow{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-top:28px}
.flow span{background:var(--sheet);border:1px solid var(--rule-2);border-radius:999px;padding:12px 20px;font-size:18px;font-weight:600}
.flow i{font-style:normal;color:var(--accent-text);font-weight:800;font-size:22px}
.figs{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin:30px 0 0}
.figs div{background:var(--sheet);border-radius:22px;padding:20px;box-shadow:var(--shadow)}
.figs dt{font-size:15px;color:var(--ink-2);font-weight:600}
.figs dd{margin:8px 0 0;font-size:44px;font-weight:800;letter-spacing:-.04em}
.rai{width:100%;border-collapse:separate;border-spacing:0;margin-top:24px;font-size:18px;background:var(--sheet);border-radius:22px;overflow:hidden;box-shadow:var(--shadow)}
.rai th{font-size:14px;text-align:start;color:var(--ink-2);padding:14px 18px;border-bottom:1px solid var(--rule)}
.rai td{padding:12px 18px;border-bottom:1px solid var(--rule);vertical-align:top}
.rai tr:last-child td{border-bottom:0}
.rai td:first-child{font-weight:700;white-space:nowrap;color:var(--plum)}
.st{display:inline-block;border-radius:999px;padding:4px 12px;font-size:14px;font-weight:700;white-space:nowrap}
.st.ok{background:#E2F3EF;color:var(--ok-text)} .st.part{background:#F4EDF4;color:var(--plum)} .st.plan{background:#FBEEDB;color:var(--warn-text)}
.tiers{list-style:none;padding:0;margin:30px 0 0;display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.tiers li{background:var(--sheet);border-radius:24px;padding:24px;box-shadow:var(--shadow);display:flex;flex-direction:column;gap:8px}
.tiers b{font-size:32px;font-weight:800;letter-spacing:-.03em;color:var(--plum);white-space:nowrap}
.tiers span{font-size:17px;color:var(--ink-2)}
.c-biz p{font-size:19px;line-height:1.45;margin:0}
.proof{border-radius:18px;padding:14px 18px;background:var(--sheet);box-shadow:var(--shadow);font-weight:600}
.time{list-style:none;padding:0;margin:40px 0 0;display:grid;grid-template-columns:repeat(3,1fr);gap:18px;position:relative}
.time li{background:var(--sheet);border-radius:24px;padding:26px;box-shadow:var(--shadow);display:flex;flex-direction:column;gap:10px;border-top:6px solid var(--ph-l)}
.time li:nth-child(2){border-top-color:var(--ph-o)} .time li:nth-child(3){border-top-color:var(--ph-m)}
.time b{font-size:30px;font-weight:800;letter-spacing:-.03em}
.time span{font-size:18px;line-height:1.45;color:var(--ink-2)}
.time em{font-style:normal;font-size:14px;font-weight:700;color:var(--accent-text);margin-top:auto}
.ask{font-size:72px}
.disclose{background:var(--sheet);border-radius:24px;padding:26px;box-shadow:var(--shadow);font-size:17px;line-height:1.45}
.disclose p{margin:0 0 12px} .disclose p:last-child{margin:0}
.foot{position:absolute;left:72px;right:72px;bottom:22px;display:flex;justify-content:space-between;align-items:center;gap:20px}
.src{font-size:13px;color:var(--faint);max-width:52em;line-height:1.35}
.meta{display:flex;align-items:center;gap:12px;font-size:13px;font-weight:700;color:var(--ink-2);white-space:nowrap}
.badge{background:#F9E4F1;color:var(--accent-text);border-radius:999px;padding:5px 12px}
.prog{width:30px;height:30px}
.notes{display:none}
body.show-notes .notes{display:block;position:fixed;left:0;right:0;bottom:0;background:#2E2233;color:#F6EFF7;font-size:18px;padding:14px 24px;z-index:5}
.hint{position:fixed;left:14px;top:8px;color:#A090A5;font-size:12px;font-family:var(--f);transition:opacity .4s}
.hint.gone{opacity:0}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
@media (prefers-reduced-motion:no-preference){.slide:not([hidden]){animation:in .22s ease-out}}
@keyframes in{from{opacity:.4}to{opacity:1}}
@page{size:1280px 720px;margin:0}
@media print{
  html,body{background:none;height:auto}
  .deck{position:static;display:block}
  .slide,.slide[hidden]{display:flex!important;position:relative;left:auto;top:auto;transform:none!important;border-radius:0;break-after:page;page-break-after:always}
  .notes,.hint{display:none!important}
}
"""

JS = """
const slides=[...document.querySelectorAll('.slide')];const live=document.getElementById('live');let i=0;
function fit(){const s=Math.min(innerWidth/1280,innerHeight/720)*0.96;slides.forEach(el=>el.style.transform=`translate(-50%,-50%) scale(${s})`)}
function show(n){i=Math.max(0,Math.min(slides.length-1,n));slides.forEach((el,k)=>el.hidden=k!==i);
  live.textContent=slides[i].getAttribute('aria-label');history.replaceState(null,'','#'+(i+1))}
addEventListener('keydown',e=>{document.getElementById('hint').classList.add('gone');const k=e.key;
  if(['ArrowRight','PageDown',' ','Enter','ArrowDown'].includes(k)){e.preventDefault();show(i+1)}
  else if(['ArrowLeft','PageUp','Backspace','ArrowUp'].includes(k)){e.preventDefault();show(i-1)}
  else if(k==='Home')show(0);else if(k==='End')show(slides.length-1);
  else if(k==='n'||k==='N')document.body.classList.toggle('show-notes');
  else if(k==='f'||k==='F'){document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen()}});
addEventListener('click',e=>{if(e.target.closest('a'))return;show(i+(e.clientX>innerWidth/2?1:-1))});
addEventListener('resize',fit);fit();show((parseInt(location.hash.slice(1))||1)-1);
"""


def build() -> str:
    n = len(SLIDES)
    out = []
    for k, s in enumerate(SLIDES):
        label = f"Slide {k + 1} of {n}: {s['title']}"
        out.append(
            f'<section class="slide" aria-roledescription="slide" aria-label="{html.escape(label)}"{" hidden" if k else ""}>'
            f"{s['body']}"
            f'<div class="foot"><p class="src">{html.escape(s["source"])}</p>'
            f'<div class="meta">{"<span class=\"badge\">Demo data — fictional</span>" if s.get("synthetic") else ""}'
            f'{progress(k, n)}<span>{k + 1}/{n}</span></div></div>'
            f'<aside class="notes">{html.escape(s["notes"])}</aside></section>'
        )
    return (
        '<!doctype html><html lang="en"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1">'
        "<title>ReproSense pitch</title>"
        f"<style>{CSS}</style></head><body>"
        '<main class="deck">' + "".join(out) + "</main>"
        '<p id="live" class="sr" aria-live="polite"></p>'
        '<p class="hint" id="hint">← → or clicker · N notes · F full screen · print for PDF</p>'
        f"<script>{JS}</script></body></html>"
    )


if __name__ == "__main__":
    out = build()
    # a slide body that is not an f-string prints its template code on the slide: refuse to write such a deck
    leftover = re.findall(r"\{(?:html\.escape\(|[A-Z][A-Z_]{2,}\b)[^}]*\}", out)
    if leftover:
        raise SystemExit(f"template code left on a slide: {leftover}")
    OUT.write_text(out)
    print(f"wrote {OUT.relative_to(ROOT)} ({len(SLIDES)} slides; Noura's cycles {lens}; eval {e['questions']} questions)")
