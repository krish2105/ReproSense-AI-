# 03 · Regulation and data: a non-diagnostic women's health record in Abu Dhabi

Research track 3 of the 6 Nov 2026 run. Written for the team, the pitch and judge Q&A. Plain English, our own words.
This is research, not legal advice. Confirm each point with the regulator, or with a UAE health-regulatory lawyer, before any pilot.

- **Accessed:** every source on **6 Nov 2026** unless a row says otherwise.
- **Evidence labels:** **[P]** primary source read directly · **[P-idx]** primary document read only through search-engine extracts (doh.gov.ae would not open in our fetch tool because of a certificate error, and uaelegislation.gov.ae returned HTTP 403) · **[S]** secondary (law firm, trade body, consultancy, vendor) · **[NV]** not verified.
- **Limits of this run:** the shared web-search budget ran out before two checks: the exact PDPL Article 2 wording, and what FDA's January 2026 guidance updates say. IMDRF PDFs timed out, so the IMDRF N12 matrix comes from Akin Gump's 2014 summary of it.

---

## 0. The answer in nine lines

1. **Whether ReproSense counts as a medical device depends on what we claim.** Federal Decree-Law No. 38 of 2024 counts software, wearables and AI-based products as "medical equipment" when they are offered for diagnosis, treatment, cure, relief or prevention of disease, or for birth control. Article 5 says nothing in that class can circulate without marketing approval from the **Emirates Drug Establishment (EDE)**. EDE, not DoH, decides device status. [P-idx]
2. **Our borderline functions are pattern cards, questionnaire scores and red-flag signposting.** IMDRF treats spotting "early signs of a disease" as *driving* clinical management, a higher category than *informing* it. How we word each card decides which side it falls on. [S]
3. **Health data must stay in the UAE.** Under Federal Law No. 2 of 2019, Article 13 keeps data in the UAE (Article 24 sets a fine of AED 500,000–700,000) and Article 20 requires keeping it for at least 25 years. Abu Dhabi enforces this more strictly than the federal exceptions suggest (DoH Circular 147/2022). [P][S]
4. **ADHICS v2 (2024) covers us.** It names "Healthcare Technology and Service Provider", including web and mobile apps, and it recognises cloud hosting inside the UAE. DoH officials said in 2025 that a UAE-hosted cloud needs no exemption, but you should still file DoH's UAE-cloud application. [P-idx][S]
5. **The DoH Responsible AI Standard (V1, October 2025) binds our clinic customers.** For every AI system they use, it asks for a risk assessment, human oversight, validation, fairness checks, a named owner, monitoring, and telling patients they can opt out of AI-driven services. If we ship an evidence pack and an "AI off" switch, we make their compliance easier, which helps us sell. [P-idx]
6. **Consent means written approval, purpose by purpose.** The DoH Patient Healthcare Data Privacy Standard (2020) also applies to vendors. It requires consent across the whole data lifecycle, selective disclosure, a privacy impact assessment for new products, breach notice to DoH within 24 hours, and 25-year retention. That retention rule clashes with our "delete account in one step" promise. [P]
7. **Only DoH-licensed facilities can connect to Malaffi.** They need an HL7 EMR, an Etisalat SD-WAN link and a security assessment based on ADHICS. DoH's exchange policy forbids participants from loading Malaffi data into other systems, storing it in a cloud, or giving third parties access. We found no public Malaffi FHIR API. So our route is a FHIR export into the clinic's EMR. [P]
8. **DoH has concrete entry doors:** a registration for companies that deliver health services through mobile apps (Facility Licensing review, then information-security approval), and a software pre-evaluation inside the HTA process. [P-idx]
9. **What a DoH judge wants to hear:** "Synthetic data only until eight gates are passed (section 6)." That means a licensed entity, EDE's answer in writing, DoH app registration and ADHICS review, a UAE-hosted stack with no offshore AI, privacy documents, ethics approval, a Responsible AI risk file, and clinician-signed rules.

---

## 1. Is ReproSense a medical device in the UAE?

### 1.1 Who decides what

| Body | What it decides for us | Evidence |
| --- | --- | --- |
| **Emirates Drug Establishment (EDE)**, federal | Whether a product is a medical device, an IVD, an accessory or not regulated. It also issues marketing approval, runs vigilance and approves device advertising. | EDE describes itself as the only federal regulator of medical and pharmaceutical products, including devices, and says it was set up on 29 Sept 2023 [P]. Nine device services moved to EDE from MOHAP, including classification and marketing authorisation [S RegDesk, 16 Jan 2026]. MOHAP's notice put the transfer at 29 Dec 2025 [S]. The founding decree-law is reported as No. 28 of 2023 [S]. |
| **MOHAP**, federal | Owns Federal Law No. 2 of 2019 (ICT in health) and Ministerial Resolution 51/2021 (exceptions to data localisation) | [S DLA Piper] |
| **Department of Health – Abu Dhabi (DoH)** | Licensing of facilities and professionals. ADHICS and the AAMEN programme. Privacy, AI and digital-health standards. Registration of mobile-app health service companies. HTA and market access (ADHTAC). Research authorisation (ADHRTC and facility ethics committees). Malaffi policy. | Sections 2–5 below |
| **Abu Dhabi Health Data Services (ADHDS)** | Malaffi participation agreements and the security assessment | [P malaffi.ae] |
| **UAE Data Office** | PDPL for non-health personal data | [P u.ae] |

### 1.2 What the law says

- **Federal Decree-Law No. 38 of 2024** (Medical Products, Pharmacists and Pharmaceutical Establishments) took effect on 2 Jan 2025. Covered entities got a one-year grace period that the Cabinet can extend. [S Baker McKenzie]
- **Article 1, "Medical Equipment":** a medical product made of a device, instrument, system and similar parts, *including its operating software*. The definition expressly covers wearables and AI-based products. To qualify, a product must work without a pharmaceutical, immune or metabolic effect, and must be offered for listed uses. The uses include diagnosis, treatment, cure, relief or prevention of disease, and **birth control**. [P-idx]
- **Article 1, "Health Care Product":** a separate category for general health care that is not meant to diagnose, treat, cure or prevent disease and needs no prescription. [P-idx] Whether software like ours is (a) not a medical product at all, (b) a health care product, or (c) medical equipment is the exact question to put to EDE.
- **Article 5:** nobody may import, distribute, hold, sell, display, use or make any medical product for circulation in the UAE without EDE marketing approval. An approval lasts 5 years, and renewal is due 90 days before it expires. [P-idx]
- **Penalties under 38/2024:** not verified. A Gulf News headline mentions fines up to AED 1 million, but we did not open the article. [NV]
- **UAE guidance specific to software as a medical device:** none found. The EDE homepage lists devices in its mandate but links no software guidance [P]. Consultancies describe a four-class risk system and expect ISO 13485, ISO 14971 and IEC 62304 [S/NV].

### 1.3 The IMDRF lens a reviewer will use

- **IMDRF N12 (final 2014)** sorts software on two axes. The first is what the information does: *treat or diagnose*, *drive clinical management*, or *inform clinical management*. The second is the situation: *critical*, *serious* or *non-serious*. [S Akin Gump summary of N12]
  - **Category I:** inform in a non-serious or serious situation, or drive in a non-serious one. IMDRF's own example is software that stores blood-pressure history for a clinician to review later.
  - **Category II:** inform in a critical situation, drive in a serious one, or diagnose in a non-serious one.
  - **Category III:** drive in a critical situation, or diagnose in a serious one.
  - **Category IV:** diagnose in a critical situation.
  - **The trap:** "drive" explicitly includes finding early signs of a disease or condition. "Inform" means giving clinicians treatment options or bringing relevant data together for them.
- **IMDRF N81 (final, January 2025)** adds to N12 without replacing it. It asks for a clear intended-purpose statement, the context of use, functionality, change management (including how much the software learns and how autonomous it is), and software-specific hazards. Alongside it, IMDRF published **N88 Good Machine Learning Practice** (10 principles). [S Emergo by UL, 30 Jan 2025]

### 1.4 ReproSense function by function

The categories below are our own reading, not a ruling.

| Function | Output | Likely reading | Risk | Design rule that keeps it low |
| --- | --- | --- | --- | --- |
| Logging, calendar, timeline, analytics | Her own data, organised | Record-keeping, probably not software as a medical device | Low | Count and chart only. Show the 21–35-day band as a reference line, not as a verdict. |
| Doctor-ready PDF, visit mode, FHIR export | Her entries summarised for a clinician | Like IMDRF's Category I blood-pressure history example | Low | Every line traces back to entries. No conclusions. |
| Explainable pattern cards (irregular cycles, androgen-type signs, severe cyclical pain, heavy bleeding, fertility-check timing, perimenopause) | "Pattern worth discussing", with entries and the guideline | **Inform (I)** if written as "your data against a published threshold". **Drive (II)** if written as "early signs of a named disease". | **Medium: the main borderline** | Headline = the pattern in her data plus the guideline threshold (for example, "4 of 6 cycles were over 35 days; the 2023 guideline calls this irregular"). Name a condition only in "questions to ask your doctor". Never show a likelihood. The clinician sees the same basis. |
| Red-flag signposting (heavy bleeding with dizziness → 998) and the EPDS item 10 crisis path | Urgent guidance | Critical situation. If it is judged to *drive* care, it lands in **Category III**. | **Highest** | Use fixed, sourced safety-net text triggered by simple logged events. Never reassure ("low risk"). Never suppress a warning. Document it as signposting, not triage. Name it in the EDE question. |
| EPDS total ≥ 10, MRS, PBAC, EHP-5 scores | Validated questionnaire score against a published cut-off | Screening, which could be read as **drive / serious (II)** | Medium | Say "your answers add up to X; the scale's authors suggest talking to a professional above Y". Send it to the clinician. Never attach a label. |
| Care-gap engine (after-birth glucose test, 24–28-week screen) | Due and overdue reminders from guideline schedules | Inform, or plain workflow | Low–medium | Reminders only. We never order tests. The clinician decides. |
| RAG assistant (education with citations) | General information | Not patient-specific, so normally outside device scope | Low | Keep her record out of patient-side answers. Refuse to diagnose. Always cite. |
| Care navigator (drafts, she approves) | Administrative drafts | No medical purpose | Low | A human approves everything. Nothing sends automatically. |
| Clinician "Ask the record" | Retrieves her entries | Inform | Low–medium | Retrieval only, no inference. Show dated evidence chips. |
| Clinic dashboard, fairness check | Population and quality metrics | Administrative | Low as a device; medium for privacy | Aggregates of at least 10 people. Get DoH authorisation before sharing outside the clinic (see 2.3). |
| Contraception or "safe days" predictions | n/a | **Birth control is a listed device purpose** | Device | **Do not build** |

### 1.5 What keeps it non-device, or in the lowest class

1. **Intended-use statement.** Use it everywhere: app store, landing page, deck, contracts. Draft:
   > ReproSense is a personal health record and consultation-preparation tool. A woman records her own cycles, symptoms, questionnaires and lab results. ReproSense organises them, shows where her entries meet published guideline thresholds that guidelines say are worth discussing, and creates a summary she can choose to share with her clinic. It does not diagnose, treat, predict or prevent disease, does not give contraceptive advice, and does not replace a clinician's judgement. Clinicians can see the entries and guideline behind every item.
2. **Claims register.** Write down the allowed and banned phrases, and check them against the UI, the deck and marketing. The existing `clinical-copy-guard` skill already bans diagnostic phrasing. Add "early detection", "screening for PCOS", "risk score", "fertile days", "safe days" and "AI doctor".
3. **Change control.** Each new rule in `rules/clinical_rules.yaml` gets a "device check" field (inform or drive). Any "drive" rule needs a regulatory review before it merges.
4. **Get it in writing.** Ask EDE for a classification (one of its device services [S]). Also complete DoH's HTA software pre-evaluation form [P-idx] (section 2.4).
5. **If EDE says it is a device:** start a quality system (ISO 13485), a risk file (ISO 14971) and a software lifecycle (IEC 62304). These are the usual standards; the UAE-specific expectations are not verified. Do not market until approved.
6. **For orientation only:** FDA reissued its Clinical Decision Support and General Wellness guidances in January 2026 (pages updated 29 Jan and 6 Jan 2026) [P]. We did not review their content here.

---

## 2. DoH Abu Dhabi rules for digital health and AI

### 2.1 Responsible AI Standard, V1 (issued 1 Oct 2025)

- **Scope:** DoH and every licensed healthcare entity in Abu Dhabi that develops, buys or deploys AI. It covers in-house, vendor-supplied and research-built systems across the whole lifecycle, for clinical, financial and administrative uses. [P-idx; S Lexis Middle East]
- **Structure:** core foundations, data management for AI, AI risk management and AI literacy. A separate **Responsible AI Risk Management Protocol** sets out the risk process. [S Lexis; P-idx]
- **Reference number:** DoH/ST/DDGO/RAI/V1/2025 [P-idx]. "DDGO" probably means the Data & Digital Governance Office; that is our inference.

| What the standard asks (section, as extracted) | What ReproSense shows |
| --- | --- |
| A risk assessment for every AI system and related asset (3.3.1.1.1); high-risk systems go through conformity (3.3.1.2.2.2) | One risk file per component: rule engine, LLM writer, verifier, RAG assistant, document AI, care navigator |
| Validation against performance benchmarks, with documented results (3.1.3.1.1) | The AI test-results panel (60 questions, grounding, refusals, red-flag recall) on synthetic data, then a clinician-labelled set in the pilot |
| Fairness and equity: no bias (3.1.5) | Fairness check by nationality group and age band, plus Arabic–English parity tests |
| A named owner for each system (3.1.7.1.1) | A named owner for each AI component |
| Human-in-the-loop or human-on-the-loop oversight | Rules decide. The LLM only words the output. The navigator only drafts. Clinicians edit notes. |
| Transparency to patients and clinicians, including the right to opt out of AI-driven services where that applies | AI disclosure in the footer, plus an **"AI off / rules only" switch** (new) |
| Co-design with clinicians and patients | Interview log and clinical advisor reviews |
| Post-deployment monitoring, and reporting risks, controls and incidents to DoH (Risk Management Protocol) | Monitoring KPIs, an incident log and a monthly report the clinic can file |
| Health data stored in the UAE unless DoH grants an exemption, and cybersecurity under ADHICS | UAE-hosted stack (section 3.4), ADHICS gap assessment |

The standard is enforced through DoH sanctions [P-idx]. A separate 2025 DoH standard on AI in detection asks entities to appoint a **Responsible Officer for AI Governance** [P-idx]. Expect clinics to ask their vendors for the same.

### 2.2 DoH Policy on Use of AI in the Healthcare Sector (2018, v0.9)

- **Scope:** licensed providers, manufacturers, insurers, licensed researchers, and **any end-user that uses Abu Dhabi patient data for AI**. [P-idx; S Al Tamimi]
- **What it asks of developers:**
  - robustness backed by international certification, compliance with ADSSSA rules and auditable validation statements (7.1.2.1)
  - graceful degradation and automatic alerts if hardware or software fails (7.1.2.2)
  - improvement based on user feedback (7.1.2.3)
  - regular audits reported to DoH [P-idx; S]
- The 2025 Responsible AI Standard states that it is aligned with this policy [S Lexis].

### 2.3 ADHICS (cybersecurity) and the cloud question

- **ADHICS v1 (2019)** barred healthcare entities from using cloud services for health information (control CM 4.2), with case-by-case DoH exceptions. [S trade.gov]
- **DoH Circular 147/2022** (30 June 2022) did three things [S Baker McKenzie]:
  - ordered licensed entities to obtain a "safe" certificate, with an audit deadline of 31 Dec 2022
  - told them to disconnect integrated systems that process health data on cloud services
  - said health data, **even de-identified**, may not go to third parties without DoH authorisation.
- **ADHICS v2** was released in May 2024 and is reported effective from August 2024 [S DTS; P-idx].
  - It applies to any entity that creates, accesses, stores, uses, processes or transmits health information, explicitly including **Healthcare Technology and Service Providers**; its Service Provider category lists **web and mobile applications** [P-idx].
  - It recognises cloud hosting **inside the UAE** [S].
  - Entities fall into basic, transitional and advanced tiers and must write more than 15 policies [S DTS].
  - Vendor claims about the total number of controls are not verified.
- **DoH officials, 12 May 2025** [S US-UAE Business Council]:
  - Storing and processing health data in the UAE needs no exemption, but you should contact DoH to complete the UAE-cloud application.
  - Exemptions for offshore processing last up to one year, can be renewed only while localisation progresses, and end with full localisation.
  - The AAMEN portal was to open to technology providers in Q3 2025; whether it has is not verified.
  - Contacts: aamen@doh.gov.ae (security). DoH listed separate contacts for apps and for research.
- **Malaffi's own security assessment** is an extract of the ADHICS survey [P malaffi.ae].

### 2.4 Other DoH doors and rules

| Instrument | What matters for us | Evidence |
| --- | --- | --- |
| **DoH Policy on Digital Health** (DOH/STR/POL/0.9/2020, effective 22 Sept 2020) | Mobile apps fall inside "digital health". The policy is technology-neutral and expects tools to be verifiable and explainable. Entities may access only what the person consented to share. | [P-idx] |
| **Digital Products Governance Standard** (DoH) | Digital health products need licences and approvals, including regulatory ones (3.2.2.9). It points to the **ADHTAC approval process** and **DoH Web & Mobile Application approval** (3.2.4.1). It requires a feasibility study and risk assessment before starting, testing for function, security, accuracy, reliability and privacy before launch, and a named Digital Product Owner and Architect. | [P-idx] |
| **"Registration of the Companies Providing Healthcare Services via Mobile Applications"** (DoH e-service) | Email Facility Licensing (hfld@doh.gov.ae) with: Emirates ID, a **DED or ADGM licence**, scope of service, a declaration and a technical registration form. Licensing reviews it, information security approves it, and the company is listed on the DoH site. The listed examples include Ovasave Health Technologies and Dardoc Health Technologies; we did not check what those companies do. Fees: not verified. Whether a consultation-prep record needs this registration: **ask**. | [P-idx] |
| **DoH HTA Guidelines** (DoH/GD/HPS/HTA/V1/25, June 2025) | Federal (EDE) approval comes first, then DoH approval, before coverage. Software and systems go through a **pre-evaluation form** that checks the HTA medical-device requirements. Appeals go to ADHTAC within 30 days. Market access is not the same as reimbursement. | [P-idx; S] |
| **DoH Technology Registry** | Publishes reviewed new health technologies | [P-idx] |
| **DoH Standard on Tele-Medicine** (2020) | Applies only if we add remote consultations: DoH-licensed providers, ADHICS, Malaffi | [S] |
| **Research** | ADHRTC (the DoH ethics committee) reviews multicentre studies and phase I–IV trials. Other studies go to facility ethics committees under DoH authorisation, using the DoH research application form plus an information-security exemption form where one applies. The 2010 HAAD research policy is out of date. The current DoH human-subject research standard was **not retrieved** [NV]. | [P-idx; S] |

---

## 3. Federal data law

### 3.1 Federal Law No. 2 of 2019 (ICT in health fields): the articles that matter [P]

| Article | Rule | What it means for us |
| --- | --- | --- |
| 1 | "Concerned Authority" covers health-service and insurance entities and entities running **electronic healthcare services** | An app that holds health records is very likely in scope |
| 2 | Covers all ICT use in health fields, **including free zones** | Setting up in ADGM does not get us out of it |
| 4 | Confidentiality (data moves only in permitted cases), integrity, availability | Basis for the consent and audit design |
| 11 | Systems must be compatible and interoperable | Supports a FHIR export |
| 13 | No storing, processing, generating or transferring health data outside the UAE, except in cases a decision sets | UAE hosting, including the LLM |
| 14 | Using the central system (Malaffi in Abu Dhabi) needs prior permission | We do not connect directly (section 5) |
| 16 | Keep patient information confidential. No non-health use without the patient's **written approval**. Five exceptions: insurers, de-identified research under ethics rules, public health or safety, courts, the health authority. | Consent design (section 4) |
| 20 | Keep data as long as it is needed and **for at least 25 years** after the last health procedure | Clashes with one-step deletion |
| 24 | Breaching Article 13: fine of AED 500,000–700,000 | Severity |
| 25 | Disciplinary sanctions: warning, fine of AED 1,000–1,000,000, suspension or cancellation of central-system authorisation | Severity |
| 31 | In force three months after publication. Issued 6 Feb 2019. | n/a |

- **Implementing regulation:** Cabinet Resolution No. 32 of 2020 covers access controls and exchange on the central system [S DLA Piper]. Details not verified.
- **Other law:** Federal Decree-Law No. 34 of 2021 sets penalties for unauthorised disclosure of medical records [S IBA].

### 3.2 Exceptions to localisation (Ministerial Resolution 51/2021), and why not to rely on them

The resolution lists exceptions [S CMS]. DoH officials counted ten scenarios [S].

| Exception | Conditions [S CMS] |
| --- | --- |
| Treatment abroad | Patient consent and encryption |
| Samples sent to labs abroad | Patient consent and encryption |
| Scientific research | Emirate health-authority approval, encryption, anonymisation |
| Insurance | Patient consent, encryption, anonymisation |
| Cooperation with the state | Consent, encryption, anonymisation, a local copy kept |
| Simple or personal health devices | None listed |
| Pharmacovigilance | Consent, encryption, a local copy kept |
| Online health | Consent and a local copy kept |
| Patient request | Consent, encryption, a local copy kept |

The emirate authority can also approve others. **In Abu Dhabi, DoH has expected strict localisation**: Circular 147/2022 did not even mention the resolution [S], and the 2025 exemptions are time-limited steps towards full localisation [S]. Plan to keep everything in the UAE.

### 3.3 PDPL (Federal Decree-Law No. 45 of 2021)

- In force since 2 Jan 2022. It covers processing inside or outside the UAE and requires consent except in listed cases. People can correct data and restrict processing. The regulator is the **UAE Data Office**. [P u.ae]
- DLA Piper reads the PDPL as leaving onshore health-data laws intact, so Federal Law 2/2019 and the DoH standards remain the main rules for health data [S]. The exact Article 2 wording was **not verified** in this run.
- Health data counts as sensitive data. A data protection officer is needed for systematic or large-scale sensitive processing (Article 10). A DPIA is needed for high-risk technology on large amounts of sensitive data (Article 21). Breaches go to the regulator under Article 9, with timings to be set by the executive regulations. [S DLA Piper]
- **Executive regulations:** not published as of 6 Jan 2025 [S DLA Piper]. Blogs say they were still unpublished in September 2026 and mention a new federal AI and data authority from June 2026. [NV]
- **ADGM:** the ADGM Data Protection Regulations 2021 apply in ADGM on top of the federal health rules [S IBA].
- **Practical reading:** health data follows Federal Law 2/2019 plus the DoH standards. Use the PDPL as the floor for non-health data (email, device data) and as good practice (DPIA, data protection officer).

### 3.4 What this means for our stack

| Layer | Demo today (synthetic only, docs/08 rule 1) | Pilot with real data |
| --- | --- | --- |
| Web, API, database, storage | Vercel, Render, Supabase. We have not checked whether any of them offers a UAE region. | UAE-region hosting, with backups and keys in the UAE. File DoH's UAE-cloud application [S]. |
| LLM and embeddings | Claude API, which processes data outside the UAE | A UAE-hosted model, or **rules-only mode**. No patient data offshore, including de-identified data, without DoH authorisation (Circular 147/2022 [S]). PII redaction alone is not enough. |
| Logs, error tracking, email, SMS | n/a | UAE region, or no personal health information in them at all. Notifications stay neutral (discreet mode). |
| Knowledge base | Public guideline summaries | Unchanged. It holds no patient data. |

---

## 4. Consent for sharing with clinics

**What the rules say**

- **Federal Law 2/2019, Article 16:** written approval for any non-health use, with five listed exceptions. [P]
- **DoH Standard on Patient Healthcare Data Privacy** (DOH/SD/SS/PHDP/0.9, effective 16 Sept 2020). It applies to DoH-regulated entities and also to **vendors and service providers that process health data** (2.1.2). [P]
  - The patient always owns her health information (4.1.1).
  - Every entity that touches the data lifecycle should take her consent (4.1.2).
  - Written consent is required, except in listed cases, one of which is exchange between facilities through Malaffi (4.2.3).
  - The patient decides which entities see her data (4.4.1).
  - She has the right to a copy (4.4.2).
  - The privacy policy must tell patients they can complain to DoH (4.3.2.1).
  - Agreements with third parties, and patient notice or consent before her data reaches a third party (DP-DA-06).
  - Data handed back in a common electronic format, with a record of disclosures (DP-DA-03).
  - A process for correction and deletion requests (DP-DA-04).
  - A privacy impact assessment for new products (DP-DP-01).
  - Development and test kept separate from production (DP-PD-02).
  - An encryption and pseudonymisation policy (DP-DA-10).
  - Breaches reported to the health authorities **within 24 hours** of first knowledge (6.5.1).
  - **25-year retention** (6.7.1, DP-PR-01).
- **DoH Digital Health Policy:** entities access only what the person consented to share. [P-idx]
- **Responsible AI Standard:** patients must be told about AI use and that they can opt out of AI-driven services. [P-idx]
- **Malaffi is different.** Taking part is mandatory. Facilities ask for consent on their standard forms, but DoH authorises sharing where consent is missing (ADHIE policy 4.2). Malaffi's privacy notice offers no general opt-out. Patients ask for selective disclosure through their treating facility. [P]

**What ReproSense consent should look like**

The current per-purpose ledger and the 7-day revocable links already fit these rules.

1. **Separate purposes:** (a) keep my record (the service itself); (b) share this report with this named clinic (each share has an expiry and can be revoked); (c) AI explanations and the assistant, opt-in, with a rules-only fallback; (d) research, optional, only under an ethics-approved protocol; (e) de-identified quality analytics, clinic side only.
2. Arabic and English, versioned, signed, and recorded in the consent ledger. The "who saw my data" timeline meets the disclosure-record requirement.
3. **Open question for DoH:** does in-app e-consent count as "written approval"? Is UAE PASS signing expected? [NV]
4. **Open question for DoH:** does the 25-year retention rule apply to records a patient creates herself in a personal record when she asks to delete them? Until we have an answer, **do not promise one-step deletion for real data**. Promise "remove from service and stop all sharing; deletion as the law allows".
5. **Choose the route.** B2B2C through a clinic keeps the licensed clinic as the patient-facing data owner, with us as service provider under a DP-DA-06 agreement. Going direct to consumers puts every obligation on us.

---

## 5. Malaffi and FHIR

**Facts [P malaffi.ae, accessed 6 Nov 2026]**

- ADHDS runs Malaffi, which reports 3,147 signed facilities, 3,144 connected, 100% of hospitals, and 56,192 end-users.
- **Who must connect:** every DoH-licensed facility in the listed categories, including clinics, **IVF centres** and **telemedicine providers**.
- **Onboarding:**
  - an Accession Agreement and Facility Declaration (onboarding@malaffi.ae)
  - the Malaffi Security Assessment (an extract of ADHICS)
  - an **HL7-capable EMR**
  - an Etisalat SD-WAN link
- A facility that is not connected cannot renew its DoH licence, and facilities with Daman agreements cannot submit claims.

**What the DoH exchange policy forbids** (DOH/POL/STR/HIE/1.1/2020, effective 16 Apr 2020, section 4.3.13.2.2) [P]

Participants may not use Malaffi data for:

- distribution to third parties, or giving third parties access
- commercial or marketing purposes
- storage in a cloud environment
- transfer outside the UAE
- **loading it into their own systems**
- building another health information exchange

**Breach timing** (ADHIE policy) [P]: tell affected patients without undue delay and **within 60 days**. The ADHIE operator tells DoH within 5 business days.

**FHIR**

- We found no public Malaffi FHIR API and no third-party app programme. The onboarding page mentions HL7 only. The policy asks for open standards and web services. Whether Malaffi supports FHIR: **not verified**.
- The patient channel is **Sahatna**, a DoH and ADHDS app launched at GITEX in October 2024 that needs UAE PASS [S WAM / Abu Dhabi Media Office].

**What to build and say**

1. A **FHIR R4 export** (Patient, Observation, QuestionnaireResponse, DocumentReference for the PDF) that the clinic imports into its EMR. The EMR already feeds Malaffi under the clinic's own agreement.
2. **Never pull Malaffi data into ReproSense.** If she wants to bring her own Sahatna or Malaffi records, she uploads her copy. Whether that is allowed under the 4.4.2 right to a copy is a question for DoH [NV].
3. Code lab results in LOINC. Malaffi's homepage headlines 90% LOINC adoption [P].
4. **Pitch line:** "Malaffi-compatible through the clinic's EMR. We don't connect to Malaffi ourselves, and we never copy Malaffi data."

---

## 6. Before touching real patient data: the gate list

The hackathon allows synthetic data only (docs/04). We start a pilot only when **all** of these gates are passed.

| Gate | Requirement | Document | Source |
| --- | --- | --- | --- |
| G1 Legal entity | UAE company with a DED or ADGM licence, needed for the DoH app registration | Trade licence | [P-idx] |
| G2 Device status | EDE classification in writing, plus the DoH HTA software pre-evaluation | Classification letter; pre-evaluation reply | [S][P-idx] |
| G3 DoH registration | Facility Licensing app registration and information-security approval, or written confirmation that it is not needed | Registration form, declaration, scope of service | [P-idx] |
| G4 Security and residency | ADHICS v2 controls for the Service Provider category. UAE-hosted stack. DoH UAE-cloud application. Nothing offshore, including the LLM. | ADHICS gap assessment and remediation log, penetration test, data-flow map | [P-idx][S] |
| G5 Privacy | Privacy impact assessment, privacy policy (with the right to complain to DoH), written consent forms in English and Arabic, data processing agreement with DP-DA-06 clauses, 24-hour breach plan, retention policy | PIA, policy, forms, agreement, standard operating procedures | [P] |
| G6 Ethics | Protocol approved by the facility ethics committee, or ADHRTC if multicentre | Protocol, consent, ethics approval, information-security exemption form if needed | [P-idx][S] |
| G7 Responsible AI | Risk assessment for each AI component, named owners, human oversight, AI opt-out, validation report, fairness plan, monitoring KPIs, incident process | Responsible AI risk file and evidence pack | [P-idx] |
| G8 Clinical safety | Rule library signed off by a clinician, hazard log, red-flag test set at 100% recall, escalation procedure agreed with the clinic | Safety case | internal (docs/09, docs/15) |

---

## 7. Six-month regulatory plan (22 Nov 2026 – May 2027)

**Owners** come from the team map: Krishna (CTO and ops), Atharva (product and web), Yash (proposed regulatory and partnerships lead), a clinical advisor (to be recruited), and the partner clinic's medical director or privacy officer. All owners are proposals for the team to confirm.

| Month | Deliverables | Documents | Owner | Regulator contact | Done when |
| --- | --- | --- | --- | --- | --- |
| **0** (22–30 Nov) | Freeze the intended use and claims. Device memo using IMDRF N12 and N81. Regulatory register. Ask the DoH Incubator for introductions to Facility Licensing, AAMEN, HTA and Data & Digital Governance. | Intended Use & Claims v1; device memo v1; register | Yash + Atharva | DoH Incubator | Signed by all founders |
| **1** (Dec) | EDE classification enquiry. DoH HTA software pre-evaluation. Pre-submission meeting with Facility Licensing and AAMEN. Decide between an ADGM and a DED licence. First ADHICS gap assessment. First PIA/DPIA. First Responsible AI risk assessment. Choose UAE hosting and how the LLM will run (UAE-hosted or off). Clinic LOI. | Product description, function table (1.4), screenshots, labels; gap assessment; PIA; risk file | Yash (EDE, DoH), Krishna (ADHICS, hosting) | EDE; DoH Facility Licensing, AAMEN, ADHTAC | Submissions acknowledged |
| **2** (Jan) | Pilot agreement and data processing agreement with the clinic. Consent forms in English and Arabic. Privacy notice. Breach plan. Retention policy. Pilot protocol covering usability, workflow and safety, **with no accuracy claims**. Clinician signs the rule library. | Agreement, data processing agreement, forms, protocol | Yash + clinical advisor + clinic | Clinic ethics committee (or ADHRTC) | Protocol submitted |
| **3** (Feb) | UAE production stack live. ADHICS basic controls in place. Penetration test. DoH UAE-cloud application. DoH app registration filed. **Usability sessions on synthetic personas** (this replaces "real users in month 3" in docs/12). | Architecture and data-flow pack, test report, registration form | Krishna + Atharva | DoH AAMEN, Facility Licensing | Information-security review passed, or open findings logged |
| **4** (Mar) | **Gate review (section 6).** If G1–G8 are green, start the consented pilot: up to 20 women and 3 clinicians at one clinic (our LOI template). AI-off switch live. | Gate checklist signed by founders and clinic | All | Clinic files any DoH notices | All gates green |
| **5** (Apr) | Weekly safety review (red flags, wrong rule hits, complaints). Fairness check. AI incident log. Monthly Responsible AI report for the clinic. FHIR export tested with the clinic's EMR vendor. No Malaffi ingestion. | Monitoring reports | Krishna + clinical advisor | Via the clinic (Risk Management Protocol) | Zero unresolved serious incidents |
| **6** (May) | Pilot report with measured results only. ADHICS evidence pack (through AAMEN if the portal is open to vendors [NV]). Update the device strategy after EDE's reply. Commercial licence. Paid pilot contract. | Pilot report, ADHICS pack, regulatory strategy v2 | Yash + Krishna | DoH, EDE | Grant milestone 6 evidence ready |

---

## 8. Fixes our own docs need (separate PR; this research changes nothing in them)

| Doc | Change |
| --- | --- |
| docs/07, docs/10 Q&A | The device classification question goes to **EDE** (federal). DoH is the route for HTA, app registration and ADHICS. |
| docs/07 | Add the 25-year retention versus one-step deletion clash. Add the DoH privacy standard, the ADHIE limits and the "AI off" switch. |
| docs/07 (LLM safety) | PII redaction is not enough for real data. Production uses a UAE-hosted model or no LLM. |
| docs/12 moat | Change "Malaffi-ready FHIR integration" to "FHIR R4 export into the clinic's EMR, which feeds Malaffi". |
| docs/12 go-to-market | Month 3: approvals filed, UAE stack live, synthetic usability tests. Months 4–6: consented pilot behind the gates. |
| docs/05 | Add the V1 Responsible AI Standard URL (below) beside the existing DoH link. |
| Feature backlog | Never add contraception or "safe days" features. |

---

## 9. Judge Q&A: 30-second answers

- **"Is it a medical device?"** "UAE law counts software and AI as medical equipment when they are meant to diagnose, treat or prevent disease, or for birth control. Our intended use is a personal record and consultation prep that *informs* clinicians. We've mapped every function to IMDRF categories, and the borderline ones are pattern cards, questionnaire scores and red-flag signposting. Before any pilot, we'll ask EDE for a written classification and use DoH's HTA software pre-evaluation. If EDE says it's a device, we follow that pathway and don't market until approved."
- **"Where does the data live?"** "Today it's synthetic only. In the pilot, everything runs on UAE-hosted infrastructure, as Article 13 of Federal Law 2/2019 and ADHICS v2 require, and no patient data goes to an offshore AI."
- **"Do you plug into Malaffi?"** "Not directly. Malaffi is for licensed facilities, and its policy bans re-using its data. We export FHIR into the clinic's EMR, and the EMR already feeds Malaffi."
- **"How do you meet the Responsible AI Standard?"** "A risk file for each AI component, rules that decide while the LLM only words things, a named owner, validation and fairness tests, monitoring, and a switch that lets her turn AI off."
- **"Consent?"** "Written consent for each purpose, which she can revoke, with selective sharing and an audit trail. We've asked DoH how the 25-year retention rule applies to records she creates herself."

---

## 10. Open questions for DoH and EDE (log in QUESTIONS.md)

1. **EDE:** Is ReproSense not a medical product, a health care product, or medical equipment? Which functions tip it over: pattern cards, EPDS scoring, red-flag signposting?
2. **DoH Facility Licensing:** Does a consultation-prep record used through clinics need the mobile-app company registration?
3. **DoH:** Does Article 20's 25-year retention apply to patient-generated records she asks to delete?
4. **DoH:** Does in-app e-consent count as "written approval" under Article 16? Is UAE PASS signing expected?
5. **DoH AAMEN:** Which ADHICS tier applies to a small service provider? Is the AAMEN portal open to vendors yet?
6. **DoH:** May a third-party, UAE-hosted LLM process identifiable pilot data under a data processing agreement? Is any de-identified offshore call ever acceptable?
7. **ADHDS:** Is there a FHIR or patient-mediated route for apps? May a woman import her own Sahatna or Malaffi export?
8. **DoH research:** Does a single-clinic usability and workflow pilot need only a facility ethics committee, or ADHRTC too?
9. **DoH:** What authorisation is needed to share aggregate care-gap metrics with payers?

---

## 11. Sources (all accessed 6 Nov 2026)

**UAE federal**
- Federal Law No. 2 of 2019 (official English text, Emirates Health Services flipbook), pages 2–9: https://www.ehs.gov.ae/app_content/legislations/php-law-en-77/files/basic-html/page5.html (and page2 … page9.html) [P]
- Federal Decree-Law No. 38 of 2024 (UAE Legislation portal, read via search extracts): https://uaelegislation.gov.ae/en/legislations/2751 [P-idx]
- Baker McKenzie, UAE new medical products law (14 Jan 2025): https://healthcarelifesciences.bakermckenzie.com/2025/01/14/uae-enacts-new-pharma-law-to-boost-pharmaceutical-innovation/ [S]
- Emirates Drug Establishment homepage: https://www.ede.gov.ae/ [P]
- RegDesk, device services moved from MOHAP to EDE (16 Jan 2026): https://www.regdesk.co/blog/uae-medical-device-regulatory-update-transfer-of-services-from-mohap-to-ede [S]
- CMS, Ministerial Resolution 51/2021 exceptions: https://cms.law/en/are/legal-updates/uae-health-data-new-data-transfer-permissions [S]
- UAE government portal, data protection laws: https://u.ae/en/about-the-uae/digital-uae/data/data-protection-laws [P]
- DLA Piper, Data Protection Laws of the World, UAE: https://www.dlapiperdataprotection.com/index.html?t=law&c=AE [S]
- IBA, "How is AI in healthcare being regulated in the UAE?" (11 May 2026): https://www.ibanet.org/ai-healthcare-regulation-uae [S]

**Department of Health – Abu Dhabi**
- Responsible AI Standard V1 (2025): https://www.doh.gov.ae/-/media/Feature/Resources/Standards/2025/Responsible-AI-Standard-V1.ashx [P-idx]. The existing docs/05 link https://www.doh.gov.ae/-/media/B84FF5DD027846699C51F36C439A580F.ashx appears to be the same standard [P-idx].
- Lexis Middle East record of the Responsible AI Standard: https://www.lexismiddleeast.com/regulatory/AbuDhabi/UAEDepartmentHealthAbuDhabi_Responsible_AI_Standard/en [S]
- Responsible AI Risk Management Protocol: https://www.doh.gov.ae/-/media/8BD7C5DEC5974781B4C11BA00964B6F7.ashx [P-idx]
- Policy on Use of AI in the Healthcare Sector (2018): https://www.doh.gov.ae/-/media/E9C1470A575146B18015DEBE57E47F8D.ashx [P-idx]; Al Tamimi summary: https://www.tamimi.com/news/new-policy-on-artificial-intelligence-in-healthcare-issued-by-the-department-of-health-abu-dhabi/ [S]
- Standard for use of AI in detecting (2025): https://www.doh.gov.ae/-/media/Feature/Resources/Standards/2025/050825_Standard-use-of-AI-in-detecting-PT-AD.ashx [P-idx]
- ADHICS v2 standard: https://www.doh.gov.ae/-/media/Feature/Resources/Standards/ADHICS-v2-standard.ashx [P-idx]; ADHICS v2 implementation guideline: https://www.doh.gov.ae/-/media/Feature/Resources/Guidelines/ADHICS-v2-implemetation-guideline.ashx [P-idx]
- DTS Solution, ADHICS v2 changes: https://www.dts-solution.com/adhics-v2-0-whats-new-whats-changed/ [S]
- Baker McKenzie via Global Compliance News, DoH Circular 147/2022: https://www.globalcompliancenews.com/2022/10/07/https-insightplus-bakermckenzie-com-bm-data-technology-uae-abu-dhabi-department-of-health-requires-licensed-entities-to-comply-with-strict-data-localization-requirements_09222022/ [S]
- US-UAE Business Council, DoH officials on cross-border health data (12 May 2025): https://usuaebusiness.org/events/department-of-health-abu-dhabi-clarifies-cross-border-health-data-laws/ [S]
- US International Trade Administration, UAE cross-border health data: https://www.trade.gov/market-intelligence/united-arab-emirates-regulations-limit-cross-border-health-data-flows [S]
- DoH Standard on Patient Healthcare Data Privacy (Sept 2020), hosted by Malaffi: https://staticcdn.malaffi.ae/wpblobe9e5523f25/2021/02/2020-09-15-DOH-Standard-on-Patient-Healthcare-Data-Privacy-for-publication-2.pdf [P]
- DoH Policy on Digital Health (Sept 2020): https://www.doh.gov.ae/-/media/B5F0E47029F04CD8AD4CA16DC1FDBC66.ashx [P-idx]
- Digital Products Governance Standard: https://www.doh.gov.ae/-/media/3096D636D0E24FA78971CFF2EE180367.ashx [P-idx]
- DoH e-service, registration of mobile-app healthcare companies: https://www.doh.gov.ae/en/eservices/mobile-apps-accreditation [P-idx]
- DoH HTA Guidelines (2025): https://www.doh.gov.ae/-/media/Feature/Resources/Guidelines/2025/Health-Technology-Assessment-Guidelines.ashx [P-idx]; Technology Registry: https://www.doh.gov.ae/en/research/Technology-Registry [P-idx]; Research and Innovation Center: https://www.doh.gov.ae/en/research/landing-page [P-idx]
- DoH Standard on Tele-Medicine (2020): https://www.doh.gov.ae/-/media/0272CB2B824D41D6B4A2A5C78EBD94F9.ashx [P-idx]; Al Tamimi note: https://tamimi.com/news/abu-dhabi-uae-doh-telehealth-standard-2020 [S]

**Malaffi**
- Homepage (statistics): https://www.malaffi.ae/ [P]
- Facilities required to connect and onboarding: https://www.malaffi.ae/providers/facilities-required-to-connect/ [P]
- Policies page: https://www.malaffi.ae/what-is-malaffi/policies/ [P]
- DoH Policy on the Abu Dhabi Health Information Exchange (Apr 2020): https://staticcdn.malaffi.ae/wpblobe9e5523f25/2020/04/doh-policy-on-the-adhie-april-2020.pdf [P]
- Privacy notice (v2.0, updated May 2025): https://www.malaffi.ae/privacy-notice/ [P]
- What medical information is shared: https://www.malaffi.ae/patients/what-medical-information-is-shared/ [P]
- WAM, Sahatna launch: https://www.wam.ae/en/article/b5p217f-department-health-abu-dhabi-launches-sahatna [S]

**International frameworks**
- IMDRF N12 (2014), primary PDF (timed out today): https://www.imdrf.org/sites/default/files/docs/imdrf/final/technical/imdrf-tech-140918-samd-framework-risk-categorization-141013.pdf; Akin Gump summary (17 Oct 2014): https://www.akingump.com/a/web/33075/aohVS/imdrf-releases-international-framework-for-regulating-device-sof.pdf [S]
- IMDRF N81 FINAL:2025 (primary PDF timed out): https://www.imdrf.org/sites/default/files/2025-01/IMDRF_SaMD%20WG_Software-Specific%20Risk_N81%20Final_0.pdf; Emergo by UL summary (30 Jan 2025): https://www.emergobyul.com/news/imdrf-releases-key-guidance-documents-medical-device-software [S]
- FDA Clinical Decision Support Software guidance (final, January 2026): https://www.fda.gov/regulatory-information/search-fda-guidance-documents/clinical-decision-support-software [P, page metadata only]
- FDA General Wellness guidance (final, January 2026): https://www.fda.gov/regulatory-information/search-fda-guidance-documents/general-wellness-policy-low-risk-devices [P, page metadata only]

**Repo context:** docs/01, 04, 05, 07, 08, 10, 12, 14, 15 and knowledge_base/sources.yaml (read, not modified).
