# ReproSense AI · Handoff for the next Claude account (Sun 22 Nov 2026, showcase day)

Repo: https://github.com/krish2105/ReproSense-AI- (branch `main`) · Live: https://reprosense.vercel.app ·
API: https://reprosense-api.onrender.com · Submission: programs.upstartbar.com, due **15:15 today**.
Every person and number in the demo is fictional.

---

## 1. Where things stand (12:35, 22 Nov)

### Merged and live
| PR | What it does |
|---|---|
| #172 | Landing hero: the floating cards no longer cover the phone |
| #173 | 4K demo video (3840×2160) re-recorded on the fixed hero; honest "no interviews yet" answer |
| #174 | No prices anywhere: /pricing became "How ReproSense will be paid for"; Sahatna answers in the pitch |
| #176 | Pain in words (0 none, 1–3 mild, 4–6 moderate, 7–10 severe), flow and daily-life hints, the drawn body map (3D off), the assistant renamed **Nura** |
| #177 | Nura's **food lane**: "what should I eat on my period?" answers with NHS food and drink guidance, never a medicine; personalised (heavy days put iron first); allergies drop matching foods and add 998 |
| #178 | **Four-slide pitch** (problem, solution, roadmap, demo), Nura on slide 2, longevity and fertility framing, Yash's "human knowledge first" and privacy lines, Q&A pack section I |

### Open
| PR | What | Action |
|---|---|---|
| **#179** | **Salma (PCOS) and her doctor's care plan**: a 9th demo woman, diagnosed by her doctor; daily medicine with a "taken today" tick, a monthly check-in, yearly glucose and blood-pressure checks, read-only for her clinician | Merge when CI is green (`gh pr checks 179`), then walk the demo once |
| #175 (Atharva) | Patterns: "What we checked and did not show" | Needs Krishna's G2 read; may need a rebase on main (messages, AR_REVIEW) |
| #155, #157–#161 | Dependabot updates | Leave until after the showcase |

### Files to upload by 15:15 (on the Mac, in this folder)
- `ReproSense-submission.pdf` (4 slides) and `ReproSense-demo-4K-phone.mp4` (4K, 98 s).
- Present from `ReproSense-submission.pptx` in **Presenter View**: each speaker's lines are in the notes.
- `ReproSense-Judge-QA-Pack.pdf`: 20-question cheat sheet plus the full bank.

Note: the 4K video was recorded this morning, so its assistant scene still says "AI Copilot" (now "Nura"). The live site
is current. If there is time, re-record (section 6) and upload again.

### Who does what on stage
- **Zebo:** slide 1, the problem.
- **Krishna:** slide 2, the solution, then narrates the demo (slide 4).
- **Yash:** slide 3, users, roadmap and who pays.
- **Atharva:** clicks the demo.
- About 1:30 of slides and 1:25 of demo. The demo hop to the clinician goes through **Demo people → Open clinician view**.

---

## 2. What problem we are solving (the long answer for judges)

**One sentence:** a woman in Abu Dhabi carries months of scattered health information (period logs, pain, symptoms,
lab results, pregnancy and after-birth steps), and nobody turns it into something she and her doctor can act on, so
conditions are found late and follow-ups are missed.

**The problem, with local evidence**
- **Late recognition.** Up to 70% of women with PCOS don't know they have it (WHO, 2026). In a UAE study of 518 women,
  endometriosis took **11.6 years** from first symptoms to diagnosis (Frontiers in Global Women's Health, 2021). The
  signs are there in her own days, but spread over months and apps, and a visit is about ten minutes.
- **Missed follow-ups after birth.** In Al Ain, **21.3% of 2,546 pregnancies** had gestational diabetes (Frontiers in
  Endocrinology, 2022), and at one hospital only **265 of 1,043** of those mothers (1 in 4) came back for the glucose
  test after the birth (IJERPH, 2022; 2013 to 2014 data, a 4 to 6 week window). DoH measured this follow-up as Jawda
  **PC008** until the indicator was retired in the 2025 update; the clinical recommendation stands (ADA 2026: 4 to 12
  weeks).
- **Why it matters for life (longevity).** After diabetes in pregnancy, type 2 diabetes is about **ten times** more
  likely (BMJ, 2020). PCOS raises later cardiometabolic risk, so the 2023 guideline asks for regular glucose and
  blood-pressure checks. Missing these follow-ups costs years of healthy life and money later.
- **Today's options don't close the loop.** Trackers such as Flo offer logging, predictions and symptom checks;
  chatbots don't know her record; Sahatna (DoH's own app) is the front door for records, booking and teleconsults and
  has maternity features, and Malaffi gives clinicians AI summaries. None of them hands her clinic her own logged
  observations with the evidence and follows the recommended follow-up until it is done.

**What we built (ReproSense)**
- Her health record in Arabic and English; she logs in seconds by tap, voice (Gulf Arabic) or a lab-report photo.
- **Written rules from published guidelines** find "patterns worth discussing with a doctor", each showing the exact
  days behind it and its source. It **never diagnoses** and never gives a risk percentage. Red flags come first, with
  998 and DoH's 800-SAKINA.
- **Nura**, the AI assistant, answers only from a cited library or from her own numbers computed by code; a verifier
  drops unsupported sentences. Food questions get NHS food guidance, never a medicine.
- **For the doctor:** a pre-visit brief and a two-page report read in a minute.
- **For the clinic and network:** the recommended follow-ups (the after-birth glucose test, the postnatal steps), tracked from opened to
  booked to done. Counts only at network level.
- **Across life stages:** periods, trying to conceive (when to ask for a fertility assessment), pregnancy (glucose
  screen at 24–28 weeks), after birth (DoH postnatal steps, baby's first year, feeding), perimenopause, and living
  with a diagnosis (Salma's care plan).

**Who benefits and who pays**
- **Women** use it free, always.
- **Clinics and primary-care networks** subscribe, because it closes a measured indicator.
- **Insurers** come later, paid for results (per follow-up closed).
- **No price yet:** it's set with the first pilot clinic, from what the pilot measures.

**The measure of success.** In a 90-day pilot at one clinic: the share of women with gestational diabetes who complete
the glucose test in the window their clinician sets. As a scenario only: if 100 eligible women went from 25% to 50%,
that is 25 more completed follow-ups. It is not a count of cases found or prevented.

**Proof it works (all on /evidence and /status)**
- **Safety, held-out:** 132 questions written separately from the code, never tuned on. With the AI check: crisis
  30/30, emergencies 32/32.
- **Security:** 14 of 14 attacks blocked.
- **Build:** 57 pull requests merged since acceptance, plus today's.

**Honest gaps.** No clinician has signed the rules yet (our first ask). No interviews or signed clinic yet. The demo data
is synthetic and hosted in Frankfurt; production moves to UAE hosting. The Arabic still needs a native review.

---

## 3. How to start in another Claude account

1. Install Claude Code (desktop app or CLI) and sign in with the other account.
2. Clone the repo and open it:
   ```bash
   git clone https://github.com/krish2105/ReproSense-AI-.git && cd ReproSense-AI-
   ```
3. Sign in to GitHub on that machine (`gh auth login`) with an account that has write access (krish2105 or a
   collaborator).
4. Local setup (Postgres 17 with pgvector listening on /tmp; WeasyPrint needs Homebrew's Pango on macOS):
   ```bash
   python3 tools/make_env.py && make db
   cd backend && uv sync && cd ../apps/web && pnpm install && cd ../..
   make api                                   # API on :8010
   cd apps/web && pnpm build && pnpm start -p 3100   # web on :3100
   ```
5. Paste this start prompt into the new Claude session:

```text
Read CLAUDE.md, HANDOFF.md, HANDOFF_SHOWCASE_22NOV.md (this file, also in docs/), BUILD_STATUS.md, PROGRESS.md
(top entries) and docs/27_PITCH_SCRIPT_AND_QA.md. Today is Sun 22 Nov 2026, the HealthX Ajyal showcase; the
submission is due 15:15 at programs.upstartbar.com.

Rules:
- Commit as Krishna Mathur <113384784+krish2105@users.noreply.github.com>. Never add "Co-Authored-By: Claude",
  "Generated with Claude Code" or any AI line to commits or PRs.
- Never diagnose, no probabilities, every health answer cites knowledge_base/sources.yaml, red flags first with 998.
- Changes to safety.py, rules/clinical_rules.yaml, the assistant routing, auth or RLS need Krishna's OK and a row in
  docs/safety/CHANGE_LOG.md (CI enforces it). Never tune on backend/tests/rag_heldout.jsonl.
- Synthetic data only. No names, emails or phone numbers in the repo.
- Branch from main, open a PR, merge only when CI is green and Krishna says so. Show me any message before it is
  sent on my behalf.

First: check `gh pr checks 179` (Salma's care plan) and tell me whether it is green; then run the demo path on
https://reprosense.vercel.app and list anything broken. Then ask me what to do next.
```

---

## 4. Rules that matter (from the whole project)
- **No AI co-author lines** in commits or PRs; AI use is disclosed in the app footer and the deck instead.
- **G2:** any change to clinical logic (rules, safety routing, assistant lanes, auth, RLS) needs Krishna's approval and
  a CHANGE_LOG row.
- **Showcase day:** merge only with green CI, then walk the demo path once.
- **Honesty on stage:**
  - Never say "independent reviewers": the held-out questions were written separately from the code.
  - Never say a clinic or clinician has signed, or that we did interviews.
  - Never give a price.

## 5. Key files
| Path | What |
|---|---|
| `pitch/ReproSense-submission.pptx`, `.pdf` | The 4-slide deck (built by `pitch/build_submission_deck.js`; notes in `pitch/speaker_notes.js`) |
| `pitch/ReproSense-demo.mp4` | The 4K demo video (`apps/web/scripts/demo-video.mjs`) |
| `docs/27_PITCH_SCRIPT_AND_QA.md` | Script (section 4 mirrors the speaker notes) and Q&A |
| `docs/30_JUDGE_QA_PACK.html` / `.pdf` | Q&A pack (render with WeasyPrint) |
| `rules/clinical_rules.yaml` | The 7 red flags and 13 patterns |
| `backend/app/agents/router.py`, `food.py` | Nura's lanes (knowledge, record, next step, food) |
| `backend/app/services/care_plan.py` | Salma's care plan (PR #179) |
| `apps/web/src/app/(site)/pricing/page.tsx` | "How ReproSense will be paid for" (no prices) |

## 6. Rebuilding the pitch files
```bash
# deck (needs pptxgenjs and LibreOffice)
NODE_PATH=<dir with pptxgenjs> node pitch/build_submission_deck.js
soffice --headless --convert-to pdf --outdir pitch pitch/ReproSense-submission.pptx
# 4K video (local API on :8010 and web on :3100 first; it resets the demo data)
cd apps/web && PW_CHANNEL=chrome node scripts/demo-video.mjs
```

## 7. Ideas for after the showcase (roadmap, not built)
- UAE PASS sign-in.
- Malaffi lab import, with her consent.
- A Sahatna Space entry point.
- Apple Health and Health Connect.
- Time-limited sharing.
- Booking hand-off.
- IVF-cycle support.
- Saved allergies and food preferences.
- Insurance type on her profile, for in-network follow-ups.
- Chat logging ("tell Nura your symptoms and it fills the log").
- Clinician-signed rules.
- A real pilot.
