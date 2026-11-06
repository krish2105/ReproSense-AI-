# #26 Usability session script (draft, 6 Nov 2026)

**Goal:** 5 sessions with women (Emirati and expatriate, 18–45). Time how long it takes to start a record and see
something useful, and find the first three things that confuse people. Fix those before 16 Nov (only fixes are allowed
before selection, QUESTIONS #51).

**Time:** 20 minutes. **People:** one facilitator, one note-taker if possible. **If the facilitator is male, a female
team member co-facilitates or runs the session; offer this when recruiting.** **Device:** her phone (preferred) or a
test phone, on the live URL (or the local build until #22 is deployed). Reset the demo data before each session.
**Accessibility:** she uses her normal text size and any screen reader she already uses. Aim for at least one
volunteer who uses large text and at least one who prefers Arabic.

## Safety and privacy rules (read before every session)
- **She plays a practice persona (card below), never herself.** No real health information, name or phone number.
- **Not medical advice.** If she asks about her own health, say: "I can't advise on that. Your doctor is the right
  person." Do not interpret anything she says about herself.
- **If she becomes upset or says she is in danger:** stop the session, stay with her and ask what she needs. Don't ask
  for details. In an emergency, call 998 together.
- She can stop at any time without a reason. No recording unless she agrees; screen recording only, never her face.
  On video calls, camera off is fine.
- On her own phone: turn on Do Not Disturb first, so no notification or photo appears. At the end, delete the practice
  record together (Privacy → delete).
- Notes use a code (U1–U5), age range and background only ("25–34, Emirati"). No names, and no session date in the
  saved notes: a small circle of friends plus a date can identify someone.

## Practice persona card (print one per session)
> **Reem**, 27, lives in Abu Dhabi. Her last period started on **[date about 3 weeks before the session]**. She is not
> pregnant. Her clinic, Seaside Women's Clinic (fictional), gave her a link to start a record.
> Questions a friend might ask the assistant: "Is a 35-day cycle normal?" · "What is PCOS?" · "Is period pain normal?"

## Opening (2 minutes)
**Ask first:** "Would you like to do this in Arabic or English?" Then read the opening in her language. (The Arabic
opening is translated by the native reviewer before the first Arabic session, #23.)
> "Thank you for helping. We're testing the app, not you. I'm timing the app, not you. If something is confusing,
> that's the app's fault and exactly what we need to find. Please think out loud: say what you expect, what you're
> looking for, what surprised you. You'll play Reem, from this card, so we never use your own details. Some screens
> mention pregnancy and low mood after birth; skip anything you'd rather not see. You can stop at any time."

## Tasks (keep the timer out of her sight; don't help unless she's stuck for 60 seconds)
| # | Say | She is done when | Record |
| --- | --- | --- | --- |
| 1 | "Reem's clinic gave her this link. Start a practice record for her." Open `/join?clinic=clinic_corniche` (the clinic QR link) | Record created | Time; any question she asks |
| 2 | "Reem's last period started on the date on the card. Tell the app." | Entry saved | Time; does she find the calendar? |
| 3 | "Find something the app noticed or suggests for Reem." | She points at a card or says what it means | **Time from task 1 = time to first value** |
| 4 | "Who can see Reem's entries right now? How would she stop that?" | Finds Privacy and the sharing switch | Correct or not |
| 5 | Open `/demo`, pick Noura. "Why does the app show this pattern for her?" | Opens the evidence (the dated entries) | Does she trust it? Her words |
| 6 | "Ask the assistant a question a friend might ask, for example one from the card." | Reads an answer with its source | Did she notice the source? |
| 7 | "Get a report Reem could take to her doctor." | Report open or PDF downloaded | Time |
| 8 | "Turn off the AI features for Reem." | Switch off in Privacy | Correct or not |

## After the tasks (3 minutes)
1. "On a scale of 1 to 7, how easy was it overall?" (1 = very hard, 7 = very easy)
2. "What was the most confusing moment?"
3. "Would someone like Reem share a report like this with her doctor? Why or why not?"
4. "Is there anything that would stop a woman you know from using an app like this?" (privacy, family, language)
5. Arabic sessions only: "Did any word sound strange or wrong?" Note the exact word for the native reviewer (#23).

Then delete the practice record together, and thank her.

## Note sheet (one per session, saved as `docs/interviews/U[n].md`)
```
Code: U_  · Age range: __  · Background: ___  · Language: AR / EN  · Device: own / test  · Text size / screen reader: ___
Task times: 1 ___ 2 ___ 3 ___ (time to first value: ___) 4 ✓/✗ 5 ___ 6 ___ 7 ___ 8 ✓/✗
Stuck points (task, what she said, how long):
-
Ease 1–7: __
Most confusing:
Would share with doctor? Why:
Barriers:
Words that sounded wrong (Arabic):
```

## After 5 sessions
- List every stuck point; rank by how many people hit it. The top three become issues, labelled `usability`.
- Report the median time to first value and the median ease score in BUILD_STATUS.md (Real MVP line "sign up, consent,
  log, see value in < 3 min").
- Send Arabic word problems to the native reviewer (docs/AR_REVIEW.md).
