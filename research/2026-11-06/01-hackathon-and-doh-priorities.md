# 01 · HealthX Ajyal and DoH Abu Dhabi priorities

Research track 1 of the 6 Nov 2026 run. Every URL in the source list was accessed on **6 Nov 2026**.
Labels: **Verified** = we read the primary source ourselves · **Secondary** = we read a news or third-party page ·
**Index only** = seen in search results, the page would not open · **Not verified** = we could not confirm it.
Numbers in square brackets ([S1] etc.) point to the source list at the end. Everything is in our own words.

---

## 0. What matters most for winning (read this first)

1. **The organisers' own example use cases describe ReproSense.** The official Fertility theme lists a cycle and
   ovulation tool that "flags patterns worth a clinical review, such as possible PCOS", and a tool that helps couples
   know when and where to seek a fertility assessment. The Women's Health theme lists an AI pregnancy monitor for early
   signs of gestational diabetes or pre-eclampsia, and a menopause support assistant. ReproSense covers all four. Name
   both "Start of life" themes (Fertility + Women's Health) in the application and the pitch [S1].
2. **The prototype criterion scores the core journey a team builds after it is accepted (selection: Mon 16 Nov).**
   Earlier code, research or designs are allowed only if disclosed at the start of the event [S1]. ReproSense already has
   a working backend and web app from 5–6 Nov (HANDOFF.md, QUESTIONS #34), and the docs/15 disclosure template still
   says "no backend". Disclose the code fully, make build-week work visible (for example a dated tag at selection and a
   "built 16–22 Nov" list), and ask the organisers in writing how pre-selection code is scored.
3. **DoH already measures the care gap ReproSense closes.** DoH's Jawda primary-care KPI **PC008** counts women seen
   7–84 days after birth who received breastfeeding support, postnatal depression screening and, if they had
   gestational diabetes, a glucose test. Providers submit it every quarter [S16]. Put this KPI by name on the clinic
   dashboard. Our inference: the most natural first buyer for the after-birth module is a primary-care network, because
   the KPI applies to family-medicine and GP encounters.
4. **DoH's Responsible AI Standard (Oct 2025) is the checklist a DoH juror will hold.** It asks for human oversight with
   escalation, graceful fallback, role-specific explanations, telling patients when AI is used and letting them opt out,
   subgroup fairness audits, end-to-end traceability, data cards, and UAE-hosted compute (including disaster recovery)
   with support access only from inside the UAE [S10]. Map each clause to a ReproSense feature on one slide (section 5).
5. **DoH's 2026 direction is prevention, early screening and "sensing" reproductive signals.** The Programme for the
   Future of Reproductive Health (approved 17 Sep 2026) stresses prevention, preconception care, AI and data, and aims to
   lift IVF success from 59% to 80% by 2030 [S7][S8]. The Future Health Summit (DoH theme "To Sense is to Predict") had a
   session with the DoH Undersecretary on what fertility signals say about women's lifelong disease risk [S12][S13].
   Pitch ReproSense as the patient-side record that captures those signals early and gets them to a clinician.
6. **A second Abu Dhabi competition has a Fertility track and closes very soon.** The Future Health Digital Innovation
   Challenge (Hack2skill, co-created with Inception42, MBZUAI and Microsoft) offers USD 105,000; registration closes
   10 Nov on the event page (15 Nov in the press release); prototypes are due 20 Nov [S34][S35]. Decide this week, and
   check that both rule sets allow the same product.
7. **Two numbers in the kit are out of date.** IVF success is now 59% (Sept 2026), not "above 51%" (Feb 2025) [S7][S20].
   Malaffi holds 3.5 billion records for 12.7 million patient profiles across 3,072 facilities (Aug 2025), not 1 billion [S25].

---

## 1. The hackathon: official facts

Source: the official page [S1], English and Arabic versions (same content), read in full, including the theme data
embedded in the page. The page is bilingual, which supports ReproSense's EN/AR build.

| Item | What the official page says | Status |
| --- | --- | --- |
| Name | HealthX Ajyal Hackathon; "Ajyal" is Arabic for generations | Verified [S1] |
| Organiser | Department of Health – Abu Dhabi, delivered by Upstart Bar (an Abu Dhabi strategy and innovation firm) | Verified [S1][S2] |
| Partners | Replit (technology partner); Socia and AI Tinkerers (community partners) | Verified [S1] |
| Themes | Four; every idea must address at least one. Start of life: Fertility, Women's Health. Later life: Longevity, Alzheimer's. Teams bring their own ideas within a theme | Verified [S1] |
| Eligibility | Age 18+; in person at the DOH Incubator, Masdar City on 22 Nov; teams of 2–4; at least one university student per team (a team without one applies with up to 3 and is matched); individuals can apply and be matched; clinical, research, design and business roles need no coding | Verified [S1] |
| Application | Each member applies separately with the same team name; the form takes about 11 minutes; opened Tue 27 Oct, closes **Sat 14 Nov 23:59 GST** | Verified [S1] |
| How applications are reviewed | (1) how clearly the problem is defined and evidenced, (2) what each applicant contributes, (3) whether the idea can be demonstrated at the showcase, (4) how well skills complement each other, (5) how likely the team is to continue. A clear problem matters more than a finished solution | Verified [S1] |
| Selection | Mon 16 Nov: confirmation email and participant handbook; building may start once selection is announced | Verified [S1] |
| Build week | 17–21 Nov | Verified [S1] |
| Event day | Sun 22 Nov, DOH Incubator, Masdar City: morning briefing, mentor-supported building, evening showcase where **finalist** teams pitch and demo to the jury; winners announced at the close | Verified [S1] |
| Jury | Clinical, investment and technology experts, DoH representatives and health-tech founders | Verified [S1] |
| Criteria and weights | Venture potential 30% · Problem and health impact 20% · Innovation and evidence 20% · Prototype and execution 20% · Team and pitch 10% (descriptions in section 8) | Verified [S1] |
| Scoring scale per criterion | Not published | Not verified |
| Grant threshold | At least 60/100 with the jury | Verified [S1] |
| Prizes | 30,000 AED cash pool: 1st 15,000 · 2nd 10,000 · 3rd 5,000 | Verified [S1] |
| Grant schedule | 50% on signing the Grant Agreement (after identity and bank checks) · 10% at about 1 month (founders' agreement and a short venture plan) · 15% at about 3 months (a working MVP beyond the demo, validated with a few users) · 25% at about 6 months (a UAE-licensed company with the founders as shareholders). Third place need not incorporate; its validated MVP releases the rest. Timings are indicative; faster teams are paid sooner | Verified [S1] |
| Data | No real data provided; real identifiable patient data not permitted; use synthetic or open-source data | Verified [S1] |
| Prior work | Earlier code, research or designs may be used if disclosed at the start of the event | Verified [S1] |
| AI tools | Allowed if their use is disclosed in the pitch | Verified [S1] |
| IP | Teams keep the IP they create during the event, subject to the Terms and Conditions | Verified [S1] |
| Conduct | Applicants accept the Code of Conduct and the Terms and Conditions | Verified [S1] |
| Bring | Laptop, charger, any hardware, and the synthetic or open data you plan to use | Verified [S1] |
| Pitch length, Q&A length, live or recorded demo | Not on the page; probably in the handbook on 16 Nov | Not verified |
| Terms and Conditions, Code of Conduct, Grant Agreement | Named but not linked | Not verified |
| Incubation or pilots after the event | Not promised on the page; the stated path is the grant milestones | Not verified |
| Earlier "Ajyal" editions | None found; this looks like the first edition | Not verified |

### 1.1 Theme challenges, example use cases (paraphrased) and ReproSense fit

| Theme | Challenge, in our words | Organisers' example use cases (paraphrased) | ReproSense fit |
| --- | --- | --- | --- |
| Fertility | Use AI to raise fertility awareness, support earlier assessment and improve the experience and outcomes of fertility care | (a) reproductive-health education assistant for young adults; (b) a cycle and ovulation tool that points out patterns a clinician should look at, with PCOS as the example; (c) IVF journey companion (schedules, medicines, emotional support); (d) decision support on when and where couples should seek a fertility assessment | (b) = Noura's irregular-cycle and androgen-pattern cards; (d) = Mariam's fertility-timing card (ASRM, NICE NG257); (a) = the cited assistant. Not covered: an IVF companion |
| Women's Health | Use AI to improve women's health and maternal, newborn and early-childhood outcomes through prevention, early detection and better care journeys | (a) AI pregnancy monitor that flags early signs of gestational diabetes or pre-eclampsia; (b) menopause and hormonal-health assistant with symptom tracking; (c) autism early identification and family support; (d) breast and cervical screening reminders adapted to culture and language | (a) = Hessa's 24–28-week glucose screen and pregnancy warning signs (confirm pre-eclampsia warning signs are covered, since the theme names it); (b) = Layla's perimenopause flow; "care journeys" = Fatima's after-birth glucose follow-up. Not covered: autism, cancer-screening reminders |
| Longevity | Help people in Abu Dhabi prevent, detect early and manage the health risks of ageing | includes a metabolic coach with early prediabetes flags | Secondary fit: the postpartum glucose test after gestational diabetes is early type 2 diabetes detection |
| Alzheimer's | Early identification, monitoring and care for dementia, and support for caregivers | cognitive screening, brain-health risk, caregiver help, safety at home | No fit |

---

## 2. What the delivery partner (Upstart Bar) signals

Upstart Bar publishes short articles [S3]. Three from Sept–Oct 2026 read like a guide to how its people judge AI products
and young ventures. Our inference: judges linked to the delivery partner will reward disciplined testing and real
customer learning over polish.

| Article | Main point, in our words | What ReproSense should do |
| --- | --- | --- |
| Give AI Outputs an Acceptance Test (Oct 2026) [S4] | Agree what a good output must do before reviewing outputs; test on realistic and held-out cases (synthetic data where real data cannot be used); log failures by type (omissions, unsupported additions, unclear wording) rather than one score; measure how long a person needs to verify; a named person checks before anything is circulated | Present the 60-question AI test panel as an acceptance test: criteria written first, a held-out set, failure counts by type, time to verify. The care navigator's "nothing sent without approval" is the named-reviewer idea |
| Give Every Pilot a Decision Date (Sep 2026) [S5] | A pilot answers one question, with an agreed scope, success standard, decision date, decision-maker and possible outcomes (scale, change, pause, stop) | The LOI and pilot offer should name the question (does postpartum glucose-test completion rise?), the metric, the end date and who decides |
| The Customer Interview Is Not a Pitch (Sep 2026) [S6] | Ask about the last real time the problem happened, not hypotheticals; record observations separately from conclusions; look for differences between groups; tie each round to a decision | Turn docs/12 questions 4–5 ("Would a 2-page report save time?") into "tell me about the last patient who..." questions; report interviews as counted observations |

---

## 3. Earlier Abu Dhabi health hackathons and challenges: who won, and what they built

| Event | Date | Winner(s) and what they built | Lesson for ReproSense | Status |
| --- | --- | --- | --- | --- |
| DoH "Hack on Health" (with Abu Dhabi Digital Authority and IBM; chronic disease prevention) | Oct 2019 | A BITS Pilani student team won first place (AED 30,000) with "Salama", an app for preventing chronic disease | DoH's first hackathon was about prevention | Secondary [S31] |
| DoH AI Lab second healthcare hackathon, Krypto Labs, Masdar City | Jan 2020 | Winners not found | – | Index only [S40] |
| DoH × Danat Al Emarat "Preg-a-thon" (3rd edition, safe pregnancy), run by the DoH AI Lab | Winner announced 18 Mar 2021 | **UMOOMA**: an AI pregnancy app that records vital signs, asks evidence-based questions so physicians can assess remotely, and flags urgent cases from pain descriptions; meant to connect to the hospital's systems. Team: nurse, developer, data scientist, designer, physician. Prize: implementation at Danat Al Emarat. Five teams competed | DoH's last women's-health hackathon went to a pregnancy-risk tool built by a clinician-heavy team with a hospital integration path. The same three names (developer, data scientist, designer) also appear on the 2019 winning team | Secondary [S30][S31] |
| Abu Dhabi Global Health Week Smart Health Hackathon (with DoH) | Apr 2025 | **CloudCare** (AI, wearables and cameras that watch older people's health and call family) and **Limitless** (AI fitness platform for women that accounts for pregnancy and postnatal recovery). 100+ applications from startups and students of 11 UAE universities; 45 participants in 16 teams. Criteria: creativity, feasibility, real-world applicability, global impact. Prizes: cash, plus access to seed funding, incubation and possible pilots | Women's and maternal ideas win DoH events; feasibility and real-world use are explicit criteria | Verified [S32] |
| Future Health Challenge (Future Health × MIT Solve; disease prediction) | Winners 22 May 2026 | **ThinkMD** (decision support used by 9,000+ frontline workers in 885 facilities), **Vector Control Innovations / VectorCam** (AI mosquito surveillance), **Huna** (AI on routine blood tests to find people at higher cancer risk; 500,000+ screened in pilots). 393 submissions from 68 countries | Abu Dhabi's Future Health juries reward measured, real-world evidence. ReproSense should show measured results (even on synthetic data) and an honest route to real ones | Verified [S33] |
| HealthX (startAD × DoH accelerator; same "HealthX" brand) | Launched 15 May 2024; Cohort 2 listed | 30 life-science startups over two years; benefits include the DoH regulatory sandbox, de-identified UAE data, pilot-proposal help and licensing support. Of 21 Cohort 2 startups, one is fertility-related (GenEmbryomics, embryo genome sequencing) and none is women's-health software | Women's-health software is thin in DoH's accelerator pipeline; HealthX is a plausible next step. A formal link between this accelerator and the hackathon is not verified | Verified [S28][S29] |
| Future Health Digital Innovation Challenge 2026 (Hack2skill; co-created with Inception42, MBZUAI, Microsoft) | Registration 15 Oct–10 Nov 2026 (event page) or to 15 Nov (press release); prototypes due 20 Nov; awards at GITEX 7–11 Dec 2026 | Not yet run. Focus areas: Fertility (listed statements include male reproductive health, reproductive potential, inherited disease risk), Population Health, Wellbeing. USD 105,000 (50k / 35k / 20k). Six criteria: health impact and clinical relevance; technical depth; working demo; responsible AI, safety and data governance; scalability; commercial viability and path to pilot. Teams of up to 5 | A second chance with the same product; the prototype deadline falls inside build week. Whether entering both is allowed: not verified | Verified [S34][S35] |

---

## 4. DoH Abu Dhabi priorities that ReproSense should speak to

### 4.1 Abu Dhabi Programme for the Future of Reproductive Health (Sept 2026)
- Approved by Crown Prince Sheikh Khaled bin Mohamed bin Zayed at the Executive Council on 17 Sep 2026; DoH runs it [S8].
  Roadmap to 2030 [S7].
- Scope: prevention and preconception health, genetic screening (premarital and preconception), fertility diagnosis and
  treatment, and assisted reproduction including fertility preservation. Men and women share the responsibility [S7][S9].
- Target: IVF success from 59% today to 80% by 2030 [S7][S9]. Tools named: precision medicine, genomics (a database of
  nearly 1 million genomes), AI and health data analytics [S7].
- Capacity: more than 2,000 experts in more than 250 facilities; a new Global Reproductive Health Advisory Council;
  centres of excellence to be designated [S7].
- DoH Undersecretary Dr Noura Al Ghaithi said reproductive health begins long before treatment, with prevention and early
  screening (paraphrased) [S7]. The Crown Prince tied investment in reproductive health to the health of future
  generations (paraphrased) [S8]: a natural opening line for a hackathon named "generations".
- Not mentioned: PCOS, Malaffi, startups [S7].
- So what: present ReproSense as prevention and early-assessment infrastructure for the steps before IVF, not as an IVF
  tool. Prepare an answer to "what about men?" (the programme stresses both partners; NICE NG257 assesses both).

### 4.2 Women's and Children's Health Strategy: after-birth care
- DoH's Integrated Postnatal Care Programme (14 Jul 2025) sits under its Women's and Children's Health Strategy: a
  teleconsultation in the first days after discharge, two nurse or midwife home visits for mothers with complications or
  babies with special needs, and outpatient visits at 7–14 days and at six weeks [S15]. The announcement does not
  mention gestational-diabetes follow-up or depression screening [S15].
- A Postnatal Care Program Standard (DoH/ST/HQS/PCP/V1/2025, effective May 2025) and Circular 172/2025 (home-visit KPIs
  must be recorded and reported) exist, but we could not open either file on 6 Nov [S17][S18]. Index only.
- So what: ReproSense's after-birth stage (EPDS check, glucose-test window, warning signs, visit prep) is a companion
  to a DoH programme that already runs. Offer it as preparation for the six-week check.

### 4.3 Jawda quality KPIs: what clinics are already measured on
From DoH's Jawda Primary Care guidance, Version 7 (July 2023; file last modified Nov 2024), read in full [S16]:
- **PC008 Post-Partum Follow-Up and Care Coordination** (women's health, clinical effectiveness): the share of women
  with a postpartum visit 7–84 days after delivery who got all of: breastfeeding evaluation and education; postnatal
  depression screening; and a glucose test if they had gestational diabetes. Quarterly; higher is better; measured from
  claims and medical records.
- **PC007 Timeliness of Routine Antenatal Screening Tests**: hepatitis B, HIV, blood group and an obstetric panel. It
  does not include the 24–28-week glucose test.
- **Depression screening KPI**: accepts standard tools; the Edinburgh Postnatal Depression Scale is named as a perinatal tool.
- How it works: every primary-care provider names a staff member who submits Jawda data each quarter through the Jawda
  e-notification system; DoH may check it against Shafafiya claims. The KPIs apply to family-medicine and GP encounters,
  not specialist ones.
- Caveat: the guidance itself says to use the latest online version; a newer version may exist (not verified).
- So what: this is the strongest venture hook we found. A clinic pays because ReproSense helps a KPI DoH already audits.
  Show "PC008 completion: before → after" on the admin dashboard, with EPDS and the glucose test as the two parts the
  care navigator helps complete.

### 4.4 Paying for quality in fertility: Rewarding Exceptional Quality
- Launched 30 Jul 2025: DoH tracks providers against benchmarks and pays extra when goals are met; fertility first, other
  areas later. Context: 14 advanced fertility centres; 45 women's-health facilities; 2,800+ OB-GYN professionals
  (700 specialists and consultants, 375 midwives); 6,180+ IVF cycles in 2024 [S19]. Benchmarks not published (not verified).
- 695 IVF births and 14 licensed ART facilities in 2024 [S20].
- So what: for fertility clinics, structured pre-visit histories and follow-up tracking support quality reporting. Do not
  claim ReproSense raises IVF success.

### 4.5 Prevention and screening for families
- IFHAS (Abu Dhabi Public Health Centre's periodic screening) added a reproductive health screening for men and women
  aged 20–35, plus anxiety screening, clinical breast exams (20–39), blood counts and memory tests; Thiqa cardholders
  book through the Sahatna app (1 Aug 2025) [S21].
- For the Year of the Family 2026, DoH added family-health screenings to IFHAS from age 18, including reproductive
  health for young men and women. Premarital genetic testing covers 570+ genes; newborn screening 815+ conditions. DoH
  describes four pillars: prevention, quality of care, innovation, preparedness [S22].
- National Family Growth Agenda 2031 (6 Nov 2025): three pathways, one of them reproductive health; a task force of 20+
  government bodies; 2026 named the Year of the Family [S23].
- A women's and children's medical city was approved on 11 Jan 2024, including a relocated Corniche Hospital (opening
  2027) with fertility and ART services and a women's and children's mental health centre [S24].
- So what: ReproSense can be the record between screenings: it prepares people for the IFHAS reproductive screening and
  keeps track of what happens after it.

### 4.6 Data, sensing and prediction
- Future Health Summit, 20–22 Oct 2026, ADNEC, theme "To Sense is to Predict": continuous sensing and joined-up data to
  catch risks early [S12][S13]. Day-three session: "The Fertility Signal: Decoding Women's Lifelong Disease Risk", with
  Dr Noura Al Ghaithi [S12]. What was said there: not verified.
- DoH × ŌURA research partnership (7 May 2026): women's health first (preconception and perinatal care), then
  cardiometabolic risk; consent-based sharing, anonymisation and UAE-compliant storage; next phase is pilot design and
  ethics approval. DoH's chairman called women's health and fertility a priority (paraphrased) [S14].
- Malaffi, the emirate's health information exchange, run by M42's Abu Dhabi Health Data Services: 3.5 billion records,
  12.7 million patient profiles, 3,072 facilities, 53,476 authorised users, an AI Patient Risk Profile for chronic disease
  and acute events, and 160,000+ pharmacogenomics reports (14 Aug 2025) [S25]. Public third-party API or FHIR documentation:
  not found (not verified).
- UAE Healthy Future Study: an NYU Abu Dhabi cohort with DoH listed as a partner; Phase I about 15,000 adults; focus on
  diabetes and heart disease [S26]. Its PCOS paper found 25.9% self-reported PCOS among 1,040 Emirati women aged 25–67
  (recruited 2016–2022). Self-report means the figure may be imprecise [S27].
- So what: say that ReproSense senses the signals that are not in Malaffi (cycles, pain, mood, home readings), explains
  them with guidelines and hands them to the clinician whose system feeds Malaffi. Be ready for "how is this different
  from Malaffi's risk profile?": that is a clinician-side chronic-disease score; ReproSense is a patient-side
  reproductive history with a follow-up workflow.

### 4.7 Routes after the event
- HealthX (startAD × DoH) offers a regulatory sandbox, de-identified UAE data and pilot support [S28].
- DoH, ADIO and Masdar City agreed on 16 Apr 2025 to build health and life-sciences labs in Masdar City, with incubator
  and accelerator programmes [S36]. We found no official page describing the "DOH Incubator" venue as a programme (not verified).
- DoH runs an e-service for registering companies that provide healthcare services through mobile apps (application to
  Facility Licensing, information-security review, DED or ADGM licence, scope of service, technical form) [S37]. Index
  only: the page did not open, and whether ReproSense needs it is not verified. Ask DoH; add it to the 6-month milestone.
- Medical-device classification is a federal question; we did not check current rules in a primary source. Keep the
  docs/10 answer ("confirm classification with DoH before any pilot").

---

## 5. DoH AI rules: what a DoH juror will check

### 5.1 Responsible AI Standard (Verified, read in full) [S10]
Reference DoH/ST/DDGO/RAI/V1/2025; published and effective Oct 2025; revision due Oct 2026 (a revised version may
already exist: not verified); owned by DoH's Data and Digital Governance Office. It covers DoH and every licensed
healthcare entity that develops, buys or deploys AI, including agents and third-party products, over the whole
lifecycle. Our inference: a licensed clinic that buys ReproSense must apply this standard to it, so the vendor must
make that easy.

| Clause | Requirement, in our words | What ReproSense has, or should show |
| --- | --- | --- |
| 3.1.1.1 | Co-design with clinicians and patients; fit existing workflows | Clinician advisor and interviews; visit-note draft; FHIR export |
| 3.1.1.2 | Human in or on the loop; escalation steps by risk level | Care navigator only drafts; red flags → 998; EPDS item 10 → crisis path |
| 3.1.2.1 | Robust under failure; graceful fallback; failure-mode analysis before deployment; monitoring after | Demo-safe and deterministic modes; add a one-page failure-mode table |
| 3.1.3.1 | Validate against benchmarks on diverse data; keep records of results | AI test panel (grounded rate, refusals, red-flag recall) with saved results |
| 3.1.4.2 | Role-based access, multi-factor authentication, least privilege, all access logged | Roles, row-level security, hash-chained audit log; passkeys/MFA on the roadmap |
| 3.1.4.3 | Secure code review and vulnerability scanning (OWASP, NIST) | CI scanning (gitleaks, pip-audit, npm audit) |
| 3.1.4.4 | Privacy by design, minimum data, encryption, pseudonymisation; production data not used to train models | Alias-only profiles, field encryption, no training on user data |
| 3.1.4.5.1 | Compute and storage, including disaster recovery, inside the UAE; developer and support remote access only from inside the UAE | Hackathon: synthetic data plus the Claude API is fine. The production plan must name UAE-region hosting with UAE disaster recovery, a UAE-hosted model and UAE-based support |
| 3.1.5 | Data reflects the population; subgroup gaps flagged; bias checks traceable | Fairness check by nationality group and age band; a data card for the synthetic data |
| 3.1.6.1 | Tell patients and clinicians when AI contributes; plain-language summaries; patients may opt out of AI services; clear consent | AI disclosure in the footer; per-purpose consent includes the assistant; show an explicit AI opt-out |
| 3.1.6.2 | Document data sources, logic and decision criteria; end-to-end logs of inputs, outputs and versions | Rules in YAML with sources; "how this was produced" trace; versioned rule file |
| 3.1.6.3 | Explanations by role: clinician (rationale, confidence, next steps) and patient (plain language) | Patient card vs clinician SBAR handover; "record strength" instead of a probability |
| 3.1.7 | Named owners; clinicians keep final authority; override and audit trail | Clinician edits the visit note; approvals logged |
| 3.1.8 | Energy-efficient design; sustainability assessment for high-impact AI | Rules first, LLM only for wording; cached answers |
| 3.2.1.5 | Check open-data licences before use | Check the Kaggle PCOS dataset licence (research/README.md) |
| 3.2.5.3 | Datasheets or data cards for every dataset | Write a data card for the synthetic generator |
| 3.3.1.2 | Risk register; very high risk prohibited; high risk needs DoH conformity assessment before and after deployment; medium risk follows governance | Keep a risk register; argue for a medium or low tier (no diagnosis, clinician decides) |
| 3.4 | AI literacy training for staff and clinicians | Offer a short clinician onboarding in the pilot |

The standard also lists a DoH AI Policy (June 2025), an AI Risk Management protocol V1.0 (July 2025) and ADHICS (May 2024)
as related documents [S10]. We did not open the policy or the protocol (not verified).

### 5.2 AI Clinician Framework (21 Oct 2026)
Published at the Future Health Summit: a basis for how AI systems might one day be authorised to do clinical work that now
needs a licensed clinician. Competence is judged per clinical activity, physician oversight is required, systems must
refer to a physician when needed, and detailed thresholds are left to future policies [S11]. ReproSense is not an AI
clinician: it prepares information, never diagnoses and always routes to a clinician. Say this plainly; it supports a
lower risk tier.

---

## 6. Things in the kit to correct or sharpen

| Where | Issue | Suggested change |
| --- | --- | --- |
| docs/05, docs/10 | IVF "above 51%" is the Feb 2025 figure | 59% now, target 80% by 2030 (Sept 2026) [S7] |
| docs/05 | Malaffi "1 billion records" is old | 3.5 billion records, 12.7 million profiles, 3,072 facilities (Aug 2025) [S25] |
| docs/15 disclosure template | Says "no backend", but code from 5–6 Nov exists | List the repo, the commit range and what existed before 16 Nov (QUESTIONS #34) |
| docs/07 compliance map | Missing UAE disaster recovery, UAE-only support access, AI opt-out, data card, risk register | Add the five rows from section 5.1 |
| docs/12 first customer | Women's-health and IVF clinics only | Add primary-care networks for the after-birth module (PC008 applies to family-medicine and GP encounters) [S16] |
| docs/12 interview script | Questions 4–5 are hypothetical | Ask about the last real case [S6] |
| docs/10 Q&A | No answers on Malaffi's risk profile, men, AI opt-out | Add three short answers (sections 4.1, 4.6, 5.1) |
| Pregnancy rules | The theme names pre-eclampsia | Confirm the warning-sign card covers its urgent symptoms with 998 guidance (clinician sign-off needed) |

## 7. Questions to ask the organisers (for QUESTIONS.md)
1. Pitch length, Q&A length, and whether the demo must be live; screen and internet set-up.
2. How "Prototype and execution" treats code that was written before selection and disclosed.
3. Does every selected team pitch on 22 Nov, or is there a finalist cut on the day?
4. Is there a scoring sheet or scale for each criterion?
5. Links to the Terms and Conditions, Code of Conduct and Grant Agreement (IP, licence route).
6. Can a clinical advisor outside the 4-person team attend or answer questions?
7. May the same product also enter the Future Health Digital Innovation Challenge?
8. Does the technology partner (Replit) expect use of its platform, or offer credits?

---

## 8. Judging criteria → what a judge will look for → what ReproSense should show

| Criterion (weight) | Official description, in our words [S1] | Evidence a judge will look for | What ReproSense should show |
| --- | --- | --- | --- |
| **Venture potential (30)** | A clear customer, a route to adoption in the UAE health system, understanding of regulatory and data rules, a realistic milestone plan | A named buyer and budget owner; a price; interviews about real recent cases; an LOI or pilot with a question, metric and decision date; a KPI the buyer already reports; answers on the DoH AI standard and UAE hosting; milestones that match the 1-, 3- and 6-month grant tranches | Buyer slide: primary-care networks (Jawda PC008) and women's-health/IVF clinics (Rewarding Exceptional Quality); interview counts with two quotes; the LOI; a 12-week pilot with a decision date and PC008 completion as the metric; the section 5.1 clause map; UAE hosting plan; founders' agreement at month 1, MVP validated with 15–20 women and 3 clinicians at month 3, licensed company and DoH app-registration check at month 6 |
| **Problem and health impact (20)** | How big the problem is for people in Abu Dhabi, and how much the solution could improve outcomes, access or cost | Local numbers with sources; the DoH priority it serves; one measurable outcome; access (Arabic, free for women, privacy); a cost argument | 25.9% self-reported PCOS among Emirati women [S27] (with the self-report caveat) plus the docs/05 figures; links to the reproductive-health programme, the postnatal programme and the Year of the Family; outcome = postpartum glucose-test completion after gestational diabetes; Arabic, discreet mode, free for women |
| **Innovation and evidence (20)** | Improves on existing solutions and uses clinical or scientific evidence | A clear difference from trackers and from DoH's own tools (Malaffi risk profile, ŌURA research); guideline-traceable logic; validated questionnaires; AI tested against criteria set in advance, on held-out cases; honest limits; clinician review | One card traced from entries to rule to source; a tracker vs EHR vs ReproSense table; the AI test panel framed as an acceptance test with failure types; PBAC, EPDS, MRS, EHP-5; clinician sign-off on the rules; a "what we do not claim" line |
| **Prototype and execution (20)** | A working version of the core user journey, built after acceptance | Live and end-to-end with no dead buttons; patient, clinician and clinic views; real data flow; fallbacks; a clear line between build-week work and disclosed earlier work | The 3-minute path live (Noura → Hessa → Fatima → clinician → admin closing a gap); demo-safe mode; a backup video; a "built 16–22 Nov" list next to the disclosed baseline |
| **Team and pitch (10)** | A clear pitch, direct answers, commitment to continue | A multidisciplinary team with a clinical voice (DoH's 2021 winner UMOOMA had a nurse and a physician); short direct answers; AI use disclosed in the pitch (a rule); who keeps working after the event, and how | A named clinician advisor or fourth member; one-sentence answers to the docs/10 questions plus Malaffi, men and AI opt-out; an AI disclosure slide; post-event roles tied to the grant milestones |

---

## Sources (all accessed 6 Nov 2026)

| ID | Source | Type | Status |
| --- | --- | --- | --- |
| S1 | HealthX Ajyal Hackathon official page (EN/AR, including embedded theme data): https://upstartbar.com/ajyal/ | Official event page | Verified |
| S2 | Upstart Bar home page: https://upstartbar.com/ | Organiser | Verified |
| S3 | Upstart Bar insights index: https://upstartbar.com/insights/index.html | Organiser | Verified |
| S4 | Upstart Bar, Give AI Outputs an Acceptance Test (Oct 2026): https://upstartbar.com/insights/give-ai-outputs-an-acceptance-test.html | Organiser | Verified |
| S5 | Upstart Bar, Give Every Pilot a Decision Date (Sep 2026): https://upstartbar.com/insights/give-every-pilot-a-decision-date.html | Organiser | Verified |
| S6 | Upstart Bar, The Customer Interview Is Not a Pitch (Sep 2026): https://upstartbar.com/insights/the-customer-interview-is-not-a-pitch.html | Organiser | Verified |
| S7 | Abu Dhabi Media Office, Programme for the Future of Reproductive Health (17 Sep 2026): https://www.mediaoffice.abudhabi/en/health/abu-dhabi-programme-for-the-future-of-reproductive-health-an-integrated-ecosystem-shaping-standards-research-and-innovation/ | Government | Verified |
| S8 | ARN News Centre, Crown Prince approves the programme (17 Sep 2026): https://www.arnnewscentre.ae/en/news/uae/h-h-sheikh-khaled-approves-programme-to-boost-ivf-success-rates/ | Secondary (news) | Secondary |
| S9 | Gulf News, reproductive health programme through 2030 (18 Sep 2026): https://gulfnews.com/uae/health/abu-dhabi-unveils-major-reproductive-health-programme-through-2030-1.500679110 | Secondary (news) | Secondary |
| S10 | DoH, Responsible Artificial Intelligence (AI) Standard, DoH/ST/DDGO/RAI/V1/2025 (PDF): https://www.doh.gov.ae/-/media/B84FF5DD027846699C51F36C439A580F.ashx | Regulator | Verified |
| S11 | TradeArabia, DoH publishes AI Clinician Framework (21 Oct 2026): https://tradearabia.com/News/488291/DoH-publishes-AI-Clinician-Framework | Secondary (news) | Secondary |
| S12 | Zawya press release, Abu Dhabi Future Health Summit programme (Oct 2026): https://www.zawya.com/en/press-release/events-conferences/abu-dhabi-future-health-summit-opens-its-doors-tomorrow-1760403 | Press release | Secondary |
| S13 | Abu Dhabi Media Office, Future Health 2026 theme (16 Mar 2026): https://www.mediaoffice.abudhabi/en/health/future-health-a-global-initiative-by-abu-dhabi-reveals-2026-theme-as-to-sense-is-to-predict/ | Government | Verified |
| S14 | Abu Dhabi Media Office, DoH partners with ŌURA (7 May 2026): https://www.mediaoffice.abudhabi/en/health/department-of-health-abu-dhabi-partners-with-oura-to-launch-joint-research-programme-on-data-driven-preventive-health/ | Government | Verified |
| S15 | Abu Dhabi Media Office, Integrated Postnatal Care Programme (14 Jul 2025): https://www.mediaoffice.abudhabi/en/health/department-of-health-abu-dhabi-launches-integrated-postnatal-care-programme-to-enhance-maternal-and-infant-health | Government | Verified |
| S16 | DoH, Jawda Primary Care (PC) Service Quality Performance Indicators, Version 7 (PDF): https://www.doh.gov.ae/-/media/Feature/Muashir/Jawda/Jawda-Quarterly-Submission-Guidelines/PrimaryCare-JAWDA---Update-2022.ashx | Regulator | Verified |
| S17 | DoH, Postnatal Care Program Standard (PDF): https://www.doh.gov.ae/-/media/B164DC4D53DF4640A1DB640CBEED6228.ashx | Regulator | Index only |
| S18 | DoH, Circular 172/2025 (PDF): https://www.doh.gov.ae/-/media/Feature/Resources/Circulars/2025/172--2025.ashx | Regulator | Index only |
| S19 | Abu Dhabi Media Office, Rewarding Exceptional Quality programme (30 Jul 2025): https://www.mediaoffice.abudhabi/en/health/department-of-health-abu-dhabi-launches-rewarding-exceptional-quality-programme-recognising-excellence-by-healthcare-providers/ | Government | Verified |
| S20 | Abu Dhabi Media Office, IVF success above 51% in 2024 (3 Feb 2025): https://www.mediaoffice.abudhabi/en/health/abu-dhabis-ivf-services-ranked-among-the-most-successful-worldwide-in-2024-with-51-percent-success-rate/ | Government | Verified |
| S21 | Abu Dhabi Media Office, ADPHC expands IFHAS (1 Aug 2025): https://www.mediaoffice.abudhabi/en/health/abu-dhabi-public-health-centre-expands-comprehensive-screening-programme-ifhas-to-advance-community-health-and-preventive-care/ | Government | Verified |
| S22 | Gulf News, Abu Dhabi's new health equation (22 Aug 2026): https://gulfnews.com/uae/health/abu-dhabis-new-health-equation-from-prevention-to-precision-care-building-healthier-families-for-life-1.500648690 | Secondary (news) | Secondary |
| S23 | Mohamed bin Zayed official site, National Family Growth Agenda 2031 session (6 Nov 2025): https://www.mohamedbinzayed.ae/en/latest-news-listing/2025/11/UAE-President-attends-session-on-National-Family-Growth-Agenda-2031 | Government | Verified |
| S24 | Abu Dhabi Media Office, medical city for women's and children's health (11 Jan 2024): https://www.mediaoffice.abudhabi/en/health/khaled-bin-mohamed-bin-zayed-approves-establishment-of-medical-city-in-abu-dhabi-dedicated-to-women-and-childrens-health/ | Government | Verified |
| S25 | M42, Malaffi reaches 3.5 billion clinical records (14 Aug 2025): https://m42.ae/media-resources/news/malaffi-reaches-35-billion-clinical-records-setting-a-new-standard-for-healthcare-innovation-in-abu-dhabi/ | Operator | Verified |
| S26 | NYU Abu Dhabi, UAE Healthy Future Study: https://nyuad.nyu.edu/en/research/faculty-labs-and-projects/public-health-research-center/uae-healthy-future-study.html | Research institution | Verified |
| S27 | UAEU research portal, self-reported PCOS in the UAE Healthy Future Study (Int J Women's Health 2023;15:289–298): https://research.uaeu.ac.ae/en/publications/association-between-self-reported-polycystic-ovary-syndrome-with-/ | Peer-reviewed (abstract) | Verified |
| S28 | Abu Dhabi Media Office, startAD and DoH launch HealthX (15 May 2024): https://www.mediaoffice.abudhabi/en/health/startad-and-department-of-health-abu-dhabi-launch-healthx-to-advance-abu-dhabi-as-global-biotech-and-life-sciences-hub/ | Government | Verified |
| S29 | startAD, HealthX programme page (Cohort 2): https://startad.ae/programs/healthx/ | Programme | Verified |
| S30 | Danat Al Emarat, winner of the 3rd DoH health hackathon (2021): https://danatalemarat.ae/media-center/news/department-of-health-abu-dhabi-and-danat-al-emarat-hospital-announce-the-wining-team-in-the-3rd-edition-of-the-health-hackathon/ | Hospital (co-organiser) | Secondary |
| S31 | BITS Pilani, students win "Hack on Health" (2019): https://www.bits-pilani.ac.in/?p=4349 | University | Secondary |
| S32 | Abu Dhabi Media Office, ADGHW 2025 Smart Health Hackathon winners (18 Apr 2025): https://www.mediaoffice.abudhabi/en/health/abu-dhabi-global-health-week-2025-smart-health-hackathon-winners-revealed/ | Government | Verified |
| S33 | Abu Dhabi Media Office, Future Health Challenge winners (22 May 2026): https://www.mediaoffice.abudhabi/en/health/future-health-a-global-initiative-by-abu-dhabi-reveals-winners-of-future-health-challenge/ | Government | Verified |
| S34 | Hack2skill, Future Health Digital Innovation Challenge: https://hack2skill.com/event/futurehealthchallenge/ | Official challenge page | Verified |
| S35 | Zawya press release, Future Health launches the Digital Innovation Challenge (Oct 2026): https://www.zawya.com/en/press-release/companies-news/future-health-launches-global-challenge-to-move-health-innovation-towards-real-world-application-1680763 | Press release | Secondary |
| S36 | Abu Dhabi Media Office, DoH, ADIO and Masdar City labs agreement (16 Apr 2025): https://www.mediaoffice.abudhabi/en/health/department-of-health-abu-dhabi-abu-dhabi-investment-office-and-masdar-city-sign-agreement-to-establish-state-of-the-art-health-and-life-sciences-laboratories-as-part-of-the-health-endurance-longevity-and/ | Government | Verified |
| S37 | DoH e-service, registration of companies providing healthcare services via mobile apps: https://www.doh.gov.ae/en/eservices/mobile-apps-accreditation | Regulator | Index only |
| S40 | DoH event page, Health Hackathon 2020: https://www.doh.gov.ae/en/events/Health-Hackathon-2020 | Regulator | Index only |

Repo files used for context (not changed): docs/01, 05, 07, 09, 10, 12, 14, 15; knowledge_base/sources.yaml; HANDOFF.md;
BUILD_STATUS.md; QUESTIONS.md (#34); ASSET_INTEGRATION_REPORT.md section 8.

**Method note.** Searches used WebSearch; pages were read with WebFetch, or downloaded into a scratch folder and converted
to text (the official hackathon page and its embedded theme data, the DoH Responsible AI Standard PDF, and the DoH Jawda
Primary Care PDF). DoH's website refused connections several times on 6 Nov, so S17, S18, S37 and S40 are index only and
should be re-opened before the pitch. No numbers were estimated or invented; where a fact could not be confirmed it is
marked "not verified".
