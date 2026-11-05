# 01 · Product spec

## Problem statement
**One line:** In Abu Dhabi, reproductive conditions are recognised late because a woman's history reaches a short appointment in pieces, and follow-ups after pregnancy fall between services.

Women in Abu Dhabi often carry their reproductive health story in pieces: a period app, photos of lab results, memories
of painful months, a pregnancy record at another hospital. In a 10–15 minute appointment they struggle to show the pattern,
and conditions like PCOS and endometriosis go unrecognised for years. After gestational diabetes, the follow-up glucose test
is often missed. ReproSense turns the pieces into one explainable story that both the woman and her doctor can act on.

## Personas (fictional, used in the demo)
| Persona | Age | Story | Expected observations |
| --- | --- | --- | --- |
| Amina | 27 | Regular cycles, mild cramps | None (shows a calm, "all good, keep logging" state) |
| Noura | 24 | Cycles 38–62 days, acne, excess hair growth logged | Irregular-cycle pattern + androgen-type symptom pattern → discuss PCOS evaluation |
| Priya | 31 | Pain 7–9/10 each period, missed work 4 times, pain with bowel movements during periods | Severe cyclical pain pattern → discuss endometriosis evaluation |
| Fatima | 33 | Gave birth 9 weeks ago, had gestational diabetes, no glucose test logged | Postpartum glucose test due (care gap) |
| Sara | 35 | Periods 8–10 days, flooding, clots (PBAC 158–161), one day dizziness logged | Heavy-bleeding pattern + **red flag** (urgent guidance) |
| Mariam | 36 | Regular cycles, trying to conceive for 7 months | Fertility-check timing (ASRM ≥ 35 after 6 months; NICE NG257 2026) + preconception checklist |

## Feature list with priority
**P0 = must work in demo · P1 = should · P2 = stretch**

| # | Feature | Priority | Acceptance criteria |
| --- | --- | --- | --- |
| 1 | Landing page with 3D hero, light/dark, EN/AR | P0 | Loads < 2.5s on mobile, all sections, CTA to /demo |
| 2 | Demo switcher (personas, clinician, admin, reset) | P0 | One click per role; reset restores seed |
| 3 | Onboarding with granular consent | P0 | 5 steps, skip allowed, consent saved to ledger |
| 4 | Dashboard (ring, trend, observations, reminders) | P0 | Matches persona data; empty state for new user |
| 5 | Symptom & cycle log (slider, body map, chips, note) | P0 | Save → appears in timeline within 1s |
| 6 | Timeline (12 months, zoom) | P0 | Periods, cycle length, pain, symptoms, events lanes |
| 7 | Explainable insights | P0 | Each card shows pattern, supporting entries, rule, source, next steps |
| 8 | Red-flag handling | P0 | Pinned urgent card with 998 and nearest-emergency guidance |
| 9 | RAG assistant with citations | P0 | ≥1 citation per answer; refuses diagnosis politely |
| 10 | Doctor-ready report + PDF | P0 | 2-page PDF: summary, timeline chart, observations, labs, questions |
| 11 | Share with clinic (consent, expiring link) | P0 | Link expires in 7 days; revocable; logged |
| 12 | Clinician patient list + patient view | P0 | 30-second summary; same data as patient side |
| 13 | Admin/payer dashboard | P0 | KPIs, care-gap funnel, region view, ROI slider on 1,200 cohort |
| 14 | Postpartum glucose-test bridge | P1 | Fatima persona shows reminder + clinic care gap |
| 15 | Natural-language symptom capture | P1 | Free text → structured fields shown for confirmation |
| 16 | Document AI on lab reports | P1 | Upload synthetic report → extracted table, confirm before save |
| 17 | Consultation prep questions | P1 | 5 questions tied to her own entries |
| 18 | Privacy centre (audit timeline, export, delete) | P1 | Export JSON works; delete removes data in demo |
| 19 | Ramadan mode | P2 | Toggle changes reminder times + shows fasting guidance |
| 20 | Wearable CSV import (context only) | P2 | Resting HR + temperature drawn on timeline |
| 21 | Arabic voice note | P2 | Speech-to-text into log note |
| 22 | PBAC bleeding score (pictorial chart, Higham 1990) | P0 | Pad/clot counters; score per period; ≥ 100 feeds heavy-bleeding rule |
| 23 | Record strength meter | P0 | Shows how much data supports a pattern (cycles, entries) — never a disease probability |
| 24 | "How this was produced" trace | P0 | Per observation: intake → rule with values → safety → sources → wording check |
| 25 | Change detection | P1 | "Cycles averaged X days before <date> and Y after" when step ≥ 7 days |
| 26 | Clinician "Ask the record" | P0 | Questions answered only from her entries, with dated evidence chips |
| 27 | SBAR pre-visit handover + editable visit note | P0 | Situation, Background, Assessment, Recommendation |
| 28 | Fertility timing + preconception checklist | P1 | Mariam persona; ASRM/NICE NG257; folic acid 400 mcg |
| 29 | Fairness check (admin) | P1 | Pattern and sharing rates by nationality group and age band; flag gaps > 5 points |
| 30 | Home: greeting, day pills, cycle arc (phase colours, "estimate" label if irregular) | P0 | Arc matches cycle day; after birth shows weeks 0–12 with glucose-test window |
| 31 | Today's recommendation cards | P0 | Text comes from rule next-steps/questions, never invented |
| 32 | Mood check-in row | P1 | Tap saves mood for the day |
| 33 | Calendar + last logged data tiles | P0 | Period days filled; flow, pain, symptoms, daily life |
| 34 | Analytics: 3/6/12 months, cycle-length line, pain bars | P0 | Switch filters cycles; 21–35 band shown |
| 35 | AI Copilot chat UI (avatar, citations, suggested pills, mic/send, clear) | P0 | Every answer cites; urgent words trigger 998 guidance |
| 36 | 3D hero cycle ring + phone tilt (R3F) | P1 | 60fps on laptop; static fallback with reduced motion or no WebGL |
| 37 | 3D "year" spiral, drag to rotate | P1 | One loop per cycle from real data; days > 35 highlighted |

## Copy rules (all screens)
- Calm, warm, plain. Grade 7 reading level. Short sentences.
- Say "pattern worth discussing", "consider", "your doctor can check". Never "you have", "diagnosis", "% chance".
- Every medical word has a tap-to-explain tooltip.
- Footer on every screen: "ReproSense gives information, not a diagnosis. In an emergency call 998. Demo data is fictional. Built with AI tools."

## Success metrics shown in the pitch (measured on synthetic scenarios)
| Metric | Target in demo |
| --- | --- |
| Time to produce doctor-ready summary | < 10 seconds |
| Observations backed by ≥1 recorded entry | 100% |
| Assistant answers with a valid citation | 100% of 30 test questions |
| Banned diagnostic phrases in outputs | 0 across 200 generated outputs |
| Extraction accuracy on 20 synthetic lab reports | measured and shown honestly (field-level) |
| Clinician time to understand history (interview estimate) | asked in 5 clinician interviews |

## Version 4 features (team-approved 5 Nov 2026)
| # | Feature | Priority | Acceptance criteria |
| --- | --- | --- | --- |
| 38 | Life-stage switch (periods, trying, pregnancy, after birth, perimenopause) | P0 | Home, patterns and questions change; each stage has a demo woman |
| 39 | Pregnancy home: week arc, trimester, warning signs (998), appointments | P0 | Hessa shows week 24 and the glucose screen due |
| 40 | Pregnancy glucose screen 24–28 weeks (rule + care gap) | P0 | CARE_PREGNANCY_GLUCOSE_SCREEN fires for Hessa only |
| 41 | EPDS mood check after birth with crisis path | P0 | Score ≥ 10 → discuss card; item 10 > 0 → crisis screen, no score shown |
| 42 | Perimenopause: hot-flush count, MRS check-in, NICE NG23 card | P1 | Layla shows OBS_PERIMENOPAUSE_SYMPTOMS |
| 43 | Iron-check pattern (heavy bleeding + tiredness) | P1 | Sara shows OBS_HEAVY_WITH_FATIGUE |
| 44 | Body map (front/back images, tap points, year heat glow) | P0 | Tap saves site; glow size = painful days per site |
| 45 | Care navigator agent (draft request, questions, bring list; approve) | P0 | Nothing sent without approval; audit logged |
| 46 | Verifier agent (sentence-level source check) | P0 | Unsupported sentences removed; count shown in trace |
| 47 | Guideline graph + Arabic ↔ English retrieval | P1 | Arabic question retrieves English source and answers in Arabic |
| 48 | AI test-results panel (60 questions) | P0 | Grounded ≥ 95%, refusals 15/15, red-flag recall 100% |
| 49 | Visit mode (one-screen SBAR + QR) | P0 | Opens from Report; QR opens shared record |
| 50 | FHIR R4 export | P1 | Bundle validates against R4 Patient + Observation |
| 51 | Wearable import (sleep, temperature) as context | P2 | Never creates a pattern alone |
| 52 | Discreet mode (PIN, neutral name, no previews) | P1 | Toggle hides names; PIN on open |
| 53 | Demo-safe mode (saved answers, offline) | P0 | Full demo path works with network off |
| 54 | 3D follow-ups-by-region chart on clinic dashboard | P1 | Heights from cohort data; drag to rotate; fallback |
| 55 | EHP-5 monthly check-in for pain | P2 | Trend line only, never a diagnosis |
