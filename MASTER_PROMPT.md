# MASTER PROMPT — Build ReproSense AI end to end

> Give this whole file to Claude Code (or any coding agent). It is self-contained, and it points to `docs/` for detail.
> Do not build only a landing page. Build a complete, navigable, working product with a real backend.

---

## 0. Role and goal

You are a senior full-stack + AI engineering team building **ReproSense AI** for the **HealthX Ajyal Hackathon**
(Department of Health – Abu Dhabi). The jury scores: **Venture potential 30%, Health impact 20%, Innovation & evidence 20%,
Working prototype 20%, Team & pitch 10%**. Minimum 60/100 to get a grant. Our target: a build that a senior judge would score 90+.

Win condition: **one complete, reliable, beautiful journey** from a woman's logs → explainable observations → doctor-ready
report → clinician view → clinic dashboard proving value to a paying customer. Depth beats breadth.

---

## 0b. Problem statement (use word for word in the pitch)
In Abu Dhabi, reproductive conditions are recognised late because a woman's history reaches a short appointment in pieces,
and follow-ups after pregnancy fall between services. ReproSense gives her a structured, consented record and gives clinics a
way to act on it.

## 0c. Skills to load (in .claude/skills/)
`no-ai-slop-ui` before ANY UI work · `clinical-copy-guard` for every health sentence · `add-explainable-observation` for any rule ·
`synthetic-data-realism` for data changes · `demo-readiness` every evening of build week. The mockup in `mockup/` is the visual reference.

## 1. Product in one paragraph

ReproSense AI is a privacy-first reproductive health intelligence platform. Women log cycles, symptoms and pain, and upload
lab reports. The platform turns months of scattered information into **explainable, non-diagnostic observations**
(irregular-cycle pattern, androgen-type symptom pattern, severe-pain pattern, heavy-bleeding pattern, missed postpartum
glucose test), grounded in clinical guidelines, and produces a **structured doctor-ready report**. Clinics and payers get a
**dashboard** of patients who need follow-up and the care gaps closed. It never diagnoses and never invents probabilities.

## 2. Problem and evidence (use in the landing page "Why" section — cite sources from docs/05)

- PCOS: ~12% of reproductive-age women worldwide; 25.9% self-reported among Emirati women (UAE Healthy Future Study),
  but only 1.6% coded in a Dubai hospital record study → under-recognised.
- Endometriosis: average diagnostic delay ~6.6 years in a 2024 scoping review; women often feel unheard.
- Gestational diabetes: 7.9–24.9% of UAE pregnancies (up to 37.7% by IADPSG); postpartum diabetes screening is often missed.
- Abu Dhabi priorities: DoH launched the Abu Dhabi Programme for the Future of Reproductive Health (Sept 2026, roadmap to 2030,
  prevention + early screening + AI); DoH–ŌURA partnership (May 2026) starts with women's health, preconception and perinatal care.

## 3. Users and roles

| Role | Route prefix | What they do |
| --- | --- | --- |
| Patient (woman 18–45) | `/app/*` | Onboard, log, see timeline + insights, ask assistant, export/share report |
| Clinician (OB-GYN / family doctor) | `/clinic/*` | Patient list with consented reports, patient summary, care-gap actions |
| Clinic / payer admin | `/admin/*` | Population dashboard, care gaps, adoption metrics, ROI view |
| Demo switcher | `/demo` | Pick a fictional persona or role in one click (judges use this) |

## 4. Screens to build (full spec: docs/01_PRODUCT_SPEC.md)

1. **Landing** `/` — 3D hero (soft glass helix), problem with cited numbers, how it works (4 steps), for women / for clinics,
   privacy & safety, team, "Try the demo" CTA. Light + dark. EN + AR.
2. **Onboarding** `/app/onboarding` — 5 short steps: language → consent (granular toggles) → age range → cycle basics
   (last period, usual length) → optional history (diagnosed conditions, pregnancy/GDM history). Skip allowed.
3. **Dashboard** `/app` — cycle ring (day X, phase), cycle-length trend (6 cycles), symptom summary, latest observations
   (max 3 cards), reminders (e.g. postpartum glucose test due), quick actions.
4. **Log** `/app/log` — date, flow, pain 0–10 slider, pain location (body map), symptoms chips, impact on daily life,
   mood/sleep/energy, free-text note (AI extracts symptoms from it), photo/PDF upload of lab report.
5. **Timeline** `/app/timeline` — 12-month swim-lane chart: periods, cycle length, pain intensity, symptoms, events
   (lab test, pregnancy, delivery). Zoom 3/6/12 months.
6. **Insights** `/app/insights` — observation cards. Each card: title, plain explanation, "Why we noticed" (exact entries,
   clickable), rule + guideline source, "What to consider next", "Questions for your doctor". Red flags pinned on top.
7. **Assistant** `/app/assistant` — RAG chat, EN/AR, citations under every answer, suggested questions, refuses diagnosis.
8. **Doctor report** `/app/report` — preview + PDF download + "share with my clinic" (consent dialog, expiring link).
9. **Documents** `/app/documents` — upload lab report (PDF/image/text) → Document AI extracts values (AMH, testosterone,
   TSH, prolactin, HbA1c, OGTT, ferritin, Hb) into a confirm-before-save table.
10. **Privacy centre** `/app/privacy` — what we store and why, consent toggles, "who saw my data" audit timeline,
    export my data (JSON), delete my data.
11. **Clinician list** `/clinic` — consented patients, sorted by red flag → open observations → newest report.
12. **Clinician patient view** `/clinic/patients/[id]` — 30-second summary, timeline, observations with evidence,
    extracted labs, patient's own questions, "mark reviewed", "book follow-up", AI visit-note draft (clinician edits).
13. **Admin dashboard** `/admin` — KPIs (reports received, time saved per consult, open care gaps, gaps closed),
    care-gap funnel, region map (Abu Dhabi, Al Ain, Al Dhafra), what-if ROI slider. Synthetic cohort of 1,200 women.
14. **Demo switcher** `/demo` — 5 persona cards + clinician + admin, one click each; reset demo data button.

## 5. Features beyond the brief (our edge — build in this order after the core)

1. **Pregnancy & postpartum bridge** — history of gestational diabetes → reminder for a glucose test 4–12 weeks after birth
   and then regular rechecks (ADA guidance). Shows on dashboard, report and clinic care gaps. Links Fertility + Women's Health + Longevity.
2. **Natural-language symptom capture** — "cramps so bad I missed work again" → structured entry (pain 8, impact: missed work).
3. **Document AI for lab reports** — extract + normalise units + flag out-of-reference values (reference range printed on the report).
4. **Consultation prep** — 5 personalised questions for the doctor, ranked by her own data.
5. **Ramadan mode** — fasting-aware reminders; advice to talk to a doctor before fasting if pregnant or diabetic.
6. **Arabic-first experience** — full RTL, Arabic voice note input (stretch).
7. **Wearable import (optional)** — CSV upload of resting heart rate / temperature / sleep; shown as context only, never as a diagnosis.
8. **Clinic-side care-gap engine** — list of overdue follow-ups with one-click bilingual reminder draft (clinician approves).
9. **"Explain like I'm new" toggle** — every medical word has a tap-to-explain tooltip.
10. **Accessibility** — WCAG 2.2 AA, large text mode, reduced motion.
11. **PBAC bleeding score** — pad/clot counters (Higham 1990), score ≥ 100 feeds the heavy-bleeding rule.
12. **Record strength meter** — how much data supports a pattern; never a disease probability.
13. **"How this was produced" trace** on every observation (rule with values, safety, sources, wording check).
14. **Clinician "Ask the record"** — answers only from her entries, with dated evidence.
15. **SBAR pre-visit handover** + editable visit-note draft.
16. **Fertility timing + preconception checklist** (Mariam persona; ASRM, NICE NG257 2026).
17. **Change detection** in cycle length.
18. **Fairness check** in the admin dashboard (by nationality group and age band) for DoH's Responsible AI Standard.

## 6. AI architecture (full spec: docs/03_AI_PIPELINE.md)

A LangGraph state machine with 7 small agents. Deterministic order, typed state, every step logged.

```
intake_agent → document_agent → signal_agent(rules) → safety_guardian → evidence_agent(RAG)
            → insight_writer(LLM, JSON schema) → report_agent → (clinician) care_gap_agent
```

- **signal_agent** is pure Python. It evaluates `rules/clinical_rules.yaml` against the patient's data and returns
  observations with `supporting_entry_ids`. No LLM here. This is what makes the AI trustworthy.
- **safety_guardian** runs red-flag rules first; can stop the pipeline and return urgent guidance.
- **evidence_agent** retrieves 3–5 passages from the curated knowledge base (pgvector, hybrid BM25 + vector, re-rank).
- **insight_writer** turns observation + evidence into plain language using a strict JSON schema; banned-phrase filter
  ("you have", "diagnosed with", "% chance") rejects and retries; max 2 retries, then a template fallback.
- LLM calls receive **de-identified** data only (alias, relative dates, no names).
- The Kaggle PCOS dataset (541 women, Kerala) is used **only** in `research/` to show which features literature links
  to PCOS (evidence slide). It is never used to give a user a score.

## 7. Data (full spec: docs/04_DATA_PLAN.md)

Run `python3 data/synthetic/generate_synthetic.py`. It creates:
- 8 rich personas across 5 life stages (12 months of daily logs, labs, notes, questionnaires) — Amina (regular), Noura (irregular + androgen signs),
  Priya (severe cyclical pain), Sara (heavy bleeding + red-flag day + tiredness), Mariam (trying to conceive, 36), Hessa (pregnant, week 24,
  glucose screen due), Fatima (after birth, GDM, EPDS 11), Layla (47, perimenopause, hot flushes, MRS).
- A 1,200-woman synthetic clinic cohort for the admin dashboard.
- Synthetic lab report text files for Document AI.
Seed the database from `data/synthetic/output/`. Every record has `is_synthetic = true`.

## 8. Design (full spec: docs/06_DESIGN_SYSTEM.md, rules: .claude/skills/no-ai-slop-ui)

Identity E · Mauve Pro (v4, team choice, 5 Nov 2026; tokens from v3 soft mauve): a calm, warm women's-health app. The colours are dusty plum for actions plus four
phase colours: period magenta #D35FA8, follicular peach #EAB09D, fertile pink #EFB5D3 and luteal lavender #B88BE3. The background is a soft lilac wash.
Cards are very round (22–24px). Plus Jakarta Sans everywhere, with IBM Plex Sans Arabic for RTL. Light and dark modes.
Signature pieces:
- day pills
- the cycle arc with a "Day N" centre (marked as an estimate when cycles are irregular)
- a full-width "Log your symptoms" pill
- recommendation cards
- an emoji mood row
- a calendar with logged-data tiles
- Analytics: a 3/6/12-month switch, a gradient line chart and pill-bar chart
- an AI Copilot chat with citations, suggested-question pills and mic/send
- a floating tab bar (Home · Calendar · Analytics · Patterns · AI Chat · Report)

3D (React Three Fiber): a slowly rotating ring of cycle-day beads behind a phone that tilts on hover, and a drag-to-rotate
"year in 3D" spiral, with one loop per cycle and days past 35 in lavender. Every 3D element carries real data.
Copy `mockup/` exactly.

## 9. Security & privacy (full spec: docs/07_SECURITY_PRIVACY.md)

Passkeys (WebAuthn) + email magic link fallback · RBAC (patient, clinician, admin) · Postgres RLS · AES-256 at rest +
field-level encryption for notes · TLS · consent ledger · hash-chained audit log · rate limits · CSP/HSTS · Zod/Pydantic
validation · PII redaction before LLM · prompt-injection guard on uploaded documents · data export/delete.

## 10. Build phases (track in BUILD_STATUS.md)

| Phase | Output | Done when |
| --- | --- | --- |
| 0 Setup | monorepo, lint, CI, env, design tokens, data generated | `pnpm dev` + `uvicorn` run, tokens visible in a test page |
| 1 Data + rules | DB schema, seed, rules engine + 20 unit tests | each persona gets the expected observations |
| 2 Patient core | onboarding, dashboard, log, timeline | demo persona fully navigable on mobile width |
| 3 AI insights | agents, RAG ingest, insights screen, assistant | answers cite sources; banned phrases never appear |
| 4 Report | doctor report preview + PDF + share | PDF opens, matches persona data |
| 5 Clinician + admin | clinic list, patient view, admin dashboard | care gap closes live in demo |
| 6 Documents + extras | Document AI, postpartum bridge, NL symptom capture, Ramadan mode | lab upload → confirm table |
| 7 Polish | 3D hero, dark mode, Arabic RTL, empty/loading/error states, a11y | Lighthouse ≥ 90, no console errors |
| 8 Security pass | headers, RLS tests, rate limits, audit log | docs/07 checklist all ticked |
| 9 Ship | deploy, demo reset, backup video, pitch assets | senior-judge score ≥ 90 |

## 11. Quality bar

- TypeScript strict, no `any`. Python typed with Pydantic. Tests: rules (unit), agents (snapshot), API (integration),
  one Playwright e2e for the full demo path.
- Loading, empty and error states on every screen. Skeletons, not spinners.
- Every chart has a text summary for screen readers.
- No placeholder lorem ipsum. Copy is written in calm, warm, plain English and Arabic.
- Performance: LCP < 2.5s on mobile; 3D lazy-loaded and replaced by a still image when `prefers-reduced-motion`.

## 12. What NOT to build

Native iOS/Android apps · live hospital/EHR integration · real patient data · fertility probability prediction ·
automated diagnosis · prescriptions · payments.

## 13. When you finish each phase

1. Update `BUILD_STATUS.md` (phase status, what works, what's left) and append to `PROGRESS.md` (date, what changed).
2. Run the `senior-judge` agent against `docs/09_SCORECARDS.md`; paste its score table into PROGRESS.md.
3. Fix anything scored below 4/5 before starting the next phase.
4. If blocked or unsure: write the question in `QUESTIONS.md` and ask the user.

## 13. Version 4 additions (5 Nov 2026, team-approved): build all of these
- **Five life stages** with a stage switch on Home: periods, trying to conceive, pregnancy (week arc, warning signs, glucose screen at 24–28 weeks),
  after birth (glucose test, EPDS mood check with a crisis path for item 10), perimenopause (hot-flush count, MRS, NICE NG23).
- **Eight agents**: intake, rules engine (no LLM), evidence, **verifier** (each sentence must match a retrieved passage or it is dropped),
  safety, **care navigator** (drafts the appointment request, questions and what to bring; human approves before anything is sent),
  clinician copilot (SBAR, Ask the record), follow-up (care gaps).
- **RAG**: hybrid search + re-ranker, a small guideline graph (condition → criteria → test → timing), Arabic ↔ English retrieval,
  a 60-question test set with a live AI test-results panel (grounded ≥ 95%, refusals 15/15, red-flag recall 100%).
- **Body map** (front/back images from IMAGE_PROMPTS_CHATGPT.md set D, tap points from `SITES`), with a heat glow from her year.
- **Visit mode** (one-screen SBAR + QR), **FHIR R4 export**, **wearable import** (sleep/temperature, context only), **discreet mode**
  (PIN, neutral name "My notes", no notification previews), **demo-safe mode** (saved answers, works offline).
- **Validated questionnaires** only: PBAC, EHP-5, EPDS, MRS. New rules: OBS_HEAVY_WITH_FATIGUE, CARE_PREGNANCY_GLUCOSE_SCREEN,
  OBS_POSTPARTUM_MOOD, OBS_PERIMENOPAUSE_SYMPTOMS, RF4 self-harm, RF5 pregnancy, RF6 after-birth warning signs.
- **3D (React Three Fiber)**: cycle-day ring + phone tilt, year spiral, follow-ups-by-region columns on the clinic dashboard. All from data.
- Design: **E · Mauve Pro** (docs/06). Images: IMAGE_PROMPTS_CHATGPT.md. Reference: mockup/reprosense-mockup.html.
- Demo story for the 3 minutes: Noura (pattern + body map) → Hessa (care navigator) → Fatima (clinic closes the gap). Other women stay explorable.
