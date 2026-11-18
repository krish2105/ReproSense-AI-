# 22 · Rescore: 6 Nov 2026, evening (main at `89da565`)

## How this was scored
- **Who:** one reviewer (Claude Code), against `docs/09_SCORECARDS.md` and the line tables in `docs/18_ROADMAP_TO_95.md` section 2. Krishna asked for no subagents, so there was no panel this time.
- **What was run:**
  - every check, run again on this machine;
  - a live check of `https://reprosense.vercel.app`;
  - CI results on GitHub.
- **Honesty rule:** these are our own strict estimates; the jury decides. A score moves only when the work is merged and running, not when it's planned or approved.

## 1. Headline
| Scorecard | Morning (6 Nov) | Evening (6 Nov) | When PR #40 merges | 95% bar |
| --- | --- | --- | --- | --- |
| Jury rubric /100 | 68.5 | **68.5** | 69 | 95 |
| Real MVP /100 | 75 | **75** | 75 | 95 |
| Real SaaS /100 | 72 | **72** | 72 | 95 |
| Clinical safety /35 | 23 | **23** | 24.5 | 33.5 |
| Women's experience /35 | 26 | **26** | 26 | 33.5 |
| Trust pack /7 | 7 | **7** | 7 | 7 |

**What changed today, and why the scores barely moved:**
- **The web app is live** at `https://reprosense.vercel.app`, with its functions in Frankfurt.
- **The API isn't live yet.** The Supabase free limit on Krishna's account blocked the database; Atharva is creating it (#22). Until then, every data page on the live site shows the "can't reach the service" screen, so the prototype score can't count a live demo yet.
- **The region and free-plan fix is merged** (#49).
- **PR #40 (Q53, Q48) is approved** but not yet merged.
- **The roadmap (PR #48) and the mobile roadmap (docs/21) are written.** Plans don't add points until they're carried out.

## 2. Line by line

### 2.1 Jury rubric
| Criterion | Score | Evidence today | Next card |
| --- | --- | --- | --- |
| Venture (30) | 18.5 | Unit economics are sourced but still hypotheses. The UAE hosting plan and a validated FHIR export exist. No interviews, letter of intent or advisor yet. | A8, A10, B4, B7 |
| Health impact (20) | 15 | The local numbers are sourced, with their limits. No clinician quote, no pilot baseline, no usability evidence. | B4, B5, B6 |
| Innovation & evidence (20) | 15 | Explainable rules, cited RAG and held-out evaluation are in place. The model check isn't scored, and no clinician has signed the rules. | A3, B2, B6 |
| Working prototype (20) | 14 | The full path passes 110 e2e tests locally. The web is live but the API isn't, so there's no live demo. The #418 flake is still in CI. | A7, A6/C0 |
| Team & pitch (10) | 6 | A 10-slide deck built from the real product. No rehearsals, no backup video, no clinician on the team slide. | B10 |

### 2.2 Real MVP (10 lines × 10)
| Line | Score | Evidence today |
| --- | --- | --- |
| Sign up and see value in under 3 min | 7 | The join flow works in e2e; never timed with real women |
| Persists across devices | 3 | No sign-in yet (#27) |
| Observations link to entries | 9 | Every pattern card lists its days; care-gap cards don't yet |
| Doctor PDF accurate and readable | 7 | A valid 35 KB PDF; never timed by a clinician |
| Consent-only clinician view | 10 | Forced RLS, with tests |
| Empty, loading and error states | 9 | `error.tsx` everywhere, API-down and slow e2e; no audit table yet |
| Arabic and English | 6 | 1,079 keys in both languages, none missing; no native review |
| Lighthouse ≥ 90 on mobile | 10 | 99–100 on every app screen (measured 6 Nov) |
| Automated tests | 9 | 178 backend tests, 50 unit, 110 e2e; the #418 flake remains |
| Pilot-ready | 5 | Half deployed; no sign-in or tenants yet; safety case not written |

### 2.3 Real SaaS (10 lines × 10)
| Line | Score | Evidence today |
| --- | --- | --- |
| Multi-tenant | 5 | Clinician invites parked on a branch (C1) |
| Roles per tenant | 4 | No clinic-admin role |
| Clinic onboarding | 6 | QR join works; invites not merged |
| Metrics per tenant | 8 | Per-clinic totals on the network view only |
| Pricing page | 9 | Tiers are shown; prices untested |
| Audit log export | 9 | Network level, hash chain checked |
| Data residency | 8 | UAE plan written; the demo runs in Frankfurt (synthetic data) |
| Integration path | 9 | FHIR R4 export: 0 errors, 94 warnings |
| Support, SLA, status page | 7 | /status checks the API live; uptime workflow ready (`LIVE_WEB_URL` set, `LIVE_API_URL` pending) |
| Unit economics | 7 | Sourced, but every number is a hypothesis |

### 2.4 Clinical safety (7 lines × 5)
| Line | Score | Evidence today |
| --- | --- | --- |
| Red flags | 4 | Recall is 15/15 on the acceptance set, but RF2 can't fire without a fever until #40 merges (then 5) |
| Crisis path | 3 | The EPDS item 10 path is tested; the assistant catches 11/30 held-out crisis messages; the 998 strip is always on |
| Held-out routing | 3 | Emergencies 24/32, diagnosis 6/10, medicine 4/10, everyday 42/50 |
| Non-diagnostic language | 5 | 0 banned phrases; guard tests |
| Sources | 4 | 28 sources; NG126 missing (A5) |
| Edge cases | 2 | Q48 and Q53 are fixed in #40 (then 3); Q49 R1–R10 wait for a clinician |
| Governance | 2 | No safety case or sign-off yet (A9, B6) |

### 2.5 Women's experience (7 lines × 5)
| Line | Score | Evidence today |
| --- | --- | --- |
| Value in under 3 min | 4 | Never timed with women |
| Clarity | 4 | Walk findings are still open (#43) |
| Arabic and RTL | 2 | RTL layout passes e2e; the Arabic, including all 28 knowledge-base summaries, isn't reviewed by a native speaker |
| Tone and cultural fit | 4 | Reviewed by the women-care-lead agent; no sessions with women yet |
| Privacy and control | 4 | AI is opt-in; consent per clinic; no sign-in to export or delete |
| Accessibility | 5 | axe in e2e; Lighthouse accessibility 100 |
| Useful for her visit | 3 | Report, questions and draft request exist; not validated with women or clinicians |

### 2.6 Trust pack: 7/7
| Check | Result |
| --- | --- |
| Grounded answers | 29/30 (96.7%) |
| Diagnosis questions refused | 15/15 |
| Red-flag recall | 15/15 |
| Rule accuracy | 8/8 personas |
| Banned phrases | 0 |
| Demo-safe e2e | passes |
| Care navigator never sends | passes |

## 3. Engineering and readiness (26 parameters, measured 6 Nov evening)
Grades: **A** ready, **B** minor gaps, **C** a real gap with a fix planned, **D** a weak spot that could cost the win, **F** missing.

| # | Parameter | Measured | Grade | Next |
| --- | --- | --- | --- | --- |
| 1 | Backend tests | 178 passed, ruff clean | A | Keep |
| 2 | Backend coverage | 92% of lines. Gaps: `ai/llm.py` 49% (the live-model path), `services/documents.py` 72%, `ai/safety_eval.py` 74% | A- | A3 adds tests for the provider and the eval |
| 3 | Web lint, types, unit | eslint and tsc clean; 50 unit tests pass | A | Keep |
| 4 | End-to-end | 110 passed, 8 skipped, 0 failed (1.8 min; desktop and mobile; EN and AR; axe) | A | Keep |
| 5 | CI stability | React #418 failed twice in a row on main on 6 Nov (the #38 merge) | C | #44 Next 16 |
| 6 | Bundle size | 103 kB of shared first-load JS; heaviest route `/app/report` at 135 kB | A | Keep |
| 7 | Lighthouse on mobile | 99–100 on the app screens; landing 100 (6 Nov) | A | Re-measure after C0 and C3 |
| 8 | Live web | `reprosense.vercel.app`: 200 on `/`, `/demo`, `/trust`, `/robots.txt`; functions in `fra1` | B | — |
| 9 | Live API | Not deployed: the database is blocked by the Supabase free limit; Atharva is creating it | F | #22 (Atharva's database, then Render) |
| 10 | Uptime | Workflow ready; `LIVE_WEB_URL` set; `LIVE_API_URL` pending | C | Krishna, after Render |
| 11 | Secrets | gitleaks over all history in CI: clean | A | A0 adds the AI co-author guard |
| 12 | npm production dependencies | 4 advisories (2 high), all `postcss` via `next` 15.5.29 | C | #57 (A11) |
| 13 | Python dependencies | pip-audit: no known vulnerabilities | A | Keep |
| 14 | Auth and tenancy | Forced RLS and consent-only tests; no sign-in; tenants parked | C | C1, C3 |
| 15 | Safety, acceptance set | 29/30 grounded, 15/15 refusals, 15/15 red flags, 0 banned | A | Keep |
| 16 | Safety, held-out round 5 | Crisis 11/30, emergencies 24/32, diagnosis 6/10, medicine 4/10, everyday 42/50 | D | A3, then B2 |
| 17 | Rules | 18 rules, each citing a source; Q48/Q53 fixed in #40 (not merged); Q49 R1–R10 wait for a clinician | C+ | #42, B6, C4 |
| 18 | Knowledge base | 28 sources in our own words; NG126 missing; 28/28 Arabic summaries unreviewed | B- | A5, B3 |
| 19 | Internationalisation | 1,079 keys EN = AR, 0 missing; 25 Arabic strings identical to English (mostly brand names and numbers; check `home.pillFuture`, `admin.liveStatus`) | C | B3 |
| 20 | FHIR R4 | HL7 validator: 0 errors, 94 warnings | B+ | #47 (C5) |
| 21 | Data realism | PBAC 11 on every medium day; 128 vs 133 entry counts | C | #43 (A4a, A4d) |
| 22 | Docs and process | Gates, roadmap (#48), scorecards, QUESTIONS, CI on every PR | B+ | A0 |
| 23 | Venture evidence | 0 interviews, 0 letters of intent, no advisor; economics are hypotheses | D | A8, B4, B7 |
| 24 | Women's evidence | 0 usability sessions; 0% native Arabic review | D | B3, B5 |
| 25 | Pitch readiness | Deck from the real build; 0 rehearsals; no backup video | C | B10 |
| 26 | Mobile | No app or PWA yet; roadmap in docs/21 (not part of the jury score) | — | #50–#56 |

## 4. Top 10 fixes by points per hour (updated)
| Order | Fix | Who | Points it unlocks |
| --- | --- | --- | --- |
| 1 | Database, then the Render API, then the live smoke test (#22) | Atharva (database), Krishna (Render), Atharva (smoke test) | Prototype +3, MVP +2, SaaS +2 |
| 2 | Merge #40 and #48 | Atharva | Clinical safety +1.5; the roadmap on main |
| 3 | A0 co-author guard (#41) | Atharva | Protects Krishna's rule |
| 4 | A3 model-check cap and coverage gate (#42) | Atharva | Makes B2 trustworthy |
| 5 | A11 postcss override (#57) | Atharva | Security C → A |
| 6 | A4 walk findings (#43) | Atharva | Women's experience +1; realism |
| 7 | A8 outreach, advisor first (#26) | Atharva | About +12 across the jury and safety, once people say yes |
| 8 | A5 NG126 and the overdose source (#42) | Atharva | Clinical safety +1 |
| 9 | A9 safety case (#45) | Atharva | Clinical safety +2 (+1 more once signed) |
| 10 | B2 model check with Krishna's key (#29) | Krishna | Clinical safety +4, if it passes |

## 5. Who has what
- **Atharva:** #22 (database and smoke test), #23, #26, #27, #28, #31, #41–#47, #57, the mobile issues #51–#56 (after the showcase), and merging #40 and #48.
- **Krishna:**
  - Render, once Atharva's connection string arrives (paste `DATABASE_URL` yourself);
  - `LIVE_API_URL`, `STATUS_MONITOR_URL` and `SUPPORT_EMAIL`;
  - B2 with your key;
  - mobile M0 (#50);
  - every gate G2 approval;
  - the dates: the second competition (Q45) by 10 Nov, applications by 14 Nov 23:59, the organiser email (Q44) before 16 Nov, the tag on 16 Nov.
