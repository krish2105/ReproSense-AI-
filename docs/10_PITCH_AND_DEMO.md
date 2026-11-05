# 10 · Pitch and demo

## 3-minute demo script
| Time | Screen | Say |
| --- | --- | --- |
| 0:00 | Landing | "Up to 70% of women with PCOS don't know they have it. In the UAE, women with endometriosis waited eleven years on average for a diagnosis. And at one Al Ain hospital, only one in four women who had diabetes in pregnancy came back for the glucose test after birth. The story exists. It just arrives in pieces." (WHO 2026; Mousa 2021; Agarwal 2022: research/2026-11-06/02 §2, keep the qualifiers ready) |
| 0:20 | /demo → Noura | "Noura, 24, Al Ain. Fictional, like all our data." |
| 0:30 | Dashboard + Timeline | "Twelve months in one view: cycles from 36 to 62 days, acne and hair-growth days." |
| 0:50 | Insights | "ReproSense doesn't diagnose. It shows the pattern, the exact entries behind it, and the 2023 international guideline that defines it." |
| 1:10 | Assistant (Arabic) | Ask "What is PCOS?" → answer with citations. |
| 1:30 | Report → PDF | "Ten seconds: a two-page report her gynaecologist can read in a minute." |
| 1:50 | Clinician view | "The doctor sees the same story, with consent, and a visit-note draft she edits." |
| 2:10 | Admin dashboard | "In our synthetic 1,200-woman cohort: 248 follow-ups, 101 closed. Closing Fatima's glucose test adds one, live, and moves the glucose part of DoH's own after-birth quality indicator, Jawda PC008, from 3 of 10 to 4 of 10. The fairness check shows sharing rates by group." |
| 2:30 | Business slide | "Women use it free; clinics pay per clinician seat, AED 399 a month. It will run on UAE infrastructure, as DoH's AI standard requires, with controls mapped to ADHICS and the formal assessment by month 6. Our ask: one three-month pilot, judged on how many women complete the follow-ups they are due." |

## 10-slide deck
1. Hook + one number · 2. Problem in Abu Dhabi · 3. Why it happens (fragmented, short visits) · 4. ReproSense (one picture)
5. Live demo · 6. How the AI works (rules decide, RAG grounds, LLM explains) · 7. DoH Responsible AI Standard, clause by clause (the /trust page)
8. Business model + interviews · 9. Milestones (grant schedule) · 10. Team + ask (pilot clinic, clinical advisor) + AI disclosure + prior-work disclosure (docs/15)
Every slide that shows a number carries its source line. The deck itself: `pitch/deck.html`.

## Judge Q&A
| Question | Answer |
| --- | --- |
| Is this a medical device? | Classification is the regulator's decision: the Emirates Drug Establishment decides device status (Federal Decree-Law 38 of 2024). We designed it to inform, never diagnose: every rule shows its source and a clinician decides. We will ask EDE for a written classification before any pilot. Never say "it is not a medical device". |
| How accurate is it? | Observations are deterministic rules from published guidelines, traceable to her entries. The AI is verified against a fixed test set (60 questions, every refusal and red flag caught, one listed failure), not yet clinically validated. We claim no accuracy figure before a pilot. |
| Why not just Flo or Clue? | Flo and Clue now sell doctor reports too, so the PDF is not our moat. Ours is the clinic loop (consented sharing, a worklist, follow-ups that close and move DoH's PC008 indicator), rules that show their source, and Arabic. And we never monetise health data. |
| Who pays? | Women's health and IVF clinics (per clinician seat), and primary-care networks for the after-birth module, because Jawda PC008 applies to family-medicine and GP visits. Payers and employers later, for care-gap closure. |
| Can she turn the AI off? | Yes. One switch in Privacy closes the assistant and gives her cards fixed wording; nothing she writes reaches a model. Patterns come from rules, so they stay the same (DoH Responsible AI Standard 3.1.6.1). New records start with AI off unless she ticks it. |
| Do you connect to Malaffi? | Only licensed facilities connect, and DoH policy forbids copying Malaffi data into other systems. We export FHIR R4 into the clinic's EMR, which feeds Malaffi. |
| Data residency? | Synthetic data now. Production will run on UAE-region cloud, including disaster recovery, with a UAE-hosted model or no LLM, per Federal Law No. 2 of 2019 and the DoH AI standard (clause 3.1.4.5.1). |
| How is this different from DoH's Oura work? | Wearables give signals; we turn signals plus logs plus labs into a clinical next step. We can ingest wearable data as context. |
| Will you continue? | Yes: founders' agreement in month 1, validated MVP with a clinic in month 3, licensed company in month 6. |
