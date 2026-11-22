# Claims register

Started 22 Nov 2026 (showcase day). Every claim the product, README or pitch makes about evidence, quality rules,
competitors, safety or the event, with what it rests on and its limits. Before a claim is used in a new place, check it
here. A recent "last checked" date does not make an old source current: the version and status columns say that.

Status: **built** (in the product), **tested** (measured by our tests), **proposed** (planned, not done),
**historical** (true of the past, not of today), **withdrawn** (we no longer say it).

Clinical reviewer for every row: **not yet assigned** (the clinical advisor is being recruited). Until then these are
the team's readings of the sources, not a clinician's.

## Quality rules and clinical recommendations

| Claim | Status | Population, date or window | Source, version, where | Retired or superseded? | Last checked | Limits |
| --- | --- | --- | --- | --- | --- | --- |
| DoH measured after-birth follow-up (breastfeeding support, depression screen, glucose test after gestational diabetes) as Jawda primary-care indicator PC008 | historical | Primary-care visits 7 to 84 days after birth | [Jawda Primary Care guidance, Version 7, July 2023](https://www.doh.gov.ae/-/media/Feature/Muashir/Jawda/Jawda-Quarterly-Submission-Guidelines/PrimaryCare-JAWDA---Update-2022.ashx) | **Retired.** [Version 9 (2026)](https://www.doh.gov.ae/-/media/Feature/Muashir/Jawda/2026/Primary-Care-PC-Services-Jawda-GuidanceVersion-92026.ashx), printed page 41, "Summary of Changes 2025 V8": PC001 to PC003, PC006 to PC008 and others retired | 22 Nov 2026 | Never say clinics report PC008 today, that ReproSense improves a PC008 score, or that payment rests on it |
| No after-birth or maternal follow-up indicator is in the current primary-care Jawda sets | tested against the documents | Version 9 (2026) and the [Q3 2026 guidance](https://www.doh.gov.ae/-/media/Feature/Muashir/Jawda/2026/Primary-Care-and-Medical-Center-Services-Jawda-Guidance_V1_2026_Effective-From-Q3-2026.ashx) | Both documents read on 22 Nov 2026 | Current | 22 Nov 2026 | We do not invent a replacement indicator. The pilot clinic confirms which quality framework applies to it |
| A glucose test is recommended 4 to 12 weeks after gestational diabetes (75 g OGTT), then every 1 to 3 years | built (the follow-up rule) | People with recent gestational diabetes | [ADA Standards of Care 2026, section 15](https://diabetesjournals.org/care/article/49/Supplement_1/S321/163918/15-Management-of-Diabetes-in-Pregnancy-Standards), recommendations 15.30 and 15.31 (grade B). Read through the PubMed Central copy | Current (2026 edition) | 22 Nov 2026 | A clinical recommendation, not a UAE reporting duty. Eligibility, timing and exclusions in a pilot follow the clinic's own approved protocol |
| DoH's Postnatal Care Program Standard sets postnatal checks (first days, 7 to 14 days, 6 weeks) and asks for depression and anxiety screening | built (postnatal steps) | Postnatal period, first 6 weeks | [DoH/ST/HQS/PCP/V1/2025, May 2025](https://www.doh.gov.ae/-/media/E9385172FCBB4E469B94039B6BF0D381.ashx) | Current | 22 Nov 2026 | **The standard does not name the EPDS questionnaire or a glucose test after gestational diabetes.** Those two steps in the app come from NICE and the ADA. Open item: check each postnatal step in the app against the standard's wording (clinical reviewer) |

## Problem evidence

| Claim | Status | Population, date or window | Source | Last checked | Limits |
| --- | --- | --- | --- | --- | --- |
| 265 of 1,043 women (25.4%) came back for the glucose test after gestational diabetes | historical | One Al Ain hospital; data reported as 2013 to 2014; a 4 to 6 week window | [Agarwal, Lal, Vyas, IJERPH 2022](https://doi.org/10.3390/ijerph192113946) | 22 Nov 2026 (abstract; the publisher's page would not open) | Not today's Abu Dhabi baseline. Not comparable with a 12 week endpoint. Always say "one hospital, 2013 to 2014 data, 4 to 6 weeks" |
| 21.3% of 2,546 pregnancies had gestational diabetes | historical | Al Ain, Mutaba'ah cohort, 2017 to 2021 | [Frontiers in Endocrinology, 2022](https://doi.org/10.3389/fendo.2022.1069477) | 6 Nov 2026 | One cohort, one city |
| Up to 70% of women with PCOS are unaware of it | cited | Global | [WHO fact sheet](https://www.who.int/news-room/fact-sheets/detail/polycystic-ovary-syndrome) | 6 Nov 2026 | A global estimate, not a UAE figure |
| Endometriosis took 11.6 years on average from first symptoms to diagnosis | historical | 518 women in the UAE, recruited 2018 to 2019 | [Frontiers in Global Women's Health, 2021](https://doi.org/10.3389/fgwh.2021.708410) | 6 Nov 2026 | One study |
| After gestational diabetes, type 2 diabetes is nearly ten times more likely | cited | Pooled, international | [Vounzoulaki et al., BMJ 2020](https://pmc.ncbi.nlm.nih.gov/articles/PMC7218708), relative risk 9.51 | 22 Nov 2026 | Use this one figure everywhere. Dennison et al. (relative risk 8.3, Diabetes Research and Clinical Practice) is a second estimate; do not mix them |

## Withdrawn impact claims

| Claim | Status | Why |
| --- | --- | --- |
| "About 18 more mothers per 1,000 births with raised blood sugar found early" | **withdrawn 22 Nov 2026** | It multiplied a 2017 to 2021 prevalence, a 2013 to 2014 attendance rate with a 4 to 6 week window, a target we assumed, and a pooled international abnormal-result rate. Different populations and windows cannot be chained into a result |
| Any AED "value of follow-ups" on /pilot | **withdrawn (PR 2)** | No clinic has supplied a cost. Money inputs stay empty until one does |
| Replacement | proposed | A scenario from the clinic's own numbers: eligible women, completion today, an assumed target. Example: 100 women, 25% to 50%, 25 more completed follow-ups. Never "cases found", "prevented" or "saved" |

## Safety and AI

| Claim | Status | Basis | Limits |
| --- | --- | --- | --- |
| Patterns are decided by written rules, not by a model | built | `rules/clinical_rules.yaml`, `backend/app/rules/engine.py` | No clinician has signed the rules yet |
| The language model extracts fields from her voice note and lab photo (she confirms before saving), rewords text, and gives a second safety classification of chat messages | built | `backend/app/agents/`, `backend/app/services/lognote.py`, `documents.py`, `agents/safety.py` | Never say "the AI only rewords" |
| Held-out safety set, 132 messages: with the model check, crisis 30 of 30 and emergencies 32 of 32; word checks alone 11 of 30 and 24 of 32 | tested | `backend/app/ai/eval_results.json`, round 5 | A finite synthetic set written by the team's reviewers, not clinicians. Not sensitivity in a population, not clinical validation. Without the model the chat's safety path is weaker |
| Diagnosis requests given the exact refusal 6 of 10, medicine questions 4 of 10 | tested | Same file | The misses still gave a sourced answer with no diagnosis and no dose; each needs classifying by a reviewer |
| Words we never use | rule | docs/19 section 1 | "100% safe", "zero hallucinations", "clinically validated", "all emergencies detected", "fully compliant", "DoH-approved", "not a medical device" |

## Competitors and partners

| Claim | Status | Source | Limits |
| --- | --- | --- | --- |
| Flo offers informational symptom checks, including for PCOS | cited | [Flo research page](https://flo.health/collaborations/academic-research/flo-symptom-checkers-new-study) | Never say trackers "only predict periods" |
| Ovia covers life stages and sells to health plans, employers and health systems | cited | [oviahealth.com](https://www.oviahealth.com/) | |
| Nabta Health runs AI-supported women's healthcare in the UAE | cited (secondary) | [nabtahealth.com](https://nabtahealth.com/) | The site did not render for our check; details are from press coverage |
| Sahatna Space has maternity care features; AI health assistance and IVF services are announced as coming | cited | [DoH, 16 Oct 2025](https://www.doh.gov.ae/en/news/abu-dhabi-advances-smart-and-intelligent-health-system-with-launch-of-sahatna-space-on-tamm) | Never say Sahatna "has no women's health features" |
| Malaffi's provider portal has an AI assistant that summarises records and a wellness page with maternity journeys | cited | [Malaffi provider portal](https://www.malaffi.ae/the-malaffi-provider-portal/) | |
| ReproSense exports FHIR R4 | built | `backend/app/services/fhir.py` | **Not a Malaffi integration.** No partnership, endorsement or procurement exists or is claimed |

## Event facts

| Claim | Status | Source | Last checked |
| --- | --- | --- | --- |
| Prizes AED 15,000, 10,000 and 5,000; grant paid in tranches (50% on signing, 10% at 1 month, 15% at 3 months, 25% at 6 months, timings indicative); at least 60 of 100 needed for a grant | cited | [upstartbar.com/ajyal](https://upstartbar.com/ajyal/) | 22 Nov 2026 |
| Judging: venture 30, problem and health impact 20, innovation and evidence 20, prototype 20, team and pitch 10 | cited | Same page | 22 Nov 2026 |
| Earlier work is allowed if disclosed at the start; AI tools are allowed if disclosed in the pitch | cited | Same page | 22 Nov 2026 |
| Slide count and pitch length | from the organisers' session, not the public page | Organisers' information session, 17 and 21 Nov (team notes) | The public page states neither |

## Law

| Claim | Status | Source | Limits |
| --- | --- | --- | --- |
| Health data from care in the UAE stays in the UAE unless a Health Authority decision allows an exception | cited | Federal Law No. 2 of 2019, Article 13 (read through the Emirates Health Services copy) | Never say "the law allows no exceptions", and never claim an exception applies to us. Residency and exceptions need legal review. The demo is hosted in Frankfurt with fictional data only |
| Device status | not decided | Emirates Drug Establishment classification service | A "not a diagnosis" line does not decide classification. We make no device claim in either direction |
