# 23 · Build week features (17–21 Nov 2026)

Decided by Krishna on 18 Nov after the organisers' information session (17 Nov). Theme: **Women's Health** ("How might
we use AI to improve women's health and maternal, newborn and early-childhood outcomes through prevention, early
detection and better care journeys?"). Jury: PureHealth (healthcare), NYU Abu Dhabi (research), DoH. Scoring: Venture
30, Problem and impact 20, Innovation and evidence 20, Prototype 20 (built after acceptance), Team and pitch 10.
Submission on 22 Nov by 15:15: a 3-slide PDF or PPT and an MP4 demo, at programs.upstartbar.com.

Every feature lands as its own pull request with tests, written test first, merged on green CI. Anything that changes
clinical logic (`rules/clinical_rules.yaml`, `backend/app/rules/`, `safety.py`, `assistant.py`, `config.py`) adds a row to
`docs/safety/CHANGE_LOG.md` and needs Krishna's approval (gate G2). Synthetic data only; never diagnose; every health
sentence cites a source; red flags first with 998.

## Done
| Feature | PR | Why it scores |
| --- | --- | --- |
| Live deploy: API and database on Render, web on Vercel, uptime pings | `b092748`, `8204fed` | Prototype: judges can open the link |
| OpenRouter provider (the hackathon's AI credits) | #101 | Innovation: the AI runs on the organisers' credits |
| AI lab-report reader: photograph a report, the model transcribes, she confirms | #102 | Innovation, Prototype: a visible AI moment |

## Wave 1 (18–19 Nov)
| Feature | Web | Phone | Notes |
| --- | --- | --- | --- |
| **Postnatal 6-week pathway** following DoH's Postnatal Care Program Standard (May 2025) and Integrated Postnatal Care Programme: first-days telemedicine, 7–14-day and 6-week visits, mood check at 10–14 days, glucose test 4–12 weeks after gestational diabetes; reminders for her; completion for the clinic and PC008 | yes | yes (installable) | Theme fit and the DoH judge. Care gaps, not new red flags |
| **Voice logging** in English and Arabic: she speaks, the AI turns it into a log entry, she confirms | yes | yes | Uses the browser's speech recognition and the model; she always confirms |
| **3D body pain map**: her pain sites on a 3D figure, heat by frequency; a still image when 3D is unavailable | yes | yes | Procedural geometry, no licensed models |
| **Judge guided tour**: one tap walks the 3-minute demo path | yes | yes | Makes the live demo safe on stage |

## Wave 2 (19–20 Nov)
| Feature | Notes |
| --- | --- |
| **Clinic onboarding and clinic admin**, rebuilt fresh (the pre-selection branch stays unmerged): clinician invite by QR, clinic-admin role, per-clinic dashboard and export | Venture: the PureHealth customer story |
| **Pilot ROI simulator** for a clinic or insurer: every input visible and editable, no invented outcomes | Venture |
| **Pre-visit AI brief**: "what changed since your last visit", cited, from her entries only, never a diagnosis | Innovation |
| **Read-aloud** of patterns and the report in Arabic and English (browser speech) | Impact: low literacy, tired new mothers |
| **Her year in 3D** inside her timeline | Prototype polish |

## Wave 3 (20–21 Nov)
| Feature | Notes |
| --- | --- |
| **Her own sign-in**: passkey first, email code as backup (needs an email-service key in Render) | Prototype: a real MVP |
| **Scored model safety check** on held-out round 5 with the credits | Innovation and evidence; needs the OpenRouter key |
| **Blood-pressure log** in pregnancy and after birth, with urgent guidance for high readings or warning symptoms | New red-flag rule: G2 and clinician sign-off before real use |
| **Family support view** (Year of the Family 2026): she shares reminders, read-only and revocable | Privacy first: no health details unless she chooses |
| **Planning-a-pregnancy checklist**: premarital screening, folic acid, vaccines, each with its source | Prevention |
| **3D pregnancy and fourth-trimester ring**: 40 weeks plus 6 postnatal weeks, what is due when | Prototype polish |
| **Installable web app** (PWA): installs on a phone, works offline, reminders | The phone app this week (Expo PR #68 stays for after the event) |
| Polish pass, **MP4 demo** (automated recording), **3-slide deck** (problem, solution, roadmap) | Submission |

## Wave 4 · Dareen (18–21 Nov): the mother–baby link and native Arabic
| Feature | Notes |
| --- | --- |
| **Baby's first-year schedule**: newborn checks and the UAE immunisation schedule, sourced | Closes the theme's newborn and early-childhood half |
| **Feeding and breastfeeding log** with sourced support | DoH Postnatal Standard 3.1.3.3 |
| **AI hospital-discharge reader**: photo of the discharge summary, the model reads, she confirms | Innovation; feeds K1 and D1 with real dates |
| **Reminder centre**: everything due, calendar file or a notification she turned on | MVP |
| **Arabic-first pass**: native review, RTL fixes, 30 Gulf Arabic probes | Women's experience, DoH judge |
| **Mother–baby clinic board** with fair, small-number-suppressed analytics | Venture: PureHealth and DoH story |

Prompts: docs/24 (Wave 4). Strict scorecard and projection: docs/25.

## Waiting on people
- OpenRouter key: sign-in codes to Krishna's registered email are not arriving; a teammate can claim it, or ask Adnan.
- An email-service key for the sign-in backup (Krishna adds it in Render).
- Native Arabic review of new strings (`docs/AR_REVIEW.md`).
