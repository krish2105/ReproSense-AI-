# 24 · Who builds what in build week, with Claude Code prompts (Krishna, Atharva, Yash, Dareen)

Written 18 Nov 2026 by Krishna. The features and why they score are in `docs/23_BUILD_WEEK_FEATURES.md`. **Code freeze:
Sat 21 Nov 18:00.** Submission on Sun 22 Nov by 15:15: a 3-slide PDF or PPT and an MP4 demo. Live demo:
https://reprosense.vercel.app (API on Render; it can take up to a minute to wake).

The organisers judge build week by **GitHub commits from 17–21 Nov that substantially transform the solution**, so every
task below is its own branch and pull request, opened by the person who owns it.

## The split
| Wave | Krishna (backend, AI, safety) | Atharva (web, 3D, design) | Yash (content, product, demo) |
| --- | --- | --- | --- |
| **1 · Wed 18 – Thu 19** | K1 Postnatal 6-week pathway · K2 Voice logging (EN/AR) | A1 3D body pain map · A2 Judge guided tour | Y1 Planning-a-pregnancy checklist · Y2 Live demo test on phones |
| **2 · Thu 19 – Fri 20** | K3 Pre-visit AI brief · K4 Clinic onboarding API | A3 Clinic onboarding and admin screens (with K4) · A4 Her year in 3D · A5 Read-aloud | Y3 Pilot ROI page · Y4 Family support view |
| **3 · Fri 20 – Sat 21** | K5 Her own sign-in (passkey + email code) · K6 Blood-pressure log and warning (G2) · K7 Scored model safety check (needs the key) | A6 Installable web app (PWA) · A7 3D pregnancy and fourth-trimester ring · A8 Motion and polish, release | Y5 MP4 demo and 3-slide deck · Y6 Rehearsals and backup |

**Wave 4 · Dareen (Wed 18 – Sat 21, freeze 18:00):** the **mother–baby link**, closing the theme's "newborn and
early-childhood" half, plus native Arabic. D1 Baby's first-year schedule · D2 Feeding and breastfeeding log · D3 AI
hospital-discharge reader · D4 Reminder centre · D5 Arabic-first pass (native review and Gulf Arabic assistant probes)
· D6 Mother–baby clinic board with fair analytics. Dareen is the team's Abu Dhabi university student and a native
Arabic speaker; she builds with Claude Code and opens her own PRs.

Krishna's tasks are built with Claude Code on his account. Each person ticks their boxes in their own GitHub issue.
Order for Dareen: D5 can start at once; D1 and D4 build on K1 (the postnatal pathway, `backend/app/services/postnatal.py`)
and D3 on the lab-photo reader (#102, `_read_photo` in `backend/app/api/patient.py`).

## How to use a prompt
1. `git checkout main && git pull`, then `make env db seed test` once (expect about 380 passed) and `make hooks`.
2. Start Claude Code in the repository folder and paste the **shared preamble** below, then your task's prompt.
3. When Claude Code opens the PR, check the screens yourself (English, Arabic, dark mode, phone width), then merge on
   green CI. Safety or rules changes wait for Krishna's approval.

### Shared preamble (paste first, every time)
```text
You are working on ReproSense AI (HealthX Ajyal hackathon, DoH Abu Dhabi, theme Women's Health). Read CLAUDE.md,
HANDOFF.md section 0, docs/23_BUILD_WEEK_FEATURES.md and docs/24_TEAM_TASKS_BUILD_WEEK.md first.
Rules: never diagnose; no probabilities; every health sentence cites a source from knowledge_base/sources.yaml; red
flags first with 998; synthetic data only; the care navigator only drafts. Load the skills that match the work
(no-ai-slop-ui and web-screen for any UI, clinical-copy-guard for any health text, mauve-3d for 3D, mauve-charts for
charts). Work test first: write the failing test, watch it fail, then build. Every user-facing string goes in
apps/web/messages/en.json and ar.json (Arabic right-to-left, add new Arabic strings to docs/AR_REVIEW.md). Commit as me,
with no Claude or AI co-author line and no "Generated with Claude Code". Branch from main, one branch and one PR per
task, with make test and (for web) pnpm lint, pnpm typecheck, pnpm test and the relevant Playwright spec in the PR
description, plus screenshots. If you change rules/clinical_rules.yaml, backend/app/rules/, safety.py, assistant.py or
config.py, add a row to docs/safety/CHANGE_LOG.md and ask Krishna to approve (gate G2). Ask me before guessing.
```

---

## Wave 1 (Wed 18 – Thu 19 Nov)

### K1 · Postnatal 6-week pathway (Krishna) · branch `feat/postnatal-pathway`
```text
Task K1: build the postnatal 6-week pathway. Follow DoH Abu Dhabi's Postnatal Care Program Standard (May 2025) and
Integrated Postnatal Care Programme (July 2025): a telemedicine check in the first days after discharge, visits at
7–14 days and at 6 weeks, a mood check (EPDS) at 10–14 days, and, after gestational diabetes, the glucose test 4–12
weeks after birth (existing CARE_POSTPARTUM_GLUCOSE_TEST). Add the DoH sources to knowledge_base/sources.yaml with
summaries in our own words. Backend: compute the pathway from her delivery date (Fatima, 9 weeks after birth, is the
demo), each step with its window, status (done, due, overdue, upcoming) and source; reminders are drafts only. Web:
an "After birth" pathway card on Home and a timeline view in English and Arabic; the clinician sees her pathway
status; the clinic network counts completed steps next to PC008. These are care steps, not new red flags. Tests for
the windows, Fatima's status, Arabic copy and the clinician view.
```

### K2 · Voice logging, English and Arabic (Krishna) · branch `feat/voice-logging`
```text
Task K2: voice logging. On the log screen add a microphone button. Use the browser's speech recognition (Web Speech
API, ar-AE or en-US by the app's language); where it is unavailable, hide the button and keep typing. The transcript
goes to the existing POST /v1/logs/parse; with a model configured (OpenRouter, app/ai/llm.py) the parser may use it to
read Gulf Arabic and English into flow, pain 0–10, symptoms from the fixed list, impact and mood, and must fall back
to the rule-based parser with no model. She always sees the filled form and confirms before anything is saved; red
flags from the parsed entry show 998 guidance immediately. Respect her AI switch: with AI off, only the rule-based
parser runs. Tests: the parser with a fake model and without one, Arabic and English examples, the AI switch.
```

### A1 · 3D body pain map (Atharva) · branch `feat/3d-body-map`
```text
Task A1: a 3D body pain map. Today apps/web/src/components/log/BodyMap.tsx uses flat images and the API's pain sites
(lower abdomen, upper abdomen, left pelvis, right pelvis, lower back). Build a React Three Fiber figure from simple
shapes (no downloaded anatomy models: licences), front and back, that shows where she logs pain with a heat colour by
how often (from the last 3 months of her logs) and lets her tap a region to select it in the log form. Follow the
mauve-3d skill: lazy-load, respect reduced motion, and show the existing 2D map as a still fallback when WebGL is
unavailable (the e2e 3D-fallback checks must pass). Labels and an accessible list in English and Arabic. Tests: the
heat calculation (unit), and Playwright for the fallback and for selecting a region.
```

### A2 · Judge guided tour (Atharva) · branch `feat/judge-tour`
```text
Task A2: a one-tap "Show me in 3 minutes" guided tour for judges, started from the landing page and /demo. It walks
the demo path with a small floating card per step (open Noura, her patterns with evidence, ask the assistant, prepare
the doctor report, switch to the clinician, open the clinic network with care gaps closing), highlighting the element
to look at and offering Next, Back and Exit. It must work in English and Arabic, light and dark, at 390 and 1280 px,
and never block the real buttons. Keyboard accessible and announced to screen readers. Playwright test that runs the
whole tour on desktop and mobile.
```

### Y1 · Planning-a-pregnancy checklist (Yash) · branch `feat/preconception-checklist`
```text
Task Y1: a planning-a-pregnancy checklist for the "Trying" life stage (persona Mariam). Items: folic acid before
conception (nhs_folic_acid), premarital screening in Abu Dhabi, vaccinations to check before pregnancy, a check-up if
cycles are irregular, and when to ask for a fertility assessment (existing OBS_TTC_FERTILITY_ASSESSMENT). Each item
cites a source in knowledge_base/sources.yaml; add any new official UAE or NHS source with a summary in our own words
and say so in the PR. Never imply she must do any item, never a diagnosis. She can tick items; ticks are saved to her
record. English and Arabic. Ask Krishna to review the health wording before merging (clinical-copy-guard).
```

### Y2 · Test the live demo on phones (Yash) · no code unless a bug is clear
```text
Task Y2: test https://reprosense.vercel.app end to end on two phones (one iPhone, one Android) and a laptop, in
English and Arabic, light and dark: demo people, Noura's home and patterns, the assistant (ask "What counts as a heavy
period?"), the doctor report and PDF, the clinician view (Fatima), the clinic network. Note every problem as a GitHub
issue with a screenshot, the device and the steps. If a fix is a small, clearly web-only change, fix it on its own
branch with a Playwright test; anything about health wording goes to Krishna.
```

---

## Wave 2 (Thu 19 – Fri 20 Nov)

### K3 · Pre-visit AI brief (Krishna) · branch `feat/previsit-brief`
```text
Task K3: a pre-visit brief. Before an appointment, write "what changed since your last visit" from her own entries
only: new patterns, cycle and pain changes, labs confirmed since, care steps done or due, her questions. Rules decide
the facts; the model (when configured) may reword, and the verifier keeps only sentences supported by her data and the
cited sources; without a model, a deterministic template. Never a diagnosis or probability. Shown to her before she
shares, and to the clinician in the patient view. Tests with and without a model, and the guard on banned wording.
```

### K4 · Clinic onboarding API (Krishna) · branch `feat/clinic-onboarding-api` (pairs with A3)
```text
Task K4: clinic onboarding, built fresh this week (do not merge build-week/clinician-invites; it predates selection).
API: a clinic-admin role; the admin invites a clinician by a single-use QR or link; the clinician accepts and joins that
clinic; per-clinic dashboard figures and a per-clinic CSV export of follow-ups without names; every action audited.
Row-level security keeps each clinic to its own consented patients. Publish the request and response shapes in the PR
for Atharva's screens (A3). Tests for roles, RLS between two clinics, single-use invites and the export.
```

### A3 · Clinic onboarding and admin screens (Atharva) · branch `feat/clinic-onboarding-ui`
```text
Task A3: the screens for Krishna's clinic onboarding API (K4; read its PR for the shapes). A clinic-admin area: invite
a clinician (QR and link), see who joined, the clinic's own dashboard (follow-ups open, booked, done, PC008) and the
export button. A clinician accepting an invite. Separate layout and role from her app and the clinician view. English
and Arabic, light and dark, phone and desktop, axe-clean. Playwright: admin invites, clinician accepts, export works.
```

### A4 · Her year in 3D (Atharva) · branch `feat/year-3d-in-app`
```text
Task A4: bring the 3D year spiral (apps/web/src/components/landing/YearSpiral3D.tsx) into her timeline
(apps/web/src/app/app/timeline/page.tsx) using her own logs: one bead per logged day, coloured by cycle phase, rings for
pain 7 or more, diamonds for events; tapping a bead opens that day. Keep the 2D chart as fallback and for screen
readers. mauve-3d rules, reduced motion, English and Arabic. Playwright: the fallback and opening a day from a bead.
```

### A5 · Read-aloud (Atharva) · branch `feat/read-aloud`
```text
Task A5: a "Read aloud" button on her pattern cards, the assistant's answers and the doctor report summary, using the
browser's speech synthesis (Arabic voice when the app is in Arabic, English otherwise; hide the button if no voice is
available). Play, pause and stop; it reads the card's text and sources, never anything hidden. Keyboard accessible.
Unit test for the text it reads; Playwright with a stubbed speechSynthesis.
```

### Y3 · Pilot ROI page (Yash) · branch `feat/pilot-roi`
```text
Task Y3: a public "Pilot value" page for a clinic or an insurer, built from the existing
apps/web/src/components/admin/RoiCalculator.tsx. Inputs (all visible and editable, with defaults that cite their
source or say "assumption"): women in the pilot, share with gestational diabetes, follow-up completion before and
after, cost of one missed follow-up, subscription price. Output: follow-ups closed and value per 1,000 women. No
invented outcomes, no clinical claims; a plain "assumptions" note. English and Arabic. Unit tests for the arithmetic.
```

### Y4 · Family support view (Yash) · branch `feat/family-support`
```text
Task Y4: a family support view for the UAE Year of the Family 2026. She can share a read-only link with her husband or
mother that shows only her upcoming care steps and reminders and "how you can help" tips, with no health details unless
she ticks them, and she can revoke it at any time (reuse the consent and share-link patterns in her Privacy page and
/shared/[token]). Every view is logged in her "who saw my data". English and Arabic. Tests: what the link shows and
hides, revocation, expiry. Krishna reviews the privacy wording before merge.
```

---

## Wave 3 (Fri 20 – Sat 21 Nov, freeze 18:00)

### K5 · Her own sign-in (Krishna) · branch `feat/sign-in`
```text
Task K5: her own sign-in so a joined record works on any device: passkeys (WebAuthn) first, and a 6-digit email code
as backup (the email service key is set in Render by Krishna; without it the code option is hidden). Export and
delete after sign-in. Demo personas stay one tap. Rate limits on codes, audited sign-ins. Tests for both methods with
fakes, and Playwright for the passkey flow with a virtual authenticator.
```

### K6 · Blood-pressure log and warning (Krishna, gate G2) · branch `feat/bp-log`
```text
Task K6: she can log blood pressure in pregnancy and in the 6 weeks after birth. A new red-flag rule in
rules/clinical_rules.yaml (with add-explainable-observation) shows urgent 998 guidance for a high reading or warning
symptoms (severe headache, vision changes, sudden swelling), citing NICE NG133 (add it to the knowledge base). Readings
on her timeline and the clinician view. CHANGE_LOG row; mark it for clinician sign-off. Tests for the thresholds,
the urgent card and Arabic.
```

### K7 · Scored model safety check (Krishna) · branch `feat/model-safety-score`
```text
Task K7: with the OpenRouter key set, run make safety-eval to score the model's second safety check on held-out round
5 (never tune on it), save it under heldout_with_model next to the word-checks number, and show both on /status with
the model's name. If the key is not available by Friday noon, write up the method and leave the number empty.
```

### A6 · Installable web app (Atharva) · branch `feat/pwa`
```text
Task A6: make the web app installable on phones (the phone app for this week): a web app manifest with the ReproSense
icons, a service worker that caches the app shell and the demo pages for offline viewing (never caches API answers
with her data), an "Add to home screen" hint, and a reminder permission prompt only after she asks for reminders.
Lighthouse PWA checks pass. Playwright: the manifest and the offline page.
```

### A7 · 3D pregnancy and fourth-trimester ring (Atharva) · branch `feat/pregnancy-ring-3d`
```text
Task A7: a 3D ring of 40 weeks of pregnancy plus the 6 weeks after birth for the Pregnancy and After-birth stages
(Hessa, Fatima). It shows where she is and what is due when (the glucose screen at 24–28 weeks, K1's postnatal steps),
each with its source on tap. Built from shapes in code, mauve-3d rules, 2D fallback, English and Arabic.
```

### A8 · Motion, polish and release (Atharva) · branch `feat/polish`
```text
Task A8: page transitions, loading skeletons and empty states on every screen; a last pass in dark mode and Arabic at
390 and 1280 px; run the full Playwright suite three times green. Then the release (C7 in docs/18): tag
build-week-release, nothing merged after Sat 21 Nov 18:00.
```

### Y5 · MP4 demo and 3-slide deck (Yash)
```text
Task Y5: the submission. 1) A 3-slide deck as PDF and PPTX: the problem (Abu Dhabi evidence with sources from
docs/05), the solution (what we built, how it uses AI, why it beats today's options) and the roadmap (customers,
milestones, what we need), in pitch/. 2) The MP4 demo, about 90 seconds, recorded from the live site with captions:
Krishna's Claude Code session prepares an automated recording; review it, add a voice-over if you like. Submit both at
programs.upstartbar.com on 22 Nov before 15:15.
```

### Y6 · Rehearsals and backup (Yash)
```text
Task Y6: three timed rehearsals of the 3-minute pitch plus 3-minute Q&A (docs/drafts/26-rehearsal-cards.md, the Q&A in
docs/10), one with the live link on a phone. Keep the backup MP4 on two laptops and a USB stick. Write the morning
checklist for 22 Nov (arrive 09:30, Emirates IDs, laptops and chargers).
```

---

## Wave 4 · Dareen: the mother–baby link and native Arabic (Wed 18 – Sat 21 Nov, freeze 18:00)

The theme asks for "women's health and maternal, **newborn and early-childhood** outcomes"; until now ReproSense
covered the mother only. Each task below is new build-week work with its own branch and PR. Newborn content is
information and scheduling only: no diagnosis of the baby, no dosing, "ask your baby's doctor" for anything else, and
every item cites an official source (MOHAP / DoH / NHS / NICE / WHO) added to `knowledge_base/sources.yaml` with a
summary in our own words. Anything that adds an urgent warning for the baby is a new red-flag rule: gate G2 (Krishna's
approval, CHANGE_LOG row, clinician sign-off before real use).

### D1 · Baby's first-year schedule (Dareen) · branch `feat/baby-schedule`
```text
Task D1: a "Baby's first year" schedule linked to the mother's record after a birth (persona Fatima, baby born 20 Sep
2026). Steps: the newborn checks in DoH's Postnatal Care Program Standard (with the mother's checks), and the UAE
national immunisation schedule from birth to 12 months, each with its window, status (done, due, upcoming, not
recorded, never "missed") and source. First find and add the official sources (the MOHAP/DoH national immunisation
schedule for the UAE; quote the document name, date and link in the PR) to knowledge_base/sources.yaml with
answers: false and summaries in English and Arabic in our own words. Backend: a service like
backend/app/services/postnatal.py (read it) that computes the schedule from the birth date; she can mark a step done
("baby had this"); a baby has no name in the data, only "your baby". Web: a "Baby's first year" card on Home and a
page with the timeline, English and Arabic, light and dark, 390 and 1280 px. The clinician sees the schedule status.
Tests first: windows from a birth date, statuses, sources exist, Arabic, the API, and a Playwright spec.
```

### D2 · Feeding and breastfeeding log (Dareen) · branch `feat/feeding-log`
```text
Task D2: a quick feeding log after a birth: breastfeeding, expressed milk or formula, and how it went (latch worries,
pain, enough wet nappies), in one tap each, plus sourced support tips from DoH's Postnatal Care Program Standard
(3.1.3.3 promotes exclusive breastfeeding and support) and the NHS. Show a simple daily summary chart (mauve-charts
skill). Information only: never advice on formula amounts or medicines, never a diagnosis; "talk to your midwife,
nurse or doctor" when she logs a worry. If you want an urgent warning (for example a baby under 3 months with a
fever), stop and ask Krishna: that is a new red-flag rule (gate G2). English and Arabic. Tests first, and a Playwright
spec for logging a feed.
```

### D3 · AI hospital-discharge reader (Dareen) · branch `feat/discharge-reader`
```text
Task D3: she photographs her hospital discharge summary and the AI reads the key facts so her after-birth pathway
(K1) and the baby schedule (D1) start from the right dates: discharge date, birth date, mode of birth, gestational
diabetes in pregnancy (yes/no), and the baby's birth weight. Reuse the lab-photo path (#102): _read_photo in
backend/app/api/patient.py, OpenRouterProvider.complete_json_image in backend/app/ai/llm.py, and the "model only
transcribes, our code validates" pattern in backend/app/services/documents.py (photo_text). Every value is checked by
code (real dates, not in the future, after pregnancy) and shown to her to confirm before anything is saved; she can
edit or drop each one; the photo itself is not kept. Her AI switch off: nothing is sent. Saved facts become events
(hospital_discharge, delivery) so the pathway uses the real discharge date. Tests first with a fake vision model
(see backend/tests/test_lab_photo.py), English and Arabic, and a Playwright spec with the API stubbed.
```

### D4 · Reminder centre (Dareen) · branch `feat/reminders`
```text
Task D4: one reminder centre for everything that is due: her postnatal steps (K1), the glucose test, the baby's
schedule (D1), and the pregnancy glucose screen. A "Reminders" page and a bell on Home with the count due this week;
each reminder links to the step and its source and can be snoozed or marked done. Reminders never send anything on
their own: they can be added to her phone calendar (an .ics file) or, once the installable app exists (A6), shown as a
notification she turned on herself. English and Arabic (Arabic dates and numbers correct). Tests first for what is
due when, snoozing and the .ics file; a Playwright spec.
```

### D5 · Arabic-first pass (Dareen) · branch `feat/arabic-first`
```text
Task D5: you are the team's native Arabic speaker. 1) Review docs/AR_REVIEW.md row by row, safety replies first: fix
meaning, tone (warm, direct, feminine address where the screen is hers) and medical terms, and decide every
"flagged term" (نزيف, جلطات, إغراق) in its section; change apps/web/messages/ar.json, rules/translations_ar.yaml and the
backend Arabic strings to match, and fill the OK column. 2) Walk every screen in Arabic at 390 px and fix right-to-left
layout bugs, numbers and dates. 3) Write 30 new Gulf and standard Arabic assistant questions the way women really ask
(everyday, urgent, crisis, medicine, diagnosis requests) as regression probes in backend/tests/test_safety_routing.py
(never in rag_heldout.jsonl round 5), and report which routes fail. Changes to safety wording or routing go to Krishna
(gate G2). Tests and screenshots in the PR.
```

### D6 · Mother–baby clinic board with fair analytics (Dareen) · branch `feat/mother-baby-board`
```text
Task D6: on the clinic network page (/admin) add a "Mother and baby follow-up" board: across the synthetic cohort and
the live demo women, how many postnatal checks (K1) and baby schedule steps (D1) are done, due or not recorded, by
region and by clinic, with small numbers suppressed (fewer than 10 shown as "fewer than 10", like the existing
regions view) and a fairness view (completion by nationality group and age band, no individual rows). Extend
data/synthetic/generate_synthetic.py if needed (synthetic-data-realism skill; the generator must stay byte-identical
for its seed, so regenerate and commit its output, and make sure CI's generator-check passes). mauve-charts for the
charts; English and Arabic. This is the PureHealth and DoH story: care gaps closing for mothers and babies. Tests
first for the counts and the suppression.
```
