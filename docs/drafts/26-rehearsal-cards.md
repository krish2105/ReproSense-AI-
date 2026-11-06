# #26 Rehearsal cards and Q&A drill (draft, 6 Nov 2026)

Five timed rehearsals before 22 Nov, a backup video, and a Q&A drill. The script itself is docs/10 (3-minute demo
table); these cards are what you hold. Print one card per page.

## Before every rehearsal (5 minutes)
- [ ] Demo people → **Reset demo data** (the closed follow-up count must start at the seeded number).
- [ ] Open the API `/readyz` 10 minutes before (a sleeping free instance takes about a minute to wake).
- [ ] Check the admin numbers on screen match what you will say (docs/10 row 2:10 changes after every reset).
- [ ] Phone on a hotspot as a second network. Browser zoom 100%, notifications off, one tab per screen.
- [ ] Backup video open in a second window, paused at 0:00.

## Card 1 · 0:00–0:30 · Landing → /demo
**Say:** the three numbers (PCOS 70% unaware · endometriosis 11 years · 1 in 4 back for the glucose test), each with
its qualifier ready. "The story exists. It just arrives in pieces."
**Click:** Demo people → Noura. **Say:** "Noura, 24, Al Ain. Fictional, like all our data."

## Card 2 · 0:30–1:10 · Noura: Home, Timeline, Patterns
**Say:** "Seven cycles from 42 to 56 days, every one past the usual 35."
**Click:** Patterns → open the evidence. **Say:** "It doesn't diagnose. It shows the pattern, the entries behind it,
and the guideline that defines it."
**Never say:** "she has PCOS", any percentage risk.

## Card 3 · 1:10–1:50 · Assistant (Arabic) → Report
**Click:** switch to Arabic, ask the suggested PCOS question. Point at the numbered source.
**Click:** Report → Prepare → PDF. **Say:** "Ten seconds: two pages her gynaecologist reads in a minute."

## Card 4 · 1:50–2:30 · Clinician → Admin
**Click:** switch to clinician, open the same patient. **Say:** "Same story, with her consent."
**Click:** Fatima → close the glucose follow-up → Admin. **Say:** the closed count moving and Jawda PC008 from 3 of 10
to 4 of 10 (check the screen first).

## Card 5 · 2:30–3:00 · Business and ask
**Say:** "Women use it free. Clinics pay per clinician seat, AED 399 a month, a price we are testing in interviews.
Production runs on UAE infrastructure. Our ask: one three-month pilot, judged on follow-ups completed."
**End on time.** If over 3:00, cut card 2's evidence click, never the clinic close.

## If something breaks
| Problem | Do |
| --- | --- |
| Page won't load | Say "Let me show you the recording", switch to the backup video at the same step |
| PDF is slow | Show the report preview on screen; the PDF is the same content |
| Assistant gives an odd answer | "Every answer cites its source; this one shows why we keep a human in the loop." Move on |
| Numbers differ from the card | Say what the screen shows, never the card |

## Rehearsal log (5 runs)
| # | Date | Time (target ≤ 3:00) | Broke / slow | Fixed by |
| --- | --- | --- | --- | --- |
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |
| 5 | | | | |

## Backup video
2 minutes, full demo path, recorded after a reset on the live URL, no sound or a calm voice-over. Copies on two
laptops and a USB stick (docs/08 rule 10).

## Q&A drill
One person asks, the other answers in **20 seconds**, then swap. The full answers are in docs/10 "Judge Q&A"; below
are the key points to hit, plus harder questions docs/10 does not cover yet.

| Question | Must say | Never say |
| --- | --- | --- |
| Is this a medical device? | The Emirates Drug Establishment decides; we will ask in writing before any pilot; it informs, a clinician decides | "It is not a medical device" |
| How accurate is it? | Rules from published guidelines; held-out test shows where it still misses; no clinical accuracy claim before a pilot | Any accuracy % for diagnosis |
| What if your checks miss a crisis? | 11 of 30 on a fresh held-out round; that's why 998 is on screen in every chat | "It catches everything" |
| Why not Flo or Clue? | They sell doctor reports too; our moat is the clinic loop, sourced rules, Arabic, never monetising data | |
| Data residency? | Synthetic now; production in a UAE region (AWS or Azure UAE); no current host has a UAE region, so we move before real data | "It's already in the UAE" |
| *Who on your team is a clinician?* | The truth: our advisor's name and role if signed; if not, "we are recruiting one, and the rules are open for review" | A name who hasn't agreed |
| *You built this before selection?* | Yes, and we disclosed it at the start (docs/15); build week adds the listed features | Anything that hides the dates |
| *Has anyone paid or committed?* | The real interview and LOI count; if none, "not yet; our month-1 milestone is one LOI" | Invented numbers |
| *Delete vs. 25-year retention?* | An open question we will settle with DoH: delete removes it from her app, the archive is held as the law asks | "We delete everything" as settled |
| *Why would a clinic pay AED 399?* | The interview answers in their words; it is a hypothesis we are testing | "Clinics told us it's cheap" unless true |
