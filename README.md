# ReproSense AI — Claude Code starter kit

HealthX Ajyal Hackathon (DoH Abu Dhabi) · showcase 22 Nov 2026 · team ReproSense

## Start here (3 steps)
1. Unzip, open the folder in your terminal, run `claude` (Claude Code).
2. Paste the box from **START_PROMPT.md**.
3. Claude Code reads CLAUDE.md → MASTER_PROMPT.md → docs/, generates the data and builds phase by phase.

Want to show the team first? Open **mockup/reprosense-mockup.html** in any browser (no install).

## What's inside
| Path | What it is |
| --- | --- |
| START_PROMPT.md | Short prompt to paste into Claude Code |
| MASTER_PROMPT.md | Full build instructions (screens, AI, data, phases) |
| CLAUDE.md | Rules Claude Code reads every session |
| BUILD_STATUS.md · PROGRESS.md · QUESTIONS.md | Live tracking: phases, session log, open decisions |
| docs/01–15 | Product spec, architecture, AI pipeline, data, evidence, design system, security, deploy rules, scorecards, pitch, image prompts, business model, glossary, competitors, win plan |
| rules/clinical_rules.yaml | Transparent, sourced observation rules (needs clinician review) |
| knowledge_base/sources.yaml | Curated guideline sources for RAG |
| data/synthetic/ | Tested generator + generated demo data (8 personas across 5 life stages, 1,200-woman cohort, lab reports, PBAC scores, fairness table) |
| .claude/agents/ | 9 role agents: CEO, CTO, CMO, Chief Healthcare Officer, Women Care Lead, Agentic AI Architect, RAG Specialist, AI Engineer, Senior Judge |
| IMAGE_PROMPTS_CHATGPT.md | 37 ChatGPT image prompts (brand, website, life stages, body map, icons, clinic, pitch) with file names |
| public/images/ | Folders for the generated images (names in IMAGE_PROMPTS_CHATGPT.md) |
| mockup/ | Interactive HTML mockup (design E · Mauve Pro: 5 life stages, body map, care navigator, visit mode, 3D) + team scorecard |
| .claude/skills/ | 5 skills: no-ai-slop-ui, clinical-copy-guard, add-explainable-observation, synthetic-data-realism, demo-readiness |
| docs/15_WIN_PLAN.md | Score path 74 → 81 → 94 (v4 estimate), winning confidence, LOI and disclosure templates |
| research/ | Where the Kaggle PCOS evidence notebook goes |

## Hackathon rules to remember
- Apply by **14 Nov 23:59 GST**, every member separately, same team name.
- No product code before selection on **16 Nov**; disclose earlier designs/research (this kit) at the start.
- Synthetic/open data only. Disclose AI tools in the pitch.

All data in this kit is fictional.
