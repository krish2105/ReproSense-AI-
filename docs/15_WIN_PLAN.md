# 15 · Win plan — from 74 today to 94 on 22 Nov (version 4 estimate)

Our estimate against the official rubric. The jury decides; this file tells the team exactly where the points are.

## Score path
| Criterion (max) | Today 5 Nov | By selection 16 Nov | Showcase 22 Nov | What earns the points |
| --- | --- | --- | --- | --- |
| Venture potential (30) | 23 | 27 | 28 | Clinical advisor, 5 clinician + 3 clinic-manager interviews, 1 letter of intent (LOI), priced pilot offer, 6-month plan tied to grant milestones |
| Health impact (20) | 19 | 20 | 20 | Five life stages, Abu Dhabi numbers (docs/05), pregnancy glucose screen, EPDS, perimenopause, one clinician quote |
| Innovation & evidence (20) | 18 | 19 | 19 | Validated questionnaires (PBAC, EHP-5, EPDS, MRS), verifier agent, care navigator, traces, fairness check, clinician sign-off on rules |
| Working prototype (20) | 7 | 7 | 18 | 3-woman demo path built first (Noura, Hessa, Fatima), demo-safe mode, zero dead buttons |
| Team & pitch (10) | 7 | 8 | 9 | Clinical advisor named, 5 rehearsals, backup video, direct answers to docs/10 questions |
| **Total** | **74** | **81** | **94** | If everything is attempted and the demo breaks: ~83 |

## Winning confidence (judgement, assumes the showcase column is reached)
| Outcome | Confidence | Without a clinician | Reasoning |
| --- | --- | --- | --- |
| Grant-eligible (≥ 60) | ~97% | ~93% | Even a partly broken demo keeps venture + impact + innovation above 60 |
| Top 3 | ~70–75% | ~55–60% | Covers every criterion; venture (30%) is where most teams are weakest |
| First place | ~45–50% | ~30–35% | Unknown field; a doctor-led team with real pilot data could outscore us |

## Readiness beyond the hackathon
| Scorecard | Today | After build week | After 3-month pilot |
| --- | --- | --- | --- |
| Real MVP (docs/09 B) | ~30/100 (specified 10/10, working 0/10) | ~65–70/100 (6–7/10 checks) | ~85/100 |
| Real SaaS (docs/09 C) | ~30/100 (3/10 in design) | ~45/100 (5/10) | ~80/100 (8–9/10) |

What lowers it: no clinician; building all 55 features and breaking the demo; no interviews/LOI; machine-sounding Arabic.

## Before 16 Nov (research, design and people; the code built 5–6 Nov must be disclosed in full, see below)
- [ ] All members apply separately, same team name, by 14 Nov 23:59 GST
- [ ] Recruit a clinician (OB-GYN, GP, nurse or health-science student); ask the organisers to match one if needed
- [ ] 5 clinician interviews + 3 clinic-manager interviews (script: docs/12)
- [ ] 1 letter of intent (template below)
- [ ] Native Arabic review of mockup + app strings
- [ ] Generate images with IMAGE_PROMPTS_CHATGPT.md (S1 style anchor and D1 body map first) and save in public/images
- [ ] Clinician reviews `rules/clinical_rules.yaml` and signs the header
- [ ] Prepare the disclosure note (template below)

## Build week 17–21 Nov
Follow BUILD_STATUS.md phases 0–9. Code freeze Sat 21 Nov 18:00 GST. Run the `demo-readiness` skill each evening.

## Letter of intent template (non-binding)
```
[Clinic letterhead]
Date: ____
To: ReproSense team (HealthX Ajyal Hackathon)

[Clinic name], a women's health clinic in [Abu Dhabi area], is interested in piloting ReproSense,
a non-diagnostic tool that helps patients bring structured cycle, symptom and lab histories to
appointments and helps our clinicians track recommended follow-ups.

Subject to data-protection review, DoH requirements and a pilot agreement, we would consider a
[3]-month pilot with up to [3] clinicians and [20] consenting patients, starting after [month/year].

This letter is non-binding and creates no financial obligation.

Name, role, signature: ____
```

## Prior-work disclosure (read at the start of the event) — UPDATED 6 Nov 2026
The official rules score "Prototype and execution" on the core journey built **after acceptance (16 Nov)**, and allow
earlier code, research or designs **only if disclosed at the start of the event** (research/2026-11-06/01 §0.2, 05 §0.1).
The old template said "an interactive HTML mock-up (no backend)". That stopped being true on 5 Nov. An incomplete
disclosure costs far more than any feature, so read this version, and ask the organisers in writing how disclosed
earlier code is scored (QUESTIONS.md #44).

```
Prior work disclosed by team ReproSense (all before selection on 16 Nov 2026):
- Research, product specification, clinical rules, design mock-ups and images (5 Nov 2026).
- Working code in the public repository github.com/krish2105/ReproSense-AI- (5–6 Nov 2026):
  - backend: FastAPI, PostgreSQL with row-level security, rules engine, LangGraph pipeline, knowledge-base retrieval,
    assistant, doctor PDF, clinic and network APIs, synthetic data generator and tests;
  - web app: patient, clinician and network-admin views in English and Arabic, landing page with 3D views;
  - end-to-end tests, CI, Docker image and deploy configuration;
  - join flow with clinic QR invite, pricing page, AI on/off switch, DoH Jawda PC008 panel;
  - trust centre (DoH Responsible AI Standard clause map), per-clinic metrics, audit log export, support terms,
    pitch deck, and the safety, privacy and evidence fixes from the 6 Nov judge panel (assistant safety routing with a
    held-out test, crisis path, clinic-only sharing, closed demo roster, evidence order, clinician voice).
- Built but parked for build week (not merged before selection): clinician invites (branch `build-week/clinician-invites`).
- The repository state at selection is tagged `pre-selection-2026-11-16`; everything after the tag is build-week work.
- AI tools used: Claude (research, specification, code assistance), ChatGPT for illustrations.
- No real patient data has been used at any point; every record is synthetic and labelled "Demo data — fictional".
```

To do on 16 Nov (team): create the tag `git tag -a pre-selection-2026-11-16 -m "State at selection" && git push origin
pre-selection-2026-11-16`, then keep a "built 17–21 Nov" list in PROGRESS.md for the pitch credits slide.

## Recruit a clinical advisor before 16 Nov (biggest score lever)
Send to 5–10 gynaecologists, OB-GYN residents, midwives or GPs (LinkedIn, SP Jain network, SKMC / Corniche / Danat Al Emarat alumni):

> Hi Dr ___, I'm Krishna, an AI student at SP Jain Dubai. My team is entering the DoH Abu Dhabi HealthX Ajyal hackathon
> (showcase 22 Nov) with ReproSense: a woman's cycle, pregnancy and after-birth record that flags patterns worth discussing
> (never a diagnosis) and gives her doctor a 2-page summary. Would you give 20 minutes to review our clinical rules, and,
> if you like it, be named as an advisor? No cost or commitment beyond that. Thank you.

## Demo story (3 minutes, three women)
Noura: irregular cycles + body map → Hessa: pregnancy, care navigator drafts the glucose test request → Fatima: clinic dashboard closes
her after-birth glucose gap live. Mention the other two stages in one sentence; judges can explore them.
