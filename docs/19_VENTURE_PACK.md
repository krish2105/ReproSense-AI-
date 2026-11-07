# 19 · Venture pack

Card A10 (#46), 7 Nov 2026.

**Status: draft, pending clinician review.** Before anyone outside the team sees this pack, the advisor signs off four things: the intended use, the pilot measure (test and window), the cycle example and the red-flag wording.

- **Decision.** First paying customer (to validate): an Abu Dhabi women's health clinic that sees women after birth, in a group that also runs family medicine. UEMS is an example: Danat Al Emarat plus HealthPlus Family Health (04 §1.4 ← [M42, 17 Nov 2025][m42]). Price hypothesis, to validate: a 3-month paid pilot at AED 5,000–10,000, then AED 399 per clinician a month (04 §9). Primary measure: postpartum glucose tests completed after gestational diabetes. No real patient data until gates G1–G8 pass (03 §6).
- **Why.** DoH already collects this follow-up quarterly as Jawda PC008 (01 §4.3 ← [Jawda PC v7][jawda]). At the hypothesis price of AED 399, specialist seats come to about AED 3.35M a year, or about AED 5.15M with midwives (04 §2, our arithmetic ← [AD Media Office][admo]). So the pilot must measure one follow-up outcome that networks and payers value.
- **Risks.**
  - No interview or LOI is on record (docs/15).
  - EDE decides device status (03 §1.1).
  - PC008 counts family-medicine and GP visits, not specialist ones (01 §4.3 ← [Jawda PC v7][jawda]).
  - Twenty patients may include only about 4 with gestational diabetes, and not all will be after birth during the pilot (our inference; our arithmetic; 02 §3.4: 18.9% at one Al Ain hospital, Agarwal 2022, R14; 21.3% by IADPSG in the Mutaba'ah cohort, Bashir 2022, R11).
  - No clinician sign-off yet.
- **Next action.** Owner: Yash, proposed partnerships lead (03 §7; team to confirm). Before 16 Nov: 5 clinician and 3 clinic-manager interviews, 1 LOI, the clinical advisor recruited, every step logged in the B7 tracker (docs/15).

## 1. Intended use and claims

The draft below comes from 03 §1.5 and §1.4. *Pending founder and clinician sign-off.*

> ReproSense is a personal health record and consultation-preparation tool. A woman records her own cycles, symptoms, questionnaires and lab results. ReproSense organises them, shows where her entries meet published guideline thresholds for discussion with a doctor, and creates a summary she can choose to share with her clinic. It also shows fixed, sourced safety messages, such as calling 998, when she logs certain urgent symptoms. It scores validated questionnaires against their authors' published cut-offs, and it reminds her and her clinic of follow-ups that guidelines schedule. It never orders tests. It does not diagnose, treat, predict or prevent disease, does not give contraceptive advice, and does not replace a clinician's judgement. Clinicians can see the entries and guideline behind every item.

- **Never say:** a diagnosis or likelihood, "early detection", "screening for PCOS", "risk score", "fertile days", "safe days", "AI doctor", "DoH-approved", "ADHICS-compliant", "100% secure", "clinically validated", "it's not a medical device" or "non-device" (03 §1.5; 05 §7, §10).

Detail: Appendix A.1

## 2. Regulatory one-pager

The Emirates Drug Establishment (EDE) decides device status.

**Eight gates before any real record (03 §6):**
- G1: UAE company.
- G2: EDE classification in writing, plus the HTA pre-evaluation.
- G3: DoH app registration, or written word that it is not needed.
- G4: ADHICS v2 controls on a UAE-hosted stack, model included.
- G5: PIA, consent in English and Arabic, data processing agreement, 24-hour breach plan, retention policy.
- G6: ethics approval.
- G7: Responsible AI risk file.
- G8: clinician-signed rules, hazard log, red-flag tests at 100% recall.

**If EDE says it is medical equipment:** no pilot or marketing until EDE marketing approval. We then start ISO 13485, ISO 14971 and IEC 62304 (03 §1.2, §1.5).

Detail: Appendix A.2

## 3. Six-month milestones and the pilot measure

| Month | Grant tranche (official trigger) | Milestones | Owner (proposed) |
| --- | --- | --- | --- |
| 0 · 22–30 Nov | 50% on signing | Sign; claims frozen; device memo; regulatory register | Yash, Atharva |
| 1 · Dec | 10%: founders' agreement and venture plan | 10 interviews; 1 clinic LOI; EDE enquiry; HTA pre-evaluation; ADGM or DED licence choice; ADHICS gap assessment, PIA, AI risk assessment | Yash (EDE, DoH), Krishna (ADHICS, hosting) |
| 2 · Jan | none | Pilot and data processing agreements; English and Arabic consent; breach plan; retention policy; clinician signs the rules | Yash, clinical advisor (to recruit) |
| 3 · Feb | 15%: MVP beyond the demo, validated with a few users | UAE stack live; penetration test; applications filed (EDE, HTA, app registration), no approval yet; 15–20 women and 3 clinicians test on synthetic personas | Krishna, Atharva |
| 4–5 · Mar–Apr | none | Gate review; if G1–G8 are green, a consented pilot (up to 20 women, 3 clinicians, one clinic); weekly safety review | All, clinical advisor |
| 6 · May | 25%: UAE-licensed company, founders as shareholders | Licence; ADHICS evidence pack; interim pilot report with measured results only (our inference: a 3-month pilot from month 4 ends at month 6); paid pilot contract; regulatory strategy v2 | Yash, Krishna |

*Source:* tranches 01 §1 ← [HealthX Ajyal][ajyal] (timings indicative); milestones 03 §7 (abridged) and docs/12.

**Primary pilot measure (draft, pending clinician review).** Eligible patients are pilot patients with gestational diabetes in their current pregnancy. The measure is the share of them who complete the postpartum glucose test within 12 weeks of birth (75 g 2-hour OGTT, or the clinic's protocol test). It matches the glucose element of Jawda PC008 (01 §4.3 ← [Jawda PC v7, Jul 2023][jawda]; detail in A.3).
- **Baseline:** the clinic works out its own current rate inside its own systems. It shares only an aggregate count (x of n, n ≥ 10), and only after its privacy officer agrees. If n is under 10, the baseline stays with the clinic. ReproSense receives no patient-level records until G1–G8 pass (03 §1.4, §2.3, §6).
- **Local reference (not a baseline):** at one Al Ain hospital in 2013–14, 265 of 1,043 women (25.4%) came back for the 4–6-week OGTT. That is one hospital, old data and a different window. Most international studies report 31–49% (02 §3.5 ← [Agarwal 2022][agarwal], [Eng 2024][eng]).

Detail: Appendix A.3

## 4. Market size and competitors

We use no top-down femtech figure, because none was trusted (04 §2). What sets ReproSense apart is the combination: the clinic loop, sourced rules, after-birth care gaps, Arabic and UAE privacy. The ReproSense row in A.4 shows the demo and its plans, not a tested pilot.

Detail: Appendix A.4

## 5. First customer

**Profile (decision, to validate).** An Abu Dhabi women's health clinic that sees women after birth, in a multi-site group that also runs family medicine, so PC008-eligible visits are in scope (01 §4.3, §6). The medical director signs, a lead OB-GYN champions it and the privacy officer reviews it.
- **What did a clinic manager actually say?** Nothing is recorded yet.

Detail: Appendix A.5

## Appendix A: detail and sources

All facts come from research/2026-11-06/01–05 and docs/05, 07, 12 and 15. Tags read *file § ← outside source*, so "03 §7" means research/2026-11-06/03, section 7. **Hypothesis** means no source yet. **Not found** means it is not in those files. **Our inference / our judgement** means the team's reasoning. All demo data is fictional.

No licensed clinician has signed this wording. The clinical advisor is still "to recruit" (03 §7), and the sign-off of rules/clinical_rules.yaml is unticked (docs/15).

### A.1 Intended use and claims

In month 0 all founders sign three documents: *Intended Use & Claims v1*, a device memo (IMDRF N12 and N81) and a regulatory register (03 §7).

*Intended population:* not found. Define it in v1 (adults; cycle rules exclude anyone less than 3 years after her first period).

- **Say** "a pattern worth discussing with a doctor", with her data shown against the threshold. Example (illustrative; pending clinician review): "4 of 6 logged cycles were longer than 35 days. For women more than 3 years after their first period, the 2023 international PCOS guideline describes cycles shorter than 21 or longer than 35 days as irregular — a pattern worth discussing with a doctor" (docs/05 ← [Nordic perspective][nordic]).
- **IMDRF reading (ours, not a ruling).** Cards *inform* care (Category I). "Early signs of a named disease" would *drive* it (Category II) (03 §1.3–1.4 ← [Akin Gump][akin]). Two functions are borderline: red-flag signposting (possibly Category III) and questionnaire scores (possibly Category II). We name both in the EDE enquiry (03 §1.4, §10 Q1).
- **On device status, say** that classification is the regulator's decision and we don't self-certify. Make no device claim in either direction, and no wellness claim: cards apply thresholds and suggest a doctor (05 §0.4, §5, §10 Q1).
- **Never build** contraception or "safe days" features, because birth control is a listed device purpose (Decree-Law 38/2024, Art. 1 ← [UAE Legislation][dl38]). Every new rule gets a "device check" field (inform or drive). A "drive" rule needs regulatory review first (03 §1.5).

### A.2 Regulatory one-pager

Software or AI offered to diagnose, treat or prevent disease, or for birth control, counts as medical equipment and needs EDE approval (Decree-Law 38/2024, Arts. 1 and 5; in force 2 Jan 2025). DoH runs the HTA pre-evaluation, app registration, ADHICS and the privacy and AI standards (03 §1.1–1.2 ← [EDE][ede], [RegDesk][regdesk], [Baker McKenzie][bm38]; docs/07). Contacts: EDE; DoH Facility Licensing (hfld@doh.gov.ae), AAMEN (aamen@doh.gov.ae), ADHTAC (03 §2.3–2.4 ← [US-UAE Business Council][usuabc], [DoH e-service][appreg]).

**Data, ADHICS and AI**
- Health data, backups and any model stay in the UAE (Federal Law 2/2019, Art. 13; fine AED 500,000–700,000, Art. 24). De-identified data still needs DoH authorisation before it goes to a third party (Circular 147/2022) (03 §2.3, §3.1 ← [Law 2/2019][law2], [Baker McKenzie][c147]).
- Records are kept for at least 25 years (Art. 20). Our promise is "remove from service and stop all sharing; deletion as the law allows" (03 §4; docs/07).
- ADHICS v2 (May 2024) accepts UAE cloud (03 §2.3 ← [DTS][dts], [US-UAE Business Council][usuabc]). Say "will be mapped to ADHICS; the formal assessment is a month-6 milestone" (05 §7, §10 Q5).
- DoH's Responsible AI Standard V1 (1 Oct 2025) binds our clinic customers. It asks for a risk assessment for each AI system, an AI opt-out (ours is built and tested) and compute and support access inside the UAE (03 §2.1; 01 §5.1 ← [DoH RAI Standard][rai2], [V1 link][rai]).
- **Hosting (hypothesis).** Supabase, Render and Vercel hold synthetic data only and have no UAE region. Production goes on AWS me-central-1 or Azure UAE North, with a UAE-hosted model or none. The pilot stack costs about AED 122 a month, excluding disk, data transfer and a public IP. Production is not priced (docs/07; docs/12 ← [AWS EC2][awsec2], [AWS RDS][awsrds], [AWS VAT][awsvat]).

### A.3 Six-month milestones and the pilot measure

AED per tranche: not found. The prize pool is AED 30,000 (15k / 10k / 5k) (01 §1; 05 §1).

DoH collects PC008 quarterly for GP and family-medicine visits 7–84 days after birth (01 §4.3 ← [Jawda PC v7, Jul 2023][jawda]; 2026 wording to confirm). The primary measure also matches SMFM's proposed 12-week metric (02 §3.5 ← [SMFM 2023][smfm]).
- **Secondary (operational):** clinician minutes to understand a new patient's history, or the share of visits where she brought a report (05 §6 ← [Upstart Bar][decision]).
- A PC008 baseline for any Abu Dhabi provider: not found.
- **Target:** no source sets one. We agree it in the LOI against the clinic's own baseline, with a review date and a decision-maker, and report counts (x of n) (05 §6 ← [Upstart Bar][decision]).
- **Limits:**
  - No sample-size calculation exists (02 §4).
  - SMFM advises against tying this metric to financial incentives for now, so we sell seats, not pay per closed gap (02 §4 ← [SMFM 2023][smfm]).
  - The dashboard's PC008 counts are synthetic (docs/12; docs/15).

### A.4 Market size and competitors

| Abu Dhabi | Figure | Source |
| --- | --- | --- |
| Women aged 18–45 | Not found | 04 §1.1 |
| Women, all ages | ≈ 1.37 million, 33% of 4.14 million (2024) | 04 §1.1 ← [SCAD][scad] |
| Fertility centres · women's health facilities | 14 · 45 (Jul 2025) | 04 §1.1 ← [AD Media Office][admo] |
| OB-GYN workforce | 2,800+, incl. ≈ 700 specialists and consultants · 375 midwives (Jul 2025) | same |
| IVF cycles | 6,180+ (2024) | same |
| Births in Abu Dhabi facilities | 30,000+ (2023) | 04 §1.1 ← [Gulf News][gn] |

At the hypothesis price, 700 seats × AED 399 × 12 ≈ AED 3.35M a year, or ≈ AED 5.15M with midwives (our arithmetic; 04 §2; docs/12). It is not a ceiling, because the wider OB-GYN workforce is 2,800+ (04 §1.1). It is also not a venture on its own. After seats come network licences (AED 150,000–400,000 a year, hypothesis), payer reporting on care gaps (phase 2; price is a very-low-confidence placeholder), and then the GCC (04 §2, §9).

| | Doctor summary | Clinician sees record | Care gaps | Rule and source per card | Arabic | Pregnancy and after birth | Tracking (App Store) | UAE residency |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Flo | Yes (Premium, 6 cycles) | No | NF | NF | No | Partial | Tracks | NF |
| Clue | Yes (paid, 6 cycles) | NF | NF | NF | Yes | Partial | Tracks | NF |
| Natural Cycles | Yes (perimenopause) | NF | NF | NF | No | Partial | Not checked | NF |
| Oura | Partial | Partial | NF | NF | Yes | Partial | Not checked | NF |
| Nabta | NF | Yes (own clinicians) | Partial | NF | NF | NF | NF | NF |
| Salve | NF | Partial | Partial | n/a | No | NF | NF | NF |
| **ReproSense (demo)** | Yes (12 months) | Yes (separate route) | Yes | Yes | Yes (review pending) | Yes | No ad SDKs (planned; no App Store listing) | Planned |

*Source:* 04 §7, cells cited in 04 §4–6 ← Flo ([report][flo1], [clinicians][flo2], [App Store][flo3]), Clue ([App Store][clue1], [report][clue2]), Natural Cycles ([perimenopause][nc1], [App Store][nc2]), Oura ([blog][oura1], [App Store][oura2]), [Nabta][nabta], [Salve][salve]. NF = not found. The ReproSense row shows the demo and its plans, not a tested pilot. Nabta sells to the same buyers and could be a partner (04 §5, §7).

### A.5 First customer

The clinic team's pain (medical director, lead OB-GYN, privacy officer): short visits, messy histories and missed follow-ups (docs/12).
- **Best fit (our judgement):** M42's UEMS, which owns Danat Al Emarat, HealthPlus Family Health and HealthPlus Diabetes and Endocrinology. Big groups buy slowly (04 §1.4 ← [M42][m42]).
- **Fastest yes (04 §1.4 judgement):** HealthPlus IVF / Umniya and Fakih IVF. Fakih IVF's sale to Blue Ocean Health Group was agreed on 7 Feb 2025, but completion is not confirmed (04 §1.4 ← [M42][m42], [NMC][nmc], [Umniya, The National advertorial, 10 Feb 2026][umniya]). Both focus on fertility, so they fit better as a second pilot (our judgement).
- **Price, to validate (ex VAT):** free for women. A paid pilot at AED 5,000–10,000 for 3 months, credited to year 1. Then AED 399 per clinician a month (test 299 / 399 / 549), or AED 1,990 a month for up to 5 clinicians (04 §9; docs/12).
- docs/15 (our own estimate) scores Venture at 23/30 on 5 Nov. It reaches 27 by 16 Nov only with the advisor, the interviews, 1 LOI, a priced offer and this plan.

**Letter of intent:** use the docs/15 template (`docs/drafts/26-letter-of-intent.md` does not exist yet). Before sending, add the upgrades in 05 §6:
1. A named clinical champion and a decision-maker.
2. The primary measure plus one secondary measure. The baseline is the clinic's own aggregate rate, worked out inside its systems and shared only as x of n (n ≥ 10) once its privacy officer agrees.
3. An agreed target, a review date, and what follows success.
4. "Any required ethics approval" in the subject-to clause (G6).
5. Confidentiality as the only binding clause.

**B7 tracker.** Stages: contacted, interviewed, LOI sent, LOI signed, paid pilot.

| Clinic type | Contact role | Date | Stage | Next step |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |

[agarwal]: https://doi.org/10.3390/ijerph192113946
[eng]: https://doi.org/10.3389/fgwh.2024.1391213
[smfm]: https://doi.org/10.1016/j.ajog.2022.12.315
[jawda]: https://www.doh.gov.ae/-/media/Feature/Muashir/Jawda/Jawda-Quarterly-Submission-Guidelines/PrimaryCare-JAWDA---Update-2022.ashx
[ajyal]: https://upstartbar.com/ajyal/
[decision]: https://upstartbar.com/insights/give-every-pilot-a-decision-date.html
[nordic]: https://helda.helsinki.fi/server/api/core/bitstreams/ab97d92f-9773-4c9c-adc0-53178c47bd91/content
[akin]: https://www.akingump.com/a/web/33075/aohVS/imdrf-releases-international-framework-for-regulating-device-sof.pdf
[dl38]: https://uaelegislation.gov.ae/en/legislations/2751
[ede]: https://www.ede.gov.ae/
[regdesk]: https://www.regdesk.co/blog/uae-medical-device-regulatory-update-transfer-of-services-from-mohap-to-ede
[bm38]: https://healthcarelifesciences.bakermckenzie.com/2025/01/14/uae-enacts-new-pharma-law-to-boost-pharmaceutical-innovation/
[usuabc]: https://usuaebusiness.org/events/department-of-health-abu-dhabi-clarifies-cross-border-health-data-laws/
[appreg]: https://www.doh.gov.ae/en/eservices/mobile-apps-accreditation
[law2]: https://www.ehs.gov.ae/app_content/legislations/php-law-en-77/files/basic-html/page5.html
[c147]: https://www.globalcompliancenews.com/2022/10/07/https-insightplus-bakermckenzie-com-bm-data-technology-uae-abu-dhabi-department-of-health-requires-licensed-entities-to-comply-with-strict-data-localization-requirements_09222022/
[dts]: https://www.dts-solution.com/adhics-v2-0-whats-new-whats-changed/
[rai2]: https://www.doh.gov.ae/-/media/B84FF5DD027846699C51F36C439A580F.ashx
[rai]: https://www.doh.gov.ae/-/media/Feature/Resources/Standards/2025/Responsible-AI-Standard-V1.ashx
[awsec2]: <https://b0.p.awsstatic.com/pricing/2.0/meteredUnitMaps/ec2/USD/current/ec2-ondemand-without-sec-sel/Middle%20East%20(UAE)/Linux/index.json>
[awsrds]: https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonRDS/current/me-central-1/index.json
[awsvat]: https://aws.amazon.com/tax-help/uae/
[scad]: https://scad.gov.ae/w/abu-dhabi-population-in-2024-grows-7-5-to-reach-4-14m
[admo]: https://www.mediaoffice.abudhabi/en/health/department-of-health-abu-dhabi-launches-rewarding-exceptional-quality-programme-recognising-excellence-by-healthcare-providers/
[gn]: https://gulfnews.com/amp/gulfnews/uae/health/30000-births-in-1-year-abu-dhabi-boosts-maternity-services-1.101851919
[flo1]: https://help.flo.health/hc/en-us/articles/51631220426900-I-want-to-generate-a-report-for-my-doctor
[flo2]: https://med.flo.health/about-flo
[flo3]: https://apps.apple.com/ae/app/flo-period-pregnancy-tracker/id1038369065
[clue1]: https://apps.apple.com/ae/app/clue-period-cycle-tracker/id657189652
[clue2]: https://helloclue.com/terms-of-service-doctors-report
[nc1]: https://www.naturalcycles.com/perimenopause
[nc2]: https://apps.apple.com/ae/app/id765535549
[oura1]: https://ouraring.com/blog/oura-built-for-womens-health-across-every-life-stage/
[oura2]: https://apps.apple.com/ae/app/oura/id1043837948
[nabta]: https://www.wamda.com/2026/10/nabta-health-advances-3-million-pre-series-backing-pvp
[salve]: https://apps.apple.com/gb/app/salve/id1282638920
[m42]: https://m42.ae/media-resources/news/m42-and-olive-rock-partners-agree-strategic-alignment-of-assets-to-advance-healthcare-delivery/
[nmc]: https://nmc.ae/en/news/NMC-Healthcare-announces-its-intent-to-sell-its-stake-in-FakihIVF
[umniya]: https://www.thenationalnews.com/business/2026/02/10/umniya-fertility-launches-in-abu-dhabi-with-an-outcome-led-whole-person-approach-to-care
