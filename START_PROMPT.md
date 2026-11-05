# START PROMPT (paste into Claude Code, opened in this folder)

Start Claude Code with: `claude --model opus --effort high`

**Before 16 Nov (planning only, no code — hackathon rule):**
```
Read CLAUDE.md, MASTER_PROMPT.md (especially section 13), every file in docs/ in order, BUILD_STATUS.md, PROGRESS.md,
rules/clinical_rules.yaml, IMAGE_PROMPTS_CHATGPT.md, and open mockup/reprosense-mockup.html.
Do not write product code yet. Give me a short summary, a day-by-day plan for 17–21 Nov, and log every question or doc conflict in QUESTIONS.md.
```

**From 17 Nov (build):**
```
You are lead engineer for ReproSense AI (HealthX Ajyal, showcase 22 Nov 2026).
Read CLAUDE.md, MASTER_PROMPT.md (section 13 = version 4 scope), docs/ in order, BUILD_STATUS.md, PROGRESS.md.
Copy mockup/reprosense-mockup.html exactly (design E · Mauve Pro, docs/06) with React Three Fiber for the 3D.
Use images from public/images/ (made with IMAGE_PROMPTS_CHATGPT.md). Load no-ai-slop-ui and clinical-copy-guard before UI or health text.
Run python3 data/synthetic/generate_synthetic.py, then build phase by phase from Phase 0. After each phase: tests, update
BUILD_STATUS.md + PROGRESS.md, commit, senior-judge score with docs/09. Never diagnose; every answer cites a source;
the care navigator only drafts. If anything is unclear, stop and ask me. Begin Phase 0.
```

Each new day: `claude --model opus --effort high`, then "Continue from BUILD_STATUS.md."
