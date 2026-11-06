# #26 Outreach messages (draft, 6 Nov 2026)

Copy, fill the `[brackets]`, send from your own account. One person per message: no group sends, no mass mail.
Already in the repo, not repeated here: Krishna's advisor message (docs/15 "Recruit a clinical advisor"), the interview
questions (docs/12 "Interview script"), the letter-of-intent template (docs/15).

**Before you send anything:** say it is a hackathon project, say the data is fictional, never promise a diagnosis
feature, and never ask anyone for their own health information.

## 1. Clinical advisor (from Atharva)
**Who:** OB-GYNs, OB-GYN residents, midwives, GPs, nurses, senior health-science students. 5–10 messages to get one yes.

> Hi Dr [name], I'm [your name], [your role]. My team is building ReproSense for the Department of Health's HealthX
> Ajyal hackathon (showcase 22 Nov, Masdar City). It keeps a woman's cycle, pregnancy and after-birth entries in one
> record, shows patterns worth discussing with a doctor (never a diagnosis), and gives her doctor a 2-page summary.
>
> Every pattern comes from a written rule with its guideline source. We need a clinician to check those rules. Could
> you give us 20 minutes this week? If you like the work, we would be glad to name you as our clinical advisor.
> There is no cost, and you can say no at any point. All our data is fictional.
>
> Thank you, [name] · [phone or email]

**Short version (WhatsApp / LinkedIn):**
> Hi Dr [name], I'm [name], on a team in the DoH HealthX Ajyal hackathon. Could you spare 20 minutes to review the
> clinical rules behind our women's health record tool? It flags patterns worth discussing, never diagnoses. Fictional
> data only. Happy to send a 1-page summary first.

**If they say yes, what the 20 minutes covers** (decisions waiting: QUESTIONS #48, #49, #52, #53, #56):
1. Read `rules/clinical_rules.yaml` rule by rule (each has its source); note any rule that should change.
2. Read 3 doctor PDFs (Noura, Hessa, Fatima), 60 seconds each: "Could you use this in a visit?"
3. If happy: sign the header of `rules/clinical_rules.yaml`, and agree to be named on the team slide.

## 2. Clinician interview (5 needed)
> Hi Dr [name], I'm [name], on a student team in the DoH HealthX Ajyal hackathon. We're building a tool that helps
> women bring a clear cycle and symptom history to their appointment, as a 2-page summary. Could I ask you 8 short
> questions (15 minutes, by phone or in person) about how patients bring their history today? No preparation needed,
> and we won't quote you by name without asking.

Use the questions in docs/12. Add these two:
- "Here is a 2-page report from a fictional patient. What would you read first? What is missing?"
- "Would you share a 'patterns worth discussing' summary with a patient, or would it worry them?"

## 3. Clinic manager interview (3 needed): the price test
> Hi [name], I'm [name], on a student team in the DoH HealthX Ajyal hackathon. We're building software that helps
> women's health clinics track recommended follow-ups (for example the glucose test after gestational diabetes, which
> DoH's Jawda PC008 measure counts). Could I ask you 15 minutes of questions about how your clinic handles follow-ups
> and buys software?

Questions (in this order; never name our price first):
1. How do you track follow-ups a patient is due for today? Who does it?
2. Which follow-ups are missed most often?
3. Who decides to buy clinical software here, and how long does that take?
4. What do you pay today per clinician for software of this kind?
5. *Only now:* "We are testing AED 399 per clinician a month. Too high, fair, or low?" Write down the exact words.
6. "Would you consider a 3-month pilot, if DoH and data-protection requirements are met?" If yes, ask about the letter
   of intent (template in docs/15). It is non-binding and has no cost.

## 4. Usability volunteers (5 needed: Emirati and expatriate women, 18–45)
Send through people you know; never to strangers' private numbers. Translate into Arabic with the native reviewer
before using it in Arabic.

> Hi [name], I'm helping test a women's health app for a DoH hackathon. Could you try it for 20 minutes, on your own
> phone or mine? You'd use made-up details only, and we won't ask about your own health. You don't need to be married
> or have children. We're checking where the app is unclear, not testing you, and you can stop at any time. A woman
> from our team can run it if you prefer. [In person at ___ / video call, camera off is fine]. Thank you!

## 5. Follow-up (after 3 working days with no answer, once only)
> Hi [name], a quick follow-up on my message about the HealthX Ajyal hackathon. If now is busy, no problem at all.
> Thank you either way.

## Notes rules (what goes in the repo)
- Notes go in `docs/interviews/` as `C1.md`, `M1.md`, `U1.md` (clinician, manager, usability): role, setting
  ("OB-GYN, private clinic, Abu Dhabi"), date, answers. **No names, phone numbers, emails or clinic names** unless the
  person agreed in writing to be named.
- Quotes on slides only with the person's permission, worded as they said it.
- A signed letter of intent is kept outside the repo; the repo notes only "LOI received from a women's health clinic
  in [area], [date]" until the clinic agrees to be named.
- Then fill `EVIDENCE` (and `TEAM` once the advisor agrees) in `pitch/build_deck.py` with true facts only and rebuild
  the deck (docs/drafts/README).

## Tracker (fill as you go)
| Who (role, no names) | Type | Sent | Reply | Done | Next step |
| --- | --- | --- | --- | --- | --- |
| | Advisor | | | | |
| | Clinician | | | | |
| | Manager | | | | |
| | Usability | | | | |
