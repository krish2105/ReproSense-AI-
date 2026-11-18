# BUILD_STATUS — ReproSense AI

Legend: ⬜ not started · 🟨 in progress · ✅ done · ⛔ blocked

Last updated: 2026-11-07, late night (Krishna approved and merged #82, #86 and #92–#96: G2 safety fixes 4a–4c and 4e, the G3 delta rule; deploy waits for the accounts, B2 for the API key). Repo: https://github.com/krish2105/ReproSense-AI-

**Owners.** Krishna (`krish2105`): backend, AI, data, security, deploy. Atharva (`mercydeez`): web app (design + frontend).
Yash (`Yashpetkar7`, invite pending): not assigned yet.
**Start here:** `HANDOFF.md`.

| Phase | Name | Status | Owner | Done when | Where it stands |
| --- | --- | --- | --- | --- | --- |
| 0 | Setup (repo, CI, tokens, data generated) | ✅ | Krishna (API + web scaffold) · Atharva (web) | web + API run locally, tokens page renders light/dark | Done 5 Nov: `apps/web` (Next 15.5, TS strict, Tailwind v4 without preflight, next-intl EN/AR + RTL), mockup tokens + component CSS copied by script, `/api/v1` proxy, role-guarded `/app` `/clinic` `/admin` layouts, UI kit, `/demo` roster with login + reset, `/tokens` gallery (light/dark verified in the browser), web CI job, 16 unit tests. |
| 1 | Data + rules engine | ✅ | Krishna | 8 personas → expected observations, 30+ rule tests pass (incl. 6 red flags) | 8/8 personas; 63 rule and guard tests; parity test against the generator |
| 2 | Patient core (onboarding, dashboard, log, timeline) | ✅ | Atharva (built by Krishna) | persona navigable at 390px width | Done 5 Nov: Home (red flags first, stage switch, day pills, cycle / pregnancy / after-birth arcs, RF5 warning box, recommendations, mood, patterns), Hessa's care navigator (draft → approve, "Nothing was sent"), Calendar (month grid, day detail, log form with PBAC, pain, calibrated body map, symptoms, sentence capture; red flags shown at once), Analytics (3/6/12 months, cycle length with the 21–35 band, pain and bleeding-score bars, day-by-day year, table view). Verified at 390 and 1280, EN/AR, light/dark. |
| 3 | AI insights + RAG assistant | ✅ | Krishna (API ✅) · Atharva (UI, built by Krishna) | every answer cites a source; banned-phrase test passes | Done 5 Nov: Patterns (red flags pinned first, full cards, evidence chips open the day, record strength, "How this was produced" with the rule inputs and the 7 pipeline steps, draft request, crisis screen) and AI Chat (numbered sources under every answer, refusal, urgent 998 styling, crisis support only, suggested questions, EN/AR, voice input where supported). EPDS check-in moves to Phase 6 (QUESTIONS #40). |
| 4 | Doctor-ready report (preview + PDF + share) | ✅ | Krishna (API ✅) · Atharva (UI, built by Krishna) | PDF matches persona; share link expires | Done 5 Nov: report preview from the same payload as the PDF, Download/Open PDF (renders inline through the proxy), consented 7-day share (checkbox required), sharing list with Stop sharing, `/shared/[token]` (opens without login; revoked → "doesn't open", expired → 410 message, both verified), visit mode with handover rows and a real QR of the share link. |
| 5 | Clinician + admin dashboards | ✅ | Krishna (API ✅) · Atharva (UI, built by Krishna) | care gap closes live in the demo | Done 5 Nov: clinic list (consented only, most urgent first) + follow-ups due; patient record (SBAR, red flags, follow-ups with book/done/reopen and a reminder draft, Ask the record with dated evidence, charts, patterns with evidence, labs, her questions, visit note, mark reviewed); consent gate for Amina; admin (KPIs, live demo follow-ups, funnel, regions, fairness tables, ROI with stated assumptions, audit chain check, 10-second refresh). Verified: closing Fatima's gap moved closed 101→102, rate 40.4→40.8%, open 88→87. |
| 6 | Life stages + agents v4 | ✅ | Krishna (API ✅) · Atharva (UI, built by Krishna) | every life stage opens from the stage switch; navigator draft needs approval; FHIR bundle validates | Done 5 Nov: stage switch for all five stages and the navigator (Phase 2); EPDS check-in with the standard items and citation (crisis → support only, no score; Arabic items pending the validated version, QUESTIONS #40); lab reports (upload, editable extraction, confirm; Fatima's demo OGTT closes her follow-up); privacy centre (choices, who saw my data, stored counts, JSON export, FHIR check: 9 resources, no validation errors, discreet mode, delete with confirmation). Not built: wearables, Ramadan mode (needs a source). |
| 7 | Polish (R3F, dark, Arabic RTL, states, a11y, images) | ✅ | Atharva (built by Krishna) | Lighthouse ≥ 90, zero console errors, 3D fallback works | Done 6 Nov: landing on Noura's live record (her phone tilting over a React Three Fiber ring of her cycle days; year spiral beside the cycle ledger; stage cards, evidence, trace, model, promises), `/admin` follow-ups by region in 3D with a flat chart and the table, `/status`, robots.txt. Lighthouse 100/100/100/100 on mobile and desktop (two runs each); reduced motion and no-WebGL show the posters (checked in Chrome); zero console errors. Arabic still needs the native review (AR-REVIEW). All 37 images are in `apps/web/public/images`. |
| 8 | Security pass | 🟨 | Krishna | docs/07 checklist fully ticked | Done: forced RLS with tests, append-only hash-chained audit log, AES-GCM notes and documents, headers, rate limits, CORS, input validation, PII redaction, injection stripping, gitleaks in CI. Not yet: passkeys (stretch), web CSP, dependency scanning. |
| 9 | Ship (deploy, reset, video, pitch) | 🟨 | Krishna + Atharva | senior-judge ≥ 90/100 | Done: demo reset endpoint; Playwright e2e of the 3-minute path in CI (6 Nov: 69 checks at 1280 and 390 px, every key screen in EN/AR/dark through axe, 998 red flag, 3D fallbacks, zero console errors). Not done: deploy, backup video, pitch. |

## Pre-build (before selection on 16 Nov)

| Task | Status |
| --- | --- |
| All members submit application (same team name) by 14 Nov 23:59 GST | ⬜ |
| Disclosure note of prior designs/research/AI tools; **now also the code written on 5–6 Nov** (QUESTIONS #34, #44) | 🟨 complete note drafted in docs/15 (6 Nov); Krishna: ask the organisers how earlier code is scored, tag `pre-selection-2026-11-16` |
| Second competition (Future Health Digital Innovation Challenge, Fertility track): registration closes **10 Nov** (QUESTIONS #45) | ⬜ Krishna decides |
| Native Arabic review of every AR-REVIEW string (landing evidence, join, trust, admin, privacy, assistant) | ⬜ |
| Pitch deck from the real build (`pitch/deck.html`, PDF backup) | ✅ 6 Nov; fill the marked placeholders only with true facts |
| 5+ interviews (clinicians, clinic managers, women) | ⬜ |
| Clinician reviewer for rules/clinical_rules.yaml (also #17, #27, #28, #35) | ⬜ |
| Generate images with IMAGE_PROMPTS_CHATGPT.md | ✅ 37 images + 1 duplicate placed in public/images; see ASSET_INTEGRATION_REPORT.md |
| Body-map tap points calibrated to the real art (mockup) | ✅ verified at 320/375/768/1280, front + back |
| Hackathon rules re-checked on the official page (upstartbar.com/ajyal) | ✅ 5 Nov; building may start when selection is announced on 16 Nov |

## Verified numbers (7 Nov late night, main `bd2de0f`)
- Web e2e, local, runs 10–12: run 11 had 118 passed and 8 skipped. Runs 10 and 12 each failed one test, and only on React #418 (`/admin` in the demo path; `/app` in the join test, after which its serial block left 2 tests unrun); every other test passed. That is not 3 in a row. On the new code #418 hit 3 of 6 runs (`/clinic`, `/admin`, `/app`, all desktop), against 0 of 3 on `31ca72d`. A dev-server repeat of the demo-path, join and screens specs (135 test runs) logged no hydration mismatch, which fits the documented production-only race in Next 15.5's React canary. The fix path stays Next 16 (#72, from 17 Nov)
- Lighthouse, mobile, signed in: **100 / 100 / 100** on `/app`, `/app/insights`, `/app/assistant`, `/app/report`, `/clinic`
- Backend (CI, Linux): **318 passed**
- Second rescore: Jury **72**, MVP **76.5**, SaaS **72**, Clinical safety **26.5/35**, Women's experience **27.5/35**, Trust **7/7**

## Verified numbers (7 Nov night, local, main `31ca72d`)
- Web e2e (production build, API from the Linux Docker image in CI's demo-safe setup, no retries): **114 passed, 8 skipped,
  0 failed in each of 3 runs in a row** (runs 4–6; 5.9–7.1 min each), 0 hydration errors
- Backend: **306 passed** (the PDF test also passes in CI on Linux; on Windows it needs GTK)
- Web unit tests: **52 passed**
- Senior-judge rescore: Jury **72**, MVP **76**, SaaS **72**, Clinical safety **26/35**, Women's experience **27/35**, Trust pack **7/7** (PROGRESS.md)

## Verified numbers (6 Nov, local)
- Web e2e (`pnpm e2e`, production build): **69 passed, 3 skipped** (desktop-only checks on the phone project), 3 runs in a row; the demo path takes 13–16 s per viewport
- Landing Lighthouse: **100 / 100 / 100 / 100** on mobile and on desktop
- Web unit tests: **50 passed**
- Assistant safety routing, held-out round 5 (132 new questions, measured once, word checks only): crisis **11/30** · emergencies **24/32** · diagnosis refused **6/10** · medicine sent to a doctor **4/10** · everyday answered normally **42/50**. Round 4, before the review fixes: 12/30 · 18/32 · 7/10 · 3/10 · 46/50. The model second check is not scored yet (#29).

## Test hardening (issue #24, 6 Nov, local on Windows + Chrome, production build)
- **Demo-safe mode:** `backend/tests/test_demo_safe.py` replaces the Anthropic client with a tripwire and runs home, patterns and the assistant for three personas with `LLM_PROVIDER=none` and a key set: no model client is built (a second test proves the tripwire fires under `auto`). The CI e2e job now runs with a dummy key, a dead `ANTHROPIC_BASE_URL` and `E2E_DEMO_SAFE=1`, so the whole demo path must pass with `/readyz` reporting `llm: none`.
- **Hydration flake #418 (QUESTIONS #54):** not reproduced in 2 full local runs (106 tests each, 0 hydration errors). Cause stands as documented in research/2026-11-05 §6: Next 15.5.29 is the newest 15.5 and still bundles React `19.2.0-canary-0bdb9206-20250818`; a stable React needs Next 16 (a stack change, Krishna's call). CI keeps one retry.
- **Lighthouse, mobile, signed in** (performance / accessibility / best practices): `/app` 99/100/100 · `/app/insights` 99/100/100 · `/app/assistant` 100/100/100 · `/app/report` 100/100/100 · `/clinic` 100/100/100. SEO is 66 on the three inner patient pages only because they are deliberately not crawlable.
- **States:** every area has an `error.tsx` with Try again (her app and the clinic also link back to the demo people); empty states where data can be empty; navigation feedback through `LinkPending` (route `loading.tsx` stays removed, see #54). Server calls now time out after 15 s (`API_TIMEOUT_MS`), so a hung API shows the error screen instead of a spinner. New `e2e/api-down.spec.ts`: API down (her app, clinic) and API too slow (roster and her app give up after the timeout), against a second copy of the build on :3101 pointed at a stub.

## SaaS evidence (issue #25, 6 Nov)
- **FHIR R4:** the export of all 8 personas passes the official HL7 FHIR validator (v7.0.5, R4 4.0.1) with **0 errors**. The first run found 1 error per bundle (a custom `synthetic` extension with no published definition); it was removed, since the standard `HTEST` tag already marks the data as test data, and `fhir.validate()` now rejects such extensions. 94 best-practice warnings remain (narrative, performer, dates on pattern Observations).
- **Unit economics** (docs/12, deck slide 8): UAE pilot stack ≈ AED 122 a month (AWS me-central-1 list prices with VAT), model cost per report zero in the shipped mode, infrastructure-only margin ≈ 94% for one small clinic, payback shown as CAC scenarios. All labelled hypotheses with sources.
- **UAE hosting plan** (docs/07, /trust clause 3.1.4.5.1): Supabase, Render and Vercel have no UAE region, so production moves to AWS Middle East (UAE) or Azure UAE North before any real record.
- **Malaffi:** wording checked in docs/07, docs/10 and docs/12; nothing in the app or deck claims a direct connection.

## AI eval after the Arabic punctuation fix (6 Nov)
- 60-question eval (extractive mode, no LLM): grounded **30/30 (100%)**, refusals **15/15**, red flags **15/15**, banned phrases **0**, answer language **100%**. The one known miss, ar04 ("متى تُعتبر الدورة غزيرة؟"), came from the tokenizer counting ؟ ، ؛ as part of the word before them.

## Verified numbers (5 Nov, local, `make test`)
- Backend tests: **104 passed** (rules 63 · API 27 · RLS 8 · security 6 · AI eval 1 covering 60 questions)
- AI eval (extractive mode, no LLM): grounded **96.7%** (target ≥ 95) · refusals **15/15** · red-flag recall **100%** · banned phrases **0** · answer language match **100%**. One known miss: ar04.
- Rule accuracy: **8/8** personas

## Known risks
- No clinician on the team yet → evidence score risk (QUESTIONS #2, #18).
- The web app is the largest remaining piece and blocks the demo path (Phases 2–7 UI).
- No LLM key configured: the assistant and cards run in deterministic mode. Set `ANTHROPIC_API_KEY` for Claude wording (cached for demo-safe mode).
- Code exists before selection: it must go in the disclosure note (QUESTIONS #34). The repo is public.
