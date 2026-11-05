# CLAUDE.md — ReproSense AI (read this first, every session)

## What we are building
ReproSense AI is a privacy-first, AI-powered reproductive health intelligence platform for women in Abu Dhabi.
It turns months of fragmented cycle logs, symptoms, lab reports and history into **explainable, non-diagnostic
observations**, a **doctor-ready report**, and a **clinic/payer dashboard** that shows care gaps being closed.

Tagline: **Understand your body. Recognise the patterns. Take informed action.**

Hackathon: HealthX Ajyal (DoH Abu Dhabi). Build week 17–21 Nov 2026, showcase 22 Nov 2026, DOH Incubator, Masdar City.
Judging: Venture 30 · Health impact 20 · Innovation & evidence 20 · Working prototype 20 · Team & pitch 10.

## Non-negotiable rules (break one and the build fails)
1. **Never diagnose.** Never write "you have PCOS / endometriosis / infertility". Use "a pattern worth discussing with a doctor".
2. **No fake probabilities.** Observations come from transparent rules in `rules/clinical_rules.yaml`. No "73% PCOS risk".
3. **Every observation explains itself:** what pattern, which entries support it, what to consider next, and its source.
4. **Synthetic data only.** Everything in `data/` is fictional and every screen shows a "Demo data — fictional" badge.
5. **Red flags first.** Red-flag rules run before anything else and show urgent guidance (UAE ambulance 998). EPDS item 10 > 0 opens the crisis path, never a pattern card.
6. **Every educational answer cites a source** from `knowledge_base/sources.yaml`. No source found → say so, don't guess.
7. **No secrets in code.** Keys live in `.env` (never committed). `.env.example` lists names only.
8. **Every button works.** No dead links, no "coming soon" in the demo path.
9. **Patient and clinician interfaces are separate** routes, layouts and roles.
10. **AI use is disclosed** in the app footer and the pitch credits (hackathon rule).
11. **Agents that act ask first.** The care navigator only drafts; she approves before anything is sent.

## Stack (decided — do not change without asking)
- Frontend: Next.js 15 (App Router) + TypeScript + Tailwind (custom tokens from docs/06; restyle shadcn/ui, never ship its defaults) + hand-built SVG charts (cycle arc, analytics, year chart) + React Three Fiber for 3D (cycle ring, year spiral, clinic map, with static fallback). Visual identity E · Mauve Pro (docs/06): Plus Jakarta Sans, plum + four phase colours, round cards, cycle arc, floating tab bar.
- Backend: Python 3.12 + FastAPI + Pydantic v2
- Database: PostgreSQL (Supabase) + pgvector (RAG) + row-level security
- AI: provider-agnostic LLM client (`backend/app/ai/llm.py`). Hackathon: Claude API on synthetic data. Production: UAE-hosted model.
- Agents: LangGraph state machine (see docs/03_AI_PIPELINE.md)
- PDF: WeasyPrint (backend) for the doctor report
- i18n: next-intl, English + Arabic (RTL)
- Deploy: Vercel (web) + Render (API) + Supabase. Backup: Replit (official hackathon tech partner).

## Folder map
```
apps/web/            Next.js app (patient + clinician + clinic-admin)
backend/app/         FastAPI: api/, ai/, agents/, rules/, rag/, reports/, security/
data/synthetic/      generator + generated demo data (personas, cohort, lab reports)
knowledge_base/      curated sources (summaries in our own words + links)
rules/               clinical_rules.yaml (the only place observation logic lives)
public/images/       generated images (prompts: IMAGE_PROMPTS_CHATGPT.md)
docs/                all specs — the source of truth
.claude/agents/      role agents (CEO, CTO, CMO, CHO, Women Care, Agentic AI, RAG, AI Engineer, Senior Judge)
```

## Skills (load before the matching work)
`no-ai-slop-ui` (any UI) · `clinical-copy-guard` (any health text) · `add-explainable-observation` (any rule) ·
`synthetic-data-realism` (data) · `demo-readiness` (build week evenings). Visual reference: `mockup/reprosense-mockup.html` (design E · Mauve Pro).
Images: `IMAGE_PROMPTS_CHATGPT.md` → save into `public/images/`. Version 4 scope: MASTER_PROMPT.md section 13.

## How to work
- Work in the phases in `BUILD_STATUS.md`. One phase at a time. Small commits with clear messages.
- After each phase: run `pnpm lint && pnpm test` (web) and `pytest` (backend); update `BUILD_STATUS.md` + `PROGRESS.md`.
- Before calling a phase done, run the **senior-judge** agent with `docs/09_SCORECARDS.md`.
- Clinical wording → check with the **chief-healthcare-officer** and **women-care-lead** agents.
- Unsure? Two docs conflict? **Stop and ask the user.** Log the question in `QUESTIONS.md`.

## Commands
```
python3 data/synthetic/generate_synthetic.py      # demo data
cd apps/web && pnpm install && pnpm dev           # web on :3000
cd backend && uv sync && uv run uvicorn app.main:app --reload   # API on :8000
cd backend && uv run python -m app.rag.ingest     # build RAG index
cd backend && uv run pytest
```

## Definition of done (demo)
Judge opens the URL → picks a demo persona → sees dashboard + timeline → opens AI insights with evidence
→ asks the assistant a question (answer has sources) → downloads the doctor PDF → switches to clinician view
→ sees the same patient's summary → opens clinic dashboard with care gaps closing. All in under 3 minutes, no errors.
