# HealthX Ajyal application: copy-paste answers (closes Sat 14 Nov 23:59 GST)

Every member applies **separately** at https://upstartbar.com/ajyal/ with the **same team name**. The form takes about
11 minutes. The organisers review five things: how clearly the problem is defined and evidenced, what each applicant
contributes, whether the idea can be demonstrated at the showcase, how the skills complement each other, and how
likely the team is to continue. The exact form fields were not public when this was written, so adapt the length.

| Field | Answer |
| --- | --- |
| Team name | **ReproSense** (identical on every application, QUESTIONS #8) |
| Themes | Start of life: **Fertility** and **Women's Health** |
| Team | Krishna Mathur (AI and backend; university student, SP Jain), Atharva Soundankar (design and frontend), plus a clinical advisor we are recruiting. Check member list and roles before submitting |

## Problem (short)
Women in Abu Dhabi often reach a gynaecologist with months of scattered period logs, symptoms and lab results, and no
clear record of the pattern. Conditions such as PCOS and endometriosis are found late, and follow-ups after gestational
diabetes are easy to miss.

## Problem (with evidence)
- Up to 70% of women with PCOS are not aware of it (WHO fact sheet, 2026). In the UAE Healthy Future Study, 25.9% of
  1,040 Emirati women reported PCOS (Int J Women's Health 2023).
- Endometriosis took 11.6 years from first symptoms to diagnosis in a UAE study of 518 women (Frontiers in Global
  Women's Health 2021); the worldwide average across 23 studies is 6.8 years.
- About 1 in 5 pregnancies in Al Ain's Mutaba'ah study had gestational diabetes (21.3%). At one Al Ain hospital
  (2013–14 data), only 265 of 1,043 women came back for the glucose test after the birth (IJERPH 2022).
- DoH already measures this gap: Jawda primary-care indicator PC008 counts the after-birth follow-up.

## Solution
ReproSense is a private, bilingual (Arabic and English) record that turns a woman's cycle logs, pain scores and lab
results into a two-page report her doctor can read in a minute. Written rules from published guidelines point out
patterns worth discussing, show the exact entries behind each one, and never diagnose. With her consent, her clinic
sees a short handover and a list of follow-ups due, so missed checks like the after-birth glucose test get closed.

## Can it be demonstrated at the showcase?
Yes. A working prototype runs end to end on synthetic data: the woman's app, the doctor report, the clinician view and
the clinic network view with the PC008 follow-up panel, in English and Arabic.

## What I contribute (each member writes their own)
- **Krishna:** AI and backend: the rules engine, the assistant with cited sources and safety routing, the database
  with row-level security, tests and deployment.
- **Atharva:** design and frontend: the patient and clinician screens, Arabic right-to-left layout, accessibility,
  end-to-end tests.
- **Clinical advisor (when recruited):** reviews and signs the clinical rules, checks every health sentence, joins the
  pitch.

## Commitment to continue
We plan a three-month pilot with one Abu Dhabi clinic, judged on how many women complete the follow-ups they are due,
then a licensed company within six months, matched to the grant milestones.

## Prior work and AI use (must be disclosed)
Research, design and a working prototype were built on 5–6 Nov 2026, before selection, in our public repository
(github.com/krish2105/ReproSense-AI-). The full disclosure note is in docs/15_WIN_PLAN.md. AI tools were used for
research, specification, code assistance (Claude) and illustrations (ChatGPT). All data is synthetic.
