# 27 · Showcase pack: what ReproSense is, the 3-minute script, the demo, and the judges' questions

For Sunday 22 Nov 2026, DOH Incubator, Masdar City. Format (organisers, 21 Nov): **three slides (problem, solution,
venture roadmap) in 1 to 1.5 minutes, then the live demo in 1.5 to 2 minutes; 3 minutes in all, then 3 minutes of
questions.** Judges: Hesham Abuasi (DoH), Madiha Parvez (PureHealth), Dr Osama Abdullah (NYU Abu Dhabi), Mehdi
Bouchenak (Vitalls); section 10 has what each is likely to ask. Submission (3-slide deck +
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
| ↳ newborn and early childhood | **Yes** | **The baby's first year** (Fatima → Home): newborn screening, well-baby visits and vaccinations from DoH Abu Dhabi's immunization circular and newborn screening standard, each with its source and "I had this". The feeding log after birth (D2, #164) is live too. |
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
| **Yash Petkar** | Product, demo, submission | Pilot value page for clinics and insurers, family support view, planning-a-pregnancy checklist, API hardening (connection pool, abuse limits, request IDs), the 3-slide deck and MP4, showcase checklist and rehearsals, live testing |
| **Zebo** | Women's health evidence (biology, NYU Abu Dhabi) | Joined on 21 Nov, the last build day: the problem slide, the science questions in Q&A (PCOS/PMOS, gestational diabetes, mood after birth), and interviews with women today |

---

## 4. The 3-minute script: 3 slides, then the demo (organisers' format, 21 Nov)

The organisers' format (WhatsApp, 21 Nov): **three slides** (the problem, the solution, the venture roadmap: how it
becomes a company) in **1 to 1.5 minutes**, then the **demo in 1.5 to 2 minutes**. 3 minutes in all, then 3 minutes of
questions. The slides are `pitch/ReproSense-submission.pdf`; the demo is the live site.

**Numbers to know by heart** (all on /evidence, /status and /pilot):
- **Safety, held-out:** 132 questions written separately from the code and never used to tune it. With the AI second
  check: crisis **30/30**, emergencies **32/32**, everyday questions answered normally 42/50 (no new false alarms).
  Word checks alone: 11/30 and 24/32.
- **Security:** 14 of 14 attacks blocked, on every change.
- **Built since acceptance (17–21 Nov):** **57 merged pull requests**, each listed with its date on /evidence. Before
  selection: 56.
- **Impact, per 1,000 births (arithmetic, not a result):** 213 with gestational diabetes; today 1 in 4 get the glucose
  test after birth (54). At 1 in 2 (107), that is 52 more tests and **about 18 more mothers with raised blood sugar
  found early** (34.5% pooled rate, Endocrine 2025). On /pilot every input is editable.
- **The loop on demo data:** a median of 8 days from a follow-up opening to it being booked; 66% of postnatal steps
  done inside their DoH window.

**Honesty rules for the stage.** Say "written separately from the code" for the held-out questions, never
"independent reviewers". The pattern cards are written by rules and templates; the AI does the language work (her
voice, lab photos, the assistant's cited answers). Say "a pilot clinic is our first ask", never that one has signed.
Quote interviews only from the evidence log (docs/29 §4).

Read it out loud three times with a timer. Speak to the judges, not the screen. Short sentences; pause after numbers.
**Bold** = stress. *[Brackets]* = what Atharva clicks.

### The words to say (same text as the PPTX speaker notes)
These are the speaker notes in `pitch/ReproSense-submission.pptx`. Open it in PowerPoint, start the Slide Show and use Presenter View (in Keynote: Play, then Presenter Display), and each speaker sees their lines under the slide. The source is `pitch/speaker_notes.js`: edit it there and rebuild (pitch/README.md), so the deck and this page never drift. Slides take about 1:30 and the demo about 1:25. Rehearse with a timer; if you run long, the timing notes say what to skip.

#### Slide 1
> ZEBO · 30 seconds · slide 1, the problem
> (Wait a beat. Look at the judges, not the screen.)
>
> "Good afternoon. Imagine a woman in Abu Dhabi with a year of irregular periods and acne, and ten minutes with a gynaecologist to explain it all.
>
> Up to 70 percent of women with PCOS don't know they have it. In a UAE study, endometriosis took eleven and a half years to diagnose. And only one in four mums with diabetes in pregnancy came back for the glucose test after the birth.
>
> Make that one in two, and about 18 more mothers in every thousand births get high blood sugar caught early."
>
> (Turn to Krishna: "Krishna.")
>
> IF ASKED
> - 70%: WHO PCOS fact sheet, Jan 2026.
> - 11.6 years: 518 women in the UAE, Frontiers in Global Women's Health, 2021.
> - 1 in 5 pregnancies with gestational diabetes: 2,546 pregnancies in Al Ain, Frontiers in Endocrinology, 2022.
> - 1 in 4 came back: 265 of 1,043 women, one Al Ain hospital, IJERPH, 2022.
> - 18 per 1,000 is arithmetic, not our result: 1,000 x 21.3% x (50% - 25.4%) x 34.5% (pooled from 18 studies, Endocrine, 2025). The inputs are on /pilot.
> - Not sure? "Good question. We haven't measured that yet." Then hand to Krishna.

#### Slide 2
> KRISHNA · 30 seconds · slide 2, the solution
>
> "So we built ReproSense: her health record, in Arabic and English. She logs in seconds, by tap, by voice, or with a photo of a lab report.
>
> Rules from published guidelines spot patterns worth raising with a doctor, and show the exact days and the guideline behind each one. It never diagnoses, and anything urgent comes first, with 998.
>
> The AI is checked. On 132 test messages it was never tuned on, it sent all 30 crises to support and all 32 emergencies to 998."
>
> (Turn to Yash.)
>
> IF ASKED
> - Who wrote the 132? Written separately from the code, in English and four kinds of Arabic, measured once, never used for tuning. Not clinicians; clinician-written tests are next. Never say "independent reviewers".
> - Where is the AI? Her voice and lab photos into the form, answers from a cited library, rewording. Rules make every safety decision; the AI can add an urgent route, never remove one.
> - Model down? Red flags are plain rules and run first. Past 10 seconds she gets a fixed, sourced reply.
> - 14 of 14 attacks blocked, on every change: /evidence.

#### Slide 3, then the demo
> YASH · 30 seconds · slide 3, the venture
>
> "Who pays? Clinics, per doctor, and primary-care networks, because the after-birth glucose test is on DoH's own scorecard, PC008. Women use it free.
>
> Next: a device memo for the Emirates Drug Establishment, a clinic letter of intent, UAE hosting, then a pilot at one clinic and a licensed company by May.
>
> Since we were accepted we've merged 57 pull requests, all on our evidence page, and we're forming the company. Let us show you."
>
> === SWITCH TO THE BROWSER: Noura's Home, English, Light ===
>
> DEMO · Atharva clicks, Krishna talks · 85 seconds (ends by 2:55)
>
> 1. Patterns, first card, Why we noticed
> "This is Noura. She's fictional, 24, and her cycles keep running past 35 days. These chips are the days she logged, and this is the guideline behind it. No diagnosis. Just something to ask her doctor."
>
> 2. Report, Before your visit
> "Before her visit: what changed since last time, on two pages her doctor reads in a minute."
>
> 3. عربي, Calendar, Try an Arabic example
> "She can also just say it, in Gulf Arabic: cramps, missed work, pain seven out of ten. The form fills itself, and nothing saves until she checks it."
>
> 4. English, Demo people, Open clinician view, Fatima K., glucose follow-up, Mark booked
> "Now the clinic. It only sees women who chose to share. Fatima had diabetes in pregnancy and is nine weeks after the birth, so her glucose test is due. One tap. Booked."
>
> 5. Demo people, Open clinic network
> "And the network sees these follow-ups close. Counts only, never names. That's what clinics and insurers pay for."
>
> 6. Krishna closes
> "We're asking for one pilot clinic, a clinical advisor to sign off our rules, and the grant. Thank you."
>
> TIMING
> - Behind at step 3? Skip it. Say: "She can log by voice in Arabic too."
> - Behind at step 5? Skip it and close.
> - Site slow or down? Yash plays ReproSense-demo.mp4 and Krishna talks over it.
> - There's no Clinician link inside her app. Go through Demo people.
>
> If a judge asks "Have you tested this with real women or doctors?" (Yash): "Not yet. Everything you saw runs on fictional data, by design. Our first 90 days are ten interviews, a clinic letter of intent and a consented pilot with up to 20 women at one clinic." Never invent a number.
>
> Q&A: answer in two sentences, then stop. Krishna: AI, safety, data, regulation. Yash: money, market, pilot. Zebo: the science (PMOS, gestational diabetes, mood after birth). Atharva: the build and the app.

---

## 5. Demo pre-flight (Sunday morning; Yash runs it, Y6 checklist)
1. **09:30:** open https://reprosense.vercel.app on the demo laptop. The free API sleeps; the first load wakes it in
   about 30–60 s.
2. **Before 15:15 (submission):** `pitch/ReproSense-submission.pdf` and `pitch/ReproSense-demo.mp4` are uploaded.
3. **10 min before:**
   - Demo people → **Reset demo data**, so every number is the seeded one.
   - Then open the clinician view once and the clinic network once (wakes those pages).
   - End on **Noura's Home** in English, **Light** theme: the demo starts there.
   - Open `pitch/ReproSense-submission.pdf` full screen in a second window for the three slides.
4. **2 min before:** reload the landing page (keeps the API awake). Chrome, 100% zoom, light theme, sound off.
   - **Microphone:** not needed; the Arabic step uses **Try an Arabic example**.
   - **Wi-Fi:** venue Wi-Fi or a phone hotspot as backup.
5. **Backups:**
   - The MP4 is on the desktop and on a USB stick.
   - The iPhone app is installed on Krishna's phone (works on its own until 25 Nov), as a 10-second "and it's on her
     phone too" if time allows.
6. **Never show:** the admin reset button during the pitch, or any real person's data.

## 6. Today's validation sprint (do it before Sunday; 30% of the score is venture potential)
Goal: **5 women and 1 clinician**, 10 minutes each, in person or by phone. Ask permission to quote **without names**.
Write answers in the evidence log (docs/29 §4) (no names, no phone numbers).

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
| **No signed clinic yet; interviews only partly written up** | Venture (30) and impact | Quote only the evidence log (docs/29 §4). Otherwise Q4. |
| **Impact is arithmetic, not measured** | Impact (20) | "About 18 more mothers per 1,000 births, from published rates; the pilot measures the real number." |
| **Half the pull requests predate acceptance** | Prototype (20) | Section 10, "Was this built after you were accepted?": 57 since, each dated on /evidence. |
| **Newborn**: the baby's schedule and a feeding log are live; no growth charts | Theme fit | "Her baby's first year and a feeding log are in the record; growth and development checks are next." |
| **Clinical sign-off** is pending (rules reviewed by AI agents and us, not yet by a licensed clinician) | Safety | "Every rule cites its guideline and is logged for sign-off; a clinical advisor is our first ask." |
| **Arabic is AI-reviewed only** (our native reviewer left the team on 21 Nov) | Arabic-first claim | "Every Arabic string is logged for a native speaker's review; that review is still open, and it's part of the pilot set-up." |
| **Diagnosis and medicine questions**: on the held-out set, 6 of 10 diagnosis requests and 4 of 10 medicine questions got the exact refusal; the rest got a sourced answer, never a diagnosis or a dose | Safety | "Crisis and emergencies are 30 of 30 and 32 of 32. The rest still never get a diagnosis or a dose; tightening those refusals is next, and we publish every miss on /status." |
| **Free hosting** sleeps, and the data is in Frankfurt for the demo | Tech and regulation | "Demo data is synthetic. Production runs on UAE-hosted infrastructure, as the Health Data Law requires; the code is ready to move." |

## 8. How likely we are to win (honest, rescored 21 Nov against the organisers' matrix)
- **Strict read today:** about **70/100**.
  - Venture ~18/30: a clear customer and route, but no validated customer yet.
  - Impact ~14/20.
  - Innovation ~15/20.
  - Prototype ~16/20: strong, but the judges weigh what was built after acceptance.
  - Pitch ~6/10: the format changed on 21 Nov.
- **With the interview notes on slide 3, the per-1,000-births line, the "built since acceptance" record and a clean,
  rehearsed run:** about **78–83**, a **top-3 contender**. A signed letter of intent or a clinician's written interest
  adds the most on top.
- **What separates us:**
  - A working product with published safety evidence, not a slide.
  - Tied to a DoH indicator (PC008) and DoH's Postnatal Care Program Standard.
  - Arabic-first, with the Gulf dialect by voice.
- **The biggest risks on the day:**
  - A slow free server: use the MP4.
  - Running over: rehearse to 2:55.
  - The hop to the clinician view through **Demo people**.
  - A validation question with no written answer.

---

## 9. The judges' questions, with answers
**Printable pack:** `docs/30_JUDGE_QA_PACK.pdf` (10 pages): a 20-question cheat sheet, how the backend works (stack, the 7 red flags and 13 patterns in plain words, where AI is and isn't used, the numbers), and a 75-question bank tagged by who answers. Source: `docs/30_JUDGE_QA_PACK.html`.

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

**Q5. Mental health: what if she writes something worrying?** *(Zebo)*
> If her words suggest crisis, the app shows support and 998, never a score. After birth, the mood check uses the
> EPDS questionnaire, and its self-harm question goes straight to support, with 998 and DoH's 24/7 line 800-SAKINA.
> On 132 held-out messages written separately from the code, our safety layer caught all 30 crisis messages.

### AI (NYU Abu Dhabi)
**Q6. Where is the AI, if rules decide everything?** *(Krishna)*
> AI does the language work: reading her Arabic or English sentence into the form, reading a photographed lab report,
> answering questions from our cited library, and rewording the brief. A verifier drops any sentence her data
> doesn't support. The decisions that matter for safety stay in transparent rules, which is what DoH's Responsible
> AI Standard asks for.

**Q7. How do you stop hallucinations?** *(Krishna)*
> Retrieval from a curated library with citations, a check that every sentence is supported, and a fixed template
> fallback. On our 60-question test set every answer was grounded, every diagnosis request was refused, and every red
> flag was caught. On 132 held-out questions written separately from the code and never used to tune it, the safety layer with the AI second
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

**Q11. Who can see her data?** *(Krishna)*
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

**Q15b. DoH already has Sahatna. Why would anyone need this?** *(Yash)*
> Sahatna is the front door to care: built by DoH with Abu Dhabi Health Data Services, over a million users in its
> first year, it shows the records her clinics already hold in Malaffi and lets her book and consult. We cover the
> months between those visits, which its public listings don't describe: her own cycle, symptom and blood-pressure
> entries, turned into patterns worth discussing with a doctor and a follow-up her clinic tracks. We're a
> complement: DoH has announced maternity and IVF services for Sahatna, and we'd welcome being a women's-health
> module alongside them.

Facts behind Q15b, checked 22 Nov 2026 (say only these; a DoH judge may know more than is published):
- Launched 15 Oct 2024 at GITEX by DoH with ADHDS, the operator of Malaffi
  ([WAM](https://www.wam.ae/en/article/b5p217f-department-health-abu-dhabi-launches-sahatna)).
- Over 1 million users in its first year; "Sahatna Space" opened inside TAMM on 16 Oct 2025, with maternity care
  features named and IVF services listed as coming
  ([DoH](https://www.doh.gov.ae/en/news/abu-dhabi-advances-smart-and-intelligent-health-system-with-launch-of-sahatna-space-on-tamm)).
- Its App Store listing describes appointments, records, prescriptions, dependents, wearables, an AI patient
  assistant and self-assessments for mental health and child autism. We found no cycle, symptom or home
  blood-pressure logging and no doctor summary from her own entries in it
  ([App Store](https://apps.apple.com/us/app/id6472413092)). Say "its public listings don't describe", never
  "Sahatna has nothing for women".
- We found no public API or developer programme for Sahatna or Malaffi. Our route is the clinic: the report and the
  FHIR export land in the clinic's own record system, which is already connected to Malaffi. A direct link would be
  a DoH or ADHDS partnership we would ask for.

**Q15c. She has acne. Won't your app tell her she has PCOS?** *(Krishna or Atharva)*
> No. Acne on its own never creates a pattern: the rule needs irregular cycles first, as the 2023 international PCOS
> guideline describes, and even then it says "ask your doctor whether an assessment is appropriate". On the Patterns
> screen, "What we checked and did not show" lists her own numbers next to each rule's threshold, so she can see
> why no card appeared. It never says nothing is wrong.

Behind Q15c: the guideline calls acne and hair loss without excess hair growth relatively weak predictors of raised
androgens (recommendation 1.3.2), and lists what a doctor rules out first (thyroid, prolactin, 17-OH progesterone).
Not built yet, and say so if asked: asking once about hormonal contraception, medicines and thyroid conditions, and
holding the cycle card while she is on hormonal contraception. That changes when a rule fires, so it waits for the
clinical advisor.

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
**Q19. Why would a woman log every day?** *(Zebo)*
> She doesn't have to: two taps, or one sentence by voice in Arabic. The value comes before the appointment, when her
> scattered year becomes one page. Reminders are opt-in.

**Q20. Does it work offline or on a phone?** *(Atharva)*
> It installs from the browser like an app, and public pages work offline. We also have an iPhone app on the same
> record. Her health data is never stored on the device by the web app.

**Q21. How did you build this much in a week?** *(Atharva)*
> The core record was started before selection: 56 pull requests, all public. Since acceptance we merged 57 more,
> including what you saw today: Arabic voice, the postnatal pathway, blood pressure, the pre-visit brief, the baby's
> first year, the feeding log, staff sign-in, the attack suite and the model safety score. /evidence lists every one
> with its date, and we used AI coding tools openly, as the rules require.

**Q22. What did each of you do?** *(each, one line)*
> Krishna: AI and safety. Atharva: the web app, 3D and design. Yash: product, testing and the submission. Zebo
> joined us on the last build day from biology at NYU Abu Dhabi and leads our evidence questions and interviews.

**Q23. What's the biggest risk?** *(Krishna)*
> Trust: women and doctors trusting an app with health data. That's why it never diagnoses, shows its evidence, lets
> her switch AI off and delete everything, and why our first ask is clinical sign-off, not more features.

**Q24. What would you do with the prize?** *(Yash)*
> Fund the pilot: UAE hosting, the penetration test, a clinical advisor's time, and the first clinic's onboarding.

### If you don't know
> "Good question. We haven't measured that yet. Here's how we'd find out: …" Never invent a number.

---


---

## 10. The four judges: what each one is likely to ask (21 Nov)
From the organisers' "Meet your judges" and their scoring matrix. Public facts only; check anything you quote.
Matrix reminders:
- Venture 4 needs a "clear customer and credible UAE route; good grasp of regulation and data; realistic milestones".
- Prototype 4 needs "the full core journey works reliably, built after acceptance".
- Pitch 5 needs "a concrete plan to continue".

### Hesham Abuasi · Senior Analyst, Incubation and Acceleration, DoH
He scores whether this becomes a real company inside Abu Dhabi's rules.
- **"Will you continue after today?"** *(Krishna)* "Yes. We're forming the company to run the pilot. The next 90 days
  are fixed: the device-classification memo, ten interviews and a clinic letter of intent, then UAE hosting and a
  penetration test."
- **"What licences do you need?"** *(Krishna)* Q12: the EDE classification memo first (it doesn't diagnose, so we
  expect it to sit below the medical-device line, and we'll confirm that with EDE). Then a DoH licence for the
  company, an ADHICS gap assessment, and the Health Data Law (data stays in the UAE).
- **"Why the incubator?"** *(Yash)* "We need a pilot clinic and regulatory guidance more than money: the incubator
  opens both."

### Madiha Parvez · Group Innovation Manager, PureHealth
PureHealth's group includes SEHA's clinics, the Daman insurer and the Pura app. She'll test fit and adoption.
- **"Why not build this into Pura?"** *(Krishna)* Q16. "We'd rather be inside Pura than compete with it. From its public
  listings Pura covers teleconsults, medicines and diabetes; we couldn't see a women's or maternal module. We bring
  the clinical rules, the Arabic and the safety evidence as that module."
- **"What would a pilot look like for us?"** *(Yash)* "One primary-care clinic, up to 20 consenting women in late
  pregnancy or after birth, 3 clinicians, 90 days. Measured on one number DoH already asks for: the glucose test after
  gestational diabetes (PC008). The proposal is on /pilot."
- **"What's it worth to a payer?"** *(Yash)* "On /pilot, per 1,000 births: about 52 more completed follow-ups and about
  18 more mothers with raised sugar found early, at the inputs you choose. That's arithmetic, not a result; the pilot
  measures the real number."
- **"Malaffi?"** *(Krishna)* Q13: FHIR export today; connecting through the proper DoH route comes after the pilot.

### Dr Osama Abdullah · Director, Core Technology Platforms, NYU Abu Dhabi
He'll test the method behind the numbers.
- **"Who wrote your held-out questions?"** *(Krishna)* Answer exactly how they were made: "Written separately from the
  code, by writers who never saw it, in English and four Arabic varieties. We measured them once and never tuned on
  them. Clinician-written questions are the next step." Never call them clinicians or independent reviewers.
- **"What if the model is wrong or down?"** *(Krishna)* "The safety decisions don't depend on it. Red flags are
  written rules that run first. The model can only *add* a crisis or urgent route, never remove one. Each request has
  a 10-second model budget; past it, she gets a fixed, sourced template."
- **"How do you know answers are grounded?"** *(Krishna)* Q7: retrieval from a curated library, a check that drops any
  sentence a source doesn't support, and the 60-question test set on /evidence.
- **"Where does the data live?"** *(Krishna)* Q10: the demo is synthetic and hosted in Frankfurt. Production is
  UAE-hosted (February milestone), with row-level security and a tamper-evident access log.

### Mehdi Bouchenak · Founder and CEO, Vitalls
Vitalls builds an AI digital health passport for individuals and families (seed round, Oct 2026). He'll look at it as
a founder.
- **"Why a separate women's app, and not a health passport?"** *(Krishna)* "A passport stores records. We add the
  clinical layer for women's health: cited rules, red flags first, the doctor report, and the clinic follow-up. Her
  record exports as standard FHIR, so a passport could hold it."
- **"How do you get users?"** *(Yash)* "Through clinics, not ads. The clinic invites her with a QR code at the visit.
  The clinic pays, and she uses it free. That's why the pilot comes first."
- **"Why would she keep logging?"** *(Zebo)* Q19: two taps or one sentence by voice, and the payoff comes before her
  appointment.
- **"What's defensible?"** *(Krishna)* "Clinical rules with sources, published safety evidence, Arabic first, and a
  DoH indicator to tie to. Flo and Nabta are consumer and service plays. We're the record a clinic uses."

### Zebo's crash course (joined 21 Nov; read before rehearsal)
Zebo presents slide 1 and takes the science questions. What to know cold, all in this pack or on the live site:
1. **Slide 1, word for word** (section 4), with the four numbers and where each comes from:
   - up to 70%: WHO, 2026;
   - 11.6 years: a UAE study of 518 women, 2021;
   - 1 in 5 pregnancies in Al Ain had gestational diabetes: 2022;
   - 1 in 4 mothers came back for the glucose test: one Al Ain hospital, 2022.
2. **The per-1,000-births line**: 213 → 54 tested today → 107 at half → 52 more tests → about 18 mothers with raised
   sugar found early, at a 34.5% pooled rate. It's arithmetic, not a result.
3. **What the product never does**: diagnose, give a percentage, or name a condition she "has". It says "a pattern worth
   discussing with a doctor". Urgent signs come first, with 998.
4. **Q5** (mood after birth: the EPDS check, and its self-harm question goes straight to support, 998 and 800-SAKINA),
   **Q19** (why she logs), and the **PMOS** question above.
5. Click through the live demo once: Noura → Patterns → Why we noticed → Report.
6. If unsure, say "Good question; we haven't measured that yet" and hand to Krishna. Never guess a number.

### New questions this week
- **"PCOS was renamed PMOS in May. Why does your app say PCOS?"** *(Zebo)* "The Lancet consensus renamed it, with a
  three-year transition; the international guideline adopts PMOS in 2028. Our search and library already know PMOS.
  We show PCOS because women and doctors here still use it, and we'll switch with the guideline (QUESTIONS #58)."
- **"Was this built after you were accepted?"** *(Atharva)* "The core record was started before selection: 56 pull
  requests, all public. Since acceptance we merged 57 more, including everything new you saw today. Our evidence page
  lists each one with its date."
- **"Nabta just raised money for women's health in the UAE. Why you?"** *(Yash)* "Nabta runs clinics and
  consultations. We're software for any clinic's women: the record, the rules and the follow-up. A Nabta clinic could
  use ReproSense."

Sources for new facts in this pack (others are in `knowledge_base/sources.yaml` and docs/05):
- The four themes and the format: organisers' information session, 17 Nov 2026; the 3-slide format, 21 Nov 2026.
- Raised sugar after gestational diabetes, 34.5% within a year (pooled, 18 studies): Liu et al., Endocrine 2025,
  doi:10.1007/s12020-025-04271-2.
- PCOS renamed PMOS: Lancet consensus, 12 May 2026 (PubMed 42119588); three-year transition.
- Vitalls (AI health passport, seed Oct 2026): Wamda, Oct 2026. Nabta Health ($2M pre-Series A, Oct 2026; data in
  Frankfurt): its own privacy notice and press coverage. Pura features: its App Store listing.
- UAE health data: Federal Law No. 2 of 2019, summarised by Simmons & Simmons and PwC Middle East.
- DoH AI rules: the DoH Responsible AI Standard; the AI Clinician Framework (WAM, Oct 2026).
- PureHealth's Pura app: Abu Dhabi Media Office.
- StartAD × DoH pilots: IBA overview.
