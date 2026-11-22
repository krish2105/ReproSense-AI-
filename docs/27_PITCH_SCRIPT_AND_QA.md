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
"since your last visit" brief, and the follow-ups that guidelines recommend (for example the glucose test 4 to 12
weeks after gestational diabetes, ADA 2026) are tracked from due, to booked, to done.

**The outcome**
- **For her:** she walks into the appointment with her story in order, in her language, and knows when something can't
  wait.
- **For the doctor:** a one-minute read instead of a 15-minute history, with the evidence attached.
- **For the clinic and payer:** fewer missed follow-ups, counted in a way they can check. That is who pays.

## 2. The four hackathon themes, and what we cover
The organisers set four themes: **longevity, women's health, fertility and Alzheimer's**. We were assigned **Women's
Health**: *"How might we use AI to improve women's health and maternal, newborn and early-childhood outcomes?"*

| Theme | Covered? | Where in the product |
| --- | --- | --- |
| **Women's health** (ours) | **Yes, core** | Periods: irregular cycles and androgen signs (PCOS guideline 2023), severe cyclical pain (endometriosis), heavy bleeding (PBAC score), iron. Red flags first with 998. Five life stages. |
| ↳ maternal | **Yes** | Pregnancy: glucose screening window (24–28 weeks); pregnancy warning signs; **blood-pressure log with the NICE NG133 warning** (pregnancy and 12 weeks after birth). After birth: **the DoH Postnatal Care Program visits** (the check in the first days, at 1 to 2 weeks and at 6 weeks, with depression screening), plus two steps from clinical guidelines: the EPDS mood questionnaire (NICE) and the glucose test after gestational diabetes (ADA). |
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
- **Impact (a scenario, not a result):** we have not measured our effect. If 100 eligible women went from 25% to 50%
  completion, that is **25 more completed follow-ups**. Never "18 per 1,000", "cases found" or "money saved": those
  mixed rates from different populations and time windows (corrected 22 Nov).
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
> "Good afternoon. Meet Noura. She's 24, from Al Ain. She's fictional, but her story isn't.
>
> For a year her periods have come every six to eight weeks, with acne and extra hair. She knows something is wrong. But in a ten-minute appointment she can't remember the dates, she feels embarrassed, and she leaves with 'come back if it gets worse'.
>
> That's how up to 70 percent of women with PCOS end up not knowing they have it, and why, in a UAE study, endometriosis took eleven and a half years to diagnose.
>
> The problem isn't tracking. It's explaining."
>
> (Turn to Krishna: "Krishna.")
>
> IF ASKED
> - 70%: WHO PCOS fact sheet, Jan 2026.
> - 11.6 years: 518 women in the UAE, Frontiers in Global Women's Health, 2021.
> - 1 in 5 pregnancies with gestational diabetes: 2,546 pregnancies in Al Ain, Frontiers in Endocrinology, 2022.
> - 1 in 4 came back: 265 of 1,043 women, one Al Ain hospital, 2013 to 2014 data, within 4 to 6 weeks, IJERPH, 2022.
> - Impact (if asked): at one Al Ain hospital, on 2013 to 2014 data, 1 in 4 mums with diabetes in pregnancy came back for the glucose test within 4 to 6 weeks (IJERPH, 2022). We have not measured our own effect. Scenario only: if 100 eligible women go from 25% to 50%, that is 25 more completed follow-ups. Never say "18 per 1,000" or "cases found".
> - PC008 (if a DoH judge raises it): DoH measured this follow-up as Jawda PC008 until the indicator was retired in the 2025 update (V8); the 2026 sets have no after-birth follow-up indicator. The clinical recommendation stands (ADA 2026: a glucose test 4 to 12 weeks after birth). Our pilot clinic confirms which current quality measure applies.
> - Not sure? "Good question. We haven't measured that yet." Then hand to Krishna.
> - Longevity? After diabetes in pregnancy, type 2 diabetes is about ten times more likely (Vounzoulaki et al., BMJ 2020), so the after-birth glucose test protects her later health. The 2023 PCOS guideline also asks for regular glucose and blood-pressure checks, because PCOS raises cardiometabolic risk.
> - Fertility? The Trying stage says when to ask for a fertility assessment (after 12 months, or 6 months at 35 or over: NICE NG257, ASRM 2021) and gives a sourced planning checklist (folic acid, rubella). IVF support is on the roadmap.

#### Slide 2
> KRISHNA · 30 seconds · slide 2, the solution
>
> "So ReproSense does the explaining for her. She logs in seconds, by tap or by voice in Gulf Arabic.
>
> Over the year, rules from published guidelines show the pattern, with the exact days behind it and the guideline. Never a diagnosis; urgent signs come first, with 998. And she can ask Nura, our assistant, what's happening in her body, in plain words from NHS sources, with her own numbers.
>
> With her consent, her doctor gets a two-page report to read in a minute. Noura doesn't have to explain. Her record does.
>
> And it's safe: on 132 messages it was never tuned on, all 30 crises went to support and all 32 emergencies to 998."
>
> (Turn to Yash.)
>
> IF ASKED
> - Human plus technology? Clinical knowledge sits in the rules, taken from published guidelines. The AI does language work: it turns her voice and lab photos into fields she confirms, rewords text, and gives a second safety check. She checks every value before it saves, the care navigator only drafts, and the doctor makes every decision.
> - Privacy in one breath: hers by default. Her clinic sees it only if she shares, and she can revoke, export or delete everything. The network sees counts, never names (groups under 10 are hidden). Names are removed before any text reaches a model, and with AI off nothing is sent. She can read every access in a tamper-evident log. We never sell health data.
> - Where is the data? The demo is fictional and hosted in Frankfurt. Production stays in the UAE, as the Health Data Law requires (February milestone).
> - Privacy not done yet (say it if pushed): UAE hosting, backups, penetration test, privacy impact assessment. ADHICS gap assessment in December; UAE hosting and the penetration test in February.
> - Who wrote the 132? Written separately from the code, in English and four kinds of Arabic, measured once, never used for tuning. Not clinicians; clinician-written tests are next. Never say "independent reviewers".
> - Where is the AI? Her voice and lab photos into the form, answers from a cited library, rewording. Rules make every safety decision; the AI can add an urgent route, never remove one.
> - Model down? Red flags are plain rules and run first. Past 10 seconds she gets a fixed, sourced reply.
> - 14 of 14 attacks blocked, on every change: /evidence.
> - "Why not just Sahatna?" (our mentor says expect it; DoH owns Sahatna): "Sahatna is Abu Dhabi's front door to care for everyone: records, booking, teleconsults. ReproSense is the specialist for women behind that door: it follows her cycle and pregnancy over months, explains each pattern with its guideline, and follows each recommended follow-up until it is done. Sahatna already has maternity features and Malaffi gives clinicians AI summaries; our specialty is what she logs herself between visits, handed to her clinic with the evidence. We export in FHIR, the standard format; a link to Malaffi or Sahatna would be a partnership we'd ask DoH for."
> - "DoH is adding maternity and IVF to Sahatna. Aren't you redundant?": "That's exactly where we fit. Sahatna has maternity care features today and lists IVF as next; we've already built the women's record, the postnatal steps and the after-birth glucose follow-up loop, with safety evidence. We'd like to be that module rather than a second app."
> - Who is Nura? Our AI assistant, named in Arabic (نورا). She answers only from our cited library or from her own numbers computed by code, never diagnoses, and a verifier drops any sentence a source doesn't support.
> - "What is PCOS?" / "What is happening with my body?" Nura explains 10 conditions in plain words (PCOS, endometriosis, heavy periods, period pain, irregular periods, menopause, gestational diabetes, postnatal depression, pre-eclampsia, fertility), each sentence checked against its NHS or guideline page, then adds her own patterns with her numbers, and links the NHS page and an official NHS video. In Arabic it adds the WHO Arabic fact sheet.
> - Can Nura make things up? Not in these answers: the explanations are fixed sentences written and checked by us and assembled by code, so the model can't invent one. Video links come only from official health bodies and were checked to exist.
> - "Do I have PCOS?" Nura says first that it can't tell and only a doctor can, then gives the cited facts and what her own record shows, to take to her doctor. "What medicine for PCOS?" gets the fixed reply: ask your doctor or pharmacist, never a medicine name.
> - "What should I eat on my period?" Nura answers with food and drink from NHS pages (iron-rich foods if her periods are heavy, fluids, drug-free cramp relief), never a medicine; if she names an allergy, those foods are left out and 998 is given for a serious reaction.

#### Slide 3
> YASH · 30 seconds · slide 3, the venture
>
> "Our users: women like Noura, free, and their doctors. Who pays? Clinics and primary-care networks, on a subscription, because follow-ups that guidelines recommend, like the glucose test after diabetes in pregnancy, get done and they can see it. We'll set the price with our pilot clinic, from what the pilot measures.
>
> Next: a device memo for the Emirates Drug Establishment, a clinic letter of intent, UAE hosting with UAE PASS sign-in, then a pilot at one clinic and a licensed company by May.
>
> Since acceptance: 57 merged pull requests, all on our evidence page. We're forming the company. Let us show you."
>
> IF ASKED
> - Price: "There isn't one yet, on purpose. Women will always use it free; clinics and networks will subscribe, insurers later pay per follow-up closed. We set the number with our first pilot clinic, from what the pilot measures."
>
> - Tested with real women or doctors? "Not yet. Everything you saw runs on fictional data, by design. Our first 90 days are ten interviews, a clinic letter of intent and a consented pilot with up to 20 women at one clinic." If we spoke to anyone today, say exactly that, from the evidence log (docs/29 section 4). Never invent a number.
>

#### Slide 4, the demo
> KRISHNA talks, ATHARVA clicks · slide 4, the demo · 85 seconds (ends by 2:55)
> (Stay on this slide for one breath: "Here it is, live." Then switch to the browser.)
>
> === SWITCH TO THE BROWSER: Noura's Home, English, Light ===
>
> 1. Patterns, first card, Why we noticed
> "This is Noura. She's fictional, 24, and her cycles keep running past 35 days. These chips are the days she logged, and this is the guideline behind it. No diagnosis. Just something to ask her doctor."
>
> 2. Ask Nura, tap "What is happening with my body?"
> "She can ask Nura what's happening in her body. It answers from her own record: cycles of 42 to 56 days, the guideline behind it, an NHS page and an NHS video. Never a diagnosis."
>
> 3. Report, Before your visit
> "Before her visit: what changed since last time, on two pages her doctor reads in a minute."
>
> 4. عربي, Calendar, Try an Arabic example
> "She can also just say it, in Gulf Arabic: cramps, missed work, pain seven out of ten. The form fills itself, and nothing saves until she checks it."
>
> 5. English, Demo people, Open clinician view, Fatima K., glucose follow-up, Mark booked
> "Now the clinic. It only sees women who chose to share. Fatima had diabetes in pregnancy and is nine weeks after the birth, so her glucose test is due. One tap. Booked. It stays open until the test is done."
>
> 6. Demo people, Open clinic network
> "And the network sees each follow-up move from due, to booked, to done. Counts only, never names. That's what clinics and insurers pay for."
>
> 7. Krishna closes
> "We're asking for one pilot clinic, a clinical advisor to sign off our rules, and the grant. Thank you."
>
> TIMING
> - Behind at step 2? Skip it: judges can try Nura themselves after.
> - Behind at step 4? Skip it. Say: "She can log by voice in Arabic too."
> - Behind at step 6? Skip it and close.
> - Site slow or down? Yash plays ReproSense-demo.mp4 and Krishna talks over it.
> - There's no Clinician link inside her app. Go through Demo people.
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
| **Impact is not measured yet** | Impact (20) | "We have not measured it. As a scenario, 100 eligible women going from 25% to 50% is 25 more completed follow-ups; the pilot measures the real number." |
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
  - Follows DoH's Postnatal Care Program Standard and the ADA after-birth glucose recommendation (PC008 was retired in 2025: never call it current).
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
> ten interviews, a clinic letter of intent and a consented pilot with about 20 adults with clinician-documented
> gestational diabetes at one clinic, measured on one number: how many complete the glucose test in the window their
> clinician sets."

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

**Q11b. Privacy in 20 seconds (for "How do you protect her privacy?")** *(Krishna)*
> Hers by default: her clinic sees her record only if she shares, and she can revoke, export or delete it. The network
> sees counts, never names, and groups under 10 are hidden. Names are removed before any text reaches a model; with AI
> off, nothing is sent. Every access is in a tamper-evident log she can read, and we never sell health data. On a shared
> family phone, discreet mode shows "My notes" instead of the app name and hides her name. She can give someone she
> trusts a read-only family link, choose whether it shows details, and revoke it.

**Q11c. What isn't done yet on privacy?** *(Krishna, only if pushed; say it plainly)*
> The demo runs on fictional data in Frankfurt on free hosting: no UAE hosting, no backups, no penetration test and no
> privacy impact assessment yet. The ADHICS gap assessment is in December; UAE hosting and the penetration test are the
> February milestone, before any real record.

**Q12. Is this a medical device? What approvals do you need?** *(Krishna)*
> Because it doesn't diagnose, it's designed to sit below the software-as-a-medical-device line. Our November step is
> a classification memo for the Emirates Drug Establishment, plus a DoH licence for the company and an ADHICS
> (cybersecurity) gap assessment.

**Q13. Does it connect to Malaffi?** *(Krishna)*
> Not yet. The record already exports in the FHIR standard, which is what health information exchanges use, so
> connecting to Malaffi through the proper DoH and M42 route is a roadmap step after the pilot.

### Business (PureHealth, investors)
**Q14. Who pays?** *(Yash)*
> Women use it free, always. Clinics and primary-care networks pay a subscription because recommended follow-ups get
> done and they can see it; insurers later, per follow-up completed. There is no price yet on purpose: we set it with our first
> pilot clinic, from what the pilot measures.

**Q14b. Why not just use Sahatna, DoH's own app?** *(Krishna; our mentor flagged it)*
> Sahatna is Abu Dhabi's front door to care for everyone: records, booking, teleconsults. ReproSense is the specialist for women behind that door: it follows her cycle and pregnancy over months, explains each pattern with its guideline, and follows each recommended follow-up until it is done. Sahatna already has maternity features and Malaffi gives clinicians AI summaries; our specialty is what she logs herself between visits, handed to her clinic with the evidence. We export in FHIR, the standard format; a link to Malaffi or Sahatna would be a partnership we'd ask DoH for.

**Q15. How is this different from Flo, Clue or Nabta?** *(Yash)*
> Flo and Clue track cycles and Flo offers symptom checks, including for PCOS; Ovia covers life stages and sells to
> health plans and employers; Nabta runs AI-supported women's care locally. Our specialty is narrower: what she logs
> herself, linked to its evidence, handed to her clinic with consent, and a follow-up tracked until it is done,
> Arabic-first. The real alternatives are also a nurse's phone call and a reminder in the clinic's own system.

**Facts behind Q14b (Sahatna), checked 22 Nov 2026.** Say only these; a DoH judge may know more than is published:
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
> Start narrow: women's health and primary-care clinics in Abu Dhabi that follow women after gestational diabetes. Then
> the UAE and the GCC, where the same Arabic-first record applies. We'll size it with the pilot's real numbers rather
> than a big top-down figure.

**Q18. What do you need, and what will you do in 6 months?** *(Krishna)*
> A pilot clinic, a clinical advisor and the grant. Our plan:
> - **November:** freeze our claims and write the device memo.
> - **December:** interviews and a letter of intent.
> - **February:** the system runs on UAE hosting with a penetration test.
> - **March to May:** a consented pilot and a licensed company.

**Q18b. What does the Department of Health get from this, apart from a product?** *(Krishna or Atharva)*
> Sight of the months between visits. Malaffi shows what happened in a clinic. With her consent, and as counts only,
> ReproSense shows what women are logging before they ever book: how many women's entries match a pattern worth
> discussing, and how many of them have shared a report with a clinic, by region and age. On our synthetic network,
> 496 of 1,200 women match a pattern and 220 of them have not shared with a clinic yet. That is where DoH would aim
> services and awareness.

Behind Q18b (Clinic network → "What the Department of Health would see"):
- Counts from the synthetic cohort only, never names; every group under 10 is hidden. Say "on our synthetic network",
  never "in Abu Dhabi".
- Say "entries match a pattern worth discussing". Never "women with PCOS", "detected", "screened" or "prevalence".
- Other things DoH gets, already on the dashboard: after-birth glucose follow-ups week by week, the
  postnatal steps done inside their window, and a fairness check by nationality group and age band.
- Roadmap, not built: a consented research cohort, an aggregate export for programme reporting, counts of the topics
  women ask Nura about, and reminders for DoH's cervical and breast screening programmes.

**Q18c. Isn't PC008 retired? Why is it in your product?** *(Krishna or Yash)*
> You're right, and we corrected it on 22 Nov. DoH measured this follow-up as Jawda PC008 until the indicator was
> retired in the 2025 update; the 2026 sets have no after-birth follow-up indicator. The clinical reason has not
> changed: the ADA recommends a glucose test 4 to 12 weeks after gestational diabetes. Our pilot clinic tells us which
> current quality measure applies; we don't claim one.

**Q18d. Why not an ordinary reminder, or a nurse's phone call?** *(Yash)*
> Those are the real alternatives, and a pilot should compare against them. A reminder tells her a test is due. It
> doesn't carry her own history to the visit, show the clinic who is still open, or tell booked apart from done. We
> track the follow-up from due, to booked, to done, with the evidence she and her clinician can both see.

**Q18e. What happens when the AI model is down?** *(Krishna)*
> Urgent signs on her record are plain rules and still run first, and the 998 strip stays on screen. The second safety
> check by the model is what lifted crisis messages from 11 of 30 to 30 of 30 on our held-out set, so without it the
> chat is weaker, and we say so: a limited mode that tells her the assistant is restricted is our next safety change.

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
  pregnancy or after birth, 3 clinicians, 90 days. Measured on one number: the glucose test after gestational diabetes,
  in the window the clinic's own protocol sets. The proposal is on /pilot."
- **"What's it worth to a payer?"** *(Yash)* "We have not measured that. /pilot shows a scenario from your own numbers: eligible
  women, completion today and a target give the extra completed follow-ups. It is not cases found or money saved; the
  pilot measures the real number."
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
   - 1 in 4 mothers came back for the glucose test: one Al Ain hospital, 2013 to 2014 data, a 4 to 6 week window
     (published 2022).
2. **The scenario line**: 100 eligible women, 25% to 50% completion, 25 more completed follow-ups. A scenario, not a
   result, and never "cases found".
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
