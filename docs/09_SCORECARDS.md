# 09 · Scorecards (the senior-judge agent uses these after every phase)

Score each line 0–5. 0 = missing, 3 = works but plain, 5 = a demanding expert would show it as-is.

## A. Jury scorecard (official weights)
| Criterion (weight) | Sub-checks | Score /5 | Weighted |
| --- | --- | --- | --- |
| **Venture potential (30)** | Named first customer (women's health / IVF clinic group) · who pays and price hypothesis · UAE adoption path (clinic → Malaffi FHIR) · regulatory plan (DoH, ADHICS, data law) · 6-month milestone plan · interviews done | | ×6 |
| **Health impact (20)** | Abu Dhabi-relevant numbers (PCOS, endometriosis delay, GDM) · clear outcome (earlier evaluation, closed care gaps) · access/cost angle | | ×4 |
| **Innovation & evidence (20)** | Explainable rules tied to 2023 PCOS guideline, NICE/ESHRE, ADA · RAG with citations · better than trackers (doctor-ready, clinic loop) · honest limits | | ×4 |
| **Working prototype (20)** | Full demo path works live · patient + clinician + admin · PDF · AI answers with sources · no dead buttons · mobile + desktop | | ×4 |
| **Team & pitch (10)** | 3-min story · direct Q&A answers · AI disclosure · commitment to continue | | ×2 |
| **Total** | | | **/100** |

## B. Real MVP scorecard (is it a product, not a demo?)
| Check | Pass? |
| --- | --- |
| A new user can sign up, consent, log and see value in < 3 minutes | |
| Data persists across sessions and devices | |
| Every observation links to the exact entries behind it | |
| Doctor PDF is accurate to the data and readable in 60 seconds | |
| Clinician only sees consented patients (tested) | |
| Empty, loading and error states everywhere | |
| Works in Arabic RTL and English | |
| Lighthouse ≥ 90 performance and accessibility on mobile | |
| Automated tests: rules, API, e2e demo path | |
| Can run for a real pilot after security hardening (no rewrites needed) | |

## C. Real SaaS scorecard (could a clinic buy it?)
| Check | Pass? |
| --- | --- |
| Multi-tenant: each clinic is a tenant with its own users and data partition | |
| Roles and permissions per tenant (clinician, clinic admin) | |
| Onboarding for a clinic (invite clinicians, share QR for patients) | |
| Usage + outcome metrics per tenant (reports received, gaps closed) | |
| Pricing page with tiers (Free patient · Clinic · Network/Payer) | |
| Audit log export for compliance | |
| Data residency story (UAE region) | |
| Integration path (FHIR export, Malaffi later) | |
| Support/SLA statement and status page | |
| Unit economics hypothesis (CAC, price per clinician seat, gross margin) | |

## Earlier estimate (v2) — superseded by docs/15_WIN_PLAN.md (v4: 74 → 81 → 94)
| Criterion | Estimate | What lifts it to 5/5 |
| --- | --- | --- |
| Venture (30) | 24 | 5 clinic interviews + one letter of intent |
| Impact (20) | 18 | local numbers already sourced; add one clinician quote |
| Innovation (20) | 17 | live evidence links in every card; clinician-reviewed rules |
| Prototype (20) | 0 → target 19 | build the demo path; no dead buttons |
| Pitch (10) | 8 | rehearse 5×; clinician on stage |
| **Projected if executed** | **~90–95** | Honest note: scores are our estimate; the jury decides |

## Trust pack checks (add to every senior-judge review)
| Check | Pass |
| --- | --- |
| Grounded answers (verifier, 60 questions EN+AR) | ≥ 95% |
| Diagnosis questions refused | 15 / 15 |
| Red-flag recall (6 rules) | 100% |
| Rule accuracy (8 personas) | 8 / 8 |
| Banned words in generated text | 0 |
| Demo-safe mode (network off) | full path works |
| Care navigator never sends without approval | verified in test |
