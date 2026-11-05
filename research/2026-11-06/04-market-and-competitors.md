# 04 · Market, customers and competitors

**Track:** the size of the first customer segment, what clinic software costs, femtech and clinic-side competitors, and where ReproSense is different. Ends with a positioning statement and a price hypothesis.
**Researched:** 6 Nov 2026. **Every link was accessed on 6 Nov 2026**, except items marked "repo doc".
**For:** the HealthX Ajyal pitch: Venture 30, Health impact 20, Innovation and evidence 20.

**Status codes used below**

| Code | Meaning |
| --- | --- |
| P | Primary source read today: government, regulator, insurer, or the company's own page or release |
| S | Press or trade article read today |
| V | Company or vendor claim read today, not checked independently |
| T | Third-party listing or competitor blog read today (weak) |
| D | Derived: our own arithmetic from cited inputs (inputs shown) |
| NV | Not verified: seen only in a search-result summary, or the page blocked our fetch |

The shared web-search budget for this run ran out near the end. Items marked NV could not be checked further. Rates use USD 1 = AED 3.6725 (the CBUAE peg; the CBUAE page blocked our fetch, so the peg was not re-checked today).

---

## 0. Five findings that matter most for winning

1. **The first buyer can be counted, and DoH already pays it for quality.** Abu Dhabi has 14 specialised fertility centres and 45 women's health facilities. It has about 700 OB-GYN specialists and consultants and 375 midwives, and ran 6,180+ IVF cycles in 2024. DoH's value-based "Rewarding Exceptional Quality" programme started with fertility in July 2025. It rewards providers that meet quality goals, and Gulf News describes the rewards as financial incentives. ([S1](https://www.mediaoffice.abudhabi/en/health/department-of-health-abu-dhabi-launches-rewarding-exceptional-quality-programme-recognising-excellence-by-healthcare-providers/), [S2](https://gulfnews.com/uae/health/new-abu-dhabi-initiative-rewards-excellence-in-fertility-care-1.500217482))
2. **Thiqa funds a lot of IVF and asks for evidence every cycle.** Daman's Thiqa guideline (last updated 26 Nov 2025) covers up to six egg retrievals and three embryo transfers per patient per year. It pays in bundles and needs pre-authorisation at the start of each cycle. Clinics with structured histories have an easier time. ([S6](https://www.damaninsurance.ae/wp-content/uploads/2026/01/Thiqa-Coverage-for-Assisted-Reproductive-Treatment-Services-External.pdf))
3. **A doctor PDF is not our moat. Competitors already have one.** Flo sells a "report for a doctor": Premium only, iOS only, the last six cycles, and not available while tracking pregnancy. Clue sells a one-off six-cycle report. Natural Cycles and Oura also let users share with clinicians. Flo says its app does not connect to practice systems, and its UAE App Store listing has no Arabic. Our real difference is the combination of five things: the clinic loop, rules that show their source, after-birth care gaps, Arabic, and UAE privacy. ([S31](https://help.flo.health/hc/en-us/articles/51631220426900-I-want-to-generate-a-report-for-my-doctor), [S32](https://med.flo.health/about-flo), [S33](https://apps.apple.com/ae/app/flo-period-pregnancy-tracker/id1038369065), [S37](https://helloclue.com/terms-of-service-doctors-report))
4. **Nabta Health now sells to our buyers.** In October 2026 it moved from consumer sales to "AI-powered preventive healthcare infrastructure" for employers, insurers and providers. It has an AI care-navigation tool called Aya and runs its own clinics. It is our nearest regional rival and a possible partner. ([S50](https://www.wamda.com/2026/10/nabta-health-advances-3-million-pre-series-backing-pvp))
5. **Seat prices support about AED 399 per clinician per month, but seats alone make a small market.** UAE clinics pay about AED 89–249 per practitioner for practice software (vendor figures we could not fully verify). In 2019 Okadoc said doctors paid it about AED 500 a month on average. AI scribes cost about USD 100–150 per clinician per month. All Abu Dhabi OB-GYN specialists and midwives at AED 399 come to about AED 5.2M a year. So the venture story needs clinic-network licences and payer revenue for closed care gaps. For scale: the UAE has 1.27M adults with diabetes, 64% of them undiagnosed, at USD 1,583.5 per person per year. ([S20](https://www.khaleejtimes.com/get-your-doctors-appointment-in-seconds), [S61](https://international-diabetes-federation.s3.eu-west-1.amazonaws.com/media/uploads/sites/3/2025/08/IDF_Atlas_11_2025_MENA_Factsheet.pdf))

**Pitch fixes these imply (the docs were not edited, per this task):**
- The docs/10 answer to "Why not just Flo or Clue?" says they only predict periods. That is out of date now that both sell doctor reports. Answer with the clinic loop and explainable rules instead.
- On the venture slide, use the Abu Dhabi fertility numbers above, not a top-down femtech market figure.

---

## 1. First customer segment: women's health, fertility and IVF clinics

### 1.1 Abu Dhabi: how big is the segment?

| Measure | Figure | Data date | Source (accessed 6 Nov 2026) | Status |
| --- | --- | --- | --- | --- |
| Specialised fertility centres | 14 | Jul 2025 | [S1](https://www.mediaoffice.abudhabi/en/health/department-of-health-abu-dhabi-launches-rewarding-exceptional-quality-programme-recognising-excellence-by-healthcare-providers/), [S2](https://gulfnews.com/uae/health/new-abu-dhabi-initiative-rewards-excellence-in-fertility-care-1.500217482) | P |
| Licensed facilities offering assisted reproduction | 14, two of them opened in 2024. The 2023 count was 12. | Feb 2025; Mar 2024 | [S3](https://www.mediaoffice.abudhabi/en/health/abu-dhabis-ivf-services-ranked-among-the-most-successful-worldwide-in-2024-with-51-percent-success-rate/), [S4](https://gulfnews.com/amp/gulfnews/uae/health/30000-births-in-1-year-abu-dhabi-boosts-maternity-services-1.101851919) | P / S |
| Women's health facilities | 45 | Jul 2025 | [S1](https://www.mediaoffice.abudhabi/en/health/department-of-health-abu-dhabi-launches-rewarding-exceptional-quality-programme-recognising-excellence-by-healthcare-providers/) | P |
| OB-GYN workforce | 2,800+ professionals, including about 700 specialists and consultants and 375 midwives | Jul 2025 | [S1](https://www.mediaoffice.abudhabi/en/health/department-of-health-abu-dhabi-launches-rewarding-exceptional-quality-programme-recognising-excellence-by-healthcare-providers/) | P |
| OB-GYN workforce (earlier) | 642 specialists and consultants, 383 midwives | 2023 data | [S4](https://gulfnews.com/amp/gulfnews/uae/health/30000-births-in-1-year-abu-dhabi-boosts-maternity-services-1.101851919) | S |
| IVF cycles | 6,180+ | 2024 | [S1](https://www.mediaoffice.abudhabi/en/health/department-of-health-abu-dhabi-launches-rewarding-exceptional-quality-programme-recognising-excellence-by-healthcare-providers/), [S2](https://gulfnews.com/uae/health/new-abu-dhabi-initiative-rewards-excellence-in-fertility-care-1.500217482) | P |
| Births after IVF | 695 | 2024 | [S3](https://www.mediaoffice.abudhabi/en/health/abu-dhabis-ivf-services-ranked-among-the-most-successful-worldwide-in-2024-with-51-percent-success-rate/) | P |
| IVF success rate | Above 51% (DoH, 2025). The Sept 2026 programme gives 59% emirate-wide, with a target of 80% by 2030. These are two different measures, so never put them in one sentence. | 2025; 2026 | [S3](https://www.mediaoffice.abudhabi/en/health/abu-dhabis-ivf-services-ranked-among-the-most-successful-worldwide-in-2024-with-51-percent-success-rate/), [S5](https://www.mediaoffice.abudhabi/en/health/abu-dhabi-programme-for-the-future-of-reproductive-health-an-integrated-ecosystem-shaping-standards-research-and-innovation/) | P |
| Births in Abu Dhabi facilities | 30,000+, about 6% after assisted reproduction | 2023 | [S4](https://gulfnews.com/amp/gulfnews/uae/health/30000-births-in-1-year-abu-dhabi-boosts-maternity-services-1.101851919) | S |
| Largest maternity unit | Corniche Hospital (SEHA / PureHealth) delivers about 1 in 3 Abu Dhabi babies, with 300,000+ births since 1977. A new 357-bed SEHA Corniche Hospital broke ground in June 2026. | Jun 2026 | [S10](https://www.mediaoffice.abudhabi/en/health/purehealth-hosts-groundbreaking-ceremony-for-seha-new-corniche-hospital-for-women-and-newborns/) | P |
| Women living in Abu Dhabi | About 1.37 million (33% of 4.14 million). No breakdown for ages 15–49 was published. | 2024 | [S7](https://scad.gov.ae/w/abu-dhabi-population-in-2024-grows-7-5-to-reach-4-14m) | P |
| Malaffi (health information exchange) | 3,072 connected facilities, 12.7 million patient profiles, 3.5 billion records, 53,476 authorised users | Aug 2025 | [S9](https://m42.ae/media-resources/news/malaffi-reaches-35-billion-clinical-records-setting-a-new-standard-for-healthcare-innovation-in-abu-dhabi/) | P |
| Facilities supporting the reproductive care journey | 250+ (the programme's count; not only fertility centres) | Sept 2026 | [S5](https://www.mediaoffice.abudhabi/en/health/abu-dhabi-programme-for-the-future-of-reproductive-health-an-integrated-ecosystem-shaping-standards-research-and-innovation/) | P |

**What it means:** this is a small, countable and concentrated market. We can name every fertility centre in a slide, and one group deal covers several sites (section 1.4). The pitch can say "14 fertility centres, 45 women's health facilities, about 1,075 OB-GYN specialists and midwives" with a government source behind each number.

### 1.2 UAE-wide: what we could and could not find

| Measure | Figure | Source (accessed 6 Nov 2026) | Status |
| --- | --- | --- | --- |
| UAE births | 96,631 in 2022 (30,889 to Emirati mothers) | [S8](https://gulfmigration.grc.net/?p=10866), FCSC and MOHAP data | P (official data, republished) |
| Licensed fertility centres, whole UAE | No official national count found. A commercial guide claims 35+. | [S64](https://uaefreezonefinder.com/uae-ivf-fertility-reproductive-clinic-guide-2026/) | NV |
| Fertility and IVF providers, Dubai | No Dubai Health Authority count found. One directory says 14. | [S65](https://www.zavis.ai/intelligence/abu-dhabi-3-year-fertility-fellowship-emiratis) | NV |
| OB-GYN doctors, whole UAE | No national count found | — | NV |

### 1.3 Who pays, and why clinics will care now

- **Thiqa pays for IVF in bundles.** Daman's adjudication guideline for Thiqa plans is version 3.6, effective 1 Feb 2022 and last updated 26 Nov 2025. It covers up to six egg retrievals (stimulated or natural) and up to three embryo transfers per patient per year. Payment is a bundle, and every cycle needs pre-authorisation. Eligibility rules include a preferred age of 18–47 and a BMI of 19–40, with extra counselling at a BMI of 35–40. Pooling embryos needs clinical evidence such as lab, radiology or genetic reports. This is a payer that already spends heavily on fertility and asks for documentation, so a clean, structured history has value to the clinic. ([S6](https://www.damaninsurance.ae/wp-content/uploads/2026/01/Thiqa-Coverage-for-Assisted-Reproductive-Treatment-Services-External.pdf), P)
- **DoH rewards quality, and fertility came first.** The Rewarding Exceptional Quality programme launched on 30 July 2025. DoH watches providers against set standards: patient outcomes, best practice, safety and patient experience. Providers that meet the goals get incentives, which Gulf News calls financial. Other specialties follow in later phases. The size of the incentives is not public. ([S1](https://www.mediaoffice.abudhabi/en/health/department-of-health-abu-dhabi-launches-rewarding-exceptional-quality-programme-recognising-excellence-by-healthcare-providers/) P, [S2](https://gulfnews.com/uae/health/new-abu-dhabi-initiative-rewards-excellence-in-fertility-care-1.500217482) S; incentive amounts NV)
- **DoH quality indicators (Jawda) have an ART guidance.** DoH's 2026 Jawda submission page lists an "ART Jawda Guidance, version 9" and a separate Maternal and Perinatal Care guidance. The DoH website failed our certificate check, so we could not read which indicators they hold. ([S11](https://www.doh.gov.ae/en/programs-initiatives/muashir/jawda-indicators-submission-guidelines2026), NV) **Check next:** does any maternal Jawda indicator cover the glucose test after gestational diabetes? If yes, it becomes our strongest sales hook.
- **Policy tailwind.** The Abu Dhabi Programme for the Future of Reproductive Health (17 Sept 2026) covers prevention, preconception health, screening, fertility diagnosis and treatment. It names AI and health data analytics as tools. ([S5](https://www.mediaoffice.abudhabi/en/health/abu-dhabi-programme-for-the-future-of-reproductive-health-an-integrated-ecosystem-shaping-standards-research-and-innovation/), P)

### 1.4 The groups that run the clinics (only what we could source)

| Group or brand | What we found | Ownership news | Source (accessed 6 Nov 2026) | Status |
| --- | --- | --- | --- | --- |
| Fakih IVF | Centres in Dubai, Abu Dhabi (including a Khalifa City branch), Al Ain and the Western Region | NMC agreed on 7 Feb 2025 to sell its 65% stake to Blue Ocean Health Group, which then owns it fully. Completion was expected within two months; we did not confirm completion. | [S13](https://nmc.ae/en/news/NMC-Healthcare-announces-its-intent-to-sell-its-stake-in-FakihIVF); locations: [S12](https://fakihivf.com/) | P (sale); NV (locations, completion) |
| Bourn Hall Fertility (Mediclinic) | Clinics in Dubai, Abu Dhabi and Al Ain | Mediclinic Middle East took 100% on 14 Nov 2021, after buying 30% in Dec 2018. At the time Mediclinic ran 6 UAE hospitals, 900+ beds and 29+ clinics (2021 figures). | [S14](https://www.mediclinic.ae/en/corporate/media-and-news/press-releases-and-news/mcme-acquisition-of-bourn-hall-international.html) | P |
| HealthPlus IVF and Women's Health Abu Dhabi | Fertility centre with its own pharmacy and genetics lab | Olive Rock Partners (ORP) took 100% in a swap with M42 (signed 25 Jul 2025, announced 17 Nov 2025). Umniya Fertility, backed by ORP, launched in Feb 2026 from the existing Abu Dhabi facility (source is an advertorial). | [S15](https://m42.ae/media-resources/news/m42-and-olive-rock-partners-agree-strategic-alignment-of-assets-to-advance-healthcare-delivery/), [S16](https://www.thenationalnews.com/business/2026/02/10/umniya-fertility-launches-in-abu-dhabi-with-an-outcome-led-whole-person-approach-to-care) | P / V |
| Danat Al Emarat Hospital for Women and Children | Women's and children's hospital in Abu Dhabi | M42 now owns 100% of UEMS, which includes Danat Al Emarat, HealthPlus Family Health and HealthPlus Diabetes and Endocrinology | [S15](https://m42.ae/media-resources/news/m42-and-olive-rock-partners-agree-strategic-alignment-of-assets-to-advance-healthcare-delivery/) | P |
| Burjeel Holdings | Trust Fertility Clinic at Burjeel Medical City, Abu Dhabi. Opened 7 Oct 2024; offers IVF, IUI and AI-assisted embryo selection. "Largest in the UAE" is its own claim. | — | [S17](https://www.tradearabia.com/News/290069/UAE%E2%80%99s-largest-fertility-centre-launched-at-Burjeel-Medical-City) | S (size claim V) |
| IVI Middle East | First GCC clinic opened in Abu Dhabi in May 2015, then Dubai in 2016 (part of IVIRMA) | — | [S18](https://www.health.abudhabi.ae/en/medical-directory/providers/ivi_middle_east_fertility_clinic/) (site unreachable today) | NV |
| SEHA / PureHealth | Corniche Hospital (see 1.1) | New hospital being delivered by Rafed, PureHealth's procurement arm | [S10](https://www.mediaoffice.abudhabi/en/health/purehealth-hosts-groundbreaking-ceremony-for-seha-new-corniche-hospital-for-women-and-newborns/) | P |

**What it means (our judgement):** buyers are consolidating into about 6–8 groups: M42, Mediclinic, Burjeel, PureHealth/SEHA, Blue Ocean Health, Olive Rock Partners, IVI and NMC. Group sales are slower because of procurement and data-protection review, but one signed group covers several sites. Two fertility businesses changed owner in 2025–26 and now belong to growth-focused investors (Fakih IVF to Blue Ocean, HealthPlus/Umniya to ORP). They may be the fastest to say yes to a pilot.

---

## 2. Bottom-up sizing (our arithmetic, inputs shown)

| Step | Inputs | Result | Status |
| --- | --- | --- | --- |
| A. Abu Dhabi OB-GYN specialist seats | 700 seats × AED 399 × 12 months | AED 3.35M a year (about USD 0.91M) | D |
| B. Add midwives | 1,075 seats × AED 399 × 12 | AED 5.15M a year (about USD 1.40M) | D |
| C. Whole UAE (rough) | Abu Dhabi had 30,000+ of the UAE's 96,631 births (different years), about 31%. If specialists per birth are similar, the UAE has about 2,250 OB-GYN specialists. | About AED 10.8M a year (about USD 2.9M) | D (assumption, not a sourced count) |
| D. Fertility centres alone | 14 centres × AED 1,990 a month × 12 | AED 0.33M a year | D |
| E. After-birth glucose-test gap (Abu Dhabi) | 30,000 births × gestational diabetes in 7.9–24.9% (repo doc docs/05) = 2,370–7,470 women a year. If only 20–58% are tested in year 1 (repo doc docs/05; not a UAE measurement), then about 1,000–6,000 women a year go untested. | About 1,000–6,000 open care gaps a year | D (inputs not re-checked today) |
| F. IVF load per centre | 6,180 cycles ÷ 14 centres | About 440 cycles per centre per year on average | D |
| G. Payer value anchor | UAE cost per person with diabetes is USD 1,583.5 a year (about AED 5,815). 1.27M adults have diabetes, a 16.5% prevalence, and 64% are undiagnosed. | Anchor only, not a savings estimate | P ([S61](https://international-diabetes-federation.s3.eu-west-1.amazonaws.com/media/uploads/sites/3/2025/08/IDF_Atlas_11_2025_MENA_Factsheet.pdf)) |

**How to read this:** seat revenue alone is single-digit millions of dirhams in Abu Dhabi and about AED 11M across the UAE. That is fine for a first year, but it is not a venture on its own. The venture path is:
1. Start with Abu Dhabi fertility and women's health clinics.
2. Sell network licences to the groups in section 1.4.
3. Add payer and employer revenue for closed care gaps, using the after-birth glucose test as the first proof.
4. Then expand to the GCC.

We found no sourced top-down "UAE femtech market" figure we would trust. Do not put one on a slide.

---

## 3. What clinic software costs (UAE and comparable markets)

| Product | What it is | Price | Market | Source (accessed 6 Nov 2026) | Status |
| --- | --- | --- | --- | --- | --- |
| Okadoc | Doctor booking and listing portal | About AED 500 per doctor per month on average (founder, May 2019) | UAE | [S20](https://www.khaleejtimes.com/get-your-doctors-appointment-in-seconds) | S (old) |
| Clinicea | Clinic EMR and practice software (Dubai) | AED 199 per practitioner per month, no setup fee (vendor page) | UAE | [S21](https://clinicea.com/emr-management-software-dubai) | NV (fetch blocked) |
| Mindcat Clinic | Practice software (Saudi Arabia; UAE planned) | AED 249 per practitioner per month for 1–5 practitioners, falling to AED 89 for 41+. No Malaffi, NABIDH or NPHIES link. | Saudi Arabia / UAE | [S22](https://www.saasworthy.com/product/mindcat-clinic) | NV (third-party listing) |
| SimplePractice | Practice management | USD 49 / 79 / 99 per month. Plus is USD 99 for the first clinician and USD 74 for each one added. | US | [S23](https://www.simplepractice.com/pricing/) | P |
| Spruce Health | Patient messaging, phone, fax and video | USD 24 or 49 per user per month | US | [S24](https://www.sprucehealth.com/pricing) | P |
| Cliniko | Practice management, priced by practice size | USD 45 a month (1 practitioner), 95 (2–5), 145 (6–8), 395 (26–200) | Global | [S25](https://www.cliniko.com/pricing/) | P |
| Freed | AI scribe | USD 39 to 119 per month (page labels unclear) | US | [S26](https://www.getfreed.ai/pricing) | P (unclear tiers) |
| Heidi Health | AI scribe | Clinician plan about USD 150 a month, billed annually (2026). Heidi's own page shows no prices. | Global | [S27](https://www.veroscribe.com/blog/heidi-health-review-2026) | T |
| Doctolib | Booking and patient management | About EUR 135 a month per doctor, plus about EUR 79 for teleconsultation (unofficial) | France | [S28](https://pabau.com/fr/blog/doctolib-tarif/) | T (competitor blog) |
| Custom build | Build your own clinic system | USD 15k–45k to build; UAE-hosted server USD 270–630 a month | UAE | [S29](https://kolonell.com/en/blog/clinic-management-software-cost-dubai-2026) | T (vendor blog) |

**How to read this:** UAE clinics pay about AED 90–250 per practitioner per month for core practice software. Doctors have paid about AED 500 a month for patient acquisition. AI clinical tools in 2026 cost about USD 100–150 per clinician per month (AED 367–551). A ReproSense seat at AED 399 sits in between. That price only holds if clinics can see the care gaps closing in their own revenue or in DoH quality rewards, so the pilot must measure exactly that.

---

## 4. Consumer femtech: what they do and do not do

### Flo (UK)
- **Scale:** raised more than USD 200M from General Atlantic and was valued above USD 1B. It had about 70M monthly users and about 5M paying subscribers in June 2024. It also offers an Anonymous Mode. ([S30](https://www.generalatlantic.com/media-article/flo-health-secures-more-than-200m-investment-from-general-atlantic-to-revolutionize-womens-health-first-purely-digital-consumer-womens-health-app-to-achieve-unicorn-status/), P)
- **Doctor output:** "Report for a doctor" is a PDF of the last six cycles with patterns and the top five symptoms. It is Premium only and iOS only, and not available while tracking pregnancy. ([S31](https://help.flo.health/hc/en-us/articles/51631220426900-I-want-to-generate-a-report-for-my-doctor), P)
- **Clinic link:** Flo's page for health professionals says the app does not connect directly to practice management systems. It offers education packs for clinicians instead. ([S32](https://med.flo.health/about-flo), P)
- **UAE App Store:** 21 languages, none of them Arabic. In-app purchases run from AED 7.99 to AED 229.99. A Premium "virtual Health Assistant" is included. The privacy label says purchases, location, identifiers and usage data are used to track the user. ([S33](https://apps.apple.com/ae/app/flo-period-pregnancy-tracker/id1038369065), P)
- **Privacy history:** in Jan 2021 the FTC said Flo shared users' health data with marketing and analytics firms, including Facebook's and Google's. The settlement required an independent privacy review and user consent before sharing. ([S34](https://www.ftc.gov/news-events/news/press-releases/2021/01/developer-popular-womens-fertility-tracking-app-settles-ftc-allegations-it-misled-consumers-about), P) In Aug 2025 a California jury found Meta broke state privacy law by collecting Flo users' data. Flo and Google had settled before the verdict. ([S35](https://techcrunch.com/2025/08/05/jury-rules-meta-violated-california-privacy-laws-by-collecting-menstrual-health-data-from-flo), S)
- **Not found:** a clinician console, care-gap tracking, a guideline source shown for each observation, or UAE data residency.

### Clue (Germany)
- **UAE App Store:** Arabic is included (English and 26 more). Subscriptions cost AED 32.99–34.99 a month or AED 127.99–149.99 a year. Modes cover periods, trying to conceive, pregnancy and perimenopause. The privacy label says identifiers are used for tracking. ([S36](https://apps.apple.com/ae/app/clue-period-cycle-tracker/id657189652), P)
- **Doctor output:** a paid one-off PDF of the last six completed cycles. It is a snapshot that can be edited for 24 hours and says it is not a diagnosis. Terms were updated 25 Jun 2026. ([S37](https://helloclue.com/terms-of-service-doctors-report), P)
- **Wearables:** added integrations for Clue Plus in Nov 2025, and claims 100M+ users. ([S63](https://business.mammothtimes.com/mammothtimes/article/gnwcq-2025-11-17-clue-expands-wearable-integrations-with-withings-ultrahuman-whoop-huawei-polar-fitbit-noise-and-luna-unlocking-deeper-insights-into-womens-health), NV)
- **Not found:** a clinic workflow or care gaps.

### Natural Cycles (Sweden)
- **Product:** claims 6M+ users. It is an FDA-cleared birth-control app, and its sixth FDA clearance was announced in July 2026. It works with its own NC° Band, Oura, Apple Watch, Garmin and Whoop, and has postpartum and perimenopause modes. ([S38](https://naturalcycles.com/) V, [S40](https://www.contemporaryobgyn.net/view/natural-cycles-receives-fda-clearance-for-ai-powered-fertility-algorithm) S)
- **Perimenopause mode:** sold as wellness information, not a diagnosis. Users can download a "Cycle Report" for doctor visits. ([S39](https://www.naturalcycles.com/perimenopause), P)
- **UAE App Store:** English, Portuguese, Spanish and Swedish only. AED 55.99 a month or AED 369.99 a year. It is authorised as birth control only in the regions it lists, and the UAE is not one of them, so here it is fertility monitoring only. ([S41](https://apps.apple.com/ae/app/id765535549), P)
- **Not found:** Arabic, or any programme for clinicians.

### Mira (US)
- At-home hormone analyser with test wands (Max wands read LH, E3G and PdG). The Max starter kit lists at about USD 229. In 2022 Mira had clinic partnerships for IVF monitoring in the US, Canada and Australia. ([S42](https://femtechinsider.com/mira-fertility-clinic-partnerships/), NV) We did not verify whether it is sold in the UAE.

### Inito (India / US)
- Home monitor that measures FSH, estrogen, LH and PdG. It raised a USD 29M Series B in Dec 2025 (USD 45M in total) and plans to move beyond fertility into wider hormone testing. ([S43](https://www.marcamoney.com/inito-raises-29-million-in-series-b-funding-led-by-bertelsmann-india-investments/), S)
- The UAE App Store page for its app returned "not found" today, so it is likely not offered here. ([S44](https://apps.apple.com/ae/app/id1183799668), our check)

### Oura (Finland)
- **Women's health features:** Cycle Insights, ovulation detection, Pregnancy Insights, Menopause Insights, and support for hormonal birth control (announced 1 May 2026, rolled out from 6 May). Menopause results can be saved or shared with clinicians. A partnership with Twentyeight Health lets users reach clinicians for prescriptions and virtual visits. ([S45](https://www.androidauthority.com/oura-launches-hormonal-health-features-3662688/) S, [S46](https://ouraring.com/blog/oura-built-for-womens-health-across-every-life-stage/) V)
- **Accuracy claim:** ovulation detection matched the reference standard in 96.4% of cycles in a 2025 study. This is the company's own figure. ([S46](https://ouraring.com/blog/oura-built-for-womens-health-across-every-life-stage/), V)
- **UAE App Store:** Arabic supported (22 languages). ([S47](https://apps.apple.com/ae/app/oura/id1043837948), P)
- **DoH partner:** a joint research programme from 7 May 2026 starts with preconception and perinatal care. The next steps are pilot design and ethics approval. ([S48](https://www.mediaoffice.abudhabi/en/health/department-of-health-abu-dhabi-partners-with-oura-to-launch-joint-research-programme-on-data-driven-preventive-health/), P)
- **Not found:** clinic care-gap workflow. This is a fit for us: we bring wearable data in as context, not as a pattern on its own.

### Others in one line each
- **Whoop** added Arabic on 13 Oct 2026. It says female membership in the GCC grew more than 90% year on year, and its CEO calls the Gulf its fastest-growing market. ([S49](https://www.thenationalnews.com/future/technology/2026/10/13/whoop-update-arabic-will-ahmed/), S)
- **Ultrahuman** offers a free cycle and ovulation feature on its ring (Dec 2024) and a paid Pro tier at about USD 3.99 a month. ([S62](https://www.t3.com/active/fitness-trackers/ultrahumans-smart-ring-adds-medical-grade-cycle-tracking-for-a-price), NV)
- **New PCOS and endometriosis apps (2025–26):** Cycla AI, EndoTrack, Endolog, OvaKind and HER EndoPCOS. See repo doc docs/05 (not re-checked today).

---

## 5. Regional players

**Nabta Health (UAE).** Raised a USD 2M pre-Series A in Nov 2025 (USD 4.5M in total) for a hybrid of digital, at-home and in-clinic care. It opened a Women's Health Centre of Excellence with Clemenceau Medical Center Dubai. ([S51](https://femtechinsider.com/nabta-health-raises-2m-pre-series-a-to-scale-hybrid-womens-health-model-in-middle-east-and-beyond/), S) In Oct 2026, Phoenix Venture Partners led the second close of a USD 3M pre-Series A. Nabta has moved from consumer sales to AI preventive-health infrastructure for employers, insurers and providers. That includes Aya, an AI care-navigation tool, and its own clinics. ([S50](https://www.wamda.com/2026/10/nabta-health-advances-3-million-pre-series-backing-pvp), S)
*What it means:* Nabta is the nearest regional competitor for the same buyers. The difference is that Nabta is a care provider with its own clinics. ReproSense is software that any clinic can adopt, the clinic stays in control, and every observation shows its rule and source. A partnership is realistic, for example ReproSense as the record and rules layer inside Nabta's pathways.

**Ovasave (UAE, Hub71).** Raised a USD 1.2M pre-seed in Jul 2025 and is registered with DoH. It offers egg-freezing support with partner clinics, at-home hormone tests and virtual consultations. It sells mainly to consumers, plus an employer-benefits scheme. Next it plans cycle tracking, symptom monitoring and AI treatment protocols, and an expansion to Saudi Arabia. ([S52](https://www.wamda.com/2025/07/uae-femtech-ovasave-secures-1-2-million-expand-saudi-gcc), S)
*What it means:* Ovasave is a consumer funnel that could refer women to clinics that use ReproSense. It becomes a competitor if it builds tracking.

**Altibbi (Arabic digital health).** Arabic-first health content and telehealth. Its "Altibbi Mama" Arabic pregnancy app launched around 2021, starting in Egypt. ([S53](https://cairoscene.com/LifeStyle/Altibbi-Mama-is-the-First-Arabic-Medical-App-for-Pregnant-Women), NV)
*What it means:* a benchmark for Arabic health content quality, but it has no clinic loop.

---

## 6. Clinic-side and payer-side tools

| Tool | Who buys | What it does | UAE or Arabic | Source (accessed 6 Nov 2026) | Status |
| --- | --- | --- | --- | --- | --- |
| Salve (UK) | Fertility clinics | Patient app for one clinic: appointments, treatment plans, forms, 24/7 messages, medication reminders, payments | Listing is English only (Portuguese added in 2024); no UAE presence found | [S54](https://apps.apple.com/gb/app/salve/id1282638920) | P (listing) |
| Babyscripts (US) | OB practices, health systems, Medicaid plans | Remote monitoring in pregnancy and after birth (up to 1 year), including a blood-pressure programme | None found | [S57](https://www.fiercehealthcare.com/digital-health/babyscripts-raises-12-million-funding-round) | NV |
| Ovia Health by Labcorp (US) | Employers, health plans | Fertility, pregnancy and a 12-month after-birth programme | None found | [S58](https://femtechinsider.com/labcorp-acquires-ovia-health/) | NV |
| Pomelo Care (US) | Payers, employers | Virtual maternity and women's health. Raised USD 92M Series C (8 Jan 2026) at USD 1.7B; 25M+ covered lives; outcomes are self-reported | None found | [S55](https://hitconsultant.net/2026/01/08/pomelo-care-secures-92m-to-scale-the-nations-most-accountable-womens-health-model/) | S |
| Maven Clinic (US) | Employers, health plans | Women's and family health. Raised USD 125M at USD 1.7B (8 Oct 2024); about 17M covered lives | Not stated in source | [S56](https://www.nbclosangeles.com/news/business/money-report/womens-health-startup-maven-clinic-closes-funding-at-1-7-billion-valuation/3530175/?amp=1) | S |
| Lucina Analytics (US) | Health plans | Uses claims data to flag at-risk pregnancies early; owned by Unified Women's Healthcare since 2020 | None found | [S59](https://www.datanami.com/this-just-in/unified-womens-healthcare-acquires-lucina-health/) | NV |
| Malaffi (Abu Dhabi, run by M42) | DoH ecosystem | Shared health record, plus an AI Patient Risk Profile for chronic and acute risk | Abu Dhabi | [S9](https://m42.ae/media-resources/news/malaffi-reaches-35-billion-clinical-records-setting-a-new-standard-for-healthcare-innovation-in-abu-dhabi/) | P |
| DoH Population Health Intelligence (with Microsoft) | DoH | AI "digital twin" of the emirate's health system; first priorities are obesity and cancer (Oct 2025) | Abu Dhabi | [S60](https://www.mediaoffice.abudhabi/en/health/department-of-health-abu-dhabi-unveils-worlds-1st-ai-powered-population-health-intelligence-platform-at-gitex-global-2025/) | P |

**How to read this:** abroad, women's health money is going to business models paid by employers and payers. Maven and Pomelo are each valued at about USD 1.7B. That supports our phase-2 payer story. In Abu Dhabi, the government platforms work from the clinician and population side, and their first priorities are obesity and cancer. We found nothing in them that captures women's own logs or tracks the after-birth glucose test. ReproSense should plug into Malaffi (via the FHIR export already planned), not compete with it.

---

## 7. Where ReproSense is clearly different, and where it is not

Key: **Yes** = we saw it in the sources. **Partial** = some of it. **No** = the source says it does not. **NF** = not found in what we read. The source for each cell is cited in sections 4–6. The ReproSense column describes the demo build and plans in docs/01 and docs/07, not a tested pilot.

| Capability | Flo | Clue | Natural Cycles | Oura | Nabta | Salve | ReproSense (demo) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Doctor-ready summary | Yes (Premium, 6 cycles, not in pregnancy) | Yes (paid one-off, 6 cycles) | Yes (perimenopause Cycle Report) | Partial (share menopause results) | NF | NF | Yes: 12 months, all life stages, the entries behind each observation, SBAR handover |
| Clinician sees the same consented record | No (no practice-system link) | NF | NF | Partial (user shares) | Yes (its own clinicians) | Partial (clinic logistics, not her own logs) | Yes: separate clinician route, 7-day revocable links, audit log |
| Care-gap tracking and network dashboard | NF | NF | NF | NF | Partial (care pathways, Aya) | Partial (appointments, medicines) | Yes: care-gap engine, funnel, gap closes live |
| Each observation shows its rule, entries and guideline source | NF | NF | NF | NF | NF | n/a | Yes (`rules/clinical_rules.yaml`, `knowledge_base/sources.yaml`) |
| Arabic in the app (UAE App Store) | No | Yes | No | Yes | NF | No | Yes, English and Arabic RTL (native review still pending) |
| Pregnancy and after-birth follow-up | Partial | Partial (pregnancy mode) | Partial (postpartum mode) | Partial (Pregnancy Insights) | NF | NF | Yes: glucose screen at 24–28 weeks, glucose test after gestational diabetes, EPDS with crisis path |
| Tracking or ads per App Store label | Tracks (purchases, location, identifiers, usage) | Tracks (identifiers) | Not checked | Not checked | NF | NF | No ad SDKs; no analytics on health screens (docs/07) |
| UAE data residency | NF | NF | NF | NF | NF | NF | Planned for production (UAE cloud region and a UAE-hosted model). The hackathon uses synthetic data only. |

**Honest summary:** doctor reports, Arabic, wearable links and AI chat are now table stakes. No single one wins. What we found nowhere else is the combination: the clinic loop, observations that explain themselves with their source, care gaps across life stages (above all after birth), Arabic, and a UAE privacy posture. ReproSense sells that as software any clinic can adopt.

---

## 8. Positioning statement

For women's health and IVF clinics in Abu Dhabi and the women they care for, ReproSense is a bilingual, privacy-first reproductive health record. It turns a woman's own months of logs and lab results into observations that explain themselves and link to a guideline, a doctor-ready summary, and a follow-up the clinic can track. Short visits start with the whole story, and recommended follow-ups, such as the glucose test after gestational diabetes, actually happen. Consumer trackers such as Flo, Clue and Natural Cycles predict cycles and export a six-cycle PDF. ReproSense closes the loop inside the clinic instead. The clinician sees the same consented record, and a care-gap engine and network dashboard show which follow-ups are open or closed. Every observation shows its rule, the entries behind it and its source. In production the data is built to stay in the UAE, and it is never used for advertising. Women use it free, clinics pay per clinician seat, and networks and payers pay for closed care gaps.

---

## 9. Price hypothesis (to validate in the docs/12 interviews)

All prices in AED, excluding VAT.

| Who pays | What they get | Hypothesis | Why this number | Sources behind the number | Confidence |
| --- | --- | --- | --- | --- | --- |
| Women | App, record, doctor report, sharing with consent | **Free** | Competitors charge women AED 33–56 a month (Clue, Natural Cycles), and charge extra for the doctor report (Flo Premium, Clue one-off). Free removes friction when a clinic invites its patients, and it builds trust. | [S33](https://apps.apple.com/ae/app/flo-period-pregnancy-tracker/id1038369065), [S36](https://apps.apple.com/ae/app/clue-period-cycle-tracker/id657189652), [S41](https://apps.apple.com/ae/app/id765535549), [S31](https://help.flo.health/hc/en-us/articles/51631220426900-I-want-to-generate-a-report-for-my-doctor), [S37](https://helloclue.com/terms-of-service-doctors-report) | High (already decided in docs/12) |
| Clinician seat | Clinician console, 30-second summaries, SBAR, visit-note draft, care-gap list | **AED 399 per clinician per month** (AED 349 if paid yearly) | Above UAE practice-software seats (AED 89–249) because it adds AI summaries and care-gap tracking. At or below what UAE doctors paid for a booking portal (about AED 500, 2019) and for an AI scribe (about USD 150, or AED 551). US practice tools cost USD 49–99 (AED 180–364). | [S21](https://clinicea.com/emr-management-software-dubai), [S22](https://www.saasworthy.com/product/mindcat-clinic), [S20](https://www.khaleejtimes.com/get-your-doctors-appointment-in-seconds), [S27](https://www.veroscribe.com/blog/heidi-health-review-2026), [S23](https://www.simplepractice.com/pricing/) | Medium. In interviews, test AED 299 / 399 / 549. |
| Small clinic bundle | Up to 5 clinicians, branded patient invite, care-gap engine | **AED 1,990 per month** | Pricing by practice size keeps billing simple (Cliniko charges USD 95 a month for 2–5 practitioners). It works out at about AED 398 per seat when 5 are used. | [S25](https://www.cliniko.com/pricing/), [S24](https://www.sprucehealth.com/pricing) | Medium-low |
| Paid pilot (3 months) | Up to 3 clinicians and 20 consenting patients; setup, training, weekly care-gap report | **AED 5,000–10,000 flat**, credited to year 1 | 3 seats × AED 399 × 3 months is about AED 3,600, plus setup. We found no public benchmark for pilot prices. | Derived from the seat price above | Low. Ask in LOI talks. |
| Clinic-network licence (yearly) | SSO, FHIR R4 / Malaffi-ready export, network dashboard, fairness check | **AED 150,000–400,000 a year** (about 25–65 clinicians at an AED 500 seat equivalent) | Seat price plus enterprise features. The groups in section 1.4 run several sites each. We found no public benchmark. | Derived; group list in section 1.4 | Low |
| Payer or employer (phase 2) | Care-gap programme for pregnancy and after birth (for example the glucose test after gestational diabetes), with outcomes reporting | **Placeholder: AED 10–20 per enrolled woman per month, or a fee per closed care gap.** Set only after pilot data. | Value anchors only. The UAE spends USD 1,583.5 (about AED 5,815) per person with diabetes a year, and 64% of UAE adults with diabetes are undiagnosed. Thiqa already funds fertility at scale. Pomelo and Maven show payers and employers buy women's-health programmes, but their prices are not public. | [S61](https://international-diabetes-federation.s3.eu-west-1.amazonaws.com/media/uploads/sites/3/2025/08/IDF_Atlas_11_2025_MENA_Factsheet.pdf), [S6](https://www.damaninsurance.ae/wp-content/uploads/2026/01/Thiqa-Coverage-for-Assisted-Reproductive-Treatment-Services-External.pdf), [S55](https://hitconsultant.net/2026/01/08/pomelo-care-secures-92m-to-scale-the-nations-most-accountable-womens-health-model/), [S56](https://www.nbclosangeles.com/news/business/money-report/womens-health-startup-maven-clinic-closes-funding-at-1-7-billion-valuation/3530175/?amp=1) | Very low (no benchmark) |

**One line for the business slide (if the interviews do not change it):** "Women free. Clinics AED 399 per clinician per month, with a 3-month paid pilot. Networks on yearly licences. Payers for closed care gaps." Each figure is a hypothesis until the interviews and the LOI back it up.

---

## 10. Gaps and next checks

1. **DoH Jawda indicators:** read the ART (V9) and Maternal and Perinatal Care guidance PDFs. The DoH site failed our certificate check. Look for any indicator on the glucose test after gestational diabetes, or on fertility follow-up. ([S11](https://www.doh.gov.ae/en/programs-initiatives/muashir/jawda-indicators-submission-guidelines2026))
2. **Rewarding Exceptional Quality:** the size of the incentives and the benchmarks are not public. Ask DoH or a fertility-centre manager.
3. **UAE-wide counts:** fertility centres and OB-GYN doctors outside Abu Dhabi (DHA and MOHAP registers).
4. **Prices we could not open:** Clinicea and Mindcat (pages blocked), Doctolib (unofficial only), Heidi (prices hidden).
5. **IVI and Mediclinic Woman:** the details came only from search summaries.
6. **Not researched in this run:** Apple Health cycle tracking, Samsung Health, EHR women's-health modules (see docs/14), Saudi and other GCC clinic markets.
7. **Thiqa eligibility:** we did not re-check who is eligible. The cycle limits above come from the Daman PDF.

---

## Sources (all accessed 6 Nov 2026)

- **S1** Abu Dhabi Media Office: DoH launches Rewarding Exceptional Quality programme (30 Jul 2025). https://www.mediaoffice.abudhabi/en/health/department-of-health-abu-dhabi-launches-rewarding-exceptional-quality-programme-recognising-excellence-by-healthcare-providers/
- **S2** Gulf News: New Abu Dhabi initiative rewards excellence in fertility care (31 Jul 2025). https://gulfnews.com/uae/health/new-abu-dhabi-initiative-rewards-excellence-in-fertility-care-1.500217482
- **S3** Abu Dhabi Media Office: Abu Dhabi IVF services among the most successful, 51% (3 Feb 2025). https://www.mediaoffice.abudhabi/en/health/abu-dhabis-ivf-services-ranked-among-the-most-successful-worldwide-in-2024-with-51-percent-success-rate/
- **S4** Gulf News: 30,000 births in 1 year (26 Mar 2024). https://gulfnews.com/amp/gulfnews/uae/health/30000-births-in-1-year-abu-dhabi-boosts-maternity-services-1.101851919
- **S5** Abu Dhabi Media Office: Abu Dhabi Programme for the Future of Reproductive Health (17 Sept 2026). https://www.mediaoffice.abudhabi/en/health/abu-dhabi-programme-for-the-future-of-reproductive-health-an-integrated-ecosystem-shaping-standards-research-and-innovation/
- **S6** Daman: Thiqa Coverage for Assisted Reproductive Treatment and Services, adjudication guideline v3.6 (last update 26 Nov 2025). https://www.damaninsurance.ae/wp-content/uploads/2026/01/Thiqa-Coverage-for-Assisted-Reproductive-Treatment-Services-External.pdf
- **S7** Statistics Centre Abu Dhabi: Abu Dhabi population in 2024 grows 7.5% to reach 4.14m (30 Jun 2025). https://scad.gov.ae/w/abu-dhabi-population-in-2024-grows-7-5-to-reach-4-14m
- **S8** Gulf Research Center, Gulf Labour Markets and Migration: UAE births by mother's nationality (FCSC and MOHAP data). https://gulfmigration.grc.net/?p=10866
- **S9** M42: Malaffi reaches 3.5 billion clinical records (14 Aug 2025). https://m42.ae/media-resources/news/malaffi-reaches-35-billion-clinical-records-setting-a-new-standard-for-healthcare-innovation-in-abu-dhabi/
- **S10** Abu Dhabi Media Office: PureHealth groundbreaking for the SEHA New Corniche Hospital (8 Jun 2026). https://www.mediaoffice.abudhabi/en/health/purehealth-hosts-groundbreaking-ceremony-for-seha-new-corniche-hospital-for-women-and-newborns/
- **S11** DoH: Jawda Indicators Submission Guidelines 2026 (lists ART Jawda Guidance V9; not opened, certificate error). https://www.doh.gov.ae/en/programs-initiatives/muashir/jawda-indicators-submission-guidelines2026 and https://www.doh.gov.ae/-/media/Feature/Muashir/Jawda/2026/ART-Jawda-Guidance_V9_2026.ashx
- **S12** Fakih IVF website (locations; search summary only). https://fakihivf.com/
- **S13** NMC Healthcare: intent to sell its stake in Fakih IVF (7 Feb 2025). https://nmc.ae/en/news/NMC-Healthcare-announces-its-intent-to-sell-its-stake-in-FakihIVF
- **S14** Mediclinic Middle East: acquisition of Bourn Hall International MENA (14 Nov 2021). https://www.mediclinic.ae/en/corporate/media-and-news/press-releases-and-news/mcme-acquisition-of-bourn-hall-international.html
- **S15** M42: M42 and Olive Rock Partners agree strategic alignment of assets (17 Nov 2025). https://m42.ae/media-resources/news/m42-and-olive-rock-partners-agree-strategic-alignment-of-assets-to-advance-healthcare-delivery/
- **S16** The National (advertorial): Umniya Fertility launches in Abu Dhabi (10 Feb 2026). https://www.thenationalnews.com/business/2026/02/10/umniya-fertility-launches-in-abu-dhabi-with-an-outcome-led-whole-person-approach-to-care
- **S17** TradeArabia: UAE's largest fertility centre launched at Burjeel Medical City (7 Oct 2024). https://www.tradearabia.com/News/290069/UAE%E2%80%99s-largest-fertility-centre-launched-at-Burjeel-Medical-City
- **S18** DoH medical directory entry: IVI Middle East Fertility Clinic (search summary only; site unreachable today). https://www.health.abudhabi.ae/en/medical-directory/providers/ivi_middle_east_fertility_clinic/
- **S19** (not used)
- **S20** Khaleej Times: Get your doctor's appointment in seconds (Okadoc; 14 May 2019). https://www.khaleejtimes.com/get-your-doctors-appointment-in-seconds
- **S21** Clinicea: EMR software Dubai (vendor page; search summary only, fetch blocked). https://clinicea.com/emr-management-software-dubai
- **S22** SaaSworthy: Mindcat Clinic listing (search summary only, fetch blocked). https://www.saasworthy.com/product/mindcat-clinic
- **S23** SimplePractice pricing. https://www.simplepractice.com/pricing/
- **S24** Spruce Health pricing. https://www.sprucehealth.com/pricing
- **S25** Cliniko pricing. https://www.cliniko.com/pricing/
- **S26** Freed pricing. https://www.getfreed.ai/pricing
- **S27** Veroscribe: Heidi Health review 2026 (5 Apr 2026). https://www.veroscribe.com/blog/heidi-health-review-2026. Heidi's own pricing page shows no prices: https://www.heidihealth.com/pricing
- **S28** Pabau (competitor blog): Doctolib prices (updated 15 Oct 2026). https://pabau.com/fr/blog/doctolib-tarif/
- **S29** Kolonell (vendor blog): clinic management software cost, Dubai (10 Oct 2026). https://kolonell.com/en/blog/clinic-management-software-cost-dubai-2026
- **S30** General Atlantic: Flo Health secures more than USD 200M (30 Jul 2024). https://www.generalatlantic.com/media-article/flo-health-secures-more-than-200m-investment-from-general-atlantic-to-revolutionize-womens-health-first-purely-digital-consumer-womens-health-app-to-achieve-unicorn-status/
- **S31** Flo Help Centre: I want to generate a report for my doctor. https://help.flo.health/hc/en-us/articles/51631220426900-I-want-to-generate-a-report-for-my-doctor
- **S32** Flo for health professionals. https://med.flo.health/about-flo
- **S33** Apple App Store (UAE): Flo. https://apps.apple.com/ae/app/flo-period-pregnancy-tracker/id1038369065
- **S34** US FTC: Flo settlement press release (13 Jan 2021). https://www.ftc.gov/news-events/news/press-releases/2021/01/developer-popular-womens-fertility-tracking-app-settles-ftc-allegations-it-misled-consumers-about
- **S35** TechCrunch: Jury rules Meta violated California privacy laws over Flo data (5 Aug 2025). https://techcrunch.com/2025/08/05/jury-rules-meta-violated-california-privacy-laws-by-collecting-menstrual-health-data-from-flo
- **S36** Apple App Store (UAE): Clue. https://apps.apple.com/ae/app/clue-period-cycle-tracker/id657189652
- **S37** Clue: Doctor's report terms (updated 25 Jun 2026). https://helloclue.com/terms-of-service-doctors-report
- **S38** Natural Cycles homepage. https://naturalcycles.com/
- **S39** Natural Cycles: Perimenopause. https://www.naturalcycles.com/perimenopause
- **S40** Contemporary OB/GYN: Natural Cycles receives FDA clearance for AI-powered fertility algorithm (27 Jul 2026). https://www.contemporaryobgyn.net/view/natural-cycles-receives-fda-clearance-for-ai-powered-fertility-algorithm
- **S41** Apple App Store (UAE): Natural Cycles. https://apps.apple.com/ae/app/id765535549
- **S42** FemTech Insider: Mira fertility clinic partnerships (Dec 2022; search summary only). https://femtechinsider.com/mira-fertility-clinic-partnerships/. Price from Mira's shop (search summary only): https://usd.miracare.com/products/new-mira-max-starter-kit
- **S43** Marca Money: Inito raises USD 29M Series B (11 Dec 2025). https://www.marcamoney.com/inito-raises-29-million-in-series-b-funding-led-by-bertelsmann-india-investments/
- **S44** Apple App Store (UAE): Inito page returned "not found" (our check). https://apps.apple.com/ae/app/id1183799668
- **S45** Android Authority: Oura launches hormonal health features (1 May 2026). https://www.androidauthority.com/oura-launches-hormonal-health-features-3662688/
- **S46** Oura blog: Oura built for women's health across every life stage (19 May 2026). https://ouraring.com/blog/oura-built-for-womens-health-across-every-life-stage/
- **S47** Apple App Store (UAE): Oura. https://apps.apple.com/ae/app/oura/id1043837948
- **S48** Abu Dhabi Media Office: DoH partners with ŌURA on a joint research programme (7 May 2026). https://www.mediaoffice.abudhabi/en/health/department-of-health-abu-dhabi-partners-with-oura-to-launch-joint-research-programme-on-data-driven-preventive-health/
- **S49** The National: Whoop adds Arabic (13 Oct 2026). https://www.thenationalnews.com/future/technology/2026/10/13/whoop-update-arabic-will-ahmed/
- **S50** Wamda: Nabta Health advances USD 3M pre-Series A with PVP backing (19 Oct 2026). https://www.wamda.com/2026/10/nabta-health-advances-3-million-pre-series-backing-pvp
- **S51** FemTech Insider: Nabta Health raises USD 2M pre-Series A (17 Nov 2025). https://femtechinsider.com/nabta-health-raises-2m-pre-series-a-to-scale-hybrid-womens-health-model-in-middle-east-and-beyond/
- **S52** Wamda: Ovasave secures USD 1.2M (17 Jul 2025). https://www.wamda.com/2025/07/uae-femtech-ovasave-secures-1-2-million-expand-saudi-gcc
- **S53** CairoScene: Altibbi Mama, an Arabic pregnancy app (search summary only). https://cairoscene.com/LifeStyle/Altibbi-Mama-is-the-First-Arabic-Medical-App-for-Pregnant-Women
- **S54** Apple App Store (UK): Salve. https://apps.apple.com/gb/app/salve/id1282638920
- **S55** HIT Consultant: Pomelo Care secures USD 92M (8 Jan 2026). https://hitconsultant.net/2026/01/08/pomelo-care-secures-92m-to-scale-the-nations-most-accountable-womens-health-model/
- **S56** NBC Los Angeles (CNBC): Maven Clinic closes funding at USD 1.7B valuation (8 Oct 2024). https://www.nbclosangeles.com/news/business/money-report/womens-health-startup-maven-clinic-closes-funding-at-1-7-billion-valuation/3530175/?amp=1
- **S57** Fierce Healthcare: Babyscripts funding (search summary only). https://www.fiercehealthcare.com/digital-health/babyscripts-raises-12-million-funding-round
- **S58** FemTech Insider: Labcorp acquires Ovia Health (search summary only). https://femtechinsider.com/labcorp-acquires-ovia-health/
- **S59** Datanami: Unified Women's Healthcare acquires Lucina Health (search summary only). https://www.datanami.com/this-just-in/unified-womens-healthcare-acquires-lucina-health/
- **S60** Abu Dhabi Media Office: DoH unveils AI-powered Population Health Intelligence platform (15 Oct 2025). https://www.mediaoffice.abudhabi/en/health/department-of-health-abu-dhabi-unveils-worlds-1st-ai-powered-population-health-intelligence-platform-at-gitex-global-2025/
- **S61** IDF Diabetes Atlas, 11th edition: MENA factsheet (2025, 2024 data; UAE row read from the PDF). https://international-diabetes-federation.s3.eu-west-1.amazonaws.com/media/uploads/sites/3/2025/08/IDF_Atlas_11_2025_MENA_Factsheet.pdf
- **S62** T3: Ultrahuman cycle tracking Pro tier (search summary only). https://www.t3.com/active/fitness-trackers/ultrahumans-smart-ring-adds-medical-grade-cycle-tracking-for-a-price
- **S63** Clue wearable-integrations press release (17 Nov 2025; search summary only, fetch failed). https://business.mammothtimes.com/mammothtimes/article/gnwcq-2025-11-17-clue-expands-wearable-integrations-with-withings-ultrahuman-whoop-huawei-polar-fitbit-noise-and-luna-unlocking-deeper-insights-into-womens-health
- **S64** UAE Free Zone Finder (commercial guide): UAE IVF clinic guide 2026 (claim of 35+ centres; not verified). https://uaefreezonefinder.com/uae-ivf-fertility-reproductive-clinic-guide-2026/
- **S65** Zavis (directory): Dubai fertility providers note (not verified). https://www.zavis.ai/intelligence/abu-dhabi-3-year-fertility-fellowship-emiratis
- **Repo docs (not re-checked today):** docs/05 (gestational diabetes prevalence 7.9–24.9%; after-birth screening 20–58% in year 1; new PCOS and endometriosis apps), docs/07 (privacy controls), docs/12 (business model), docs/14 (competitor map).
