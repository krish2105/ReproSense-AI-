# BUILD_STATUS — ReproSense AI

Legend: ⬜ not started · 🟨 in progress · ✅ done · ⛔ blocked

Last updated: 2026-11-05 (backend built and tested; web Phases 0, 2, 3, 4 and 5 done). Repo: https://github.com/krish2105/ReproSense-AI-

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
| 6 | Life stages + agents v4 | 🟨 | Krishna (API ✅) · Atharva (UI) | every life stage opens from the stage switch; navigator draft needs approval; FHIR bundle validates | Done in the API: navigator (draft → approve, never sends), EPDS crisis path, FHIR export, lab upload → confirm, pregnancy and after-birth arcs. Not started: wearables, discreet-mode UI, Ramadan mode (needs a source). |
| 7 | Polish (R3F, dark, Arabic RTL, states, a11y, images) | ⬜ | Atharva | Lighthouse ≥ 90, zero console errors, 3D fallback works | All 37 images are in `apps/web/public/images`, and the body-map tap points are calibrated (`ASSET_INTEGRATION_REPORT.md`). |
| 8 | Security pass | 🟨 | Krishna | docs/07 checklist fully ticked | Done: forced RLS with tests, append-only hash-chained audit log, AES-GCM notes and documents, headers, rate limits, CORS, input validation, PII redaction, injection stripping, gitleaks in CI. Not yet: passkeys (stretch), web CSP, dependency scanning. |
| 9 | Ship (deploy, reset, video, pitch) | ⬜ | Krishna + Atharva | senior-judge ≥ 90/100 | Demo reset endpoint is done. Not done: deploy, Playwright e2e, backup video. |

## Pre-build (before selection on 16 Nov)

| Task | Status |
| --- | --- |
| All members submit application (same team name) by 14 Nov 23:59 GST | ⬜ |
| Disclosure note of prior designs/research/AI tools; **now also the code written on 5 Nov** (QUESTIONS #34) | ⬜ |
| 5+ interviews (clinicians, clinic managers, women) | ⬜ |
| Clinician reviewer for rules/clinical_rules.yaml (also #17, #27, #28, #35) | ⬜ |
| Generate images with IMAGE_PROMPTS_CHATGPT.md | ✅ 37 images + 1 duplicate placed in public/images; see ASSET_INTEGRATION_REPORT.md |
| Body-map tap points calibrated to the real art (mockup) | ✅ verified at 320/375/768/1280, front + back |
| Hackathon rules re-checked on the official page (upstartbar.com/ajyal) | ✅ 5 Nov; building may start when selection is announced on 16 Nov |

## Verified numbers (5 Nov, local, `make test`)
- Backend tests: **104 passed** (rules 63 · API 27 · RLS 8 · security 6 · AI eval 1 covering 60 questions)
- AI eval (extractive mode, no LLM): grounded **96.7%** (target ≥ 95) · refusals **15/15** · red-flag recall **100%** · banned phrases **0** · answer language match **100%**. One known miss: ar04.
- Rule accuracy: **8/8** personas

## Known risks
- No clinician on the team yet → evidence score risk (QUESTIONS #2, #18).
- The web app is the largest remaining piece and blocks the demo path (Phases 2–7 UI).
- No LLM key configured: the assistant and cards run in deterministic mode. Set `ANTHROPIC_API_KEY` for Claude wording (cached for demo-safe mode).
- Code exists before selection: it must go in the disclosure note (QUESTIONS #34). The repo is public.
