# 25 · Strict scorecard, 18 Nov 2026 (build week, day 2), and the projection after waves 1–4

Scored strictly by Claude Code on Krishna's request, from what is on `main` and live at https://reprosense.vercel.app on
18 Nov evening, against the organisers' jury criteria (information session, 17 Nov) and eight specialist lenses.
"Projected" assumes **every task in waves 1–4 (docs/24) ships, is live, the OpenRouter key is in Render, and the people
work happens** (an advisor review, a few interviews or a small user study). If a wave slips, use the "now" column.
Scores are judgements, not measurements; the reasons are what matter.

## Facts this is based on
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
