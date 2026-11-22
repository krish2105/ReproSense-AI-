// Speaker notes for the 3-slide deck: the words each of us says, as they show in PowerPoint's Presenter View.
// Organisers' format (21 Nov): three slides in 1 to 1.5 minutes, then the live demo, 3 minutes in all.
// Keep this file and docs/27 section 4 saying the same thing. Read it aloud with a timer; cut words, never add.

const SLIDE_1 = `ZEBO · 30 seconds · slide 1, the problem
(Wait a beat. Look at the judges, not the screen.)

"Good afternoon. Imagine a woman in Abu Dhabi with a year of irregular periods and acne, and ten minutes with a gynaecologist to explain it all.

Up to 70 percent of women with PCOS don't know they have it. In a UAE study, endometriosis took eleven and a half years to diagnose. And only one in four mums with diabetes in pregnancy came back for the glucose test after the birth.

Make that one in two, and about 18 more mothers in every thousand births get high blood sugar caught early."

(Turn to Krishna: "Krishna.")

IF ASKED
- 70%: WHO PCOS fact sheet, Jan 2026.
- 11.6 years: 518 women in the UAE, Frontiers in Global Women's Health, 2021.
- 1 in 5 pregnancies with gestational diabetes: 2,546 pregnancies in Al Ain, Frontiers in Endocrinology, 2022.
- 1 in 4 came back: 265 of 1,043 women, one Al Ain hospital, IJERPH, 2022.
- 18 per 1,000 is arithmetic, not our result: 1,000 x 21.3% x (50% - 25.4%) x 34.5% (pooled from 18 studies, Endocrine, 2025). The inputs are on /pilot.
- Not sure? "Good question. We haven't measured that yet." Then hand to Krishna.`;

const SLIDE_2 = `KRISHNA · 30 seconds · slide 2, the solution

"So we built ReproSense: her health record, in Arabic and English. She logs in seconds, by tap, by voice, or with a photo of a lab report.

Rules from published guidelines spot patterns worth raising with a doctor, and show the exact days and the guideline behind each one. It never diagnoses, and anything urgent comes first, with 998.

The AI is checked. On 132 test messages it was never tuned on, it sent all 30 crises to support and all 32 emergencies to 998."

(Turn to Yash.)

IF ASKED
- Who wrote the 132? Written separately from the code, in English and four kinds of Arabic, measured once, never used for tuning. Not clinicians; clinician-written tests are next. Never say "independent reviewers".
- Where is the AI? Her voice and lab photos into the form, answers from a cited library, rewording. Rules make every safety decision; the AI can add an urgent route, never remove one.
- Model down? Red flags are plain rules and run first. Past 10 seconds she gets a fixed, sourced reply.
- 14 of 14 attacks blocked, on every change: /evidence.
- "Why not just Sahatna?" (our mentor says expect it; DoH owns Sahatna): "Sahatna is Abu Dhabi's front door to care for everyone: records, booking, teleconsults. ReproSense is the specialist for women behind that door: it follows her cycle and pregnancy over months, explains each pattern with its guideline, and closes the follow-ups DoH measures. In women's health we go deeper than any app today, Sahatna included; as a company we'd plug into it through Malaffi and FHIR, as its women's-health module."
- "DoH is adding maternity and IVF to Sahatna. Aren't you redundant?": "That's exactly where we fit. Sahatna lists maternity care and IVF as next; we've already built the women's record, the DoH postnatal steps and the PC008 follow-up loop, with safety evidence. We'd like to be that module rather than a second app."`;

const SLIDE_3 = `YASH · 30 seconds · slide 3, the venture

"Who pays? Women never do. Clinics and primary-care networks pay a subscription, because the after-birth glucose test is on DoH's own scorecard, PC008. We'll set the price with our pilot clinic, from what the pilot measures.

Next: a device memo for the Emirates Drug Establishment, a clinic letter of intent, UAE hosting with UAE PASS sign-in, then a pilot at one clinic and a licensed company by May.

Since we were accepted we've merged 57 pull requests, all on our evidence page, and we're forming the company. Let us show you."

=== SWITCH TO THE BROWSER: Noura's Home, English, Light ===

DEMO · Atharva clicks, Krishna talks · 85 seconds (ends by 2:55)

1. Patterns, first card, Why we noticed
"This is Noura. She's fictional, 24, and her cycles keep running past 35 days. These chips are the days she logged, and this is the guideline behind it. No diagnosis. Just something to ask her doctor."

2. Report, Before your visit
"Before her visit: what changed since last time, on two pages her doctor reads in a minute."

3. عربي, Calendar, Try an Arabic example
"She can also just say it, in Gulf Arabic: cramps, missed work, pain seven out of ten. The form fills itself, and nothing saves until she checks it."

4. English, Demo people, Open clinician view, Fatima K., glucose follow-up, Mark booked
"Now the clinic. It only sees women who chose to share. Fatima had diabetes in pregnancy and is nine weeks after the birth, so her glucose test is due. One tap. Booked."

5. Demo people, Open clinic network
"And the network sees these follow-ups close. Counts only, never names. That's what clinics and insurers pay for."

6. Krishna closes
"We're asking for one pilot clinic, a clinical advisor to sign off our rules, and the grant. Thank you."

TIMING
- Behind at step 3? Skip it. Say: "She can log by voice in Arabic too."
- Behind at step 5? Skip it and close.
- Site slow or down? Yash plays ReproSense-demo.mp4 and Krishna talks over it.
- There's no Clinician link inside her app. Go through Demo people.

If a judge asks the price (Yash): "There isn't one yet, on purpose. Women will always use it free; clinics and networks will subscribe, insurers later pay per follow-up closed. We set the number with our first pilot clinic, from what the pilot measures."

If a judge asks "Have you tested this with real women or doctors?" (Yash): "Not yet. Everything you saw runs on fictional data, by design. Our first 90 days are ten interviews, a clinic letter of intent and a consented pilot with up to 20 women at one clinic." Never invent a number.

Q&A: answer in two sentences, then stop. Krishna: AI, safety, data, regulation. Yash: money, market, pilot. Zebo: the science (PMOS, gestational diabetes, mood after birth). Atharva: the build and the app.`;

module.exports = { SLIDE_1, SLIDE_2, SLIDE_3 };
