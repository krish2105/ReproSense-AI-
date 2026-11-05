# OPEN QUESTIONS — answer these before / during build week

Decisions already made in this kit are marked "Default". Change any default by editing this file and telling Claude Code.

| # | Question | Default chosen | Why it matters |
| --- | --- | --- | --- |
| 1 | Who is on the team (2–4) and who is the university student? | Krishna (AI/backend, SP Jain student) + Atharva (design/frontend) + 1–2 to recruit | Every member applies separately, same team name |
| 2 | Do we have a clinician (OB-GYN, GP, nurse or health-science student)? | Recruit one this week; else ask organisers to match | Evidence = 20% of score |
| 3 | Colour direction: friend's navy/blue/teal or the pink mock-ups? | ~~Both: navy/teal base + rose/plum accent ("Blush & Deep Navy")~~ **Superseded 5 Nov: team chose E · Mauve Pro (docs/06)** | Brand identity |
| 4 | Which LLM for the demo? | Claude API on synthetic data; architecture shows switch to UAE-hosted model for production | Data residency question from judges |
| 5 | Include the pregnancy/postpartum (gestational diabetes) module? | Yes, as feature #1 beyond the brief | Gives a payer and a measurable outcome |
| 6 | Hosting: Vercel+Render or Replit? | Vercel + Render + Supabase; Replit as backup | Replit is the hackathon's tech partner — nice to mention |
| 7 | First paying customer to target in interviews? | Private women's health / IVF clinic groups in Abu Dhabi | Venture = 30% |
| 8 | Team name? | "ReproSense" | Must be identical on all applications |
| 9 | Were the mock-ups (with "Orchi" branding) made by the team? | Treat as inspiration only, redesign | Rules require disclosure of prior designs |
| 10 | Arabic copy reviewer? | Native speaker on or near the team | Arabic quality is judged by Emirati jurors |

---

## Decisions made 5 Nov (planning session)
| # | Question | Decision |
| --- | --- | --- |
| 11 | Build-week scope with 55 features | Demo path first (Noura → Hessa → Fatima) by Thu 19 Nov; P1 only while the path stays green; P2 = stretch |
| 12 | Who codes in build week | Krishna (backend/AI) + Atharva (design/frontend), each with Claude Code |
| 13 | Auth for the judged demo | DEMO_MODE signed role tokens from /demo + real RLS/consent tests; passkeys = Phase 8 stretch |

## Open questions (default used unless changed)
| # | Question | Default | Why it matters |
| --- | --- | --- | --- |
| 14 | Embeddings provider? `EMBEDDINGS_PROVIDER` is blank, the schema says `vector(1024)`, retrieval must work Arabic↔English, and Claude has no embeddings API | Hosted multilingual 1024-dim model chosen Wed 18; local multilingual-e5-large as fallback | RAG can't be built without it |
| 15 | Re-ranker: cross-encoder or LLM? | LLM re-rank of the top 20 (no extra hosting), cached for the demo | Render memory and latency |
| 16 | Demo "today": rules depend on the 22 Nov ref date (Hessa at week 24, Fatima at week 9, Sara's dizziness on 12 Nov) | App clock pinned to `DEMO_REF_DATE=2026-11-22` in demo mode | Hessa's rule won't fire if the real date is used during build week |
| 17 | Red-flag time window: the YAML says `heavy_flow_today and dizziness_today`, but Sara's dizziness entry is 10 days old and the generator uses a whole-history flag | Evaluate on each saved log; keep the urgent card pinned for 14 days with the entry date shown. Needs CHO sign-off | Sara's red flag may not appear at all |
| 18 | Clinician to sign the `clinical_rules.yaml` header (see #2) | Still recruiting | Evidence score, and #17 and #26–#28 need a clinician |
| 19 | The cohort has a 15–19 age band (includes minors), but the product is for 18+ | Regenerate the cohort with ages 18+ only (synthetic-data-realism skill) | Consent and minors questions from judges |
| 20 | Layla is 47, but MASTER §3 and the women-care-lead agent say 18–45 | Widen the stated target to 18–55 | Perimenopause stage is in scope |
| 21 | "Full demo path works with network off": a hosted app can't run offline | Cached LLM answers + local laptop build as the offline fallback + backup video | Defines what "demo-safe" means |
| 22 | docs/07 wants client-side note encryption and on-device features, but the intake agent and NL capture read notes on the server, and the signal agent runs in Python | Hackathon: server-side field-level AES-GCM, decrypted only in the API for consented features; on-device goes on the roadmap slide | Architecture and privacy claims in the pitch |
| 23 | The integration-kit master prompt assumes an Expo/native app and an ASSET_INTEGRATION_REPORT, but MASTER §12 says no native apps | Web only; no native build. Framework-neutral square/adaptive icon masters made anyway (public/images/brand/derived). Asset map: ASSET_INTEGRATION_REPORT.md | Avoids wasted work |
| 24 | Images live in `ReproSense_Claude_Integration_Kit/…`, root `public/images/` is empty, and Next.js serves `apps/web/public` | **Done 5 Nov:** all 38 placed in root `public/images` (hash-checked). Copy to `apps/web/public/images` on Day 1; update the CLAUDE.md folder map | Prevents broken images |
| 25 | Body-map calibration: the front art starts at 17.3% and the back at 14.6% (12% was requested); the mockup puts "lower back" on the front figure; the generator only emits "lower abdomen" and "lower back" | **Done in the mockup 5 Nov:** front/back switch; points measured from the art; left/right now mean her side. Coordinates in ASSET_INTEGRATION_REPORT.md §5; reuse them in the React body map | Taps would land in the wrong place |
| 30 | Mood row: docs/06 says emoji chips, but matching clay faces (E10) now exist as separate icons | Keep emoji until the team picks | Visual consistency |
| 31 | Body-map pelvis image (D3) shows womb and ovaries; using it as a tap target would imply organ-level localisation | Educational only ("Explain like I'm new"), after CHO/women-care-lead review | Clinical safety |
| 33 | The official page says teams may start building once selection is announced on Mon 16 Nov, not only from 17 Nov | Use the evening of 16 Nov for Phase 0 setup (repo, CI, Supabase project) if selected | An extra half day for the demo path |
| 32 | Red-flag bell image (E8) on the RF4 self-harm crisis screen may feel like an alarm | Use the bell for RF1–3, 5 and 6; a calm image or none on the RF4 crisis screen | Tone on the crisis path |
| 26 | Rule logic is duplicated in the generator's `evaluate_rules()`, although CLAUDE.md says the YAML is the only place, and they already differ (the generator adds `age < 45` to OBS_NO_PERIOD_90_DAYS; RF1 uses history, not "today") | The backend reads only the YAML; the generator keeps its self-check; a CI parity test compares the two; CHO decides whether to add `age < 45` | Silent divergence would break the demo |
| 27 | RF6 is ambiguous: `severe_headache and vision_change or heavy_flow or fever` has no parentheses | Add explicit parentheses (CHO approves) | Red-flag correctness |
| 28 | OBS_POSTPARTUM_MOOD must be suppressed when RF4 fires (CLAUDE rule 5), but the YAML doesn't say so, and no persona exercises RF4 | Add `suppressed_by: [RF4_SELF_HARM_THOUGHTS]`; add a test fixture (not a demo persona) | Crisis-path safety |
| 29 | Sources to verify before the pitch: the NICE NG257 (2026) "from 36" wording; the ADA source URL is a journal homepage, not the chapter | Re-check the links in build week and record access dates | Judges may click them |

## Doc conflicts found (5 Nov review)
| # | Conflict | Resolution used |
| --- | --- | --- |
| C1 | MASTER_PROMPT has two "## 13" sections | The v4 additions section wins; rename it §14 |
| C2 | Agent count: MASTER §6 says 7, §13 says "eight", and the docs/03 table has 10 rows (§13 leaves out document, insight writer and report) | The docs/03 table is the build spec; the pitch uses one agreed number |
| C3 | Phases: MASTER §10 Phase 6 is documents + extras, BUILD_STATUS Phase 6 is life stages + v4 agents; Phase 1 tests: 20 vs 30+ | BUILD_STATUS wins |
| C4 | Demo story: docs/10 and the demo-readiness skill use Noura → clinician → admin (Fatima); MASTER §13 and docs/15 use Noura → Hessa (navigator) → Fatima | §13 wins; update docs/10 and the skill on Sat 21 |
| C5 | Noura's cycle range: docs/01 says 38–62, docs/10 says 36–62; the data says 42–56 days | Pitch quotes the data |
| C6 | Persona count: docs/04 header says 5, MASTER §14 says "5 persona cards", docs/01 table lists 6; the data has 8 | 8 personas on /demo |
| C7 | Hero: MASTER §4.1 says "3D soft glass helix", §8 and docs/06 say a cycle-bead ring; the no-ai-slop-ui skill bans no-data helixes and particles, which image B1 contains | Data-driven bead ring; B1 used only as the static fallback and OG image |
| C8 | QUESTIONS #3 (Blush & Deep Navy) and the PROGRESS v2 fonts (Familjen/Public Sans) are stale | E · Mauve Pro and Plus Jakarta Sans |
| C9 | RAG eval size: 30 (docs/01, docs/03) vs 60 (§13, docs/03 v4) | 60 |
| C10 | Malaffi: docs/05 says 1 billion records, sources.yaml says 3.5 billion (Aug 2025) | Use the newer figure after re-verifying |
| C11 | Image count: PROGRESS says 40, README and prompts say 37, the zip has 38 PNGs | 37 unique images + 1 duplicate (fine) |
| C12 | Mockup hard-codes explanation text (e.g. Priya's) that differs from the YAML `explains` | Production copy comes only from the YAML |
| C13 | docs/02 layout and data model don't include the verifier, navigator, copilot, questionnaires or pregnancy fields | Extend the schema on Day 1; update docs/02 |
