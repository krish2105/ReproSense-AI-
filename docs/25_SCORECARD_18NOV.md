# 25 · Strict scorecard, 18 Nov 2026 (build week, day 2), and the projection after waves 1–4

**Latest: 68/100 on 18 Nov night (section 0), up from 59 that morning.**

Scored strictly by Claude Code on Krishna's request, from what is on `main` and live at https://reprosense.vercel.app on
18 Nov evening, against the organisers' jury criteria (information session, 17 Nov) and eight specialist lenses.
"Projected" assumes **every task in waves 1–4 (docs/24) ships, is live, the OpenRouter key is in Render, and the people
work happens** (an advisor review, a few interviews or a small user study). If a wave slips, use the "now" column.
Scores are judgements, not measurements; the reasons are what matter.

## 0. Rescore, 18 Nov night (after Krishna's wave K1–K7 landed)
Same rubric and the same strictness, from `main` at `9cd8b39` and the live site. The tables in sections 1–2 below are
the morning scores ("now" there means 18 Nov morning); this section supersedes them.

**What changed since the morning:** 9 build-week PRs merged with tests and live:
- #101 OpenRouter provider and #102 lab-report photos.
- K1 the DoH postnatal pathway (#107), K2 voice logging in Arabic and English (#108), K3 the pre-visit brief (#111),
  K4 the clinic onboarding API (#109), K5 passkey and email-code sign-in (#113), K6 the blood-pressure log with the
  NICE NG133 red flag (#116, extended to 12 weeks after birth in #118), and K7 the model safety scoring workflow (#110).

Since selection, 39 commits are on GitHub (all by Krishna), with 512 backend tests and green CI. Still true:
- Live AI is off (`llm: none`) until the OpenRouter key is in Render.
- Atharva and Yash have no commits since selection, and Dareen has not accepted her invite.
- There is no deck, MP4, letter of intent or interview.

| Jury criterion (weight) | Morning | **Night** | Why |
| --- | --- | --- | --- |
| Venture potential (30) | 16 | **17** | Clinic tenants exist in the API (clinic admin, single-use invites, per-clinic dashboard and suppressed export), but there is no screen for them and still no validation or Nabta slide. |
| Problem and health impact (20) | 15 | **17** | The maternal half of the theme is now real: DoH postnatal steps, and a blood-pressure warning in pregnancy and the 12 weeks after birth. The newborn and early-childhood half (D1, D2) is still absent. |
| Innovation and evidence (20) | 12 | **14** | Voice logging, the verified pre-visit brief and passkeys are new. The model check can be scored in one click, but AI is off live and the check is unscored. |
| Prototype and execution (20) | 11 | **15** | Visible build-week work: 9 PRs with tests, CI and e2e, all deployed. |
| Team and pitch (10) | 5 | **5** | Three of four members show no build-week commits; no deck or video yet. |
| **Total (100)** | **59** | **68** | Waves A, Y and D plus the key and the people work are worth about 14 more points (projection unchanged at about 82). |

| Lens | Morning | Night | Biggest gap left |
| --- | --- | --- | --- |
| Senior hackathon judge | 59 | 68 | AI off live; teammates' work not visible |
| CTO | 72 | 80 | Free Render tier (sleeps; database expires about 18 Dec); no ADHICS checklist |
| CEO | 55 | 58 | No customer evidence; Nabta not positioned on a slide |
| COO | 45 | 50 | No pilot operating plan; team bandwidth |
| CMO | 60 | 61 | No user voice; no video |
| Senior AI engineer | 68 | 72 | Generative AI off live; crisis recall 11/30 for the word checks; model check unscored |
| AI engineer | 74 | 79 | No live model runs or speed numbers |
| UI/UX | 74 | 78 | No judge tour; 3D only on landing and admin |
| Real MVP | 52 | 64 | She can sign in on another device, speak a log and track blood pressure; no reminders, no real users |
| Real SaaS | 38 | 48 | Tenants and invites in the API; no admin screens, billing or SLA |

**What is left, by points at stake**
1. **Krishna:**
   - Add `OPENROUTER_API_KEY` in Render; also add it as a repository secret and run Actions → model-safety-eval.
   - Get one letter of intent or written clinic interest, and do about 5 interviews.
   - Add a "why not Nabta?" slide (section 5).
   - Move to a paid Render instance for 22 Nov.
   - Optional: `RESEND_API_KEY` and `EMAIL_FROM` for email codes.
2. **Atharva (#103):** A3 clinic admin screens (the API is merged; shapes in #109), A1 3D body map, A2 judge tour, then
   A6–A8.
3. **Yash (#104):** Y1 planning-a-pregnancy checklist, Y2 phone testing of the new screens, Y5 the MP4 and the 3-slide
   deck (required for submission), Y6 rehearsals.
4. **Dareen (#106):** accept the invite. D1 the baby's first-year schedule and D2 the feeding log add the theme's
   newborn half.
5. **Clinician sign-off** (CHANGE_LOG, RULE_SIGNOFF): Q61 postnatal timing choices; Q62 a blood-pressure warning for a
   severe reading at any stage.

Deadlines: code freeze Sat 21 Nov 18:00; deck and MP4 at programs.upstartbar.com by Sun 22 Nov 15:15.

## Facts this is based on (morning)
- **Live since 18 Nov:** web on Vercel, API and a free Postgres on Render (Frankfurt), uptime pings every 10 minutes.
  The live demo path passed in English and Arabic (demo people, patterns with evidence, assistant with 3 citations,
  doctor PDF, clinician view, clinic network).
- **Tests:** 376 backend; 52 web unit; 118 Playwright passed (8 skipped by design) on 11 Nov; CI green.
- **AI today:** rules plus retrieval with citations and a verifier; generative AI is built (#101, #102) but **switched
  off live until the OpenRouter key is added**. The jury said the solution must use AI.
- **Safety evidence:** 60-question eval 30/30 grounded, 15/15 refusals, 15/15 red flags; held-out round 5 (132
  reviewer questions): emergencies 24/32, everyday 42/50, **crisis 11/30**, diagnosis 6/10, medicine 4/10. The model's
  second check is built but unscored.
- **People work:** no clinical advisor sign-off, no interviews, no letter of intent and no usability sessions recorded
  on GitHub yet. Two teammates had no ReproSense commits from 8 to 18 Nov.
- **Build-week delta so far (17–18 Nov):** the deploy, #101, #102, the plans. The organisers will judge "commits during
  17–21 Nov that substantially transform the solution"; most of the product predates selection.
- **Competition:** Nabta Health (UAE) raised a $3M pre-Series A in 2026 and sells to employers, insurers and providers;
  Maven Clinic is the global B2B2C benchmark; DoH's own Sehhatna app covers bookings and records.
- **Regulation:** DoH Responsible AI Standard (Oct 2025), DoH AI Clinician Framework (Oct 2026), ADHICS (cybersecurity),
  Malaffi (exchange). ReproSense maps the Responsible AI Standard on /trust; ADHICS is not addressed.

## 1. Hackathon jury (the official rubric)
| Criterion (weight) | Now | Projected | Why now · what moves it |
| --- | --- | --- | --- |
| Venture potential (30) | 16 | 23 | Clear buyer story (clinics, PC008, payers) and a pricing page, but **no validation** (no LOI, no interviews), and no answer yet to "how are you different from Nabta?". Moves with the ROI page, clinic onboarding, a pilot proposal, one LOI and a competitor slide. |
| Problem and health impact (20) | 15 | 18 | Strong, sourced Abu Dhabi evidence (PCOS, endometriosis delay, GDM follow-up, PC008). Gap: newborn and early childhood are half the theme and absent. Moves with K1 and D1–D2 (DoH Postnatal Standard, baby schedule). |
| Innovation and evidence (20) | 12 | 16 | Explainable rules, a verifier, held-out safety testing: rare rigour. But generative AI is off live, and crisis routing is 11/30. Moves with the key on, voice logging, the photo and discharge readers, the scored model check. |
| Prototype and execution (20) | 11 | 17 | Broad, working, live, tested. Judged on what was **built after acceptance**: today's delta is small. Moves with every wave landing as visible PRs, the judge tour and a clean live run. |
| Team and pitch (10) | 5 | 8 | The 3-slide deck and MP4 don't exist yet; two teammates were silent for a week. Moves with Y5/Y6, Dareen presenting in Arabic and English, crisp Q&A on safety and Nabta. |
| **Total (100)** | **59** | **82** | A likely top-3 contender if waves land; a mid-table finish if only the existing product is shown. |

## 2. Specialist lenses (each out of 100)
| Lens | Now | Projected | Strongest point | Biggest gap now | What closes it |
| --- | --- | --- | --- | --- | --- |
| Senior hackathon judge | 59 | 82 | Depth and honesty (limits stated) | Little build-week work visible; AI off live | Waves 1–4 as PRs; key in Render |
| CTO | 72 | 84 | RLS, audit chain, CI with e2e, IaC (`render.yaml`), provider-agnostic AI | Free tiers (sleep, DB expiry 30 days), no real auth, one region, ADHICS not addressed | K5 sign-in, paid instance on the day, an ADHICS checklist |
| CEO | 55 | 75 | Sharp wedge: care gaps closed for clinics and payers, DoH-aligned | No customer evidence, no pricing test, Nabta not positioned | LOI, ROI page, competitor slide, pilot proposal |
| COO | 45 | 70 | Runbooks and status page exist | No pilot operating plan, no support process, team bandwidth | Clinic onboarding (K4/A3), C6 runbook, a named pilot plan |
| CMO | 60 | 76 | Distinctive bilingual brand and landing page | No user voice, no channel test, no story for mothers | Usability quotes (with permission), Arabic-first copy (D5), the 90 s video |
| Senior AI engineer | 68 | 83 | Held-out discipline, verifier, safety routing, budgets | Generative AI off; crisis recall 11/30; model check unscored | Key on, K7 scored, D5 Arabic probes |
| AI engineer | 74 | 85 | Clean provider layer, caching, timeouts, "model transcribes, code validates" | No live model runs or latency numbers | Key on, live smoke of photo and voice, a latency note |
| UI/UX | 74 | 86 | Design system, RTL, dark mode, axe-clean | Dense screens, demo needs guidance, 3D only on landing/admin | Judge tour, 3D body map and rings, polish pass |
| Real MVP | 52 | 74 | A woman can join, log, see patterns, share a report | No own sign-in, no reminders, no real users | K5, D4 reminders, PWA, a small user study |
| Real SaaS | 38 | 62 | Multi-role, audit export, status page, pricing | No real tenants, onboarding, billing or SLA | K4/A3 tenants, D6 board, an SLA page; billing stays roadmap |

## 3. Where it lacks most (in order of points at stake)
1. **AI must be visibly on.** Get the OpenRouter key (a teammate can claim it) and add it in Render; then voice logging,
   the photo and discharge readers, the pre-visit brief and the model check all light up in the demo.
2. **Build-week evidence.** Every wave must land as its own PR with tests, so the organisers' commit review sees a
   transformed product, not a pre-built one.
3. **Validation for Venture (30%).** One letter of intent or a written clinic interest, 5 interviews, a 5-woman
   usability study with a SUS score, and a competitor slide (Nabta, Maven, Sehhatna, Flo/Clue).
4. **The theme's newborn half.** K1 + D1 + D2 make "maternal, newborn and early-childhood" true.
5. **Safety story.** Crisis recall 11/30 for word checks is the jury's easiest attack; answer with the always-visible
   998 strip, the model check scored (K7), and D5's Arabic probes.
6. **Reliability on the day.** Upgrade `reprosense-api` to a paid instance for 22 Nov (free instances sleep), keep the
   uptime pings, and bring the MP4 backup.

## 4. More to build if time allows (beyond waves 1–4)
- **Pilot proposal page** for PureHealth/SEHA clinics: scope, KPIs (PC008, postnatal checks done), data protection,
  90-day timeline. (Venture)
- **ADHICS and DoH AI compliance checklist** on /trust, including the AI Clinician Framework's physician oversight.
  (DoH judge)
- **WhatsApp-style share drafts** for reminders (drafted only, she sends). (Adoption in the UAE)
- **Insurer view** (aggregated, anonymous) next to the clinic network. (Payer story)
- **Evidence page** with live test and eval numbers for the NYU Abu Dhabi judge. (Innovation and evidence)

## 5. The answer to "why not Nabta?" (for the pitch)
Nabta sells memberships, consultations and diagnostics (a services business). ReproSense is the record and the rules
underneath care: it turns her own entries into explainable, sourced observations, a 2-page report the doctor reads in a
minute, and a clinic board where DoH's own measures (Jawda PC008, the Postnatal Care Program Standard) close. Clinics
and payers buy fewer missed follow-ups; she keeps a private, bilingual record. Partners, not rivals: a Nabta-style
service could plug into the same record.

Sources: DoH Postnatal Care Program Standard (May 2025); DoH news on the AI Clinician Framework (Oct 2026);
Dealroom on Nabta Health's pre-Series A; Sacra on Maven Clinic's pricing; Gulf News on Abu Dhabi family health and
Sehhatna. Links are in `knowledge_base/sources.yaml` where they back product text, and in the 18 Nov session notes.
