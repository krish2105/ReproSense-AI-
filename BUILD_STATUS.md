# BUILD_STATUS — ReproSense AI

Legend: ⬜ not started · 🟨 in progress · ✅ done · ⛔ blocked

Last updated: 2026-11-05 (kit created, no code yet)

| Phase | Name | Status | Owner | Done when |
| --- | --- | --- | --- | --- |
| 0 | Setup (repo, CI, tokens, data generated) | ⬜ | CTO | web + API run locally, tokens page renders light/dark |
| 1 | Data + rules engine | ⬜ | AI Engineer | 8 personas → expected observations, 30+ rule tests pass (incl. 6 red flags) |
| 2 | Patient core (onboarding, dashboard, log, timeline) | ⬜ | Frontend | persona navigable at 390px width |
| 3 | AI insights + RAG assistant | ⬜ | RAG Specialist + Agentic AI | every answer cites a source; banned-phrase test passes |
| 4 | Doctor-ready report (preview + PDF + share) | ⬜ | AI Engineer | PDF matches persona; share link expires |
| 5 | Clinician + admin dashboards | ⬜ | Frontend + CTO | care gap closes live in the demo |
| 6 | Life stages + agents v4 (pregnancy, after-birth mood, perimenopause, care navigator, verifier, visit mode, body map, FHIR export, wearables, discreet mode, documents AI) | ⬜ | AI Engineer + Frontend | every life stage opens from the stage switch; navigator draft needs approval; FHIR bundle validates |
| 7 | Polish (R3F: cycle ring, year spiral, clinic map; dark, Arabic RTL, states, a11y, generated images) | ⬜ | Frontend + CMO | Lighthouse ≥ 90, zero console errors, 3D fallback works |
| 8 | Security pass | ⬜ | CTO | docs/07 checklist fully ticked |
| 9 | Ship (deploy, reset, video, pitch) | ⬜ | CEO | senior-judge ≥ 90/100 |

## Pre-build (before selection on 16 Nov — no product code yet, per hackathon rules)

| Task | Status |
| --- | --- |
| All members submit application (same team name) by 14 Nov 23:59 GST | ⬜ |
| Disclosure note of prior designs/research/AI tools | ⬜ |
| 5+ interviews (clinicians, clinic managers, women) | ⬜ |
| Clinician reviewer for rules/clinical_rules.yaml (recruit a gynaecology advisor; message in docs/15) | ⬜ |
| Generate images with IMAGE_PROMPTS_CHATGPT.md (start with S1 and D1 body map) | ✅ 37 images + 1 duplicate placed in public/images (5 Nov); see ASSET_INTEGRATION_REPORT.md |
| Body-map tap points calibrated to the real art (mockup) | ✅ verified at 320/375/768/1280, front + back |
| Hackathon rules re-checked on the official page (upstartbar.com/ajyal) | ✅ 5 Nov; building may start when selection is announced on 16 Nov |

## Known risks
- No clinician on team yet → evidence score risk (see QUESTIONS.md).
- LLM provider outage on demo day → cached responses for all 8 personas (demo-safe mode) (Phase 9).
