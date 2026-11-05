# 05 · Winning pitch and demo

**What wins a jury of regulators, clinicians and investors, and how ReproSense should spend its pitch**

Research for HealthX Ajyal (DoH Abu Dhabi), showcase Sun 22 Nov 2026. Researched on 6 Nov 2026; **every source was accessed on 6 Nov 2026**.

How to read this file
- Each claim carries a source tag such as [S12]. Section 13 lists every source with its URL.
- **Read** means I read the primary page or paper today. **Secondary** means I read a reputable summary but not the original. **Not verified** means I could not confirm it, so nobody should say it on stage.
- There are no quotations: everything is paraphrased. No numbers are invented. Anything in `[brackets]` is a placeholder. Fill it with a real figure or delete it.
- Repo facts (routes, eval numbers, rules) come from `CLAUDE.md`, `HANDOFF.md`, `docs/05`, `docs/10`, `docs/12`, `docs/15` and `backend/app/ai/eval_results.json` as they stood on 6 Nov.
- Sibling files from the same research day overlap with this one: `01-hackathon-and-doh-priorities.md`, `02-local-evidence-check.md`, `03-regulation-and-data.md`. Where I cite one of them, I say so. I did not re-check their findings.

---

## 0. Bottom line

1. **The official rules contain a trap. Deal with it this week.** The Prototype criterion (20%) gives points for a working core user journey *built after acceptance* (16 Nov). Earlier code is allowed only if it is disclosed at the start of the event [S1]. The `docs/15` disclosure template still describes an HTML mock-up with no backend. That is no longer true: the backend, the web app and the e2e tests were all built before selection (`HANDOFF.md`, git log). Rewrite the note so it is complete. Tag the repo as it stood on 16 Nov. Ask the organisers in writing how disclosed earlier code is scored. An incomplete disclosure costs far more than any feature is worth.
2. **Build the pitch around the jury's own rubric.** The jury combines clinical, investment and technology expertise with DoH representatives and health-tech founders [S1]. Venture (30%) asks for four things: a clear customer, a route to adoption in the UAE health system, an understanding of regulatory and data requirements, and a realistic milestone plan. Team and pitch asks for direct answers and a commitment to continue. A team needs 60/100 to be eligible for a grant [S1].
3. **Open with a local, peer-reviewed number that the demo then fixes.** At one Al Ain hospital (2013–14 data), only 265 of 1,043 women with gestational diabetes (25.4%) came back for the glucose test 4–6 weeks after birth [S44]. Fatima's care gap closing live answers that number. Nine items in `docs/05`, `docs/10`, `docs/12` and `docs/15` need fixing or qualifying before anyone says them out loud (see section 8).
4. **Speak the regulator's language.** DoH's own Responsible AI Standard (Oct 2025) requires the following: clinician co-design, human oversight with escalation, fallbacks, documented validation, compute and storage inside the UAE, subgroup fairness checks, role-specific explanations and audit trails [S8]. ReproSense already shows most of these. One mapping slide (section 5) earns cheap points on "regulatory and data requirements". **Never say "it is not a medical device."** The FDA's January 2026 guidance and NICE's framework both treat software that applies clinical thresholds, or sends data to clinicians, as territory that needs stronger evidence [S38][S39]. Say instead that classification is the regulator's decision.
5. **Venture points come from commitments, not adjectives.** The delivery partner writes that every pilot needs a decision date, named decision-makers and outcome measures [S2]. Investors trust a letter of intent only when it has triggers that lead to a paid contract [S26]. Ask for one pilot with one measure: more women completing the follow-ups they are due.
6. **Present the AI eval as an acceptance test.** The delivery partner writes that AI outputs need criteria fixed in advance, realistic and held-back test cases, and categorised failures rather than one score [S3]. The eval file is close to that shape: 60 fixed questions, 15 of 15 refusals, 100% red-flag recall and one listed failure. Add a held-back set and error categories, and show the failure. Honesty here is rewarded.
7. **Answer clinicians by showing, not telling.** The AMA's 2026 survey found US physicians rank clear liability rules as their top need. It also found 86% call privacy critical and 88% call validation critical [S30]. A 2025 review of 33 studies adds three more worries: workload, unreliable data and unclear roles [S31]. Keep a browser tab ready for each worry: the evidence chip, the trace, the red-flag card, the clinician view and the audit log.
8. **Label everything that is synthetic, and use "will" for anything not yet built.** That covers the 1,200-woman cohort, the KPIs and the fairness rates. It also covers UAE hosting, ADHICS, Malaffi and clinician sign-off. Judges penalise ambiguity and overstated features [S15][S16].

---

## 1. The jury and the ecosystem

| What we know | Status | Source |
| --- | --- | --- |
| DoH Abu Dhabi runs HealthX Ajyal and Upstart Bar delivers it. Replit is the technology partner; Socia and AI Tinkerers are community partners. | Read | [S1] |
| Themes are fertility, women's health, longevity and Alzheimer's. No real data is provided, so teams must use synthetic or open-source data. | Read | [S1] |
| Dates: applications close Sat 14 Nov at 23:59 GST, selection is Mon 16 Nov, build week runs 17–21 Nov, and the showcase is Sun 22 Nov at the DOH Incubator, Masdar City. Attendance is in person, and finalists pitch and demo in the evening. **The page gives no pitch length.** | Read | [S1] |
| The jury brings clinical, investment and technology expertise, plus DoH representatives and founders of health-tech companies. | Read | [S1] |
| Weights: Venture potential 30, Problem and health impact 20, Innovation and evidence 20, Prototype and execution 20, Team and pitch 10. | Read | [S1] |
| Prototype and execution means the team shows a working core user journey that it built after being accepted. | Read | [S1] |
| Earlier code, research or designs may be used if disclosed at the start of the event. AI tools are allowed if their use is disclosed in the pitch. | Read | [S1] |
| The grant pool is AED 30,000 (15k, 10k, 5k). Half is paid on signing. The rest follows at 1 month (founders' agreement and venture plan), 3 months (an MVP beyond the demo, validated with a few users) and 6 months (a UAE-licensed company). A team needs at least 60/100. | Read | [S1] |
| The delivery partner's own articles say: give every pilot a decision date; put AI outputs through an acceptance test; and treat a customer interview as observation, not a pitch. | Read | [S2][S3][S4] |
| HealthX (startAD and DoH, 15 May 2024) helps startups write a customised pilot proposal. It also offers access to DoH's regulatory sandbox and UAE de-identified data, pilot talks with providers such as NMC, Burjeel and Harley Street Medical Centre, DoH licensing opportunities and introductions to investors. | Read | [S5] |
| DoH has already run a hackathon in our domain: the 2021 safer-pregnancy "Preg-a-thon" with Danat Al Emarat. The winning app was built by a nurse, a physician, a developer, a data scientist and a designer. It was designed to plug into the hospital's own system, and the prize was a chance to be implemented there. The judges were DoH's strategic affairs director, DoH's healthcare policy and standards manager, the hospital's CEO and COO, and a provider group's chief commercial officer. | Read | [S6] |
| DoH's first hackathon (Oct 2019, run by its AI Lab) used DoH mentors from strategy, foresight, non-communicable disease and health financing. | Read | [S7] |
| Abu Dhabi's Programme for the Future of Reproductive Health (17 Sep 2026) names AI and health-data analytics among its tools. It sets 2030 targets, for example raising IVF success from 59% to 80%. | Read | [S9] |

**What this means (my inference, not a source):** the panel will test whether this could become a real UAE company that DoH would let near patients. In this ecosystem, past winners had clinicians on the team, fitted a named provider's workflow and offered a concrete pilot. So name the clinical advisor and the clinic only if they have agreed in writing, and end with a pilot ask.

**Rubric map: where the points are**

| Criterion (weight) | The jury's own description [S1] | What ReproSense must make visible |
| --- | --- | --- |
| Venture potential (30) | Clear customer, a route to adoption in the UAE health system, regulatory and data understanding, a realistic milestone plan | Clinics pay per seat; a named first clinic; the DoH Responsible AI mapping; month 1, 3 and 6 milestones matched to the grant tranches |
| Problem and health impact (20) | Significance for Abu Dhabi residents; better outcomes, access or cost | The Al Ain follow-up gap [S44]; one closed gap live |
| Innovation and evidence (20) | Better than existing options; backed by clinical or scientific evidence | Every card traces to a guideline source; validation plan using the V3 framework and the DECIDE-AI checklist [S34][S35] |
| Prototype and execution (20) | A working core journey built after acceptance | The demo path, plus an honest note of what was built 17–21 Nov |
| Team and pitch (10) | A clear pitch, direct answers, commitment to continue | One speaker; 30-second answers; "we continue after Sunday" |

---

## 2. How winning teams use three minutes

The event page gives no pitch length [S1]. This plan assumes 3 minutes plus Q&A, so confirm the slot with the organisers.

| Source | What it says (paraphrased) | What we do |
| --- | --- | --- |
| Harvard HSIL 2026 hackathon guide [S12] | A 3-minute pitch splits into about 10 s on the team, 20 s on the problem, 1 min on the product, 1 min of demo and 30 s to close. The panel has 3–5 judges covering clinical, technical and business expertise. Each criterion is scored out of 5: challenge, technology and innovation, implementation, team, pitch, **and Q&A**. | Use this split, and rehearse Q&A as a scored round. |
| JetBrains, notes from the judging table, June 2026 [S13] | Open with the problem. Do one thing well, in one flow. Show something working within about 90 s. Put the judge in the user's shoes. Say plainly what works and what does not. Pre-fill data and mock slow calls so nothing stalls. Rehearse out loud with a timer. | Have the product on screen by 0:30 and working by 0:50, in one continuous story: Noura, then her doctor, then the clinic network. |
| Devpost, Kessler [S14] | Set the scene in a few sentences, then demo the working project. Skip set-up such as creating accounts, keep any text you need ready to paste, and close with the vision in a sentence or two. | Use pre-logged-in browser profiles, with the Arabic question ready as a suggested pill. |
| Devpost, five judges [S15] | Winners cover every criterion, not just one. Ambiguity is a red flag. A polished front end over a thin back end loses, and so do overstated features. Finished beats half-built. | Make the run-of-show touch all five criteria. |
| YC, Ralston (2016) [S16] | Say plainly at the start what you do, and build around 3–4 points. Exaggeration is fatal. Size the market bottom-up. Use one speaker, few words per slide and no complex graphs, and speak slowly. Live demos often go badly in short slots. | One speaker and one driver. Three points: the gap is local and measurable; we never diagnose and always show the evidence; clinics pay to close gaps. |
| Paul Graham (2006–2010) [S17] | Your first sentence says what you make. Let someone else drive the computer so the speaker can face the room. Use only four or five specific numbers. Carry a local copy in case the network fails. | At most five numbers in the whole pitch, plus an offline demo-safe mode and a backup video. |
| MIT Hacking Medicine (DePasse et al., 2014) [S18] | Health hackathons rest on three principles: start from the problem, mix disciplines (clinicians with builders) and iterate fast. Local needs and feasibility matter. | Show the clinician on the team, and cite local data. |
| Stanford Biodesign need statements [S19] | A need statement names the problem, a specific population and a measurable outcome that decision-makers value. It contains no built-in solution, and every word is backed by data and by stakeholders. | Use the need statement below. |
| Sequoia business-plan template [S20] | Include a "why now": what changed, so that this is possible now and was not before. | One line on why now (see section 3). |
| Upstart Bar, customer interviews [S4] | Ask about the last real occurrence, not whether an idea sounds useful. Record what you observe apart from your conclusions. Do not average across segments. | Report interviews as observations, for example "[3 of 5] clinicians described the last missed after-birth glucose test", not "clinicians loved it". |

**Our need statement (Biodesign format, our words):** a way to bring a woman's months of cycle, pregnancy and after-birth history to her clinician in a usable, sourced form, for women of reproductive age in Abu Dhabi, so that more of them complete the follow-ups that guidelines recommend, starting with the after-birth glucose test after gestational diabetes.

**Seven rules for the pitch**
1. The first sentence says what ReproSense does. No welcome speech.
2. Give one local number, then go straight into the product. Use five numbers at most in total.
3. Get the product on screen by 0:30 and show it working by 0:50.
4. Follow one flow: one woman, her doctor, her clinic network. Everything else waits for Q&A.
5. Every time, say what is real, what is synthetic and what is planned.
6. One speaker, one driver and one Q&A captain who routes each question to the right person.
7. End on the ask, then the tagline.

---

## 3. What investors ask health-AI teams

Context. US digital health venture funding was $14.2B in 2025, and AI-enabled companies took 54% of it (37% in 2024) [S23]. In Q1 2026, 12 mega-deals took 59% of all capital. Rock Health stopped tracking "AI deals" separately because AI is now standard, and investors favour AI built into complex workflows [S24]. **So don't pitch "AI". Pitch a workflow that closes a measurable gap, with AI underneath.**

| What they ask | What they are testing | Our best answer today | Gap to close by 22 Nov | Source |
| --- | --- | --- | --- | --- |
| Is the need big and urgent? | Size of the pain, not of the market | The Al Ain follow-up gap, at 25.4% [S44]. After gestational diabetes, the risk of type 2 diabetes is about 7–10 times higher [S48][S49] | One clinician observation, with permission to quote it | [S21] |
| Whose money do you save, and can you show a return within a year? | Buyer economics | Fewer missed follow-ups, shorter history-taking and quality reporting | Ask 3 clinic managers what one missed follow-up costs them | [S21] |
| Who uses it, who chooses it, who pays? | A clear buyer | Women use it free, clinicians choose it, clinics pay per seat. Later, payers and employers pay for closed gaps (`docs/12`) | A price point validated in interviews | `docs/12` |
| How will you reach the market? | A realistic route to market where most providers are small or mid-sized | Start with one women's-health or IVF clinic group. HealthX offers pilot talks with healthcare partners, and its ecosystem includes NMC, Burjeel and Harley Street Medical Centre [S5] | A named first clinic | [S21][S5] |
| Small clinics churn and sign small contracts. Then what? | Unit economics | A network licence for clinic groups (`docs/12`) | An indicative annual licence price | [S25] |
| Who owns the AI, data and IP? Can you legally use the data? | Data rights, consent, transfers across borders | Synthetic data only today, a consent ledger for each purpose, and production hosting inside the UAE as DoH requires [S8] | A one-page data-processing outline | [S22] |
| What if your model vendor raises prices or disappears? | Dependence on one foundation model | A provider-agnostic LLM client. Tests and the demo run without any model (the eval file says extractive mode, no LLM) | One sentence in Q&A | [S22] |
| What happens when the model or the rules change? | Change control | Rules live only in `rules/clinical_rules.yaml` and need sign-off. CI runs 104 backend tests plus the e2e suite | Show the test count | [S22] |
| Who is responsible for an AI recommendation? | How liability is split | The clinician decides, every flag shows its basis, and the navigator only drafts | Liability wording for the pilot contract | [S22] |
| Why now? | Timing | DoH's 2030 reproductive-health roadmap names AI and data (Sep 2026) [S9]. DoH's Responsible AI Standard gives a clear rulebook (Oct 2025) [S8]. Investors now fund AI that lives inside a workflow [S24] | — | [S20] |
| Traction? | Evidence of demand | Interviews, plus a letter of intent with triggers | Real numbers only | [S26] |
| How big is the market? | Bottom-up sizing | Clinicians × seat price × 12 | The count of women's-health clinicians in Abu Dhabi: **not found today**. Check DoH open data | [S16] |

On the big women's-health number: the World Economic Forum and McKinsey Health Institute report (Jan 2024) is widely quoted. It says women spend about 25% more of their lives in poor health, and that closing the gap could add about $1 trillion a year by 2040. I could not open the primary page today, so treat this as **secondary** [S29]. If it is used at all, use it as impact context, never as our market size.

---

## 4. What clinicians ask about safety and workflow

These concerns are documented:
- **AMA survey, released 12 Mar 2026.** 81% of US physicians now use AI (38% in 2023). Clear liability rules rank as their top regulatory need. 86% call data privacy critical, 88% call safety and efficacy validation critical, and 85% want a say in adoption decisions. Nearly half strongly oppose patients using AI to interpret radiology or pathology results [S30].
- **2025 systematic review of 33 studies on app and wearable data.** Attitudes were mostly positive. Clinicians still worry about workload, data security and reliability, unclear roles and medico-legal liability, and poor fit with record systems [S31].
- **2024 JMIR systematic review of 16 studies.** Clinicians used patient-generated data most for lifestyle conditions and in uncertain areas such as infertility. Some felt imperfect data beats having none. Real-world use is still rare [S32].
- **WHO guidance on large multimodal models (18 Jan 2024).** The risks it names include false, biased or incomplete statements and automation bias (people trusting the model too much), among both clinicians and patients. It asks developers to involve clinicians and patients early and to design for well-defined tasks [S33].

| What a clinician will ask | Show (tab) | Say (one line) |
| --- | --- | --- |
| Why did it flag this? | An insights card. Tap an evidence chip, the timeline jumps to that day, then open "How this was produced". | Every line traces to her own entries and a named guideline. |
| If she shares this and I miss something, is that on me? | The share screen (consent, 7-day expiry, revoke) and the clinic list (consented patients only, red flags first) | Nothing reaches you without her consent, and urgent entries send her to 998 straight away rather than into your inbox. |
| Will this add to my workload? | The clinician patient page: SBAR summary, chart, evidence and her questions | You read a one-minute summary, not raw logs, and the clinic decides who reviews and when. |
| Can I trust what she logged? | The record-strength meter, self-reported labels, and the PBAC, EPDS and MRS questionnaires used as published | It is her history, labelled as hers. It organises the conversation and does not replace your examination or tests. |
| Does the AI make things up? | An assistant answer with citation chips, then a question it has no source for | Rules decide, sources ground, the model only words the answer, and a checker removes unsupported sentences. |
| Will patients be frightened, or misread their results? | Card wording ("a pattern worth discussing", questions for the doctor). The lab upload shows extracted values for her to confirm, not an interpretation. | We never tell her what condition she has. We help her ask better questions. |
| Is it validated? | The `/status` page (internal eval) | Verified, but not yet clinically validated. The pilot is the validation study. |
| Does it work in Arabic, and for all our patients? | An Arabic answer, then the admin fairness check | The same rules apply to everyone, and we watch the rates by group. |

**Two leave-behinds worth making**
- **A one-page model card** using the fields CHAI proposed for health-AI "nutrition labels" [S36]: who built it, intended uses and uses it is not meant for, intended populations, model and data types, performance measures, security and compliance, maintenance, known risks and bias, and supporting evidence.
- **A pre-mortem against the NHS AI buyer's checklist** [S37]. Its ten questions: is AI the right tool; is procurement fair; does the product do what it claims; does it meet regulation; are users ready; data sharing and privacy; IP; infrastructure; integration; long-term support.

**Validation words clinicians and regulators recognise.** These come from the V3 framework [S34]:
- **verification**: the software does what it was built to do;
- **analytical validation**: each measurement or extraction works;
- **clinical validation**: the output means something for its intended use.

Write up the pilot with DECIDE-AI, the reporting guideline for early clinical evaluation of AI decision support (2022) [S35]. Show the three stages as a ladder on the evidence slide: "verified now, analytical next, clinical in the pilot".

---

## 5. What regulators will ask (the DoH lens)

| Topic | What the source says | What it means for us | Source |
| --- | --- | --- | --- |
| Wellness or device (US reference) | The FDA's revised guidance (6 Jan 2026) widened "general wellness". But a product falls outside it if it uses clinical thresholds, labels results as abnormal, tells users to seek care because of a result, or prompts a specific clinical action. Clinician-facing decision support stays outside device rules only if, among other conditions, the clinician can independently review the basis. | Our patient side applies guideline thresholds (for example, cycles longer than 35 days) and suggests a talk with a doctor, so we cannot claim to be a wellness app. Our clinician side shows its basis, which is the right design. | [S38] |
| Evidence tier (UK reference) | NICE's evidence standards framework (updated 9 Aug 2022) puts a diary that keeps data with the user in tier B. A tool that records data and sends it to a professional for later review sits in tier C, in the group "inform clinical management". Tools that spot early signs or guide the next test sit in a higher tier C group, "drive clinical management". | Expect tier C evidence demands, and design the pilot to meet them. | [S39] |
| UAE device regulator | The Emirates Drug Establishment, set up 29 Sep 2023, is the UAE's only federal regulator of medical and pharmaceutical products, devices included. Its page does not mention software as a medical device. | Ask DoH and the EDE for a classification before any real patient. | [S10] |
| DoH AI rulebook | The Responsible AI Standard (mapped below) sets risk tiers. Very high risk is not allowed. High risk needs a conformity assessment with DoH's Data and Digital Governance Office before and after deployment. Medium risk carries governance and risk-reporting duties, and low risk needs monitoring. | A pilot clinic will need our risk assessment, so bring a draft risk register. | [S8] |
| Health advertising | DoH circular 26/2023: licensed facilities train on DoH's health media and advertising guidelines, then log their advertising and communication materials on DoH systems. | Marketing claims will be watched. Keep the same non-diagnostic, sourced language off stage too. | [S11] |
| Privacy precedent (femtech) | The FTC's final order against Flo (22 Jun 2021) required consent before sharing health data, an independent privacy review, notice to users, and deletion requests to third parties. A US jury (1 Aug 2025) found Meta liable under California privacy law for collecting Flo users' reproductive data through its SDK. | No third-party SDKs or trackers on health screens, and say so out loud. | [S40][S41] |

**DoH Responsible AI Standard mapped to ReproSense.** This is one slide, and the cheapest points available on "regulatory and data requirements" [S8].

| Clause (paraphrased) | ReproSense evidence | Status on 6 Nov |
| --- | --- | --- |
| 3.1.1.1 Co-design with clinicians, patients and technologists; fit existing workflows | Clinical advisor and interviews; clinician view, SBAR, visit mode, FHIR R4 export | Advisor and interviews: `[status]`. Product: built |
| 3.1.1.2 Human in or on the loop; escalation by level of risk | Red flags first (998); EPDS item 10 opens the crisis path; the clinician decides; the navigator only drafts | Built |
| 3.1.2 Robustness: graceful degradation and fallbacks | Deterministic mode, offline demo-safe mode, a static fallback for 3D | Built (re-test with Wi-Fi off) |
| 3.1.3 Validation against benchmarks, with documented results | 104 backend tests, the e2e suite, the 60-question AI eval in `eval_results.json` | Built (internal only) |
| 3.1.4.4 Privacy by design; production data never used to train models | Data minimisation; no training on user data | By design |
| 3.1.4.5 Compute, storage and disaster recovery inside the UAE; remote access from inside the UAE | Production plan: a UAE region and a UAE-hosted model. The hackathon runs synthetic data on non-UAE cloud | **Planned**: say "will" |
| 3.1.5 Fairness: check coverage of subgroups and detect bias | The admin fairness check by nationality group and age band, which flags gaps over 5 points | Built (synthetic) |
| 3.1.6 Disclose AI use; explanations for each role; traceability; consent and opt-out | AI disclosure in the footer; plain-language patient cards and a clinician SBAR; audit log; consent for each purpose | Built |
| 3.1.7 Named owners; clinicians keep the final say; override and audit trail | Clinician review with an editable visit note; the audit verification endpoint | Built |
| 3.3 Risk assessment, risk register, residual risk, reporting to DoH | — | **Gap**: write a one-page risk register |

---

## 6. Letters of intent and pilot commitments

**How investors read letters of intent** [S26]: list who signed and give one aggregate figure (booked value or qualified pipeline) in the deck, with the letters themselves in the appendix. Many letters never convert. Investors trust them only when they set milestones, decision gates and a stated value if the deal goes ahead.

**How pilots turn into contracts** [S2][S27][S28]:
- Agree, before starting, what the pilot must answer, a review date, the evidence to be presented and who decides. Measure outcomes, not activity [S2].
- Agree 2–4 success measures and the decision point up front. Set a fixed timeframe, get an executive sponsor and pick a site with spare capacity [S27]. Some health-system leaders admit a pilot can be a polite "no" [S27].
- Ask what happens if the pilot succeeds, and walk away if the partner cannot say. Avoid free pilots. Operational measures such as time saved or follow-ups completed are valid success measures [S28].
- In this ecosystem the reward is a pilot. HealthX helps teams write pilot proposals [S5], and the 2021 DoH pregnancy hackathon winner got a chance to be implemented at the partner hospital [S6].

**Upgrade the LOI template in `docs/15`.** Keep it non-binding and add five things:
1. A named clinical champion, and the person who signs purchases.
2. Two or three success measures with a baseline. Examples: the share of after-birth glucose tests completed among pilot patients who had gestational diabetes; clinician minutes to understand a new patient's history; the share of visits where the woman brought a report.
3. A decision date, and what happens on success: a paid annual licence, or a paid pilot at `[AED __]`.
4. The safeguards that make it easy to sign: data-protection review, DoH requirements, and any ethics approval needed before real patients.
5. Confidentiality as the only binding clause.

Suggested wording (our own words; put it on the clinic's letterhead):

```
[Clinic], a women's health clinic in [area], intends to pilot ReproSense, a non-diagnostic tool that helps
patients bring a structured cycle, pregnancy and lab history to appointments and helps our clinicians track
recommended follow-ups. Clinical champion: [name, role]. Decision-maker: [name, role].
Pilot: [3] months, up to [3] clinicians and [20] consenting patients, starting after [month/year], subject to
data-protection review, DoH requirements and any required ethics approval.
We will judge success on: (1) after-birth glucose-test completion among pilot patients who had gestational
diabetes, compared with our current rate; (2) clinician time to understand a new patient's history;
(3) [measure]. Review date: [date]. If the measures are met, we intend to discuss a paid licence at
[indicative price or range]. This letter is non-binding and creates no financial obligation, except that
both parties keep discussions and any shared material confidential.
```

On stage, call it what it is: a non-binding letter of intent. Never say "contract", "partner" or "customer" unless money has changed hands or an agreement has been signed.

---

## 7. Mistakes that lose (and our guard)

| Mistake | Evidence | Our guard for 22 Nov |
| --- | --- | --- |
| Incomplete prior-work disclosure | Earlier code must be disclosed at the start, and prototype points are for work built after acceptance [S1] | Rewrite the disclosure note (see the checklist); tag the repo at its 16 Nov state; ask the organisers how earlier code is scored |
| A dead demo or a network failure | Carry a local copy [S17]; mock slow calls and pre-fill everything [S13]; live demos often fail in short slots [S16] | A local build plus demo-safe mode; a backup video; a second laptop; a hotspot; the dead-demo protocol in section 9 |
| A feature tour instead of one flow | One clear flow beats five half-finished features [S13] | Show three women at most, and mention the other life stages in one sentence |
| Overclaiming AI performance | In 2018 Babylon claimed its symptom checker matched doctors. UK medical bodies publicly doubted it, and a Lancet letter argued the vignette study was small and not independently reviewed [S42][S43] | Say "verified, not yet clinically validated", and quote no accuracy figure |
| Unsourced or mismatched numbers | Exaggeration is fatal [S16], and judges flag ambiguity [S15] | Fix the claims in section 8, and put a source line on every slide that shows a number |
| Diagnosis language or risk scores | Our own product rules 1–2; the FDA wellness boundary [S38]; NICE tier C [S39] | Run the banned-phrase guard on all UI text and slides; use the Q&A wording in section 10 |
| Synthetic KPIs heard as real outcomes | Ambiguity reads as a red flag [S15] | Say "in our synthetic 1,200-woman cohort", and keep the badge visible |
| Compliance described as done | — | Say "mapped to ADHICS; the formal assessment is a month-6 milestone" and "will run in the UAE" |
| Vague privacy answers | The Flo cases [S40][S41] | Name four controls: consent, expiring and revocable links, the audit log, no trackers |
| Ignoring a criterion | Winners cover every criterion [S15] | Make the run-of-show touch all five |
| Reading slides, too many words, running over time | [S16][S12] | At most seven words per slide; stop speaking by 2:55 |

---

## 8. Claims audit: fix these before the first rehearsal

| Claim (where it appears) | What the source actually says | Verdict | Say instead |
| --- | --- | --- | --- |
| "1 in 4 Emirati women reported PCOS, yet one hospital study found it coded for under 2%" (the `docs/10` opener) | 25.9% self-reported PCOS among 1,040 Emirati women aged 25–67 in the UAE Healthy Future Study, 2016–2022 [S45]. 1.6% of 64,722 women aged 15–45 at one Dubai hospital had a PCOS ICD-10 code, 2017–2022 [S46]. | Different groups, ages and methods, so a clinician can fairly call it apples and oranges. Track 02 reaches the same verdict. | Lead with the Al Ain number instead. If the PCOS point stays: "In a national UAE study, about 1 in 4 Emirati women reported PCOS. In one Dubai hospital's records, under 2% of women had a PCOS code. Different groups and methods, but the story and the record do not line up." |
| "Endometriosis takes over 6 years to recognise" (`docs/10`; `docs/05` cites a 2024 medRxiv preprint) | A peer-reviewed BJOG 2025 review of 17 studies since 2018 found reported times ranging from 0.3 to 12 years, with delay still present [S47]. Track 02 reports that the preprint is now published (6.8 years) and that a UAE study found 11.6 years. I did not re-check either. | The preprint has been superseded. | "Published studies still report delays of up to 12 years before endometriosis is recognised" [S47]. |
| "Women with GDM ~8× more likely to develop type 2 diabetes" (`docs/05`, cited to PMC6916174) | That paper is a 2020 qualitative review of women's views on screening, and its abstract gives no risk figure [S50]. Meta-analyses give a relative risk of 7.43 (Lancet 2009, 20 studies, 675,455 women) [S48] and 9.51, nearly tenfold (BMJ 2020, 20 studies) [S49]. Track 02 traced the 8× to a different Dennison paper (2021, relative risk 8.3). | The citation is wrong. | "About 7 to 10 times higher risk" [S48][S49], or fix the citation as Track 02 suggests. |
| "Postpartum diabetes screening after GDM often 20–58% in year 1" (`docs/05`, Diabetic Medicine 2016) | The source was blocked today. Track 02 says the range is background that a UK letter quotes. | Not verified. | Use Al Ain: 265 of 1,043 women (25.4%) came back for the glucose test 4–6 weeks after birth, at one hospital, in 2013–14 data [S44]. A 2023 review of 40 studies found that reminders, education and more flexible testing raise attendance [S51], which is what the navigator and the care-gap list do. |
| "248 follow-ups across 1,200 women, 101 closed" (`docs/10`) | These are numbers from the synthetic cohort. | True only as synthetic. | "In our synthetic 1,200-woman cohort…" |
| "UAE-hosted, ADHICS-mapped" (`docs/10` business slide) | Nothing is deployed yet; the data is synthetic only (`HANDOFF.md`). | Wrong tense. | "Will run on UAE infrastructure, as DoH's AI standard requires [S8]. Controls are mapped to ADHICS, with the formal assessment by month 6." |
| "Malaffi-ready FHIR integration" and "Clinician-reviewed rule library" (the `docs/12` moat) | FHIR R4 export exists, but there is no Malaffi connection. The clinician sign-off on `rules/clinical_rules.yaml` is still on the `docs/15` to-do list. | Overstated until done. | "FHIR R4 export today; a Malaffi connection would follow DoH's process." Say "clinician-reviewed" only after the advisor signs the rules header. |
| "Is this a medical device? A non-diagnostic information tool" (`docs/10` Q&A) | See section 5. | Keep it, but add that classification is the regulator's decision. | Use Q1 in section 10. |
| Disclosure note: "An interactive HTML mock-up (no backend)" (`docs/15`) | The backend (104 tests), the web app and the e2e suite were built before selection (`HANDOFF.md`, git log). | Incomplete. | List all earlier code, research and designs, with dates [S1]. |

---

## 9. The 3-minute run-of-show

Roles: **Speaker** (one voice throughout), **Driver** (keyboard and clicker) and **Q&A captain** (sends each clinical, technical or business question to the right person).

Set-up, 30 minutes before:
- Use three browser profiles, because the demo login is one `rs_token` cookie per site and a single profile holds only one role. Profile A is Noura (patient), B is the clinician and C is the admin. Pre-open each route below in its own profile.
- As admin, run the demo reset, then a full practice run, then reset again. Fatima's gap must be open when you start.
- Pre-generate Noura's PDF in a tab, and queue the Arabic suggested question.
- Cue the backup video, muted, in a separate window, and keep a screenshot deck ready.
- Use the light theme unless dark mode was tested on that projector. Set browser zoom to 110–125%.
- Before rehearsal, check every detail against the live data: Noura's cycle range and the exact admin counts.

| Time | Screen (route) | The one sentence | What judges should notice | If it breaks |
| --- | --- | --- | --- | --- |
| 0:00–0:10 | Landing page `/`, with the "Demo data — fictional" badge visible | ReproSense turns a woman's scattered cycle, pregnancy and lab history into a sourced two-page summary for her doctor, and shows clinics which follow-ups are slipping. | What it is, in one breath | Static hero image |
| 0:10–0:30 | One number slide, with the source line: Agarwal et al. 2022, 1,043 women, 2013–14; De Corte et al. 2025 | At one Al Ain hospital, only one in four women who had diabetes in pregnancy came back for the glucose test after birth, and endometriosis can still take years to be recognised, because her story reaches a short visit in pieces. | A local, peer-reviewed number for Abu Dhabi | The slide is static |
| 0:30–0:50 | Profile A: `/app` home, then `/app/timeline` (12 months) | Noura is fictional, like all our data: here are twelve months of her own logs in one view, and several of her cycles ran longer than 35 days. | A working product by 0:50 | Next pre-opened tab |
| 0:50–1:15 | `/app/insights`: tap an evidence chip so the timeline jumps to that day, then open the trace | ReproSense never diagnoses: each card names the pattern, shows the exact days behind it, links the 2023 international PCOS guideline rule it comes from, and suggests questions for her doctor. | Rules, evidence and a source, with no probability anywhere | Screenshot slide |
| 1:15–1:30 | `/app/assistant`: tap the Arabic suggested question | She can ask in Arabic, every answer cites its source, and when there is no source it says so. | Bilingual and cited | Cached demo-safe answer |
| 1:30–1:45 | `/app/report`: open the PDF, then share it with consent | One tap turns this into a two-page report, shared only with her consent, through a link that expires in seven days. | A doctor-ready output, and consent | Pre-generated PDF tab |
| 1:45–2:05 | Profile B: `/clinic/patients/[Noura]` | Her doctor sees the same entries in a separate clinician view: a one-minute summary, the evidence for each line and a visit-note draft she edits. | A separate clinician interface; the clinician decides | Pre-opened tab |
| 2:05–2:25 | Profile B: Fatima's care gap, booked and closed. Profile C: `/admin`, where the count moves | For the clinic, missed follow-ups become a worklist: Fatima's after-birth glucose test is due, we book it, the gap closes and the network count moves, all on our synthetic 1,200-woman cohort. | A care gap closing live, labelled synthetic | Reset and retry once, then play the video |
| 2:25–2:40 | Business slide | Women use it free and women's health clinics pay per clinician seat; [we have interviewed N clinicians and N clinic managers, and CLINIC has signed a non-binding letter to pilot it]. | Buyer, price model, real evidence | Say only what is true, and drop the bracket if it isn't |
| 2:40–2:50 | Credits slide: AI tools used, plus earlier work disclosed | We built this with the AI tools listed on screen, we disclosed our earlier work at the start, and [all N of us] are committed to building this company after Sunday. | The disclosure the rules require [S1]; commitment to continue | — |
| 2:50–3:00 | Ask slide | Our ask is one three-month pilot with one Abu Dhabi clinic, judged on how many women complete the follow-ups they are due: understand your body, recognise the patterns, take informed action. | A clear ask on the HealthX pilot path | — |

**Dead-demo protocol**
1. If a screen hangs for 3 seconds, the Driver moves to the next pre-opened tab and the Speaker keeps talking.
2. If something fails a second time, switch to the backup video at the matching point. The Speaker narrates live and says once, calmly, that this is a recording of the same flow.
3. Never debug on stage. After the pitch, offer the QR code so judges can try the demo themselves.

**Self-serve card for judges (print 10).** It carries a QR code to `/demo`, a 60-second path (Noura, Patterns, tap a date, Report, clinician view, clinic dashboard) and one line on synthetic data and AI use.

---

## 10. The 10 hardest questions (model answers that stay non-diagnostic)

Each answer takes about 30 seconds. "Show" is the tab the Driver opens while the Speaker answers. "Avoid" lists phrases nobody should say.

**1. Isn't this a medical device? Who regulates it?** (regulator)
We built it as preparation for a visit. It organises her own entries, shows patterns that published guidelines describe, and leaves every clinical decision to a clinician. We don't self-certify. NICE's evidence standards and the FDA's January 2026 guidance both treat software that applies clinical thresholds, or sends data to clinicians, as needing stronger evidence. So before any real patient we will ask DoH and the Emirates Drug Establishment for a classification, and we would like to pilot through DoH's sandbox.
*Show:* the trace for one card. *Avoid:* "it's not a medical device", "DoH-approved".

**2. How accurate is it?** (clinician, regulator)
Today we can show verification, not clinical accuracy. We treat it as an acceptance test with criteria fixed in advance. Every observation links to dated entries, and the rule tests pass on all eight personas. On our 60 test questions the assistant was grounded 96.7% of the time, refused all 15 questions it should refuse and caught every red-flag case, all on synthetic data. One Arabic answer failed, and we show that too. Clinical validation is the pilot: clinicians review charts without seeing our output, we compare the two, and we report it using DECIDE-AI. Until then we quote no accuracy figure.
*Show:* `/status`. Re-read its numbers on the day. *Avoid:* "XX% accurate", "clinically validated".

**3. If it misses something, or falsely reassures her, who is liable?** (clinician, investor)
There are three answers. First, it never tells her she is fine: an empty patterns screen only says that nothing has matched her entries yet. Second, red-flag entries put urgent guidance and 998 first, and if the after-birth mood check shows any thought of self-harm, it opens a crisis path instead of a score. Third, the clinician makes every clinical decision with the basis in front of her. The pilot contract will spell out that split, and in the AMA's 2026 survey clear liability rules were what physicians said they want most.
*Show:* Sara's urgent card. *Avoid:* "it can't miss anything", "zero risk".

**4. Doctors are overloaded and patient logs are unreliable. Why would a gynaecologist use this?** (clinician)
She does not read raw logs. She gets a one-minute summary, a chart, the dated entries behind each pattern and the woman's own questions, and only for patients who chose to share. Entries are labelled as self-reported, and the record-strength meter shows how much data supports each pattern. It organises the conversation and never replaces her examination or tests. Reviews of what clinicians think name workload, reliability and unclear roles as the barriers, so that is what we designed around. [Add one real interview observation.]
*Show:* the clinician patient page. *Avoid:* "saves 10 minutes a visit", unless it has been measured.

**5. This is reproductive data. Where does it live, and who sees it?** (regulator)
Today the data is synthetic only, and the database refuses anything else. In production, compute and storage stay inside the UAE, as DoH's AI standard and federal health-data law require. There are no ads, no data sales and no third-party trackers on health screens. She consents for each purpose, share links expire and can be revoked, she can see who opened her record, and she can export or delete everything. The Flo cases in the US show what happens otherwise.
*Show:* the audit timeline in the privacy centre. *Avoid:* "100% secure", "ADHICS-compliant".

**6. What does the AI actually do, and what stops it making things up?** (regulator, innovation)
The language model never decides. The rules file decides which pattern applies, retrieval finds the guideline text, and the model only puts it into plain words. Then a checker removes any sentence without a supporting source, and with no source the assistant says so. The whole demo also runs without any model. The provider can be swapped, and in production we would use a UAE-hosted model.
*Show:* the citation chips on an answer. *Avoid:* "our AI detects".

**7. Will this work fairly for Emirati and expatriate women, and in Arabic?** (regulator, clinician)
The rules apply the same published thresholds to everyone, and we train no model on anyone's data, so there is no learned bias to inherit. Thresholds can still suit some groups less well. So the clinic dashboard checks pattern and sharing rates by nationality group and age band and flags any gap over 5 points, on synthetic data today. DoH's standard asks for exactly this kind of subgroup monitoring. A clinician signs off the thresholds and a native speaker reviews the Arabic. [Confirm both are done before saying so.]
*Show:* the admin fairness check. *Avoid:* "bias-free".

**8. Who pays, how much, and how big can this get?** (investor)
Women's health and IVF clinics pay per clinician seat, and women never pay. Our price is a hypothesis we are testing: [AED __ per clinician per month], from [N] interviews. Bottom-up, the first market is Abu Dhabi's women's-health clinicians multiplied by that price. Later, payers and employers pay for closed gaps such as the after-birth glucose test. In the pilot we prove one number: more women completing the follow-ups they are due.
*Avoid:* quoting the $1 trillion women's-health figure as our market.

**9. What proof is there that clinics want this, and what happens after Sunday?** (investor, grant)
[Real evidence only: N interviews, one observation quoted with permission, the LOI and its success measures.] Then we follow the grant milestones. In month 1 we sign a founders' agreement and a venture plan. By month 3 we will have an MVP beyond the demo, tested with 15–20 consenting women and three clinicians. By month 6 we will have a UAE licence, an ADHICS gap assessment and our first paid pilot.
*Avoid:* calling an LOI a contract, or a conversation a partnership.

**10. Why won't Flo, Clue, an EHR vendor or Nabta just build this?** (investor)
Trackers are built to predict periods for consumers. Records systems see the visit, not the months between visits. Providers such as Nabta deliver care that we could support. Our edge is the clinic workflow: consented sharing, a separate clinician view and care-gap tracking. On top of that sit a rule library where each rule needs a source and sign-off, and an Arabic and English guideline base. That is slow to copy. We would rather integrate than compete, and FHIR export already works.
*Avoid:* "no competitors".

Also drill these: "Your Al Ain figure is from 2013–14. Is it still true?" (It is the most recent local figure we found, and the pilot measures today's rate.) "Will women keep logging for months?" (Honest answer: we don't know yet. The pilot measures the share of women with 3+ months of logs before a visit.) "Who on your team is clinical?" (Name the advisor only if they agreed in writing.)

---

## 11. 48-hour checklist (Fri 20 Nov → Sun 22 Nov)

**Before Friday:** email the organisers. Ask for the pitch and Q&A length, the screen and HDMI set-up, the Wi-Fi arrangements, and whether judges also visit team tables. Also ask how disclosed earlier code is scored under Prototype and execution [S1].

**Friday 20 Nov (T−48h): truth and content**
- [ ] Freeze the scope: from now on, only fixes to the demo path.
- [ ] Rewrite the disclosure note. List all earlier code, research and designs with dates, including the backend, the web app, the e2e tests, the data generator and the mock-up, plus the AI tools used. Tag the repo at its 16 Nov state. Do not squash or rewrite history.
- [ ] Prepare a short list of what was built during build week (17–21 Nov), for the Prototype criterion.
- [ ] Apply the fixes from section 8 to the deck, the script and `docs/05`, `docs/10` and `docs/12`.
- [ ] Put a source line on every slide that shows a number, and re-open every link (`docs/05` asks for this).
- [ ] Finalise the interview tally: [N] clinicians, [N] clinic managers, [N] women. Write them up as observations [S4], pick one, and get written permission to quote it.
- [ ] Get the letter of intent signed and scanned, or remove it from the script. Get the clinical advisor's written OK to be named. Get the rules header signed, or stop saying "clinician-reviewed".
- [ ] Have a native speaker review every Arabic string on the demo path, and clear the `AR-REVIEW` markers.
- [ ] Run the repo's `demo-readiness` skill on the deployed URL and on the local build. Run the backend tests and the Playwright e2e, and note the `/status` numbers you will quote.
- [ ] Draft the one-page risk register and the model card (sections 4 and 5). Add the DoH Responsible AI mapping slide.
- [ ] Record the backup video of the exact run-of-show in 1080p, once narrated and once silent. Copy it to both laptops, a USB stick and a phone.
- [ ] Run rehearsals 1–3 with a timer. Drill section 10 until every teammate answers each question in under 30 seconds.

**Saturday 21 Nov (T−36h): code freeze and dress rehearsal**
- [ ] Finish the last fixes before the 18:00 GST code freeze. Tag the release and note the commit.
- [ ] Deploy. Smoke-test on a laptop and a phone at 390 px and 1280 px, in English and Arabic.
- [ ] Warm demo-safe mode: cache answers for every question you will ask and pre-generate the PDFs. Then run the full path on the local build with Wi-Fi off.
- [ ] Check that the footer (not a diagnosis, 998, fictional data, built with AI tools) and the "Demo data — fictional" badge appear on every screen in the path.
- [ ] Run the banned-phrase check over the slides as well as the UI strings: no diagnosis wording and no risk percentages.
- [ ] Test on a projector if possible: contrast of the mauve palette, font size, light versus dark theme.
- [ ] Print the disclosure note, 10 self-serve cards with the QR code, the model card and a copy of the LOI.
- [ ] Run rehearsals 4–5 in full dress, one of them in front of someone outside the team. Cut anything that pushes past 2:55.
- [ ] Prepare the devices: charge them; switch off notifications and automatic updates; set up the three browser profiles. Pack USB-C to HDMI adapters, a clicker and a phone hotspot.
- [ ] Sleep.

**Sunday 22 Nov (T−0): show day**
- [ ] Arrive early. Test the projector, the sound, the venue Wi-Fi and the hotspot.
- [ ] Reset the demo data as admin, run the path once, then reset again so Fatima's gap is open.
- [ ] Open all the tabs in order in their profiles, cue the backup video and set the timer.
- [ ] Agree the hand signal for "switch to video" and who answers which type of question.
- [ ] Hand in or read the disclosure note at the start of the event, as the rules require [S1].
- [ ] After the pitch, hand out the self-serve card and note every judge question for follow-up.

---

## 12. Not verified, or still open

- **Pitch length and Q&A length:** not stated on the event page [S1]. Ask the organisers.
- **How disclosed earlier code is scored under Prototype and execution:** not stated [S1]. Ask in writing.
- **DoH sandbox access for hackathon teams:** HealthX cohorts get it [S5], but this is not confirmed for Ajyal.
- **EDE's position on software as a medical device:** not stated on its site [S10].
- **The WEF and McKinsey women's-health figures:** the primary page did not load [S29].
- **The 20–58% postpartum screening range in `docs/05`:** the source could not be opened.
- **The number of women's-health clinicians in Abu Dhabi** (needed for bottom-up sizing): not found.
- **The ADA 2026 postpartum testing window:** outside this track. Check the sources behind `rules/clinical_rules.yaml`.
- **The Track 02 findings cited above** (the published endometriosis review, the UAE 11.6-year figure, the Dennison 2021 relative risk): not re-checked here.

---

## 13. Sources (all accessed 6 Nov 2026)

Event and ecosystem
- **S1** Upstart Bar for DoH, HealthX Ajyal Hackathon official page: https://upstartbar.com/ajyal/ (Read)
- **S2** Upstart Bar, *Give Every Pilot a Decision Date* (Sep 2026): https://upstartbar.com/insights/give-every-pilot-a-decision-date.html (Read)
- **S3** Upstart Bar, *Give AI Outputs an Acceptance Test* (Oct 2026): https://upstartbar.com/insights/give-ai-outputs-an-acceptance-test.html (Read)
- **S4** Upstart Bar, *The Customer Interview Is Not a Pitch* (Sep 2026): https://upstartbar.com/insights/the-customer-interview-is-not-a-pitch.html (Read)
- **S5** DoH, startAD and DoH launch HealthX (15 May 2024): https://www.doh.gov.ae/en/news/startad-and-doh-launch-healthx-to-advance-abu-dhabi-as-global-biotech-and-life-sciences-hub (Read)
- **S6** Danat Al Emarat, DoH and Danat Al Emarat announce the winning team of the 3rd health hackathon (2021): https://danatalemarat.ae/media-center/news/department-of-health-abu-dhabi-and-danat-al-emarat-hospital-announce-the-wining-team-in-the-3rd-edition-of-the-health-hackathon/ (Read)
- **S7** DoH, call for its first health hackathon (24 Oct 2019): https://www.doh.gov.ae/en/news/Department-of-Health-Abu-Dhabi-calls-on-innovators-and-experts-to-participate (Read)
- **S8** DoH, Responsible Artificial Intelligence (AI) Standard, DoH/ST/DDGO/RAI/V1/2025 (Oct 2025): https://www.doh.gov.ae/-/media/B84FF5DD027846699C51F36C439A580F.ashx (Read)
- **S9** Abu Dhabi Media Office, Abu Dhabi Programme for the Future of Reproductive Health (17 Sep 2026): https://www.mediaoffice.abudhabi/en/health/abu-dhabi-programme-for-the-future-of-reproductive-health-an-integrated-ecosystem-shaping-standards-research-and-innovation/ (Read)
- **S10** Emirates Drug Establishment, home page: https://www.ede.gov.ae/en (Read)
- **S11** DoH circular 26/2023, training on the Health Media and Advertising guidelines (23 Feb 2023): https://doh.gov.ae/-/media/Feature/Resources/Circulars/26--2023.ashx (Read)

Pitch and demo
- **S12** Harvard Health Systems Innovation Lab, 2026 Hackathon Guide for Participants: https://hsph.harvard.edu/wp-content/uploads/2025/10/Participants-guide.pdf (Read)
- **S13** Katherine Druckman, JetBrains, *How to Win a Hackathon: Notes From the Judging Table* (June 2026): https://blog.jetbrains.com/ai/2026/06/how-to-win-a-hackathon-notes-from-the-judging-table/ (Read)
- **S14** Brandon Kessler, Devpost, *How to present a successful hackathon demo* (first published on TechCrunch, 2014): https://info.devpost.com/blog/how-to-present-a-successful-hackathon-demo (Read)
- **S15** Sara Sitzer, Devpost, *How to win a hackathon: Advice from 5 seasoned judges*: https://info.devpost.com/blog/hackathon-judging-tips (Read)
- **S16** Geoff Ralston, Y Combinator, *A Guide to Demo Day Presentations* (25 Jul 2016): https://www.ycombinator.com/blog/guide-to-demo-day-pitches/ (Read)
- **S17** Paul Graham, *How to Present to Investors* (2006, revised 2010): https://paulgraham.com/investors.html (Read)
- **S18** DePasse JW et al., Less noise, more hacking (MIT Hacking Medicine), Int J Technol Assess Health Care 2014;30(3):260-4: https://pubmed.ncbi.nlm.nih.gov/25096225/ (Read, abstract)
- **S19** Stanford Biodesign, *Need Statements v2* (2021): https://biodesignguide.stanford.edu/wp-content/uploads/2022/07/Need-Statements-v2.pdf (Read)
- **S20** Sequoia Capital, *Writing a Business Plan*: https://sequoiacap.com/article/writing-a-business-plan/ (Read)

Investors
- **S21** Fenwick, *The five key questions every digital health entrepreneur should consider* (Bob Kocher, Venrock; 8 Oct 2013): https://www.fenwick.com/insights/publications/the-five-key-questions-every-digital-health-entrepreneur-should-consider (Read)
- **S22** Natasha Hanson Allen, Foley & Lardner, *What Investors Should Be Asking Before They Fund an AI-Enabled Medtech Company* (16 Oct 2026): https://www.foley.com/insights/publications/2026/10/what-investors-should-be-asking-before-they-fund-an-ai-enabled-medtech-company/ (Read)
- **S23** Rock Health, *2025 year-end digital health funding overview* (12 Jan 2026): https://rockhealth.com/insights/2025-year-end-digital-health-funding-overview-a-tale-of-two-markets/ (Read)
- **S24** Rock Health, *Q1 2026 funding overview* (6 Apr 2026): https://rockhealth.com/insights/q1-2026-funding-overview-capital-continues-concentrating-and-four-other-market-signals/ (Read)
- **S25** Julie Yoo, a16z, *The New Go-to-Market Playbooks for Digital Health Startups* (19 Oct 2021): https://a16z.com/the-new-go-to-market-playbooks-for-digital-health-startups/ (Read)
- **S26** Alchemist Accelerator, *Should we include letters of intent in our pitch deck?*: https://intercom.help/alchemistacc/en/articles/8511513-should-we-include-letters-of-intent-in-our-pitch-deck (Read)
- **S27** Ron Southwick, Chief Healthcare Executive, *Why hospitals must avoid pilot purgatory* (5 Aug 2026): https://www.chiefhealthcareexecutive.com/view/why-hospitals-must-avoid-pilot-purgatory- (Read)
- **S28** Stephanie Baum, MedCity News, *How can digital health startups steer clear of pilot study pitfalls?* (21 Mar 2018): https://medcitynews.com/2018/03/how-can-digital-health-startups-steer-clear-of-pilot-study-pitfalls/ (Read)
- **S29** WEF and McKinsey Health Institute, *Closing the Women's Health Gap* (Jan 2024): https://www.mckinsey.com/mhi/our-insights/closing-the-womens-health-gap-a-1-trillion-dollar-opportunity-to-improve-lives-and-economies (Secondary: the page timed out, so figures come from search summaries)

Clinicians
- **S30** AMA, AI usage among doctors doubles as confidence grows (12 Mar 2026): https://www.ama-assn.org/press-center/ama-press-releases/ama-ai-usage-among-doctors-doubles-confidence-technology-grows (Read)
- **S31** Brückner S et al., Attitudes of healthcare professionals and researchers toward wearable and app derived patient generated health data, npj Digit Med 2025;8:186: https://pubmed.ncbi.nlm.nih.gov/40159538/ (Read, abstract). Detail from HealthManagement.org (25 Apr 2025): https://healthmanagement.org/c/it/news/integrating-patient-generated-data-into-clinical-practice (Secondary)
- **S32** Guardado S et al., Use of patient-generated health data from consumer-grade devices by health care professionals in the clinic, J Med Internet Res 2024: https://pubmed.ncbi.nlm.nih.gov/38820580/ (Read, abstract)
- **S33** WHO, AI ethics and governance guidance for large multi-modal models (18 Jan 2024): https://www.who.int/news/item/18-01-2024-who-releases-ai-ethics-and-governance-guidance-for-large-multi-modal-models (Read)
- **S34** Goldsack JC et al., Verification, analytical validation, and clinical validation (V3), npj Digit Med 2020;3:55: https://pubmed.ncbi.nlm.nih.gov/32337371/ (Read, abstract)
- **S35** DECIDE-AI reporting guideline (Vasey B et al., Nat Med 2022): https://pubmed.ncbi.nlm.nih.gov/35585198/ (Secondary: citation from search; the Clin Radiol 2023 overview abstract was read at https://pubmed.ncbi.nlm.nih.gov/36639172/)
- **S36** CHAI, assurance lab certification and draft model card ("nutrition label") (18 Oct 2024): https://chai.org/chai-advances-assurance-lab-certification-and-nutrition-label-for-health-ai/ (Read)
- **S37** Matt Hervey, Gowling WLG, via Legal 500, NHSX AI Lab buyer's checklist (4 Jun 2020): https://www.legal500.com/intelligence/canada/food-drugs-healthcare-life-sciences/nhsx-ai-lab-publishes-a-buyer%27s-checklist-for-ai-in-health-and-care (Secondary: the NHS original was unreachable)

Regulation and precedents
- **S38** FDA Law Blog (Hyman Phelps), analysis of FDA's revised Clinical Decision Support and General Wellness guidances issued 6 Jan 2026 (8 Jan 2026): https://www.thefdalawblog.com/2026/01/a-busy-day-in-the-cdrh-neighborhood-updates-to-the-cds-and-general-wellness-guidance-documents/ (Secondary analysis, read)
- **S39** NICE, Evidence standards framework for digital health technologies, Section B (updated 9 Aug 2022): https://www.nice.org.uk/corporate/ecd7/chapter/section-b-classification-of-digital-health-technologies (Read)
- **S40** FTC, final order with Flo Health (22 Jun 2021): https://www.ftc.gov/node/73903 (Read)
- **S41** National Law Review, *Jury finds Meta liable for collecting private reproductive health data* (18 Aug 2025): https://natlawreview.com/article/jury-finds-meta-liable-collecting-private-reproductive-health-data (Read)
- **S42** Jeremy Hsu, Undark, *Medical Advice From a Bot: The Unproven Promise of Babylon Health* (9 Dec 2019): https://undark.org/2019/12/09/babylon-health-artificial-intelligence-medical-advice/ (Read)
- **S43** Fraser H, Coiera E, Wong D. Safety of patient-facing digital symptom checkers. Lancet 2018;392:2263-4: https://eprints.whiterose.ac.uk/id/eprint/138305/ (Read, citation only)

Local evidence (for the claims audit)
- **S44** Agarwal MM, Lal M, Vyas CD. Gestational diabetes in a multi-ethnic, high-risk population: adequacy of screening 6 weeks after delivery. IJERPH 2022;19:13946 (Al Ain, 2013–14): https://pmc.ncbi.nlm.nih.gov/articles/PMC9658585/ (Read, full text)
- **S45** Juber NF et al. Self-reported PCOS and chronic diseases among Emiratis (UAE Healthy Future Study). Int J Womens Health 2023;15:289-98: https://pubmed.ncbi.nlm.nih.gov/36814527/ (Read, abstract)
- **S46** Mirza FG et al. PCOS prevalence among females aged 15–45 at a major women's hospital in Dubai. IJERPH 2023;20:5717: https://pubmed.ncbi.nlm.nih.gov/37174235/ (Read, abstract)
- **S47** De Corte P et al. Time to diagnose endometriosis: a systematic literature review. BJOG 2025;132:118-30: https://pubmed.ncbi.nlm.nih.gov/39373298/ (Read, abstract)
- **S48** Bellamy L et al. Type 2 diabetes after gestational diabetes: systematic review and meta-analysis. Lancet 2009;373:1773-9: https://pubmed.ncbi.nlm.nih.gov/19465232/ (Read, abstract)
- **S49** Vounzoulaki E et al. Progression to type 2 diabetes in women with a known history of gestational diabetes. BMJ 2020;369:m1361: https://pubmed.ncbi.nlm.nih.gov/32404325/ (Read, abstract)
- **S50** Dennison RA et al. Women's views on screening for type 2 diabetes after gestational diabetes (qualitative review). Diabet Med 2020;37:29-43: https://pubmed.ncbi.nlm.nih.gov/31317569/ (Read, abstract)
- **S51** Huang J et al. Interventions to increase uptake of postpartum diabetes screening after GDM: systematic review and network meta-analysis. Am J Obstet Gynecol MFM 2023;5:101137: https://pubmed.ncbi.nlm.nih.gov/37619781/ (Read, abstract)

[S1]: https://upstartbar.com/ajyal/
[S2]: https://upstartbar.com/insights/give-every-pilot-a-decision-date.html
[S3]: https://upstartbar.com/insights/give-ai-outputs-an-acceptance-test.html
[S4]: https://upstartbar.com/insights/the-customer-interview-is-not-a-pitch.html
[S5]: https://www.doh.gov.ae/en/news/startad-and-doh-launch-healthx-to-advance-abu-dhabi-as-global-biotech-and-life-sciences-hub
[S6]: https://danatalemarat.ae/media-center/news/department-of-health-abu-dhabi-and-danat-al-emarat-hospital-announce-the-wining-team-in-the-3rd-edition-of-the-health-hackathon/
[S7]: https://www.doh.gov.ae/en/news/Department-of-Health-Abu-Dhabi-calls-on-innovators-and-experts-to-participate
[S8]: https://www.doh.gov.ae/-/media/B84FF5DD027846699C51F36C439A580F.ashx
[S9]: https://www.mediaoffice.abudhabi/en/health/abu-dhabi-programme-for-the-future-of-reproductive-health-an-integrated-ecosystem-shaping-standards-research-and-innovation/
[S10]: https://www.ede.gov.ae/en
[S11]: https://doh.gov.ae/-/media/Feature/Resources/Circulars/26--2023.ashx
[S12]: https://hsph.harvard.edu/wp-content/uploads/2025/10/Participants-guide.pdf
[S13]: https://blog.jetbrains.com/ai/2026/06/how-to-win-a-hackathon-notes-from-the-judging-table/
[S14]: https://info.devpost.com/blog/how-to-present-a-successful-hackathon-demo
[S15]: https://info.devpost.com/blog/hackathon-judging-tips
[S16]: https://www.ycombinator.com/blog/guide-to-demo-day-pitches/
[S17]: https://paulgraham.com/investors.html
[S18]: https://pubmed.ncbi.nlm.nih.gov/25096225/
[S19]: https://biodesignguide.stanford.edu/wp-content/uploads/2022/07/Need-Statements-v2.pdf
[S20]: https://sequoiacap.com/article/writing-a-business-plan/
[S21]: https://www.fenwick.com/insights/publications/the-five-key-questions-every-digital-health-entrepreneur-should-consider
[S22]: https://www.foley.com/insights/publications/2026/10/what-investors-should-be-asking-before-they-fund-an-ai-enabled-medtech-company/
[S23]: https://rockhealth.com/insights/2025-year-end-digital-health-funding-overview-a-tale-of-two-markets/
[S24]: https://rockhealth.com/insights/q1-2026-funding-overview-capital-continues-concentrating-and-four-other-market-signals/
[S25]: https://a16z.com/the-new-go-to-market-playbooks-for-digital-health-startups/
[S26]: https://intercom.help/alchemistacc/en/articles/8511513-should-we-include-letters-of-intent-in-our-pitch-deck
[S27]: https://www.chiefhealthcareexecutive.com/view/why-hospitals-must-avoid-pilot-purgatory-
[S28]: https://medcitynews.com/2018/03/how-can-digital-health-startups-steer-clear-of-pilot-study-pitfalls/
[S29]: https://www.mckinsey.com/mhi/our-insights/closing-the-womens-health-gap-a-1-trillion-dollar-opportunity-to-improve-lives-and-economies
[S30]: https://www.ama-assn.org/press-center/ama-press-releases/ama-ai-usage-among-doctors-doubles-confidence-technology-grows
[S31]: https://pubmed.ncbi.nlm.nih.gov/40159538/
[S32]: https://pubmed.ncbi.nlm.nih.gov/38820580/
[S33]: https://www.who.int/news/item/18-01-2024-who-releases-ai-ethics-and-governance-guidance-for-large-multi-modal-models
[S34]: https://pubmed.ncbi.nlm.nih.gov/32337371/
[S35]: https://pubmed.ncbi.nlm.nih.gov/35585198/
[S36]: https://chai.org/chai-advances-assurance-lab-certification-and-nutrition-label-for-health-ai/
[S37]: https://www.legal500.com/intelligence/canada/food-drugs-healthcare-life-sciences/nhsx-ai-lab-publishes-a-buyer%27s-checklist-for-ai-in-health-and-care
[S38]: https://www.thefdalawblog.com/2026/01/a-busy-day-in-the-cdrh-neighborhood-updates-to-the-cds-and-general-wellness-guidance-documents/
[S39]: https://www.nice.org.uk/corporate/ecd7/chapter/section-b-classification-of-digital-health-technologies
[S40]: https://www.ftc.gov/node/73903
[S41]: https://natlawreview.com/article/jury-finds-meta-liable-collecting-private-reproductive-health-data
[S42]: https://undark.org/2019/12/09/babylon-health-artificial-intelligence-medical-advice/
[S43]: https://eprints.whiterose.ac.uk/id/eprint/138305/
[S44]: https://pmc.ncbi.nlm.nih.gov/articles/PMC9658585/
[S45]: https://pubmed.ncbi.nlm.nih.gov/36814527/
[S46]: https://pubmed.ncbi.nlm.nih.gov/37174235/
[S47]: https://pubmed.ncbi.nlm.nih.gov/39373298/
[S48]: https://pubmed.ncbi.nlm.nih.gov/19465232/
[S49]: https://pubmed.ncbi.nlm.nih.gov/32404325/
[S50]: https://pubmed.ncbi.nlm.nih.gov/31317569/
[S51]: https://pubmed.ncbi.nlm.nih.gov/37619781/
