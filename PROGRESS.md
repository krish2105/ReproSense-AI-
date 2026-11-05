# PROGRESS LOG — ReproSense AI

Append one entry per work session, newest at the top. Keep it short and factual.

Template:
```
## YYYY-MM-DD — Phase N — <who>
Done:
- ...
Tests: web X/Y pass · backend X/Y pass
Senior-judge score: Venture _/30 · Impact _/20 · Innovation _/20 · Prototype _/20 · Pitch _/10 = __/100
Next:
- ...
Blockers / questions:
- ...
```

---

## 2026-11-05 — Phases 0, 1, 3, 4, 5, 6 (backend) and 8 (partial) — Krishna with Claude Code
Done:
- Repo initialised and pushed to github.com/krish2105/ReproSense-AI- (branch `main`). CI: backend lint + tests on Postgres/pgvector, generator check, gitleaks.
- Postgres schema with **forced row-level security**. The API runs every query as the restricted role `reprosense_app` with app.role/user_id/clinic_id. The database rejects any non-synthetic person.
- Rules engine reads only `rules/clinical_rules.yaml` (safe parser, no eval). Red flags run first with a 14-day window; EPDS item 10 opens the crisis path and hides the mood card.
- LangGraph pipeline: intake → signal → safety → (crisis: end) → evidence → writer → verifier → care_gap, traced per step. Claude provider (`claude-opus-5-5`, refusal fallbacks on) is used when a key is set; otherwise deterministic templates.
- Knowledge base: 28 summaries in our own words (EN + AR, AR-REVIEW), a guideline graph and Arabic rule copy. Hybrid retrieval (full-text + pgvector + RRF + IDF re-rank) with an Arabic↔English glossary and light stemming.
- Assistant: citations on every answer, polite refusal of diagnosis or probability questions, 998 guidance first, crisis message only for self-harm.
- APIs: home/timeline/analytics/logs (PBAC, natural-language capture), insights, EPDS, lab upload → confirm (injection lines stripped), privacy (consents, audit timeline, export, delete), FHIR R4 bundle, care navigator (draft → approve, never sends), report PDF (WeasyPrint), 7-day revocable share links, clinic list and record (handover summary, Ask the record, visit note, care gaps, reminder drafts), admin metrics (k ≥ 10, fairness), quality panel, demo login/reset.
- Security: AES-256-GCM notes and documents, hash-chained append-only audit log, headers, rate limits, CORS, PII redaction before any LLM call.
- Fictional demo upload `data/synthetic/demo_uploads/fatima_postnatal_ogtt.txt`: confirming it closes Fatima's after-birth gap automatically.
Tests: web — (not started) · backend **104/104 pass** · AI eval grounded 96.7% · refusals 15/15 · red-flag recall 100% · banned 0
Senior-judge score: not run yet (run it after the web demo path exists; scoring the prototype now would only measure the missing UI)
Next:
- Atharva: Next.js app, Phases 2→7 UI against the ready APIs (HANDOFF.md §5).
- Krishna: deploy, Playwright e2e, LLM key + cache warm-up, clinician sign-off items, disclosure note.
Blockers / questions:
- QUESTIONS #34 (code before selection must be disclosed) and #35 (NG88 ferritin wording) are new.

## 2026-11-05 — Pre-build — image integration (no product code)
Done:
- Verified the Mauve Pro archive: CRC ok; 38/38 PNGs match manifest hash, size and alpha. Placed all of them at their manifest paths in public/images (+ mockup/images).
- tools/derive_image_assets.py: split the E9/E10 strips into 11 icons; made plum full-bleed brand icons from A2 (fixes A1's white corners).
- Mockup body map: fixed 4 bugs. Lower back was on the groin of the front figure; left/right pelvis were the wrong way round; the fallback covered the image; no charset/viewport meta. Added a front/back switch with tap points measured from the art.
- ASSET_INTEGRATION_REPORT.md written. Planning: QUESTIONS.md #11–#29 and C1–C13 logged.
Tests: no app yet · body-map browser check pass at 320/375/768/1280 (front + back), no console errors
- Official rules page re-checked: everything matches the kit; building may start once selection is announced on 16 Nov; prizes 15k/10k/5k AED.
Next:
- Pre-build tasks in BUILD_STATUS (interviews, clinician, LOI, Arabic reviewer, disclosure note listing these images).

## 2026-11-05 (v2) — Anti-slop redesign, new features, score path to 96
Done:
- Researched AI-generated design tells; replaced "Blush & Deep Navy" glass/gradient look with "The record she carries"
  (cycle-chart identity, one accent, Familjen Grotesk / Public Sans / IBM Plex Mono). New skill: no-ai-slop-ui.
- New skills: clinical-copy-guard, add-explainable-observation, synthetic-data-realism, demo-readiness.
- Generator: PBAC bleeding score per period (Higham 1990), Mariam persona (fertility timing, ASRM/NICE NG257),
  cohort fairness table. 6/6 personas [OK], output identical across runs.
- Rules: heavy bleeding now includes PBAC ≥ 100; new OBS_TTC_FERTILITY_ASSESSMENT.
- Mockup: cycle ledger hero, scaled evidence charts, observation trace, record-strength meter, change detection,
  Arabic voice sample, PBAC counter, SBAR handover, Ask the record, fairness check, 3-stage scorecard + winning confidence.
  Tested headless: 6 views × 2 widths, 6 personas × 6 tabs, no errors, no horizontal overflow.
- docs/15_WIN_PLAN.md: 75 → 82 → 96 path, confidence, LOI + disclosure templates.
UI slop check: pass (no gradients, glass, glows, all-caps labels, stat-card rows or generic CTAs).
Senior-judge estimate: Venture 24/30 · Impact 19/20 · Innovation 18/20 · Prototype 7/20 · Pitch 7/10 = 75/100

## 2026-11-05 — Kit created
Done:
- Master prompt, CLAUDE.md, architecture, AI pipeline, data plan, design system, security, deploy rules,
  scorecards, image prompts, 9 role agents, clinical rules, knowledge-base source list.
- Synthetic data generator written and tested (5 personas, 1,200-woman cohort, lab reports); output is byte-identical across runs.
- Interactive team mockup: mockup/reprosense-mockup.html (rebuild with `python3 mockup/build_mockup.py`).
  Tested headless at 1280px light and 400px dark: all 6 views, all patient tabs, gap-closing flow, Arabic RTL, no script errors.
Senior-judge estimate (no product code yet): Venture 24/30 · Impact 18/20 · Innovation 17/20 · Prototype 6/20 · Pitch 7/10 = 72/100
Next:
- Submit applications by 14 Nov. Run interviews. Generate images. Wait for selection (16 Nov) before writing product code.


## 5 Nov 2026 — v3 UI
The team picked the soft mauve reference. The mockup was rebuilt with day pills, the cycle arc, recommendations, a mood row, a calendar, analytics, the AI Copilot and a floating tab bar. docs/06 and the no-ai-slop-ui skill were updated.

## 5 Nov 2026 — v4 (Mauve Pro + full feature set)
- Generator: 8 personas, 5 life stages, all [OK]; new rules (pregnancy glucose screen, EPDS mood, perimenopause, iron check, RF4–RF6).
- Mockup: stage switch, pregnancy arc, body map (image slot), care navigator, visit mode, FHIR export, discreet mode, 3D clinic map, AI test panel. Tested: no errors.
- New IMAGE_PROMPTS_CHATGPT.md (40 images incl. body map framing). Docs 01/03/04/06/09/15, CLAUDE.md, MASTER_PROMPT §13, START_PROMPT updated.
