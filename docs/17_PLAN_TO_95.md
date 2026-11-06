# 17 · Plan to 95+ on every scorecard (for Atharva, from Krishna, 7 Nov 2026)

Every number below is our own strict estimate against `docs/09_SCORECARDS.md` and the judge panel's evidence of 6 Nov.
The jury decides the real score. The GitHub issues for this plan are assigned to Atharva (`mercydeez`) and grouped in
two milestones: **Before selection (16 Nov)** and **Build week (17–21 Nov)**.

## The honest summary
- Code alone takes the jury score to about **75**. The last 20 points come from people: a clinician advisor on the team,
  interviews, a letter of intent, rehearsals. Without them, 95 is not reachable.
- Before selection on 16 Nov we only fix safety, privacy, truth and data-loss defects, deploy, write docs and do people
  work. New features wait for build week, because code built before selection must be disclosed and earns no prototype
  points (QUESTIONS #44, #51). Code freeze: Sat 21 Nov 18:00.
- Non-negotiables still apply to every task: never diagnose, no probabilities, observation logic only in
  `rules/clinical_rules.yaml` (ask Krishna first), synthetic data only, the care navigator only drafts, no secrets in code,
  no AI co-author lines in commits.

## Scores today and the target
| Scorecard | Today | 95+ needs | Code-only ceiling |
| --- | --- | --- | --- |
| Jury rubric /100 | 65 | 95 | ~75 |
| Real MVP /100 | 69 | 95 | ~88 |
| Real SaaS /100 | 63 | 95 | ~85 |
| Clinical safety /35 | 23 | 33.5 | ~29 |
| Women's experience /35 | 26 | 33.5 | ~29 |
| Trust pack /7 | 6 | 7 | 7 |

## A. Jury rubric (65 → 95)
| Criterion | Today | Target | What earns the points | Issue |
| --- | --- | --- | --- | --- |
| Venture potential (30) | 17 | 28 | Named first customer and a signed letter of intent; 5 clinician + 3 clinic-manager interviews with quotes; clinical advisor on the team; unit economics (CAC, seat price, gross margin) with sources | People, SaaS docs |
| Health impact (20) | 15 | 19 | One clinician quote on the PC008 follow-up gap; pilot outcome measure stated (share of follow-ups closed) | People |
| Innovation & evidence (20) | 14.5 | 19 | Rules signed by a clinician; model safety check scored on held-out round 5; NICE NG126 added as a source | Model check, People |
| Working prototype (20) | 13 | 19 | Live URL; core journey rebuilt or extended in build week per the #44 ruling; no flaky errors; mobile and desktop | Deploy, Tests, Build week |
| Team & pitch (10) | 5.5 | 10 | Team slide with the clinician; 5 timed rehearsals; backup video; Q&A drill from docs/10 | People |

## B. Real MVP (69 → 95)
| Check (10 each) | Today | Gap | Task | When |
| --- | --- | --- | --- | --- |
| Sign up, consent, log, see value in < 3 min | 7 | Not timed with real users | 5 timed usability sessions with women (Emirati and expatriate); fix what slows them | Before 16 Nov |
| Data persists across sessions and devices | 3 | A joined record lives only in a 12-hour session (#55) | Sign-in for joined records (email one-time code), same record on any device | Build week |
| Every observation links to the exact entries | 9 | — | Keep; check care-gap cards too | — |
| Doctor PDF accurate, readable in 60 s | 7 | Never timed by a clinician | Clinician reads 3 PDFs in 60 s each; fix what they miss | Before 16 Nov |
| Clinician sees only consented patients | 10 | — | Keep the RLS tests green | — |
| Empty, loading, error states everywhere | 7 | Not audited screen by screen | Audit every route; e2e for API down and slow API | Before 16 Nov |
| Arabic RTL and English | 6 | Arabic never reviewed by a native speaker | Native review of `docs/AR_REVIEW.md`, safety replies first | Before 16 Nov |
| Lighthouse ≥ 90 on mobile | 7 | Only the landing page is measured (100) | Measure home, patterns, assistant, report, clinic on mobile; fix to ≥ 90 | Before 16 Nov |
| Automated tests: rules, API, e2e | 9 | Rare hydration error #418 (#54) | Find the cause or document the fix path; CI green 3 runs in a row | Before 16 Nov |
| Pilot-ready after hardening | 4 | No sign-in, not deployed, no UAE hosting plan | Deploy now; sign-in in build week; UAE hosting plan written | Both |

## C. Real SaaS (63 → 95)
| Check (10 each) | Today | Gap | Task | When |
| --- | --- | --- | --- | --- |
| Multi-tenant, own users and data per clinic | 5 | Clinician accounts are demo roles | Merge `build-week/clinician-invites` on 17 Nov | Build week |
| Roles per tenant (clinician, clinic admin) | 4 | No clinic-admin role | Clinic-admin role: invites, worklist, metrics for one clinic | Build week |
| Clinic onboarding (invite clinicians, patient QR) | 6 | QR works, invites parked | Invites merged; onboarding checklist screen | Build week |
| Usage and outcome metrics per tenant | 8 | Network view only | Clinic-admin dashboard for one clinic | Build week |
| Pricing page with tiers | 9 | Prices are untested hypotheses | Test the price in the interviews; update with what you learn | Before 16 Nov |
| Audit log export | 9 | Network-level only | Per-clinic export for the clinic admin | Build week |
| Data residency (UAE) | 6 | Demo runs outside the UAE | Write the UAE hosting plan (provider, region, migration) on /trust and in docs/07 | Before 16 Nov |
| Integration path (FHIR, Malaffi) | 8 | FHIR export not validated | Run the export through the official FHIR R4 validator; document the Malaffi path | Before 16 Nov |
| Support, SLA and status page | 6 | No live uptime check | Uptime monitor on the live API; link it from /status | After deploy |
| Unit economics (CAC, seat price, margin) | 2 | No numbers | Table in docs/12 and the deck, every number labelled as a hypothesis with its source | Before 16 Nov |

## D. Clinical safety (23 → 33.5 of 35)
- Clinician signs `rules/clinical_rules.yaml` and decides QUESTIONS #48, #49, #52, #53, #56.
- Score the model safety check on round 5 with a key (`make safety-eval`). Ship it on only if crisis ≥ 27/30 and
  everyday questions ≥ 48/50. Never tune the word checks on round 5.
- Add NICE NG126 (miscarriage and ectopic pregnancy) to `knowledge_base/sources.yaml` with EN and AR summaries.

## E. Women's experience (26 → 33.5 of 35)
- Native Arabic review (the biggest gap), then a second read on a phone in RTL.
- Five usability sessions with women; fix the first three things that confuse them.
- Sign-in so she controls her own record on any device.
- Fewer false alarms: the model check should bring everyday questions to ≥ 48/50.

## F. Trust pack (6 → 7)
- Add an e2e test for demo-safe mode: the full demo path with the model off and no network to any model.

## Branches (why there are 11)
Every phase and feature was built on its own branch and merged through a pull request (#8–#20). GitHub keeps a branch
after its PR merges unless "Automatically delete head branches" is on, so 8 merged branches are still there:
`feat/join-onboarding`, `ops/deploy-ready`, `pitch/deck`, `web/e2e-demo-path`, `web/evidence-doh`,
`web/phase-6-life-stages`, `web/phase-7-landing-polish`, `web/trust-saas`. All 8 are fully in `main` and safe to delete.
Keep `main`, `fix/judge-findings` (open work, merge it first) and `build-week/clinician-invites` (parked until 17 Nov).
Then turn on Settings → General → "Automatically delete head branches".

## Deploy steps (full guide: docs/16_DEPLOY_NOW.md, about 20 minutes)
1. **Supabase (database):** new project in the region closest to the UAE; Database → Extensions → enable `vector`;
   copy the **session pooler** string (port 5432), not the transaction pooler (6543).
2. **Render (API):** New → Blueprint → this repo (reads `render.yaml`). Set `DATABASE_URL` (Supabase string) and
   `ALLOWED_ORIGINS` (the Vercel URL). Render generates `DEMO_TOKEN_SECRET` and `NOTES_KEY`. Leave `LLM_PROVIDER=none`
   unless Krishna adds a key. First boot seeds the demo data. Check `/readyz` shows `"personas": 8`.
3. **Vercel (web):** import the repo, Root Directory `apps/web`, set `API_URL=https://<api>.onrender.com` and
   `NEXT_PUBLIC_SITE_URL=https://<project>.vercel.app`, deploy. Then set `ALLOWED_ORIGINS` on Render if skipped.
4. **Smoke test:** `cd apps/web && PW_CHANNEL=chrome E2E_BASE_URL=https://<web> E2E_API_URL=https://<api> pnpm e2e`.
5. **Demo day:** paid Render instance for the day (free ones sleep after 15 minutes), reset demo data after each
   rehearsal, both URLs tested on venue Wi-Fi and a phone hotspot, backup video on two laptops.
Never commit `.env` or any key; secrets live only in the Render and Vercel dashboards.
