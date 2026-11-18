# 10 · Pitch and demo

## 3-minute demo script
| Time | Screen | Say |
| --- | --- | --- |
| 0:00 | Landing | "Up to 70% of women with PCOS don't know they have it. In the UAE, women with endometriosis waited eleven years on average for a diagnosis. And at one Al Ain hospital, only one in four women who had diabetes in pregnancy came back for the glucose test after birth. The story exists. It just arrives in pieces." (WHO 2026; Mousa 2021; Agarwal 2022: research/2026-11-06/02 §2, keep the qualifiers ready) |
| 0:20 | /demo → Noura | "Noura, 24, Al Ain. Fictional, like all our data." |
| 0:30 | Dashboard + Timeline | "Twelve months in one view: seven cycles from 42 to 56 days, every one past the usual 35, with acne and hair-growth days." (checked against data/synthetic/output/personas/noura.json, 6 Nov) |
| 0:50 | Insights | "ReproSense doesn't diagnose. It shows the pattern, the exact entries behind it, and the 2023 international guideline that defines it." |
| 1:10 | Assistant (Arabic) | Ask "What is PCOS?" → answer with citations. |
| 1:30 | Report → PDF | "Ten seconds: a two-page report her gynaecologist can read in a minute." |
| 1:50 | Clinician view | "The doctor sees the same story, with consent, a pre-visit brief of what changed, and a visit-note draft she edits." |
| 2:00 | /demo → Fatima → Home | "Fatima, nine weeks after her baby. Her first six weeks follow DoH's own Postnatal Care Standard: each check with its dates and source, marked done, due or not recorded, never 'missed'. Her glucose test after diabetes in pregnancy is due." Home → *Lab reports* → *Use the demo lab report (fictional)* → confirm. |
| 2:15 | Admin dashboard | "Across our synthetic 1,200-woman cohort, 101 of 250 follow-ups are closed. Fatima's test just made it 102, and moved the glucose part of DoH's after-birth indicator, Jawda PC008, from 3 of 10 to 4 of 10. The fairness check shows sharing rates by group." (Reset the demo and check both numbers before each rehearsal.) |
| 2:35 | Business slide | "Women use it free; clinics pay per clinician seat, AED 399 a month. It will run on UAE infrastructure, as DoH's AI standard requires, with controls mapped to ADHICS and the formal assessment by month 6. Our ask: one three-month pilot, judged on how many women complete the follow-ups they are due." |

## 10-slide deck
1. Hook + one number · 2. Problem in Abu Dhabi · 3. Why it happens (fragmented, short visits) · 4. ReproSense (one picture)
5. Live demo · 6. How the AI works (rules decide, RAG grounds, LLM explains) · 7. DoH Responsible AI Standard, clause by clause (the /trust page)
8. Business model + interviews · 9. Milestones (grant schedule) · 10. Team + ask (pilot clinic, clinical advisor) + AI disclosure + prior-work disclosure (docs/15)
Every slide that shows a number carries its source line. The deck itself: `pitch/deck.html`.

## Judge Q&A
| Question | Answer |
| --- | --- |
| Is this a medical device? | Classification is the regulator's decision: the Emirates Drug Establishment decides device status (Federal Decree-Law 38 of 2024). We designed it to inform, never diagnose: every rule shows its source and a clinician decides. We will ask EDE for a written classification before any pilot. Never say "it is not a medical device". |
| How accurate is it? | Observations are deterministic rules from published guidelines, traceable to her entries. The AI is tested on our own development set (60 questions, every refusal and red flag caught, one listed failure), not yet clinically validated. A second, held-out set of 132 questions written by reviewers who never saw the code shows where it still misses (slide 6). We claim no clinical accuracy figure before a pilot. |
| What if she types something your checks miss? | They will miss some: on a fresh held-out round, word checks alone routed 11 of 30 crisis messages and 24 of 32 emergencies. That is why the 998 button is on screen in every chat, whatever she types. With a model key, a second check by a language model can add the crisis or emergency route and never removes one. We will measure it on the same held-out questions before we quote it. |
| Why not just Flo or Clue? | Flo and Clue now sell doctor reports too, so the PDF is not our moat. Ours is the clinic loop (consented sharing, a worklist, follow-ups that close and move DoH's PC008 indicator), rules that show their source, and Arabic. And we never monetise health data. |
| Who pays? | Women's health and IVF clinics (per clinician seat), and primary-care networks for the after-birth module, because Jawda PC008 applies to family-medicine and GP visits. Payers and employers later, for care-gap closure. |
| Can she turn the AI off? | Yes. One switch in Privacy closes the assistant and gives her cards fixed wording; nothing she writes reaches a model. Patterns come from rules, so they stay the same (DoH Responsible AI Standard 3.1.6.1). New records start with AI off unless she ticks it. |
| Do you connect to Malaffi? | Only licensed facilities connect, and DoH policy forbids copying Malaffi data into other systems. We export FHIR R4 into the clinic's EMR, which feeds Malaffi. |
| Data residency? | Synthetic data now. Production will run on UAE-region cloud, including disaster recovery, with a UAE-hosted model or no LLM, per Federal Law No. 2 of 2019 and the DoH AI standard (clause 3.1.4.5.1). |
| How is this different from DoH's Oura work? | Wearables give signals; we turn signals plus logs plus labs into a clinical next step. We can ingest wearable data as context. |
| How are you different from Nabta Health? | Nabta (UAE, USD 3M pre-Series A, Oct 2026) sells AI preventive-health infrastructure to employers, insurers and providers, and runs its own clinics. We don't run clinics: we are the record layer any clinic plugs in, with patterns cited to guidelines, a doctor-ready report and follow-ups that close DoH's PC008 indicator. Nabta is a possible partner as much as a rival (research/2026-11-06/04, S50). |
| Where is the AI? | Rules decide every fact, so nothing is guessed. The model rewords her cards, reads her voice notes and lab photos into fields she checks, writes the pre-visit brief, and double-checks the safety routing; it can add an urgent route, never remove one, and sentences her data doesn't support are dropped. Before stage, check that /status shows the model is on. |
| Does voice send her health data to Google? | Voice is optional. The browser turns speech into text, and Chrome uses Google's speech service to do it; the screen says so. We never receive or keep a recording, only the text she checks before saving. In production: a UAE-hosted speech model, or typing. |
| What happens after birth? | Her first six weeks follow DoH's Postnatal Care Program Standard (May 2025): a call 2–3 days after discharge, visits at 7–14 days and 6 weeks, a mood check at 10–14 days, and the glucose test 4–12 weeks after diabetes in pregnancy. The clinician sees the same steps. Two timing choices (discharge assumed at day 2, the 6-week visit shown until week 8) await our clinician's sign-off (QUESTIONS #61). |
| Will you continue? | Yes: founders' agreement in month 1, validated MVP with a clinic in month 3, licensed company in month 6. |
