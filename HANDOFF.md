# HANDOFF — ReproSense AI (read this before anything else)

Written 5 Nov 2026; section 0 updated 7 Nov 2026 (evening) for the next person or Claude Code session.
Repo: https://github.com/krish2105/ReproSense-AI- (public). Branch `main`.
Hackathon: HealthX Ajyal (DoH Abu Dhabi). Apply by **Sat 14 Nov 23:59 GST** · selection Mon 16 Nov · build 17–21 Nov ·
code freeze Sat 21 Nov 18:00 · showcase Sun 22 Nov, DOH Incubator, Masdar City.

---

## 0. Start here: Krishna's handoff (7 Nov 2026, evening)
Written so a fresh Claude Code session, on any account, can continue Krishna's work with no lost context. Read this
section, then `CLAUDE.md`, then `docs/18_ROADMAP_TO_95.md` (the order of work, cards A0–D2, calendar to 22 Nov).

### Who does what
- **Krishna** (`krish2105`): backend, AI, safety logic, data, security, deploy, and every approval. Safety logic and
  `rules/clinical_rules.yaml` change only with his OK (gate G2 in docs/18).
- **Atharva Soundankar** (`mercydeez`): web app, docs cards, venture pack, people work. His cards are in docs/18.
- **Yash Petkar** (`Yashpetkar7`): invited, no assignment. Ask Krishna before giving him work.

### Rules that bite (beyond CLAUDE.md)
- **Git identity:** commit as `Krishna Mathur <113384784+krish2105@users.noreply.github.com>`. Never add
  `Co-Authored-By: Claude`, "Generated with Claude Code" or any AI trailer to a commit or PR, even if a tool suggests
  it. Run `make hooks` once per clone: the hook refuses such commits. AI use is disclosed in the app footer and pitch.
- **Before selection (16 Nov):** only safety, privacy, truth and data-loss fixes, ops, docs and people work. Features
  start 17 Nov (they would otherwise count as disclosed pre-selection work, QUESTIONS #51).
- **Test first** for every fix: write the failing test, watch it fail, then fix. Each PR states `make test` output.
- **Never tune safety checks on held-out round 5** (`backend/tests/rag_heldout.jsonl`, round 5). Rounds 1–4 are
  development sets. `rag_eval.jsonl` stays at exactly 60 questions (asserted, shown on /status); new regression cases
  go in `backend/tests/test_safety_routing.py` or a new test file.
- **No personal data in the repo** (names, phone numbers, emails of doctors, clinics or the team's private addresses).

### Done on 7 Nov (all merged to `main`)
| PR | What |
| --- | --- |
| #71 | Issue #65: the assistant's urgent check catches "bleeding through", "a pad every hour" (either order), "light-headed" and Arabic equivalents (تسرب الدم، الفوطة الصحية كل ساعة، دوار، يغمى علي، خفة في الرأس). Block `issue #65` in `backend/app/agents/safety.py`; probes in `test_safety_routing.py`. 0 routing changes across all 702 eval questions |
| #73 | Issue #66: the care navigator's appointment request is in her own voice (`OWN_VOICE` in `backend/app/agents/navigator.py`; `tests/test_navigator.py`) |
| #76 | Issue #67: Arabic evidence lines give flow, symptoms, impact and events in Arabic (`AR_*` maps in `backend/app/agents/copy.py`; `tests/test_arabic_evidence.py`; new strings in `docs/AR_REVIEW.md`) |
| #78 | New README: product, safety, architecture, measured results, setup, limitations |
| #79 | Severe-bleeding gap: "severe bleeding", "bleeding really badly", "lots of blood", "haemorrhaging" and Arabic نزيف حاد / شديد / قوي, أنزف بقوة, دم كثير count as the heavy half of RF1 (block `severe bleeding gap` in `backend/app/agents/safety.py`; 26 probes in `test_safety_routing.py`). 0 routing changes across all 702 eval questions. G2 approved by Krishna |
| #48, #75, #74, #77 | docs/18 roadmap; Atharva's A9 safety case, A5 sources (NICE NG126, crisis, period pain) and A10 venture pack |
Also on 7 Nov: Krishna submitted his HealthX Ajyal application (via Outlook) and emailed the organisers (Upstart Bar's
info address, from his Gmail) the four questions in `docs/drafts/44-organiser-email.md`, including whether entering the
Future Health challenge as well is allowed.

### Waiting on Krishna (in date order)
1. **Watch for the organisers' reply.** It decides QUESTIONS #44 (how pre-selection code is scored) and #45.
2. **Advisor outreach:** send `docs/drafts/26-outreach.md` §1 to 5–10 OB-GYNs, residents, midwives or GPs, one name per
   message; log each in that file's tracker by role only.
3. **Mon 9 Nov: deploy** (`docs/16_DEPLOY_NOW.md`: Supabase, Render blueprint, Vercel), smoke test, uptime check
   (issue #22, #30). Then replace "Not deployed yet" in README.md and this file with the live URL.
4. **Tue 10 Nov: Future Health decision** (`docs/drafts/45-second-competition.md`). Register only if its rules allow an
   existing product and HealthX confirms no conflict; otherwise skip.
5. **By Fri 13 Nov:** interviews and usability sessions (Atharva leads, #26); clinician review booked.
6. **Sat 14 Nov 23:59:** applications close. Confirm Atharva applied with team name **ReproSense**.
7. **Mon 16 Nov:** tag `pre-selection-2026-11-16` before any build-week commit (docs/15).

### Open PRs (7 Nov evening)
Atharva merged #74 (A5: NICE NG126 and crisis sources, after resolving the `docs/AR_REVIEW.md` conflict) and #77 (A10:
venture pack) on 7 Nov evening. Still open:
| PR | Owner | State |
| --- | --- | --- |
| #72 Next 16 | Atharva | Do **not** merge before 17 Nov, and only after 3 green e2e runs |
| #68 Phone app (Expo) | Krishna | Build-week / post-showcase work (docs/21). The main checkout is on this branch |
| #58 Rescore and mobile roadmap | Krishna | Docs; review and merge or close |

### Known gaps found 7 Nov, not fixed yet
- **Word checks do not read time** (not new, seen while fixing #79): "I had a bad bleeding scare last year, now I'm just dizzy from the heat" gets the 998 reply, and so does the same message with "heavy" on `main` before #79. It errs towards showing 998. A fix is a separate safety change (G2).
- **"bleed a lot" with unrelated dizziness:** "is it bad if I bleed a lot on day one? I sometimes feel dizzy when I stand" routes to 998 through the existing `_HEAVY_FIX` pattern. Raise with the clinical advisor.
- **React hydration error #418 on `/clinic`** still fails an e2e run now and then (seen on PR #71's first run; a re-run
  passed). docs/17 target: find the cause, CI green 3 runs in a row.
- **Arabic copy** (including the new #65–#67 strings) is a draft until the native review (#23).

### Local setup notes (Krishna's Mac)
- Repo: `~/Downloads/reprosense-ai-kit`. Claude Code worktrees live in `.claude/worktrees/<name>`.
- **A fresh worktree or clone has no `.env`:** run `make env` first (random local keys, git-ignored), or the test seed
  fails with "NOTES_KEY is not set". Never copy another checkout's `.env`.
- Run `make seed` only from the checkout whose `.env` will serve the dev database: it reseeds `reprosense` with
  that checkout's NOTES_KEY. Tests seed `reprosense_test` by themselves.
- `make test` takes about 20 s once warm (the first run in a new venv is slower). Expect **306 passed** on `main` (7 Nov, after #79).
- The desktop preview launcher cannot start servers from `~/Downloads` (macOS privacy). Start servers with a background
  shell instead, for example
  `cd backend && DYLD_FALLBACK_LIBRARY_PATH=/opt/homebrew/lib uv run uvicorn app.main:app --port 8010`, then open the URL.
- For a live API check while tests may run, use a spare port and the test database so the dev database gets no audit
  rows: `DATABASE_URL='postgresql:///reprosense_test?host=/tmp' LLM_PROVIDER=none ... uvicorn app.main:app --port 8011`.
- Phone app (`apps/mobile`, PR #68) in Expo Go on the iOS simulator: launch with
  `xcrun simctl openurl booted "exp://127.0.0.1:8081?__expo_disable_fab=1&__expo_disable_auto_launch=1&__expo_disable_onboarding=1"`;
  Expo Go ignores the app's own forceRTL, so set `expo.extra.forcesRTL: true` in app.json for an Arabic layout check
  and revert it.

### Still open from 6 Nov
- Model check score (card B2, #29): with `LLM_PROVIDER=claude` and a key, `make safety-eval` scores the model's
  second check on round 5 and stores it next to the word-checks number, never in its place.
- QUESTIONS #56: two round-5 crisis messages about pills got the medicine reply; the clinical advisor decides.
- Build week: sign-in for joined records (#27), clinic tenants (#28), merge `build-week/clinician-invites` on 17 Nov.

## 1. Where things stand in one minute (updated 6 Nov 2026, night)
- **Everything is on `main`** (PRs #8–#21, CI green: backend, web, e2e, API image, gitleaks).
- **Judge panel (6 Nov, before the night's fixes):** jury 61.5/100 (range 53.5–65.5), Real MVP 66, Real SaaS 61, clinical safety 20/35, women's experience 23/35.
  - The night's fixes (PR #21) close the safety, privacy, truth and data-loss findings. Details in PROGRESS.md.
  - What remains is people work and rules-file sign-off: QUESTIONS #44–#51.
- **Backend: 280 tests** (7 Nov).
  - FastAPI, Postgres 17 + pgvector with forced row-level security, rules engine, LangGraph pipeline, RAG assistant, WeasyPrint PDF.
  - Sign-up (`/join`) and the clinic patient QR.
  - **AI on/off switch enforced:** Privacy → "Use AI features"; off closes the assistant and keeps template wording.
  - **Assistant safety routing** (`app/agents/safety.py`) for crisis, emergencies, diagnosis requests and medicine questions in EN and Gulf, Egyptian, Levantine, Iraqi, Sudanese and Yemeni Arabic. Held-out round 5 (132 questions by new writers, written after the review fixes, measured once, word checks only): crisis 11/30, emergencies 24/32, diagnosis 6/10, medicine 4/10, everyday 42/50. Round 4, before the fixes: 12/30, 18/32, 7/10, 3/10, 46/50. The 998 strip is always on screen. With a model key, a second check by the language model (`safety.model_check`) can add a route, never remove one; measure it with `make safety-eval`.
  - **Crisis path:** no score and no alarm card anywhere. Joined records stay private (not on the roster). Sharing goes only to her own clinic.
  - DoH Jawda **PC008** glucose measure; per-clinic metrics; audit log CSV export.
  - Clinician handover in clinician voice.
- **Web app: done.**
  - Phases 0–7, plus `/join`, `/pricing`, `/trust` (the DoH Responsible AI Standard, clause by clause) and `/status` support terms.
  - Playwright e2e in CI covers the 3-minute demo path, every key screen in EN/AR/dark through axe (WCAG 2.2 AA), safety, 3D fallbacks, join, AI switch and SaaS checks.
  - Lighthouse 100 on the landing page.
- **Pitch:** `pitch/deck.html` (10 slides from the real data and screens) and `pitch/ReproSense-pitch.pdf`.
  - Team and evidence lines are hidden until `TEAM` and `EVIDENCE` are set in `pitch/build_deck.py`. Fill them only with true facts.
- **Parked for build week (17–21 Nov):** clinician invites on branch `build-week/clinician-invites`, built and tested. Merge it on 17 Nov so it counts as build-week work (QUESTIONS #51).
- **Research (6 Nov):** `research/2026-11-06/` holds five sourced notes. They have already corrected the landing evidence, docs/05, 07, 10, 12 and 15.
- **Not deployed.** It needs Krishna's own Supabase, Render and Vercel accounts; follow `docs/16_DEPLOY_NOW.md`.
- **No LLM key.** Cards and the assistant run deterministically (templates plus extractive answers with citations). Adding `ANTHROPIC_API_KEY` to `.env` switches the Claude provider on, including the model's second safety check in the assistant.
- **Needs Krishna before 16 Nov:**
  - QUESTIONS #44: read the complete prior-work disclosure in docs/15, ask the organisers how earlier code is scored, and tag `pre-selection-2026-11-16`.
  - QUESTIONS #45: a second competition's registration closes **10 Nov**.
  - Applications by 14 Nov.
  - Interviews and a letter of intent.
  - A clinical advisor to sign `rules/clinical_rules.yaml`.
  - A native Arabic review of the AR-REVIEW strings.
- **Design reference:** `mockup/reprosense-mockup.html` (docs/06, design E · Mauve Pro).
- **Images:** `apps/web/public/images/` (see `ASSET_INTEGRATION_REPORT.md`).

## 2. Rules for whoever continues (non-negotiable)
1. Read `CLAUDE.md` (11 product rules), then this file, `BUILD_STATUS.md`, `QUESTIONS.md`.
2. **Git: no Claude / AI co-author lines** in commits or PRs (no `Co-Authored-By: Claude`, no "Generated with Claude Code"). Commit as yourself.
3. Never diagnose; no probabilities; every answer cites `knowledge_base/sources.yaml`. The guard lives in `backend/app/ai/guards.py`.
4. Observation logic lives **only** in `rules/clinical_rules.yaml`. Changing it needs clinician (CHO) sign-off. Wording-only Arabic copy is in `rules/translations_ar.yaml` (AR-REVIEW).
5. Synthetic data only. The database itself rejects non-synthetic people (`CHECK (is_synthetic)`).
6. The care navigator **only drafts**. Status values are `draft | approved | discarded`; there is no "sent".
7. Small commits; after each phase run `make test`, update `BUILD_STATUS.md` + `PROGRESS.md`, and run the senior-judge agent with `docs/09_SCORECARDS.md`.
8. Load the skills before matching work: `no-ai-slop-ui` (any UI), `clinical-copy-guard` (any health text), `demo-readiness` (build-week evenings).

## 3. Run it locally (macOS)
Prerequisites: Homebrew Postgres 17 with pgvector listening on `/tmp:5432`, `pango` (for PDFs), `uv`, Python 3.12, Node 20+ and pnpm.
```bash
make env      # writes .env with random DEMO_TOKEN_SECRET + NOTES_KEY (git-ignored). Never commit it.
make hooks    # once per clone: refuses commits with AI co-author or "Generated with" lines (CLAUDE.md, Git)
make db       # creates databases reprosense + reprosense_test
make seed     # schema + RLS + 8 personas + 1,200 cohort + RAG index (100 chunks)
make api      # http://127.0.0.1:8010  (docs at /docs). Port 8000 is taken by another local project.
make test     # ruff + 280 tests against reprosense_test (7 Nov)
cd apps/web && pnpm build && PW_CHANNEL=chrome pnpm e2e   # 69 Playwright checks at 1280 + 390 px (reuses the API on :8010 and `pnpm start -p 3100` if they run)
```
Gotchas:
- **WeasyPrint on macOS** needs `DYLD_FALLBACK_LIBRARY_PATH=/opt/homebrew/lib`. The Makefile sets it inline because macOS strips `DYLD_*` when it launches `/bin/sh`. Without it, PDFs return 503 and everything else still works.
- **"Today" is pinned** to `DEMO_REF_DATE=2026-11-22`. Hessa's week-24 rule and Sara's red flag depend on it.
- Tests reseed `reprosense_test` many times. The demo DB `reprosense` is reset with `POST /v1/demo/reset` (admin token) or `make seed`.
- `mockup/` can be previewed over HTTP with the "mockup" entry in `.claude/launch.json` (python http.server on 8765).

## 4. Architecture map (what is where)
| Area | Files |
| --- | --- |
| Settings / secrets | `backend/app/config.py` (env only), `.env.example` |
| DB + RLS | `backend/app/db/schema.sql`. Forced RLS on every health table; the API does `SET LOCAL ROLE reprosense_app` + `app.role/app.user_id/app.clinic_id` per request (`backend/app/db/__init__.py`) |
| Seed | `backend/app/db/seed.py`. Fictional clinics; clinician `clin-01` at `clinic_corniche`; admin `admin-01`. Amina does **not** share with the clinic (shows the consent gate) |
| Rules | `backend/app/rules/expr.py` (safe parser), `features.py` (features + supporting entry ids), `engine.py` (red flags first, 14-day window, crisis suppression) |
| Pipeline | `backend/app/agents/pipeline.py`. LangGraph: intake → signal → safety → (crisis: end) → evidence → writer → verifier → care_gap; `persist()` writes observations and opens/closes care gaps |
| Card copy | `backend/app/agents/copy.py` (numbers → sentences, questions for the doctor, EN/AR) |
| RAG | `knowledge_base/summaries/*.md` (28, EN + AR), `knowledge_base/graph.yaml`, `backend/app/rag/{kb,embed,ingest,retrieve}.py` |
| Assistant | `backend/app/agents/assistant.py`: crisis → urgent (998) → refusal → extractive cited answer; LLM optional with sentence verifier |
| Navigator / copilot | `backend/app/agents/navigator.py`, `copilot.py` (SBAR, Ask the record, visit-note draft) |
| Reports | `backend/app/reports/pdf.py` (2-page A4, inline SVG cycle chart) |
| FHIR / documents | `backend/app/services/fhir.py`, `documents.py` (lab extraction; injection lines stripped; confirm before save) |
| Security | `backend/app/security/{auth,crypto,audit,middleware}.py` |
| API routers | `backend/app/api/{demo,patient,assistant,reports,clinic,admin,quality}.py`, `backend/app/main.py` |
| Tests | `backend/tests/` (+ `rag_eval.jsonl`, 60 questions). Eval results go to `backend/app/ai/eval_results.json` |
| CI | `.github/workflows/ci.yml` (backend on pgvector, generator check, gitleaks) |

## 5. Atharva — the web app (Phases 0 web → 7). This is the critical path.
Stack is decided (CLAUDE.md): Next.js 15 App Router + TypeScript strict + Tailwind (tokens from the mockup `:root`, light + dark) + next-intl (EN/AR, RTL) + hand-built SVG charts + React Three Fiber (lazy, with a still fallback). Restyle any shadcn component; never ship defaults.

**Setup (Phase 0 web)**
- ✅ `apps/web` with pnpm. Images moved to `apps/web/public/images` (QUESTIONS #24); CLAUDE.md folder map updated.
- ✅ Rewrite `/api/v1/*` → `http://127.0.0.1:8010/v1/*` in `next.config` so the `rs_token` cookie is same-origin.
- ✅ Server components call the API directly and forward the cookie (`apiServer`, only `rs_token`, as a cookie).
- ✅ Copy `:root` + both dark blocks and the component CSS from `mockup/template.html` (lines 11–330, copied by script; deviations listed at the end of `globals.css`).
- ✅ Fonts: Plus Jakarta Sans + IBM Plex Sans Arabic (next/font).
- ✅ Footer on every screen: "ReproSense gives information, not a diagnosis. In an emergency call 998. Demo data is fictional. Built with AI tools." Plus the "Demo data — fictional" badge.

**Login model.** `/demo` → `POST /v1/demo/login {persona}` or `{role:"clinician"|"admin"}` sets the httpOnly cookie `rs_token`. The stage switch on Home = log in as that stage's persona: Periods→noura, Trying→mariam, Pregnancy→hessa, After birth→fatima, Perimenopause→layla. Reset button: log in as admin → `POST /v1/demo/reset`.

**Route → API → mockup reference**
| Route | API | Mockup section |
| --- | --- | --- |
| `/` landing | `GET /v1/demo/personas` (hero uses Noura's real cycles) | view `home` |
| `/demo` | `GET /v1/demo/personas`, `POST /v1/demo/login`, `POST /v1/demo/reset` | view `people` |
| `/app` Home | `GET /v1/me/home?lang=` → `status` (mode cycle / pregnancy / after_birth, day/week, phases, `estimate`), `day_pills`, `red_flags`, `crisis`, `observations` (≤3 cards), `recommendations`, `care_gaps`, `navigator_drafts`, `last_log`, `today_mood`; `POST /v1/mood` | `tToday`, `arcSVG`, `recs` |
| `/app/log` Calendar | `POST /v1/logs` (flow, pain 0–10, pain_sites, symptoms, impact, pbac_items, note) → returns `red_flags`/`crisis`: **show urgent guidance immediately**; `POST /v1/logs/parse` (NL capture, confirm before save); body map uses `ASSET_INTEGRATION_REPORT.md` §5 coordinates (front/back, her left/right) | `calBox`, `bodyMap`, `tLog` |
| `/app/timeline` Analytics | `GET /v1/analytics?months=3\|6\|12`, `GET /v1/timeline?months=` | `lineChart`, `barChart`, `tChart` |
| `/app/insights` Patterns | `GET /v1/insights?lang=` → `cards[]` (title, summary, explains, why_we_noticed[{entry_id,date,text}], values, what_to_consider, questions_for_doctor, sources, urgency, crisis_path), `trace[]`, `record_strength`, `change_point` | `tInsights`, `obsBlock`, `traceDialog` |
| `/app/assistant` AI Chat | `POST /v1/assistant/ask {question, lang}` → `answer`, `sentences[{text,cite}]`, `citations[{n,title,url}]`, `urgent`, `crisis`, `refused`; `GET /v1/assistant/suggested?lang=` | `tAsk`, `msg` |
| `/app/report` | `POST /v1/reports` (preview payload) → `GET /v1/reports/{id}.pdf`; `POST /v1/shares {report_id, consent:true}` → `{token, path:/shared/<token>, expires_at}`; `GET /v1/shares`, `DELETE /v1/shares/{id}`; visit mode = SBAR + QR of `/shared/<token>` | `tReport`, `visitDialog` |
| `/shared/[token]` | `GET /v1/shared/{token}` (+ `.pdf`): 404 revoked, 410 expired | — |
| `/app/documents` | `POST /v1/documents` (multipart .txt/.pdf) → extracted rows → user edits → `POST /v1/documents/{id}/confirm {rows}`. Demo file: `data/synthetic/demo_uploads/fatima_postnatal_ogtt.txt` (closes Fatima's gap) | — |
| `/app/privacy` | `GET /v1/privacy` (consents, "who saw my data" audit), `PATCH /v1/consents`, `GET /v1/export`, `GET /v1/fhir`, `DELETE /v1/me/data`, `PATCH /v1/me {discreet, language}` | — |
| navigator dialog | `GET /v1/navigator`, `POST /v1/navigator/drafts {rule_id}`, `POST /v1/navigator/drafts/{id}/approve\|discard` (show "Nothing was sent") | `navDialog` |
| EPDS check-in | `POST /v1/questionnaires/epds {answers[10]}` → if `crisis`: crisis screen, **no score** | — |
| `/clinic` | `GET /v1/clinic/patients` (consented only, red flags first) | view `clinic` |
| `/clinic/patients/[id]` | `GET /v1/clinic/patients/{id}` (sbar, cards, labs, care_gaps, analytics, timeline, her_questions, visit_note_draft); `POST …/ask`, `POST …/review`, `PUT …/visit-note`; `GET /v1/clinic/care-gaps`, `PATCH /v1/clinic/care-gaps/{id} {status}`, `POST …/reminder` (draft only) | `renderClinic`, `recordQA` |
| `/admin` | `GET /v1/admin/metrics` (kpis, funnel, regions with k≥10, fairness, roi_inputs, live_demo_gaps), `GET /v1/admin/audit/verify` | `renderAdmin`, `initMap3D` |
| `/status` team scorecard | `GET /v1/quality` (rule accuracy 8/8 + AI eval numbers) | view `score` |

**Order (demo path first, QUESTIONS #11):**
1. `/demo` → Home → Patterns for **Noura**.
2. Hessa: pregnancy arc + navigator.
3. Report + share.
4. Clinic list → Fatima → close the gap → admin KPI moves.
5. Assistant (EN + AR).
6. Calendar/log + body map.
7. Documents, privacy, EPDS.
8. Landing.
9. 3D, dark mode, RTL, states, Lighthouse.

Done when each `BUILD_STATUS` "Done when" passes at 390px and 1280px, light and dark, EN and AR, with no console errors.

## 6. Krishna — what is left on the backend / ops side
- Deploy: ready to run, see **docs/16_DEPLOY_NOW.md** (Supabase → Render blueprint `render.yaml` with `backend/Dockerfile` → Vercel `apps/web`). The API seeds an empty database on first boot and never reseeds; the schema now works under a non-superuser owner like Supabase's (tested in `tests/test_rls.py`). Still to do: create the three accounts and deploy, uptime ping, Replit backup.
- ~~Playwright e2e of the full demo path, wired into CI.~~ Done 6 Nov: `apps/web/e2e`, CI job `e2e` (seeded pgvector Postgres, API, production build, Chromium).
- Get an `ANTHROPIC_API_KEY` (or decide to stay deterministic). Run the eval in LLM mode and warm the cache for all 8 personas.
- Clinician sign-off: QUESTIONS #17, #26, #27, #28, #35 and the `clinical_rules.yaml` header. Verify NG257 wording (#29).
- Disclosure: the complete note is in docs/15 (6 Nov); read it at the start of the event, ask the organisers how earlier code is scored (QUESTIONS #44), tag the repo on 16 Nov. Applications by 14 Nov. Interviews + LOI (docs/12, docs/15).
- Nice-to-have: passkeys via Supabase Auth, web CSP with nonces, dependency scanning (pip-audit / npm audit). (The ar04 eval miss is fixed: Arabic punctuation no longer sticks to words.)

## 7. Decisions already made (do not re-open without asking Krishna)
Scope = demo path first (#11) · builders Krishna + Atharva (#12) · demo role tokens + real RLS, passkeys stretch (#13) · `hashing` embeddings + FTS hybrid (#14) · ref date pinned (#16) · 14-day red-flag window (#17) · web only, no native apps (#23) · body-map coordinates (#25) · build before selection with disclosure (#34) · phase owners (#37).

## 8. Prompt to start a new Claude Code session
```
You are continuing ReproSense AI for Krishna. Read HANDOFF.md section 0 first, then CLAUDE.md and docs/18_ROADMAP_TO_95.md.
Commit as Krishna Mathur <113384784+krish2105@users.noreply.github.com>. Never add Claude or AI co-author lines or
"Generated with Claude Code" to commits or PRs. Run `make hooks` once.
Run `make env db seed test` to confirm the backend (expect 306 passed), then `cd apps/web && pnpm build && PW_CHANNEL=chrome pnpm e2e`.
Then tell me what is waiting on me today (HANDOFF.md section 0, "Waiting on Krishna") and continue the next item I pick.
Before 16 Nov only safety, privacy, truth and data-loss fixes. Test first. Ask me before changing safety logic or
rules/clinical_rules.yaml.
```
