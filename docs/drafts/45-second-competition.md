# Decision brief: the second competition (QUESTIONS #45), decide by 10 Nov

**Future Health Digital Innovation Challenge 2026**, organised by Future Health ("a global initiative by Abu Dhabi") and run on Hack2skill, co-created with Inception42, MBZUAI and Microsoft.
- **Checked again on 6 Nov 2026 (afternoon):** the official page, its FAQ (opened answer by answer) and the full Terms and Conditions.
- **Official page:** https://hack2skill.com/event/futurehealthchallenge/
- **Terms:** https://hack2skill.com/event/futurehealthchallenge/tnc

## The facts
| Fact | What the official page and terms say |
| --- | --- |
| Registration | 15 Oct – **10 Nov 2026** ("Registration closes on 10 November"). Free. |
| Prototype due | **20 Nov 2026**: a working prototype with technical documentation, assumptions, dependencies and limitations |
| Evaluation and awards | Evaluation 20–30 Nov; the top 3 present at GITEX, 7–11 Dec 2026. USD 105,000 (50,000 · 35,000 · 20,000) |
| Where | Online; only the top 3 present in person at GITEX |
| Team | Individuals or teams of up to 5, from any country; team lead 18+; each person in one team only |
| Existing product | **Allowed.** FAQ: "Ideas, existing solutions, and early prototypes are eligible." Say how mature it is and what you will build or improve |
| IP: FAQ | "You retain full ownership of your IP." You may be asked to share the code base for evaluation |
| IP: Terms | These prevail over the FAQ. Ownership stays with you, but: (1) **for 6 months after the challenge ends**, Future Health has a **right of first refusal** on any exclusive licence or sale of what you submitted (it gets 30 days to match a third party's offer); (2) it may publish the submitted ideas worldwide, free and with no time limit; (3) it gets a perpetual, non-exclusive licence to use content about the entry for marketing |
| Engagement | All team members must attend the online checkpoints and stay active on the challenge's channels (Slack, Discord, Telegram or WhatsApp), or the team may be disqualified |
| Data | No data is provided; use only data you have the right to use and declare every source. Our synthetic data fits |
| Judging | Health impact and clinical relevance · technical depth and architecture · working solution and demo quality · responsible AI, safety and data governance · scalability and deployment readiness · commercial viability and path to pilot |
| Other competitions | Not mentioned in the terms or the FAQ |

**Fit: better than this brief first said.** Fertility challenge 02, **"Reproductive Potential"**, asks how to help people and health systems spot changes in reproductive potential earlier. It describes the information as scattered across history, metabolic risks, reproductive conditions, lab results and longitudinal data, which is ReproSense's core. We would frame the entry as patterns plus guideline-timed assessment, never as a prediction.

## HealthX Ajyal (the official page, checked the same day: https://upstartbar.com/ajyal/)
- Earlier code, research or designs may be used if disclosed at the start of the event.
- The **prototype criterion** scores "a working version of the core user journey that it built after being accepted".
- Teams keep the IP they create during the event, "subject to the Terms and Conditions". The Terms and Conditions, the Code of Conduct and the Grant Agreement are **not published**.
- Nothing on the page mentions other competitions. Only the organisers can confirm (the #44 email).

## For
- Bigger prizes, the same city and a well-fitting challenge statement (Reproductive Potential).
- An existing product is allowed.
- The judging criteria match our strengths: safety, governance, evaluation and FHIR.
- Most of the entry is documents we already have.

## Against
- **20 Nov falls inside HealthX build week,** and the online checkpoints run through it.
- **The 6-month right of first refusal** limits exclusive deals with a clinic group or investor until about June 2027.
- The HealthX terms are unknown, and their grant needs a UAE company with the founders as shareholders by month 6.

## Recommendation
1. **Register by 10 Nov.** It's free, and registering doesn't commit us to submit. Put only the team details and a short problem statement in the form.
2. **Send the #44 organiser email now,** with the question "May a team also enter the Future Health challenge with the same product?"
3. **Decide by 18 Nov whether to submit.** Submit a light entry on 19 Nov, from existing docs with no new build work, only if:
   - HealthX says yes;
   - build week is on track;
   - someone with legal knowledge has read the right-of-first-refusal clause (this brief is not legal advice).
4. **Otherwise,** don't submit. Registration alone hands over no materials.

**Krishna decides.** Registration needs the team lead's account; nothing has been registered or submitted.

## Registration answers, ready to paste (team lead's Hack2skill account)
Sign in at https://hack2skill.com/event/futurehealthchallenge/ → Register Now. Hack2skill asks you to sign in with Google, GitHub or email; that step is yours. Fill only what the form asks for.

- **Team name:** ReproSense
- **Focus area and challenge:** Fertility · Reproductive Potential
- **One line:** A woman's own record of cycles, symptoms and lab results that turns scattered history into explainable patterns worth discussing and a doctor-ready report, so changes in reproductive potential are noticed and assessed earlier.
- **The problem:** What shapes reproductive potential is scattered: cycle history, symptoms, signs of conditions such as PCOS, lab results such as AMH, and metabolic risk. Most women get a meaningful assessment only when they are already trying to conceive or struggling, and a clinician has minutes to rebuild that history.
- **Maturity:**
  - A working prototype (web, English and Arabic).
  - Transparent rules that cite published guidelines: no diagnosis, no probabilities.
  - The entries behind every pattern.
  - An assistant that cites sources and routes red flags to emergency care.
  - A two-page doctor PDF, and a clinician view by consent.
  - A FHIR R4 export with 0 errors on the official HL7 validator.
  - Synthetic data only.
- **During the challenge:** document assumptions, dependencies and limitations, and refine the reproductive-potential pathway (guideline-timed prompts to seek a fertility assessment), without adding diagnostic claims.
- **Data:** synthetic data from our own seeded generator; no real patient data; every source declared.
- **Team:** Krishna Mathur (lead; AI and backend), Atharva Soundankar (design and frontend). Each person can be in one team only.
