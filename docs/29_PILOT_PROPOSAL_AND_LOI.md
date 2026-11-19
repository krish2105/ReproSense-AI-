# 29 · Pilot proposal for a clinic, letter-of-intent template, interview guides and evidence log

Written 19 Nov 2026 for the venture criterion (30% of the score). It turns the pitch roadmap ("one consented clinic
pilot, up to 20 women and 3 clinicians, March–May, measured on one number") into an offer a clinic can read, sign and
hold us to.

**Where it lives**
- Web: https://reprosense.vercel.app/pilot#proposal, in English and Arabic, under the pilot value calculator.
- PDF: `GET /v1/pilot/proposal.pdf?lang=en|ar`, one A4 page, the "Download the one-page proposal (PDF)" button. Code:
  `backend/app/reports/pilot_proposal.py`.
- The page and the PDF read the same strings (`pilotProposal` in `apps/web/messages/en.json` and `ar.json`). Change
  the wording there, not here; this file is the same proposal in prose, plus the templates the team uses.

**Honesty rules for this document**
- No clinic has signed anything, and we have no partnership with SEHA, PureHealth or any other network. Name a clinic
  only with its written permission.
- Every number is one of three things:
  - the app's own recorded data;
  - a source in `knowledge_base/sources.yaml`;
  - labelled a hypothesis or "our proposal".
- No market sizes here (see docs/19 §4 for the sourced ones).
- Synthetic data only until gates G1–G8 pass (docs/19 §2).

---

## 1. The proposal, in prose

### 1.1 Who it is for
A women's health or primary-care clinic in Abu Dhabi that sees women in pregnancy and after birth. An example is one
clinic in a large network such as SEHA (PureHealth). Primary care fits best: DoH's Jawda indicator PC008 counts
family-medicine and GP visits, not specialist ones (`doh_jawda_pc_v7`). A women's health clinic in a group that also
runs family medicine fits too (docs/19 §5).

### 1.2 What the clinic gets
- A private record for every woman who joins, in Arabic or English: cycles, symptoms, blood pressure, lab results and
  the DoH postnatal steps.
- A two-page doctor report before each appointment, plus a brief of what changed since her last visit. Both show the
  entries and the guideline behind every pattern.
- A follow-up list: the glucose test after gestational diabetes and the postnatal steps. Each is tracked from opened to
  booked to done.
- Reminder drafts that staff approve. The app never sends a message by itself.
- A clinic dashboard with counts only, and an audit log of every access.

### 1.3 How the pilot works
- **Women:** up to 20 adults in the clinic's care, in late pregnancy or the first weeks after birth, so the after-birth
  measures apply. Each one chooses to join and consents in Arabic or English. She can leave at any time.
- **Clinicians:** 3, chosen by the clinic, for example an OB-GYN, a family physician and a midwife.
- **Length:** 90 days, planned for March to May 2027 (docs/19 §3: months 4–6).
- **Roles:**
  - The clinic names a champion (a lead clinician), a decision-maker and its privacy officer.
  - We name a product lead, a clinical safety lead and a support contact.
  - Roles only in this repository, never names.
- **Start condition:** no real record before all of these are in place:
  - the pilot agreement and the data processing agreement are signed;
  - any ethics or quality approval is given;
  - the system runs on UAE hosting.
- **Small numbers:** in the Mutaba'ah cohort in Al Ain, 21.3% of 2,546 pregnancies met the IADPSG criteria for
  gestational diabetes (`bashir_2022_gdm_mutabaah`). At that rate, about 4 of 20 women would have had it (our
  arithmetic). So we report counts (x of n), not percentages, and call the pilot a test of the workflow, not an
  outcome study. No sample-size calculation exists (docs/19 A.3).

### 1.4 What we measure, and how the app counts it
Each measure comes from what the app already records: the dates on her entries, the follow-up steps and the audit
log. Nothing is estimated. Every table and field named here exists on `main`. The closed-loop metrics (#148,
`followups.loop_metrics()`, shown as `loop` on `/v1/admin/metrics` and `/v1/clinic-admin/dashboard`) already compute
measures 2–4 on the synthetic cohort: `postnatal_in_window`, `opened_to_booked` (median days) and
`record_opened_before_visit`, with groups under 10 hidden. In the pilot they run on the pilot clinic's women only.
With up to 20 women, most pilot groups are under 10, so network views hide them by design. The counts go only to the
clinic's own decision-maker, in the day-90 report, as x of n.

| # | Measure | How the app counts it | Basis |
| --- | --- | --- | --- |
| 1 | **Glucose test after gestational diabetes, within 12 weeks of birth (primary)** | Denominator: pilot women with gestational diabetes in this pregnancy who gave birth during the pilot. Numerator: those with either a glucose test result (OGTT) dated within 84 days of the birth, or the `postpartum_glucose_test` follow-up marked done by the clinic in that time. Both are dated: the OGTT is a lab result she confirmed; "done" is a `care_gaps` status change with its `audit_log` row. | Source: the glucose part of DoH Jawda PC008, "Post-Partum Follow-Up and Care Coordination", which looks at women seen 7–84 days after birth (`doh_jawda_pc_v7`). Local reference, not a baseline: 265 of 1,043 women (25.4%) came back for the test at one Al Ain hospital, 2013–14 (`agarwal_2022_gdm_followup`). |
| 2 | **Postnatal steps done on time** | Of the steps due during the pilot, how many were recorded inside their window. Steps: the check-in 2–3 days after leaving hospital, the visit 7–14 days after, the mood check 10–14 days after birth, and the 6-week visit. Recorded means a dated `postnatal_check` event or EPDS questionnaire in her record (`backend/app/services/postnatal.py`). | Source: DoH Postnatal Care Program Standard, 2025 (`doh_postnatal_standard_2025`). The 6-week window's end (week 8) and the assumed discharge day are our choices, shown as such in the app (CHANGE_LOG). |
| 3 | **Days from a pattern opened to the follow-up booked** | For each follow-up the rules open: days from the date it opened to the date the clinic marked it booked (the `care_gap_in_progress` audit row). The opening date is the observation's `created_at`. Reported as the median, with the count. | The app's own data. No target is set in advance. |
| 4 | **Reports read before the visit** | Of the pilot visits: how many had her shared report or pre-visit brief opened by a clinician before the visit was marked. Openings are dated audit rows: `view_record` (her record in the clinician view, which carries the report and the brief) or `view_shared_report` (her share link). The visit is `mark_reviewed` or the follow-up marked done. | The app's own data. No target is set in advance. |
| 5 | **Her satisfaction** | The System Usability Scale (SUS): 10 short statements, scored 0 to 100, in Arabic or English, at week 4 and week 12. For now it is a short form outside the app. Only the score is kept, never her name. | Source: Lewis 2018 (`lewis_sus_2018`). No pass mark set in advance. The Arabic wording needs the native-speaker review (docs/AR_REVIEW.md). |

**Targets and baseline.**
- Targets are agreed in the letter of intent, against the clinic's own baseline. No source sets one (docs/19 A.3).
- The clinic works out its current rate inside its own systems and shares only a count (x of n).
- It shares that count only when n is 10 or more and its privacy officer agrees. If n is under 10, the baseline stays
  with the clinic.

### 1.5 Data protection
- **Consent first:** each woman chooses to join and to share her record with the clinic, in Arabic or English.
- **Revocation:** she can stop sharing at any time in Privacy, and the clinic loses access at once. Access needs an
  active `care_share` consent (`clinician_can_see()` in `backend/app/db/schema.sql`).
- **UAE hosting in production:** health data, backups and any AI model stay in the UAE, as Federal Law No. 2 of 2019
  requires (docs/19 A.2). The demo holds fictional data only and is hosted outside the UAE (Render and Vercel,
  Frankfurt).
- **Audit log:** every access is a line in a hash-chained, append-only audit log, which she can read too.
- **No names in network views:** counts only, and any group under 10 is hidden (`K_MIN = 10` in
  `backend/app/api/admin.py`).
- **No advertising**, and health data is never sold.
- **At the end:** sharing stops, and data is returned or deleted as the agreement and the law allow. Records may have
  to be kept for at least 25 years (docs/19 A.2).

### 1.6 The 90 days
| Days | Step | What happens |
| --- | --- | --- |
| 1–14 | Set up | Agreements signed; the UAE-hosted system ready; one hour of training for the 3 clinicians; the clinic works out its own baseline. |
| 15–30 | Enrol | Up to 20 women join with consent. Their first reports reach the clinic before their visits. A weekly 30-minute review of safety and follow-ups starts. |
| 31–84 | Run | Follow-ups are opened, booked and done in the app. SUS at weeks 4 and 12. A mid-point review with the champion on day 45. |
| 85–90 | Decide | Counts for every measure, the safety log and the interview notes go to the decision-maker, who decides to continue, change or stop. |

### 1.7 What the clinic commits
- An internal champion: a lead clinician who meets us for 30 minutes each week.
- Clinician time:
  - one hour of training;
  - reading the report before each pilot visit;
  - marking follow-ups booked or done.
- A decision-maker and the privacy officer, for the agreements and the day-90 decision.
- Its own baseline, worked out inside its systems and shared only as a count.
- Honest feedback, recorded without names.

### 1.8 What we commit
- Set-up, training and support, free during the pilot.
- UAE hosting before any real record, and her data used for nothing outside the pilot.
- A weekly safety review, and any safety concern reported to the champion within one working day.
- Every pattern shows its entries and its source. No diagnosis and no risk score.
- A final report with measured counts only, whatever they show.

### 1.9 Price
- **During the pilot:** free.
- **After it:** AED 399 per clinician per month. This is a price hypothesis we are testing, not a quote (`/pricing`;
  docs/19 A.5 tests 299 / 399 / 549).
- **Open question:** `/pricing` still describes a paid pilot at AED 5,000–10,000. This proposal follows the free-pilot
  line from the build brief. The team picks one before the pitch (QUESTIONS.md).

### 1.10 Exit criteria at day 90 (our proposal, agreed in the letter of intent)
**Continue if all of these hold:**
- More women complete the glucose test within 12 weeks than at the clinic's own baseline, counted as x of n.
- At least 2 of the 3 clinicians read the report before most pilot visits and want to keep using it.
- No harm linked to the app, and no breach of consent or data rules.

**Stop if any of these happens:**
- An urgent warning the app should have shown was missed, or any harm is linked to the app.
- A consent, hosting or data-protection condition was not met.
- Clinicians stopped opening the reports, or the decision-maker sees no gain for the clinic's measures.

SMFM advises against tying this follow-up measure to payment for now, so we sell seats, not pay per closed follow-up
(docs/19 A.3).

---

## 2. Letter of intent (template, non-binding)

Use it after a conversation where the clinic showed real interest. Send it as an editable document; the clinic may
prefer its own form. This is not legal advice.

**Handling rules:**
- Keep the signed copy outside the repository.
- In this repository, record only the clinic type, the contact's role and the stage.
- Name the clinic in the deck or docs/19 only with its written permission.

It builds on `docs/drafts/26-letter-of-intent.md`, with the docs/19 §A.5 upgrades:
- a named champion and decision-maker;
- the primary measure plus one secondary;
- an agreed target and review date;
- ethics approval in the conditions;
- confidentiality as the only binding clause.

---

**[Clinic letterhead]**

Date: [day month year]

To: The ReproSense team (HealthX Ajyal 2026)

**Subject: Non-binding letter of intent to explore a 90-day consented pilot of ReproSense**

1. **About us.** [Clinic name] is a [women's health / primary-care / family medicine] clinic in [Abu Dhabi City / Al
   Ain / Al Dhafra], licensed by the Department of Health – Abu Dhabi.
2. **Our interest.** We are interested in a 90-day pilot of ReproSense with women who choose to take part. We
   understand ReproSense as a personal health record and visit-preparation tool. It shows patterns worth discussing
   with a doctor and tracks follow-ups such as the glucose test after gestational diabetes. It does not diagnose.
3. **Scope we would explore.**
   - Up to [20] consenting adult women in late pregnancy or after birth.
   - Up to [3] clinicians.
   - Starting no earlier than [month year].
4. **What we would measure.**
   - Primary: the share of pilot women with gestational diabetes who complete the glucose test within 12 weeks of
     birth, counted as x of n.
   - Secondary: [postnatal steps done on time / days from a pattern opened to the follow-up booked / reports read
     before the visit / satisfaction (SUS)].
   - Our baseline is our own aggregate count, worked out inside our systems. We share it only if n is 10 or more and
     our privacy officer agrees.
   - Target: [to agree]. Review date: [day 90 date]. Decision-maker: [role].
5. **Conditions.** Any pilot depends on all of the following:
   - a written pilot agreement;
   - a data processing agreement;
   - any required ethics or quality committee approval;
   - hosting of all health data, backups and any AI model in the UAE;
   - consent from each woman in Arabic or English, which she can withdraw at any time;
   - an audit log of every access;
   - network or management reports showing counts only, never names.
6. **Contact roles.** Clinic champion: [role]. Decision-maker: [role]. Privacy officer: [role].
7. **What this letter is not.** It is not a contract. It creates no obligation to buy, pay or take part. No patient
   data is shared under this letter, and ReproSense uses fictional data only until the conditions above are met. The
   only binding part is that both sides keep the other's non-public information confidential.

Signed for [clinic]: ______________________

Role: [role] · Date: [date]

Signed for ReproSense: ______________________

Role: [role] · Date: [date]

---

## 3. Interview guides (10 minutes each)

Built on docs/27 §6.
- Ask permission to quote without names before you start.
- Never ask for anyone's own health information. If someone shares it, don't write it down.
- Everything shown is fictional demo data.
- Record answers in the evidence log (§4), with roles only.

### 3.1 Clinicians (gynaecologist, family doctor, midwife or nurse): 5 questions
1. "How long does a cycle, pregnancy or after-birth history take in a visit today?"
2. *(Show the two-page report and the pre-visit brief for a fictional person.)* "Would you read this before a visit?
   What is missing, and what would you remove?"
3. "After a birth, which follow-ups get missed most often, and why? Is the glucose test after gestational diabetes
   one of them?"
4. "How does your clinic track PC008 or postnatal follow-ups today, and who reports them?"
5. "Would your clinic try this with up to 20 women and 3 clinicians for 90 days? Who would decide, and what would
   they need to see to continue?"

### 3.2 Women (18–45, Abu Dhabi): 5 questions
1. "When did you last see a gynaecologist or a doctor about your cycle or a pregnancy? How did you explain what was
   going on?"
2. "Do you track your period, symptoms or pregnancy anywhere? What is annoying about it?"
3. *(Show a fictional person's pattern card and its evidence.)* "Would this help you at your next appointment? What
   would you change?"
4. "Would you rather type, tap or speak? In Arabic or English?"
5. "Would you share it with your clinic? What would make you trust it, and what would make you stop sharing?"

---

## 4. Evidence log

Record every real conversation here on the day it happens:
- Roles and settings only, never names, phone numbers or clinic names (unless written permission is on file).
- Quote only with the person's permission, and only what they said.
- Empty rows are fine. An invented row is not.

| Date | Role (and setting) | Key quote (with permission) | Follow-up |
| --- | --- | --- | --- |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |

**LOI tracker** (stages: contacted, interviewed, LOI sent, LOI signed, pilot agreed):

| Clinic type | Contact role | Date | Stage | Next step |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |
|  |  |  |  |  |

---

## Sources
All in `knowledge_base/sources.yaml` (cite-only, `answers: false`), with our own summaries in `knowledge_base/summaries/`:
- `doh_jawda_pc_v7`: DoH Jawda Primary Care KPIs v7 (July 2023), PC008.
  https://www.doh.gov.ae/-/media/Feature/Muashir/Jawda/Jawda-Quarterly-Submission-Guidelines/PrimaryCare-JAWDA---Update-2022.ashx
- `agarwal_2022_gdm_followup`: Agarwal, Lal, Vyas, IJERPH 2022 (Al Ain). https://doi.org/10.3390/ijerph192113946
- `bashir_2022_gdm_mutabaah`: Bashir et al., Frontiers in Endocrinology 2022 (Mutaba'ah Study).
  https://doi.org/10.3389/fendo.2022.1069477
- `doh_postnatal_standard_2025`: DoH Postnatal Care Program Standard (May 2025).
  https://www.doh.gov.ae/-/media/B164DC4D53DF4640A1DB640CBEED6228.ashx
- `lewis_sus_2018`: Lewis, "The System Usability Scale: Past, Present, and Future", IJHCI 2018.
  https://doi.org/10.1080/10447318.2018.1455307
