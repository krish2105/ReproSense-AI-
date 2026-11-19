# 27 · Showcase pack: what ReproSense is, the 3-minute script, the demo, and the judges' questions

For Sunday 22 Nov 2026, DOH Incubator, Masdar City. Format: **3-minute pitch (with the live demo inside it), then 3
minutes of questions.** Jury from PureHealth, NYU Abu Dhabi and the Department of Health. Submission (3-slide deck +
MP4) at programs.upstartbar.com by **15:15**: both files are in `pitch/` (Yash, #135).

Live: https://reprosense.vercel.app · Every person and number in the demo is fictional.

---

## 1. What ReproSense does, in one breath
ReproSense is a private, bilingual (Arabic and English) health record for women in Abu Dhabi. She logs her cycle,
symptoms, blood pressure and lab results in seconds, by tap, voice or a photo of the report. Written rules taken from
published guidelines turn months of entries into **patterns worth discussing with a doctor**. Each pattern shows the
exact entries behind it and its source, and it **never gives a diagnosis or a risk percentage**. Urgent signs always
come first, with a one-tap call to **998**. With her consent, her clinic gets a two-page doctor report and a
"since your last visit" brief, and the follow-ups DoH measures clinics on (Jawda PC008: the glucose test after
gestational diabetes) are tracked until they close.

**The outcome**
- **For her:** she walks into the appointment with her story in order, in her language, and knows when something can't
  wait.
- **For the doctor:** a one-minute read instead of a 15-minute history, with the evidence attached.
- **For the clinic and payer:** fewer missed follow-ups, measured on DoH's own indicator. That is who pays.

## 2. The four hackathon themes, and what we cover
The organisers set four themes: **longevity, women's health, fertility and Alzheimer's**. We were assigned **Women's
Health**: *"How might we use AI to improve women's health and maternal, newborn and early-childhood outcomes?"*

| Theme | Covered? | Where in the product |
| --- | --- | --- |
| **Women's health** (ours) | **Yes, core** | Periods: irregular cycles and androgen signs (PCOS guideline 2023), severe cyclical pain (endometriosis), heavy bleeding (PBAC score), iron. Red flags first with 998. Five life stages. |
| ↳ maternal | **Yes** | Pregnancy: glucose screening window (24–28 weeks); pregnancy warning signs; **blood-pressure log with the NICE NG133 warning** (pregnancy and 12 weeks after birth). After birth: **the DoH Postnatal Care Program steps** (teleconsult, 2-week and 6-week visits, mood check with the EPDS questionnaire, glucose test after gestational diabetes). |
| ↳ newborn and early childhood | **Yes** | **The baby's first year** (Fatima → Home): newborn screening, well-baby visits and vaccinations from DoH Abu Dhabi's immunization circular and newborn screening standard, each with its source and "I had this". The feeding log (D2) is next. |
| **Fertility** (neighbouring theme) | **Yes, a slice** | "Trying to conceive" life stage: when to ask for a fertility assessment (Mariam's story); the planning-a-pregnancy checklist (Mariam → Home). |
| **Longevity** | **A slice** | Perimenopause (Layla: hot flushes, night sweats, changing cycles) and iron levels; the record follows her across life stages. |
| **Alzheimer's** | **No** | Not our theme. Don't claim it. |

**Five life stages, eight fictional women:**
- Noura, 24: irregular cycles and skin and hair changes.
- Priya, 31: severe period pain.
- Sara, 35: very heavy periods and dizziness, the red-flag demo.
- Amina, 27: the calm case.
- Mariam, 36: trying to conceive.
- Hessa, 29: 24 weeks pregnant.
- Fatima, 33: 9 weeks after birth, after gestational diabetes.
- Layla, 47: perimenopause.

## 3. The team: who built what (build week, 17–21 Nov)
| Member | Owns | Built this week (merged PRs) |
| --- | --- | --- |
| **Krishna Mathur** | AI, backend, clinical safety | Postnatal pathway, Arabic/English voice logging, pre-visit brief, clinic onboarding API, passkey sign-in, blood-pressure log and warning, model safety scoring, lab-photo reader, OpenRouter AI provider, iOS app |
| **Atharva Soundankar** | Web, 3D, design | 3D body pain map, "Show me in 3 minutes" judge tour, clinic-admin screens, her year in 3D, read aloud in Arabic and English, installable app, 3D pregnancy ring, polish |
| **Yash Petkar** | Product, demo, submission | Pilot value page for clinics and insurers, the 3-slide deck and MP4, showcase checklist and rehearsals, live testing on phones; family support view, planning-a-pregnancy checklist and API hardening (in review) |
| **Dareen** | Mother and baby, Arabic | Native Arabic voice of the product; owns the mother–baby roadmap (baby's first-year schedule, feeding log) |

---

## 4. The 3-minute script (four voices)

**Numbers to know by heart (all on /status and /evidence):**
- **Safety, held-out (132 reviewer questions, never tuned on), with the AI second check:** crisis **30/30**,
  emergencies **32/32**, everyday questions answered normally 42/50 (no new false alarms). Word checks alone: 11/30 and
  24/32.
- **Security:** an attack suite of 14 attacks, all blocked, runs on every change.
- **Tests:** 800+ backend tests and about 250 browser tests on every pull request.
- **The loop on demo data:** a median of 8 days from a follow-up opening to it being booked, and 66% of postnatal steps
  done inside their DoH window.

Read it out loud three times with a timer. Speak to the judges, not the screen. Short sentences; pause after numbers.
**Bold** = stress. *[Brackets]* = what Atharva clicks.

### 0:00–0:35 · Yash: the problem
> "Good afternoon. Think of a woman in Abu Dhabi with irregular periods, acne and hair growth. She's been noticing it
> for a year: some in her phone notes, some in a lab report, some she just remembers.
> When she finally sees a gynaecologist, she has **ten minutes** to tell a year-long story.
>
> This is common. Up to **70 percent** of women with PCOS don't know they have it. In a UAE study, endometriosis took
> **eleven and a half years** to diagnose. And in Al Ain, one pregnancy in five has gestational diabetes, but only
> **one in four** of those mothers came back for the glucose test after the birth.
>
> The information exists. It just arrives in pieces."

### 0:35–1:05 · Krishna: what we built
> "We built ReproSense: her health record, in Arabic and English, that turns those pieces into a next step.
>
> She logs in seconds: a tap, her voice, or a photo of a lab report. Written rules from published guidelines find
> **patterns worth discussing with a doctor**. Every pattern shows the exact entries behind it and its source.
>
> It **never diagnoses** and never gives a fake percentage. Urgent signs always come first, with a call to 998.
>
> The AI is checked, not trusted: rules decide, sources ground every answer, and the model only rewords.
>
> And it is safe. On 132 questions written by independent reviewers, and never used to tune it, our safety layer sent
> **all 30 crisis messages** to support and **all 32 emergencies** to 998 first, with no new false alarms. Let me show
> you."

### 1:05–2:20 · Atharva drives, Krishna narrates: the live demo
*[Demo people → **Open Noura's record**]*
> "This is Noura, a fictional 24-year-old. Her whole cycle on one ring, built only from her own entries."

*[**Patterns** tab → open the "irregular cycles with skin and hair changes" card → **Why we noticed**]*
> "A pattern worth discussing. These chips are the exact days she logged, and this is the 2023 international PCOS
> guideline it comes from. No diagnosis, just what to ask her doctor."

*[**Report** → scroll to "Before your visit"]*
> "Before her appointment: what changed since her last visit, and a two-page report her doctor reads in a minute."

*[Header **Clinician** (one tap) → **Fatima** → glucose follow-up → **Mark booked**]*
> "Now the clinic's side: a separate role, and it only shows women who chose to share. Fatima had gestational diabetes
> and is nine weeks after the birth, so her glucose test is due. That is DoH's PC008 indicator.
> One tap: booked."

*[Header **Clinic network**]*
> "And the network sees those follow-ups close, counts only, never names. This is what a clinic or an insurer pays
> for."

### 2:20–2:50 · Dareen: the Arabic moment and the mother
*[Atharva: **عربي** → back to Noura → **Calendar** → **Say it instead** (or **Try an Arabic example** if the mic is
slow)]*
> "And she can tell it in her own words."
> *(In Arabic, to the laptop:)* «عندي مغص وما رحت الدوام اليوم، الألم سبعة من عشرة»
> "I just said: I have cramps, I missed work, pain seven out of ten. The form filled itself. Nothing is saved until
> she checks it.
>
> For a mother, the same record carries her through pregnancy and the first weeks after birth, with the DoH postnatal
> steps, blood pressure warnings and the mood check. And now her baby's first year too: the DoH checks and
> vaccinations, each with its source."

### 2:50–3:00 · Krishna: the ask
> "We're asking for one pilot clinic, a clinical advisor to sign our rules, and the HealthX Ajyal grant to become a
> licensed company in six months. Thank you."

**Timing guards:**
- If you're behind at 2:20, Dareen uses **Try an Arabic example** instead of speaking.
- If the API is slow, Yash switches to the MP4 (`pitch/ReproSense-demo.mp4`) and Krishna narrates over it.

---

## 5. Demo pre-flight (Sunday morning; Yash runs it, Y6 checklist)
1. **09:30:** open https://reprosense.vercel.app on the demo laptop. The free API sleeps; the first load wakes it in
   about 30–60 s.
2. **Before 15:15 (submission):** `pitch/ReproSense-submission.pdf` and `pitch/ReproSense-demo.mp4` are uploaded.
3. **10 min before:**
   - Demo people → **Reset demo data**, so every number is the seeded one.
   - Then open Noura once, and then the clinician view once.
4. **2 min before:** reload the landing page (keeps the API awake). Chrome, 100% zoom, light theme, sound off.
   - **Microphone:** allowed for reprosense.vercel.app if Dareen speaks.
   - **Wi-Fi:** venue Wi-Fi or a phone hotspot as backup.
5. **Backups:**
   - The MP4 is on the desktop and on a USB stick.
   - The iPhone app is installed on Krishna's phone (works on its own until 25 Nov), as a 10-second "and it's on her
     phone too" if time allows.
6. **Never show:** the admin reset button during the pitch, or any real person's data.

## 6. Today's validation sprint (do it before Sunday; 30% of the score is venture potential)
Goal: **5 women and 1 clinician**, 10 minutes each, in person or by phone. Ask permission to quote **without names**.
Write answers in `docs/VALIDATION_NOTES.md` (no names, no phone numbers).

**Women (18–45, Abu Dhabi):**
1. "When did you last see a gynaecologist? How did you explain what was going on?"
2. "Do you track your period or symptoms anywhere? What's annoying about it?"
3. *(Show Noura's pattern card.)* "Would this help you at your next appointment? What would you change?"
4. "Would you rather type, tap or speak? Arabic or English?"
5. "Would you share it with your clinic? What would make you trust it?"

**Clinician (gynaecologist, family doctor, midwife or nurse):**
1. "How long does a cycle or symptom history take in a visit?"
2. *(Show the 2-page report and the 'Before your visit' brief.)* "Would you read this before a visit? What's missing?"
3. "Which follow-ups get missed most after birth?"
4. "Would your clinic try this with 20 women for 3 months? Who decides?"

**How to use it on Sunday:** one line in the pitch close or a Q&A answer. For example: "We spoke to five women this
week; four said they'd use it before an appointment, and one gynaecologist said the report would save her about ten
minutes." **Only say what actually happened.** If you didn't manage it, use the honest answer in Q4 below.

---

## 7. Where it is missing, and the line to use
| Gap | What a judge sees | What to say |
| --- | --- | --- |
| **No real users or clinic yet** | Venture (30) and impact | Section 6 today. Otherwise Q4. |
| **Newborn**: the baby's schedule is live, the feeding log isn't | Theme fit | "Her baby's first year is in the record now; feeding support is next, led by Dareen." |
| **Clinical sign-off** is pending (rules reviewed by AI agents and us, not yet by a licensed clinician) | Safety | "Every rule cites its guideline and is logged for sign-off; a clinical advisor is our first ask." |
| **Diagnosis and medicine questions**: on the held-out set, 6 of 10 diagnosis requests and 4 of 10 medicine questions got the exact refusal; the rest got a sourced answer, never a diagnosis or a dose | Safety | "Crisis and emergencies are 30 of 30 and 32 of 32. The rest still never get a diagnosis or a dose; tightening those refusals is next, and we publish every miss on /status." |
| **Free hosting** sleeps, and the data is in Frankfurt for the demo | Tech and regulation | "Demo data is synthetic. Production runs on UAE-hosted infrastructure, as the Health Data Law requires; the code is ready to move." |

## 8. How likely we are to win (honest)
- **Score today:** about **79/100** on the official rubric (rescored 19 Nov evening, AI live, safety 30/30 and 32/32).
  Strong on prototype, safety and evidence; weakest on validation.
- **With 5 interviews plus a doctor, a letter of intent, and a clean 3-minute run:** about **85**. That's a **top-3
  contender**.
- **Winning first place** depends on the other teams, which we can't see. What separates us:
  - It's a working product with safety evidence, not a slide.
  - It ties directly to a DoH indicator (PC008) and DoH's Postnatal Care Program Standard.
  - It's Arabic-first.
- **The biggest risks are on the day:** a slow free server (use the MP4), an over-long demo (rehearse to 2:55), and a
  validation question with no answer (do section 6).

---

## 9. The judges' questions, with answers
Answer in **two or three sentences**, then stop. The owner answers first; others add one line at most.

### Clinical safety (DoH, clinicians)
**Q1. Isn't this diagnosing? What if it's wrong?** *(Krishna)*
> It never names a condition or gives a probability. It says "a pattern worth discussing with a doctor", shows the
> entries behind it, and cites the guideline. The doctor diagnoses; we make the conversation faster and better
> informed.

**Q2. Who checked your clinical rules?** *(Krishna)*
> Every rule comes from a published guideline (the 2023 PCOS guideline, NICE, ADA, the DoH postnatal standard). Each
> one is logged with its source for clinician sign-off. That sign-off hasn't happened yet, and getting a clinical
> advisor to sign the rules is our first ask today.

**Q3. What happens in an emergency, say heavy bleeding with fainting, or high blood pressure in pregnancy?**
*(Krishna)*
> Red flags run before anything else. She sees "call 998 or go to the emergency department" first, with a one-tap
> call. Blood pressure of 160/110 or above in pregnancy or the 12 weeks after birth triggers it, following NICE NG133.

**Q4. Have you tested this with real women or doctors?** *(Yash)*
> *If you did section 6:* say exactly what they said.
> *If not:* "Not yet with a clinic; everything you've seen runs on fictional data, by design. Our first 90 days are
> ten interviews, a clinic letter of intent and a consented pilot with 20 women at one clinic, measured on one number:
> how many complete the glucose test after gestational diabetes."

**Q5. Mental health: what if she writes something worrying?** *(Dareen)*
> If her words suggest crisis, the app shows support and 998, never a score. After birth, the mood check uses the
> EPDS questionnaire, and its self-harm question goes straight to support, with 998 and DoH's 24/7 line 800-SAKINA.
> On held-out messages written by independent reviewers, our safety layer caught all 30 crisis messages.

### AI (NYU Abu Dhabi)
**Q6. Where is the AI, if rules decide everything?** *(Krishna)*
> AI does the language work: reading her Arabic or English sentence into the form, reading a photographed lab report,
> answering questions from our cited library, and rewording the brief. A verifier drops any sentence her data
> doesn't support. The decisions that matter for safety stay in transparent rules, which is what DoH's Responsible
> AI Standard asks for.

**Q7. How do you stop hallucinations?** *(Krishna)*
> Retrieval from a curated library with citations, a check that every sentence is supported, and a fixed template
> fallback. On our 60-question test set every answer was grounded, every diagnosis request was refused, and every red
> flag was caught. On 132 held-out questions written by independent reviewers, the safety layer with the AI second
> check routed 30 of 30 crisis messages and 32 of 32 emergencies correctly, and we publish every miss on /status.

**Q8. Which model, and where does the data go?** *(Krishna)*
> The code is provider-agnostic. For the hackathon it calls a commercial model on synthetic data only; in production
> it would be a UAE-hosted model. Names are removed before any text reaches a model, and with AI off nothing is sent.

**Q9. Why not just use ChatGPT?** *(Krishna)*
> A chatbot answers a question; it doesn't keep her record, show its evidence or know when something is urgent. Ours
> is grounded in her own entries and a cited library, refuses to diagnose, and connects to her clinic's follow-ups.

### Data, privacy and regulation (DoH)
**Q10. Health data law: where is the data stored?** *(Krishna)*
> The demo uses synthetic data only. In production all health data stays in the UAE, as Federal Law No. 2 of 2019
> (the Health Data Law) requires, with encryption and row-level security. Every access is in a tamper-evident log she
> can read herself.

**Q11. Who can see her data?** *(Dareen)*
> Only her, unless she chooses to share with her clinic, and she can revoke that, export everything, or delete it.
> Clinicians see only women who shared with their clinic; the network sees counts, never names.

**Q12. Is this a medical device? What approvals do you need?** *(Krishna)*
> Because it doesn't diagnose, it's designed to sit below the software-as-a-medical-device line. Our November step is
> a classification memo for the Emirates Drug Establishment, plus a DoH licence for the company and an ADHICS
> (cybersecurity) gap assessment.

**Q13. Does it connect to Malaffi?** *(Krishna)*
> Not yet. The record already exports in the FHIR standard, which is what health information exchanges use, so
> connecting to Malaffi through the proper DoH and M42 route is a roadmap step after the pilot.

### Business (PureHealth, investors)
**Q14. Who pays?** *(Yash)*
> Women use it free. Clinics pay per clinician seat; we're testing AED 399 a month. Primary-care networks pay for the
> after-birth module because it closes a measured indicator, PC008. Insurers and employers come later.

**Q15. How is this different from Flo, Clue or Nabta?** *(Yash)*
> Trackers log and predict periods; Nabta sells consultations and services. We are the clinical record and rules
> underneath care: cited patterns, a doctor-ready report, and follow-ups a clinic is measured on, Arabic-first. A
> Nabta-style service could plug into us.

**Q16. Why would PureHealth or SEHA use this instead of building it into Pura?** *(Krishna)*
> We'd rather be inside Pura than compete with it: a women's-health module with its own rules and safety evidence,
> connected to SEHA clinics. We bring the clinical logic, the Arabic and the validation; they bring the reach.

**Q17. What is the market?** *(Yash)*
> Start narrow: women's health and IVF clinics and primary-care networks in Abu Dhabi, where PC008 is measured. Then
> the UAE and the GCC, where the same Arabic-first record applies. We'll size it with the pilot's real numbers rather
> than a big top-down figure.

**Q18. What do you need, and what will you do in 6 months?** *(Krishna)*
> A pilot clinic, a clinical advisor and the grant. Our plan:
> - **November:** freeze our claims and write the device memo.
> - **December:** interviews and a letter of intent.
> - **February:** the system runs on UAE hosting with a penetration test.
> - **March to May:** a consented pilot and a licensed company.

### Product and team
**Q19. Why would a woman log every day?** *(Dareen)*
> She doesn't have to: two taps, or one sentence by voice in Arabic. The value comes before the appointment, when her
> scattered year becomes one page. Reminders are opt-in.

**Q20. Does it work offline or on a phone?** *(Atharva)*
> It installs from the browser like an app, and public pages work offline. We also have an iPhone app on the same
> record. Her health data is never stored on the device by the web app.

**Q21. How did you build this much in a week?** *(Atharva)*
> Part of the core was built before selection. This week we added the features you saw: voice, the postnatal
> pathway, blood pressure, the pre-visit brief, sign-in, 3D, the tour and the clinic admin. Every one landed as a
> tested pull request on GitHub, and we used AI coding tools openly, as the rules require.

**Q22. What did each of you do?** *(each, one line)*
> Krishna: AI and safety. Atharva: the web app, 3D and design. Yash: product, testing and the submission. Dareen:
> Arabic and the mother–baby roadmap.

**Q23. What's the biggest risk?** *(Krishna)*
> Trust: women and doctors trusting an app with health data. That's why it never diagnoses, shows its evidence, lets
> her switch AI off and delete everything, and why our first ask is clinical sign-off, not more features.

**Q24. What would you do with the prize?** *(Yash)*
> Fund the pilot: UAE hosting, the penetration test, a clinical advisor's time, and the first clinic's onboarding.

### If you don't know
> "Good question. We haven't measured that yet. Here's how we'd find out: …" Never invent a number.

---

Sources for new facts in this pack (others are in `knowledge_base/sources.yaml` and docs/05):
- The four themes and the format: organisers' information session, 17 Nov 2026.
- UAE health data: Federal Law No. 2 of 2019, summarised by Simmons & Simmons and PwC Middle East.
- DoH AI rules: the DoH Responsible AI Standard; the AI Clinician Framework (WAM, Oct 2026).
- PureHealth's Pura app: Abu Dhabi Media Office.
- StartAD × DoH pilots: IBA overview.
