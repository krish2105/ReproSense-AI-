# 02 · Local evidence check: UAE and Abu Dhabi numbers for the pitch

- **Date:** 6 Nov 2026. **Every source below was accessed on 6 Nov 2026.**
- **Track:** check the clinical and epidemiological numbers in `docs/05_EVIDENCE_AND_RESEARCH.md`, `docs/10_PITCH_AND_DEMO.md` and the landing page (`EVIDENCE` in `apps/web/src/app/(site)/page.tsx`, copy in `apps/web/messages/en.json` / `ar.json` keys `landing.ev1`–`ev4`), and find better local figures.
- **Status:** research only. No app, doc or data file was changed.

**How this was checked**
- Primary sources first: journal pages, Europe PMC records of the same papers (PubMed and PMC served a bot-check page to the fetcher, so abstracts and full texts were read through Europe PMC), WHO fact sheets, the WHO and World Bank data APIs, and Abu Dhabi Media Office / DoH releases.
- The "Read" column says how far each source was checked: **Full** = methods and results read; **Abstract** = abstract only; **Snippet** = search-result text only, so treat it as partly verified.
- **Limits.** (1) The shared web-search budget ran out before a final sweep for 2025–26 UAE papers on PCOS and endometriosis, so a newer study may exist (not verified). (2) The DoH site (Jawda PDFs, an Oct 2025 news page) would not open (socket and certificate errors), so items from it are marked partly verified. (3) MDPI, Wiley, medRxiv and Southampton eprints returned 403; their figures were read through Europe PMC or the bioRxiv API instead.

**Safe-to-say ratings**
- **SAFE**: say it as written.
- **QUALIFY**: say it only with the who / where / how words shown.
- **AVOID**: outdated, cited to the wrong paper, not comparable, or not verified.

---

## 1. What to change before 22 Nov (priority order)

1. **Gestational diabetes: the landing page quotes the wrong number from the right paper.** The "7.9% to 24.9%" and "up to 37.7%" figures are older UAE results (a 2005 comparison of criteria and a 2010 IADPSG study) that the cited 2022 paper mentions in its introduction. The paper's own result comes from Al Ain's Mutaba'ah cohort (2,546 pregnancies, 2017–2021): **21.3% by IADPSG**, the criteria recommended locally, and 27.1% by at least one of six criteria. Say **"about 1 in 5 pregnancies"**. [R11]
2. **Postpartum glucose testing: use the Al Ain figure.** The cited "Diabetic Medicine 2016" item is a one-page letter auditing 233 women in Southampton, UK. Its 20–58% range is background it quotes for high-income countries. A peer-reviewed local number exists: at a 200-bed obstetric hospital in Al Ain (2013–2014), **265 of 1,043 women with GDM (25.4%) came back for the 4–6-week glucose test**. Almost none returned after 6 weeks, and women from the UAE, Oman and Saudi Arabia returned less often than South Asian women. [R14] This is the strongest local proof of the care gap the clinic dashboard closes.
3. **Endometriosis: the 6.6-year preprint is now a peer-reviewed paper that reports 6.8 years.** The medRxiv preprint (22 studies, 6.6 years) was published in *Health Care for Women International* (online 17 Oct 2024; 2025;46(3):335–351) with 23 studies and an **average delay of 6.8 years** (range 1.5–11.4). [R6] Add the UAE figure: **11.6 years on average** from first symptoms to diagnosis among 518 women with surgically confirmed endometriosis (recruited 2018–2019), about 6 of them before the first gynaecology visit. [R9] WHO's 2025 fact sheet gives 4–12 years as the usual global range. [R8]
4. **PCOS: keep both UAE numbers but drop the inference.** 25.9% (self-reported, Emirati women aged 25–67, national cohort) and 1.6% (ICD-10 codes, all women aged 15–45 seen at one Dubai tertiary hospital) are both correct. But they measure different things in different groups, so "that gap points to recognition, not prevalence" cannot stand as a fact. Anchor the point on WHO instead: **PCOS affects 10–13% of women of reproductive age, and up to 70% do not know they have it** (fact sheet dated 22 Jan 2026). [R1, R2, R5]
5. **"GDM ~8×" in docs/05 is cited to the wrong Dennison paper.** PMC6916174 is Dennison et al. 2020, a qualitative review of women's views, and its abstract gives no risk figure. The 8× figure comes from **Dennison et al. 2021** (*Diabetes Res Clin Pract*, 129 studies): relative risk 8.3 (95% CI 6.5–10.6), with 17% developing type 2 diabetes and about a third within 15 years. [R20, R23] A local figure: of Emirati women who had GDM in 2007 at two Dubai hospitals and were followed up in 2016, **26.5% had type 2 diabetes**. [R22]
6. **IVF success: 51% is out of date.** "Above 51%" is the 2024 figure, released in July 2025. The 17 Sept 2026 programme release says **59% now** across the emirate, with a **target of 80% by 2030**. Keep "6,180+ IVF cycles in 2024" and add "14 advanced fertility centres". Neither release defines "success", so never present it as a live-birth rate. [R27, R28, R29]
7. **Malaffi: 1 billion records is an old milestone.** In Aug 2025 Malaffi reported **3.5 billion clinical records, 12.7 million unique patient profiles, 3,072 connected facilities and 53,476 authorised users**. [R41] This closes QUESTIONS.md C10.
8. **Add postpartum depression numbers, and check the crisis path against them.**
   - In a UAE cohort (7 hospitals in 4 emirates, 2018–2019), **35% of 457 mothers scored above 12 on the EPDS at least once in the first 6 months**: 24.9% at birth, 14.5% at 3 months and 9.9% at 6 months. [R24]
   - At Abu Dhabi well-baby clinics (2017–2018, about 240 mothers), 35% scored 10 or more, about 17% scored 13 or more, and **9.1% gave a non-zero answer to item 10, the self-harm question** (3.7% answered "sometimes" or "quite often"). [R25]
   - **Product implication.** ReproSense's rule that item 10 > 0 opens the crisis path would fire for about 1 in 11 mothers in that sample. The crisis screen therefore has to be calm and quick, and it must offer a same-day human contact as well as 998. Check the wording with the CHO and women-care-lead agents.

---

## 2. Lines you can say on stage

| # | Say this | Source | Rating |
| --- | --- | --- | --- |
| 1 | "Up to 70% of women with PCOS don't know they have it." | [WHO PCOS fact sheet, 22 Jan 2026](https://www.who.int/news-room/fact-sheets/detail/polycystic-ovary-syndrome) | SAFE |
| 2 | "In the UAE Healthy Future Study, about 1 in 4 Emirati women aged 25 to 67 reported a PCOS diagnosis." | [Juber 2023](https://doi.org/10.2147/IJWH.S398651) | QUALIFY: self-reported, one cohort |
| 3 | "In one Dubai hospital's records, PCOS was coded for 1.6% of women aged 15 to 45 over five years." | [Mirza 2023](https://doi.org/10.3390/ijerph20095717) | QUALIFY: one tertiary hospital, ICD-10 codes |
| 4 | "In a UAE study of 518 women with confirmed endometriosis, diagnosis took 11.6 years on average." | [Mousa 2021](https://doi.org/10.3389/fgwh.2021.708410) | QUALIFY: Arab-ancestry women, recruited 2018–19 |
| 5 | "Across 23 studies worldwide, the average delay was 6.8 years." | [Fryer 2025](https://doi.org/10.1080/07399332.2024.2413056) | SAFE |
| 6 | "About 1 in 5 pregnancies in Al Ain's Mutaba'ah study had gestational diabetes." | [Bashir 2022](https://doi.org/10.3389/fendo.2022.1069477) | SAFE (if asked: by the locally used IADPSG criteria) |
| 7 | "At one Al Ain hospital, only 1 in 4 women with gestational diabetes came back for the glucose test after birth." | [Agarwal 2022](https://doi.org/10.3390/ijerph192113946) | QUALIFY: one hospital, 2013–14 data |
| 8 | "Internationally, fewer than half of these women get the test." | [SMFM 2023](https://doi.org/10.1016/j.ajog.2022.12.315), [Eng 2024](https://doi.org/10.3389/fgwh.2024.1391213) | SAFE |
| 9 | "Women who had gestational diabetes are about 8 times more likely to develop type 2 diabetes." | [Dennison 2021](https://pubmed.ncbi.nlm.nih.gov/33333204/) | SAFE |
| 10 | "In Dubai, a quarter of Emirati women who had gestational diabetes in 2007 had type 2 diabetes nine years later." | [Bayoumi 2021](https://doi.org/10.4239/wjd.v12.i10.1778) | QUALIFY: retrospective, only women with follow-up records |
| 11 | "In a UAE study across four emirates, 1 in 3 new mothers had high depression scores at some point in the first six months." | [Hanach 2023](https://doi.org/10.1007/s00127-022-02372-1) | QUALIFY: screening scores, not diagnoses |
| 12 | "Abu Dhabi reports a 59% IVF success rate and aims for 80% by 2030." | [Abu Dhabi Media Office, 17 Sept 2026](https://www.mediaoffice.abudhabi/en/health/abu-dhabi-programme-for-the-future-of-reproductive-health-an-integrated-ecosystem-shaping-standards-research-and-innovation/) | QUALIFY: DoH's own measure, not defined as live births |
| 13 | "More than 6,180 IVF cycles were performed in Abu Dhabi in 2024." | [Abu Dhabi Media Office, 30 July 2025](https://www.mediaoffice.abudhabi/en/health/department-of-health-abu-dhabi-launches-rewarding-exceptional-quality-programme-recognising-excellence-by-healthcare-providers/) | SAFE |
| 14 | "Emirati births fell 13.55% between 2014 and 2023." | [Gulf News, citing MoHAP data](https://gulfnews.com/uae/uae-society-in-demographic-decline-federal-national-council-submits-15-recommendations-to-government-1.500419015) | SAFE (attribute it) |
| 15 | "About 28% of women of reproductive age in the UAE are estimated to be anaemic." | [WHO GHO, 2023](https://ghoapi.azureedge.net/api/NUTRITION_ANAEMIA_REPRODUCTIVEAGE_PREV?$filter=SpatialDim%20eq%20'ARE') | QUALIFY: modelled estimate, wide uncertainty |
| 16 | "Infertility affects about 1 in 6 people worldwide." | [WHO infertility fact sheet, 28 Nov 2025](https://www.who.int/news-room/fact-sheets/detail/infertility) | SAFE |

**Do not say:**
- "PCOS affects 25.9% of Emirati women." That figure is self-reported, from one cohort aged 25–67.
- "The gap proves PCOS is under-diagnosed." The two studies count different people in different ways.
- "7.9–24.9%" as the current UAE GDM range. Those are 2005 data on mixed criteria.
- "20–58%" as a UAE figure. It is a UK letter quoting high-income countries.
- "Endometriosis delay is 6.6 years." The preprint has been superseded.
- "IVF success is 51%", or any IVF "success" figure presented as a live-birth rate.
- Any national UAE prevalence of infertility, heavy menstrual bleeding or iron deficiency. None was verified.
- "Malaffi holds 1 billion records."

**Proposed 20-second opener** (replaces the 0:00 line in docs/10):
> "Up to 70% of women with PCOS don't know they have it. In the UAE, women with endometriosis waited eleven years on average for a diagnosis. And at one Al Ain hospital, only one in four women who had diabetes in pregnancy came back for the glucose test after birth. The story exists. It just arrives in pieces."

Every number in it is rated SAFE or QUALIFY above (R5, R9, R14). Keep the qualifiers ready for Q&A.

---

## 3. Evidence by topic

### 3.1 PCOS prevalence

| Figure | Who / where | Years | Study type | Read | Source | Stage |
| --- | --- | --- | --- | --- | --- | --- |
| 10–13% of women of reproductive age; up to 70% don't know they have it | Global | Fact sheet dated 22 Jan 2026 | WHO fact sheet | Full | [R5](https://www.who.int/news-room/fact-sheets/detail/polycystic-ovary-syndrome) | SAFE |
| 25.9% self-reported PCOS | 1,040 Emirati women aged 25–67 at UAE Healthy Future Study recruitment centres | Feb 2016–Apr 2022 | Cross-sectional analysis of a national cohort; PCOS by self-report | Abstract | [R1](https://doi.org/10.2147/IJWH.S398651) | QUALIFY |
| 13% self-reported a PCOS diagnosis | 493 Emirati students at one Dubai university (convenience sample) | Published 2020 | Survey | Abstract | [R3](https://doi.org/10.2147/IJWH.S272867) | QUALIFY (supporting only) |
| 27.6% by NIH criteria (questionnaire), vs 4.6% in Oman | Medical students at one UAE college: 69 with PCOS, which implies about 250 surveyed (derived from 27.6%; total not stated) | Published 2024 | Questionnaire survey | Abstract | [R4](https://doi.org/10.3390/ijerph21091165) | AVOID as a headline (small convenience sample, self-assessed criteria) |

Note: no UAE population study using full Rotterdam criteria (examination plus ultrasound or AMH) was found. Whether one exists is not verified, because the search budget ran out.

### 3.2 PCOS in hospital records (Dubai)

| Figure | Who / where | Years | Study type | Read | Source | Stage |
| --- | --- | --- | --- | --- | --- | --- |
| 1.6% period prevalence (ICD-10 codes, mostly E28.2) | 64,722 women aged 15–45 at Latifa Women and Children Hospital, Dubai | 2017–2022 | Cross-sectional review of electronic records | Abstract | [R2](https://doi.org/10.3390/ijerph20095717) | QUALIFY |
| Annual point prevalence 1.19% (2020) rising to 2.72% (2022); odds ratio 2.28 for 2022 vs 2020 | Same | 2020–2022 | Same | Abstract | [R2](https://doi.org/10.3390/ijerph20095717) | QUALIFY |

Interpretation: the denominators differ (every woman attending a tertiary hospital, including pregnant women, versus a community cohort aged 25–67), and so do the methods (diagnosis codes versus self-report). The fair claim is "many diagnoses may never reach the record", not "the gap proves under-recognition". The authors call the Dubai study the largest UAE PCOS prevalence study so far and say PCOS should be a priority.

### 3.3 Endometriosis diagnostic delay

| Figure | Who / where | Years | Study type | Read | Source | Stage |
| --- | --- | --- | --- | --- | --- | --- |
| About 10% (190 million) of women of reproductive age; diagnosis usually takes 4–12 years on average | Global | Fact sheet dated 15 Oct 2025 | WHO fact sheet | Full | [R8](https://www.who.int/news-room/fact-sheets/detail/endometriosis) | SAFE |
| Mean delay 6.8 years (study averages ranged 1.5–11.4) | 23 studies, about two thirds from high-income countries | Searched to Sept 2023; online 17 Oct 2024 | Peer-reviewed scoping review | Abstract | [R6](https://doi.org/10.1080/07399332.2024.2413056) | SAFE |
| Preprint version: 6.6 years, 22 studies, range 1.5–11.3 | Same | Posted 9 Jan 2024 | Preprint | Abstract (bioRxiv API) | [R6p](https://www.medrxiv.org/content/10.1101/2024.01.08.24300988v1) | AVOID (superseded) |
| Time to diagnosis 0.3–12 years depending on definition; delay mainly driven by doctors | 17 observational studies | 2025 | Systematic review (BJOG) | Abstract | [R7](https://doi.org/10.1111/1471-0528.17973) | SAFE |
| **UAE:** mean 11.61 years (SD 5.59) from symptom onset to diagnosis. Onset to first gynaecology visit 6.01 years; first visit to diagnosis 6.96 years. Single women 15.81 years, married 10.78. Mean age at onset 21.1, at diagnosis 34.0 | 518 surgically confirmed cases (plus 2,092 controls), women of Arab ancestry, 4 hospitals or clinics and 6 population sites in the UAE | Aug 2018–Aug 2019 | Prospective case-control | Full | [R9](https://doi.org/10.3389/fgwh.2021.708410) | QUALIFY |
| UAE clinicians quoted delays of 7–11 years, some up to 20 | UAE | 28 Mar 2024 | News (The National) | Snippet | [R10](https://www.thenationalnews.com/news/uae/2024/03/28/uae-endometriosis-diagnosis-delay/) | AVOID (use R9) |

Note on R9: the two sub-intervals add up to about 13 years, not 11.6, so they were probably calculated on different subsets. Quote only the 11.6-year mean.

### 3.4 Gestational diabetes (GDM) prevalence

| Figure | Who / where | Years | Study type | Read | Source | Stage |
| --- | --- | --- | --- | --- | --- | --- |
| **21.3% (95% CI 19.8–23.0) by IADPSG**, the locally recommended criteria. NICE 2015 21.5%, WHO 1999 21.0%, ADIPS 19.3%, NZSSD 9.4%, EASD 8.4%; 27.1% by any of the six | 2,546 singleton pregnancies, Mutaba'ah cohort, Al Ain (Abu Dhabi emirate); OGTT at 24–32 weeks | May 2017–Mar 2021 | Prospective birth cohort | Abstract + full | [R11](https://doi.org/10.3389/fendo.2022.1069477) | SAFE ("about 1 in 5") |
| 18.9% (1,043 of 5,504) by IADPSG | Deliveries at a 200-bed obstetric hospital in Al Ain (Oasis Hospital) | Jan 2013–Dec 2014 | Retrospective hospital cohort | Full | [R14](https://doi.org/10.3390/ijerph192113946) | QUALIFY |
| UAE pooled 13.4% (95% CI 9.4–18.0) from 14 studies; GCC 14.7%; MENA 13.0% | Studies published 2000–2019, mixed criteria | 2000–2019 | Systematic review and meta-analysis | Full (Table 3) | [R13](https://doi.org/10.3389/fendo.2021.668447) | QUALIFY (older data, mixed criteria) |
| 7.9–24.9% (likely across different criteria; the intro does not say); up to 37.7% by IADPSG | Older UAE studies (2005 and 2010) quoted in R11's introduction | 2005, 2010 | (Cited, not re-checked) | Full (intro of R11) | [R11](https://doi.org/10.3389/fendo.2022.1069477) | AVOID as "current" |

Supporting point: a 2025 follow-up from Mutaba'ah (2,449 pregnancies) found IADPSG the best of four existing criteria at predicting large-for-gestational-age babies, which supports quoting the IADPSG figure. [R12](https://doi.org/10.3389/fendo.2025.1641326)

### 3.5 After GDM: postpartum glucose testing and type 2 diabetes risk

**Postpartum testing uptake**

| Figure | Who / where | Years | Study type | Read | Source | Stage |
| --- | --- | --- | --- | --- | --- | --- |
| **25.4% (265 of 1,043) returned for the 75 g OGTT at 4–6 weeks.** 20.8% of those tested were abnormal (3.8% diabetes, 9.4% IGT, 7.5% IFG). Almost no follow-up after 6 weeks: 23 women returned after a year or more, all pregnant again. Arab women, especially from the UAE, Oman and Saudi Arabia, returned less often than South Asian women | Oasis Hospital, Al Ain | 2013–2014 | Retrospective cohort | Full | [R14](https://doi.org/10.3390/ijerph192113946) | QUALIFY |
| 20.2% (130 of 642) were actually screened, though 72.5% had the test ordered; 13.9% of those screened had type 2 diabetes | Tertiary centre, Jeddah, Saudi Arabia | 2016–2018 | Retrospective cohort | Abstract | [R15](https://pmc.ncbi.nlm.nih.gov/articles/PMC11726392/) | QUALIFY (Gulf comparator) |
| 36.0% (95% CI 34.4–37.6) had guideline-concordant testing by 12 weeks | 18,432 privately insured US women with GDM who connected with primary care | Deliveries 2015–2018 | Claims cohort | Abstract | [R16](https://doi.org/10.1001/jamanetworkopen.2022.54765) | QUALIFY |
| Rates generally under 50%. Proposed quality metric: % of women with GDM who complete a 75 g 2-hour GTT within 12 weeks of delivery. The statement advises against tying the metric to financial incentives for now | US professional statement | 2023 | SMFM special statement | Abstract | [R17](https://doi.org/10.1016/j.ajog.2022.12.315) | SAFE |
| 31–49% in most studies | International | 2024 | Narrative review | Full | [R18](https://doi.org/10.3389/fgwh.2024.1391213) | SAFE |
| 20–58% within a year in high-income countries (background statement); local audit found 12.2% screened at 2 years and 17.8% at 3 years | 233 women, Southampton, UK | 2016 | Letter / audit | Snippet (full text returned 403) | [R19](https://eprints.soton.ac.uk/394697) | AVOID as the main citation |

**Risk of type 2 diabetes after GDM**

| Figure | Who / where | Years | Study type | Read | Source | Stage |
| --- | --- | --- | --- | --- | --- | --- |
| Relative risk 8.3 (95% CI 6.5–10.6); 17.0% developed type 2 diabetes; about a third within 15 years; risk up 12% for each year after pregnancy; risk 57% lower in White European populations than in others | 129 studies | 2021 | Systematic review and meta-analysis | Abstract | [R20](https://pubmed.ncbi.nlm.nih.gov/33333204/) | SAFE |
| Relative risk 9.51 (95% CI 7.14–12.67) | Studies from 2000–2019 | 2020 | Meta-analysis (BMJ) | Snippet | [R21](https://www.bmj.com/content/369/bmj.m1361) | QUALIFY (use R20 unless the BMJ page is checked) |
| **26.5% (96 of 362) had type 2 diabetes at follow-up**; 39.2% IFG, 8.0% IGT, 26.2% normal | Emirati women with GDM in 2007 at Latifa and Dubai Hospital, followed up in 2016 (1,231 of 4,603 deliveries followed up) | 2007 to 2016 | Retrospective | Abstract | [R22](https://doi.org/10.4239/wjd.v12.i10.1778) | QUALIFY |
| Up to 1 in 3 have abnormal glucose on postpartum screening; lifetime type 2 diabetes risk estimated at 40–70% | US professional statement | 2023 | SMFM | Abstract | [R17](https://doi.org/10.1016/j.ajog.2022.12.315) | SAFE |

Inference (not a finding): R20's lower risk in White European populations suggests the UAE risk may be above the pooled average, and R22's 26.5% at about 9 years is consistent with that.

### 3.6 Postpartum depression (EPDS studies)

| Figure | Who / where | Years | Study type | Read | Source | Stage |
| --- | --- | --- | --- | --- | --- | --- |
| **35% (160 of 457) scored EPDS > 12 at least once in 6 months.** 24.9% at birth (114/457), 14.5% at 3 months (58/399), 9.9% at 6 months (37/374) | Mothers from 7 public and private hospitals in Sharjah, Dubai, Abu Dhabi and Fujairah; about 72% Arab or Emirati | Feb 2018–Jul 2019 | Prospective cohort | Full | [R24](https://doi.org/10.1007/s00127-022-02372-1) | QUALIFY |
| 35% scored EPDS ≥ 10 (18% mild 10–12, 7% moderate, 10% high); about 17% scored ≥ 13 (40 of about 241, my calculation from the paper's counts). Item 10: 9.1% gave any non-zero answer; 3.7% answered "sometimes" or "quite often" | About 240 mothers at Abu Dhabi primary care well-child visits (2, 4 and 6 months) | Jul 2017–Mar 2018 | Cross-sectional | Full | [R25](https://doi.org/10.1007/s10995-024-03931-5) | QUALIFY (the paper's denominators of 240, 241 and 243 and its two versions of the score bands are inconsistent, so use rounded figures) |
| Earlier UAE studies reported 10% to 35% | UAE | Various | Quoted in R25's introduction | Full | [R25](https://doi.org/10.1007/s10995-024-03931-5) | QUALIFY |
| 22% EPDS ≥ 13 at 3 months (n = 86); 12.5% at 6 months (n = 56) | 125 mothers at a government maternity hospital in Abu Dhabi | Published 2006 | Small cohort | Abstract | [R26](https://pubmed.ncbi.nlm.nih.gov/17129919/) | AVOID as current (old and small) |

The validated Arabic EPDS: R25 says the scale was validated in the UAE in 1997 but gives no citation. QUESTIONS.md #40 already names Ghubash et al. 1997; that citation is not verified here.

### 3.7 Fertility and IVF

| Figure | Who / where | Years | Type | Read | Source | Stage |
| --- | --- | --- | --- | --- | --- | --- |
| More than 6,180 IVF cycles in 2024; success "above 51%" (not defined); 14 advanced fertility centres | Abu Dhabi | Released 30 July 2025 | DoH release | Full | [R27](https://www.mediaoffice.abudhabi/en/health/department-of-health-abu-dhabi-launches-rewarding-exceptional-quality-programme-recognising-excellence-by-healthcare-providers/) | SAFE for cycles and centres; AVOID the 51% |
| IVF success 59% now, target 80% by 2030; more than 250 facilities; more than 2,000 experts; genomic database of nearly 1 million genomes; AI named for diagnosis, prevention and treatment | Abu Dhabi | 17 Sept 2026 | DoH programme release | Full | [R28](https://www.mediaoffice.abudhabi/en/health/abu-dhabi-programme-for-the-future-of-reproductive-health-an-integrated-ecosystem-shaping-standards-research-and-innovation/) | QUALIFY ("DoH reports"; the measure is not defined) |
| Programme approved by H.H. Sheikh Khaled bin Mohamed bin Zayed, Crown Prince of Abu Dhabi; 80% target by 2030 | Abu Dhabi | 17 Sept 2026 | News | Full | [R29](https://www.arnnewscentre.ae/en/news/uae/h-h-sheikh-khaled-approves-programme-to-boost-ivf-success-rates/) | SAFE |
| Emirati births 34,618 (2014) down to 29,926 (2023), a 13.55% fall | UAE nationals | 2014–2023 | MoHAP statistics reported by Gulf News (updated 24 Jan 2026) | Full | [R30](https://gulfnews.com/uae/uae-society-in-demographic-decline-federal-national-council-submits-15-recommendations-to-government-1.500419015) | SAFE (attribute it) |
| Emirati total fertility rate 3.7 (2015–17) down to 3.1 (2022) | UAE nationals | 2015–2022 | UAE.STAT data reported by Gulf News | Full | [R31](https://gulfnews.com/uae/government/declining-fertility-rate-causes-concern-in-uae-1.500025642) | SAFE (attribute it) |
| Total fertility rate 1.2 (2023) and 1.213 (2024) | All UAE residents | 2023–2024 | World Bank WDI (updated 8 Oct 2026) | API | [R32](https://data.worldbank.org/indicator/SP.DYN.TFRT.IN?locations=AE) | SAFE (say "all residents") |
| About 1 in 6 people of reproductive age experience infertility in their lifetime | Global | Fact sheet dated 28 Nov 2025 | WHO fact sheet | Full | [R33](https://www.who.int/news-room/fact-sheets/detail/infertility) | SAFE |
| UAE-specific infertility prevalence | — | — | — | — | — | NOT VERIFIED (none found) |

Note: an IVF-births figure for 2024 (695) appeared in one news search result, but the page returned 403 and the figure is not verified. Do not use it.

### 3.8 Heavy menstrual bleeding, anaemia and iron deficiency

| Figure | Who / where | Years | Study type | Read | Source | Stage |
| --- | --- | --- | --- | --- | --- | --- |
| 28.2% anaemic (uncertainty 10.9–53.7); 28.6% in pregnancy | UAE women aged 15–49 | 2023 | WHO modelled estimate (GHO; same value in the World Bank's SH.ANM.ALLW.ZS, updated 8 Oct 2026) | API | [R34](https://ghoapi.azureedge.net/api/NUTRITION_ANAEMIA_REPRODUCTIVEAGE_PREV?$filter=SpatialDim%20eq%20'ARE') | QUALIFY |
| Anaemia 27.0%, iron-deficiency anaemia 16.0%, **ferritin < 30 µg/L in 65.0%** | 204 healthy Emirati women of Bedouin Arab origin | Published 2014 | Cross-sectional | Abstract | [R35](https://pubmed.ncbi.nlm.nih.gov/24205932/) | QUALIFY (small and older) |
| HMB in 65.2% (281 of 431), defined as bleeding over 7 days, changing protection every 2 hours or less (flooding), or clots over 1 inch. Only 35.6% of them knew they had HMB; 28% of those unaware needed iron supplements and 3.9% a transfusion | 431 Saudi women | Published 2021 | Cross-sectional survey | Abstract | [R36](https://doi.org/10.1002/hsr2.244) | QUALIFY (not representative) |
| 73.6% had at least one menstrual disturbance; PMDD (50.8%) the most common; no HMB-specific figure in the abstract | 390 female university students in the UAE (convenience sample) | Feb–Mar 2023 | Cross-sectional | Abstract | [R37](https://doi.org/10.7759/cureus.82169) | QUALIFY |
| National UAE HMB prevalence; national ferritin survey | — | — | — | — | — | NOT VERIFIED (none found) |

Product fit: heavy bleeding is common, often goes unrecognised and is linked to low iron stores. That supports the PBAC score plus ferritin extraction, framed as "worth checking your iron with your doctor", never as a diagnosis.

---

## 4. Abu Dhabi system context that supports the story

- **DoH Integrated Postnatal Care Programme (14 July 2025).**
  - Mothers with pregnancy or birth complications, or whose infants have special needs, get two nurse or midwife home visits: one in the first days after discharge and one 7–14 days later.
  - The programme also includes a telemedicine session in the first days after discharge and outpatient visits at 7–14 days and at 6 weeks. The release does not say whether these cover every mother.
  - The release does not mention glucose follow-up after GDM or depression screening. The 6-week visit is the natural place for the OGTT reminder that ReproSense drafts. [R38](https://www.mediaoffice.abudhabi/en/health/department-of-health-abu-dhabi-launches-integrated-postnatal-care-programme-to-enhance-maternal-and-infant-health)
- **DoH World Mental Health Day release (9 Oct 2025).** It says maternal mental-health assessments were added to postnatal home visits, screening is built into primary care, and the Sahatna app offers a self-assessment. Partly verified: search snippets only, the page would not open. [R39](https://www.doh.gov.ae/en/news/ad-reimagines-mental-health-a-society-where-seeking-support-is-a-sign-of-strength)
- **DoH Jawda quality indicators. This is a strong venture lead, but partly verified.**
  - Search snippets of the 2022 Primary Care Jawda guidance show a postpartum-visit measure covering postpartum glucose screening for patients with GDM and postpartum depression screening, with the EPDS named.
  - 2026 versions exist: Primary Care V9 2026, Primary Care & Medical Centre V1 (from Q3 2026), Maternal & Perinatal V7.1 (from Q3 2026) and ART V9 2026.
  - If the indicator is confirmed, the clinic dashboard can be pitched as helping clinics meet a DoH Jawda indicator.
  - **Before saying it:** open the 2026 PDFs and confirm the KPI code, numerator and denominator. [R40](https://www.doh.gov.ae/-/media/Feature/Muashir/Jawda/Jawda-Quarterly-Submission-Guidelines/PrimaryCare-JAWDA---Update-2022.ashx)
- **Programme for the Future of Reproductive Health (17 Sept 2026).**
  - Pillars: prevention and preconception health, genetic screening, fertility diagnosis and treatment, assisted reproduction and fertility preservation, with AI and data named throughout.
  - **PCOS, endometriosis and postpartum care are not named.** The pitch has to draw the line itself: earlier recognition of these conditions feeds the prevention and fertility-diagnosis pillars.
  - To cite how PCOS and endometriosis affect fertility, check the exact wording in the WHO fact sheets first (not re-checked here). [R28](https://www.mediaoffice.abudhabi/en/health/abu-dhabi-programme-for-the-future-of-reproductive-health-an-integrated-ecosystem-shaping-standards-research-and-innovation/)
- **Malaffi (Aug 2025).** 3.5 billion records, 12.7 million patient profiles and 3,072 facilities support a future integration story. Do not claim an integration exists. [R41](https://www.intelligentcio.com/me/2025/08/19/malaffi-reaches-3-5-billion-clinical-records-setting-a-new-standard-for-healthcare-innovation-in-abu-dhabi/)
- **Possible caution from a payer judge:** SMFM advises against tying the postpartum-screening metric to financial incentives for now. [R17](https://doi.org/10.1016/j.ajog.2022.12.315) Pitch "per-seat subscription that improves a quality indicator", not "pay per closed gap", until this is validated with a payer.

---

## 5. Audit of the numbers currently in the repo

### 5.1 `docs/05_EVIDENCE_AND_RESEARCH.md`

| Line | Current claim | Verdict | Fix |
| --- | --- | --- | --- |
| 9 | Programme approved by the Crown Prince on 17 Sept 2026 | VERIFIED | None [R29] |
| 12 | Malaffi: 1 billion clinical records | OUTDATED | 3.5 billion records, 12.7 million profiles, 3,072 facilities (Aug 2025) [R41] |
| 13 | IVF success above 51%; 6,180+ cycles in 2024 | PARTLY OUTDATED | Keep the cycles and add the 14 centres; replace 51% with 59% now and 80% by 2030 (17 Sept 2026) [R27, R28] |
| 14 | Emirati births fell 13.55% 2014–2023 | VERIFIED | Attribute to MoHAP data via Gulf News [R30]; optionally add the Emirati fertility rate falling from 3.7 to 3.1 [R31] |
| 21 | PCOS ~12% (Nordic perspective) | OK, weak source | Cite WHO: 10–13%, up to 70% unaware (22 Jan 2026) [R5] |
| 24 | 25.9% self-reported PCOS among 1,040 Emirati women | VERIFIED | Add "aged 25–67, self-reported, 2016–2022" [R1] |
| 25 | 1.6% coded PCOS in a Dubai hospital study (2017–2022) | VERIFIED | Add "Latifa Hospital, 64,722 women aged 15–45, ICD-10; 2.72% in 2022" [R2] |
| 26 | Endometriosis delay 6.6 years (medRxiv 2024) | OUTDATED | 6.8 years, 23 studies (*Health Care Women Int* 2025) [R6]; add UAE 11.6 years [R9] |
| 27 | Delay mainly physician-driven (PMC 2024) | VERIFIED | Cite as De Corte et al., *BJOG* 2025;132(2):118–130 [R7] |
| 28 | GDM in UAE 7.9–24.9%, up to 37.7% | WRONG FIGURE FROM CITED PAPER / OUTDATED | Use the paper's own result: 21.3% by IADPSG, 27.1% by any criterion (Al Ain, 2017–2021) [R11] |
| 29 | Postpartum screening 20–58% in year 1 (Diabetic Medicine 2016) | WEAK SOURCE | It is a UK letter quoting high-income countries [R19]. Use Al Ain 25.4% [R14] plus "under 50% internationally" [R17] |
| 30 | GDM ~8× (Dennison et al., PMC6916174) | WRONG CITATION | Dennison et al. 2021, *Diabetes Res Clin Pract* 171:108625: RR 8.3 [R20]; add Dubai 26.5% [R22] |
| 31 | Kaggle PCOS dataset | NOT CHECKED | Out of scope for this track |

### 5.2 Landing page (`page.tsx` EVIDENCE list and `landing.ev1`–`ev4`)

| Item | Verdict |
| --- | --- |
| [1] UAE Healthy Future Study | Number correct. The sentence in ev1 overclaims ("points to recognition, not prevalence"). |
| [2] Dubai hospital records study | Number correct. |
| [3] Endometriosis, medRxiv 2024 | OUTDATED. Cite the published version: 6.8 years, 23 studies. |
| [4] GDM, Frontiers 2022 | ev3 quotes the old range from the introduction, not the paper's own 21.3% result. |
| [5] Postpartum screening, Diabetic Medicine 2016 | Weak source (UK letter). Replace with the Al Ain study. |
| [6] DoH programme, Sept 2026 | VERIFIED. Can add the 59% to 80% target. |

**Proposed English copy.** Run it through the clinical-copy-guard skill. Update `ar.json` with the same numbers, translated by a native speaker.

- **ev1:** "Up to 70% of women with PCOS don't know they have it. In the UAE Healthy Future Study, 25.9% of 1,040 Emirati women reported a PCOS diagnosis; in one Dubai hospital's records, it was coded for 1.6% of women. Different groups and methods, but the gap suggests many cases are never recorded." Cites [1][2][3].
- **ev2:** "Endometriosis takes years to name. A review of 23 studies found an average delay of 6.8 years; in a UAE study of 518 women with confirmed endometriosis, it was 11.6 years from first symptoms to diagnosis. Women often say they felt unheard." Cites [4][5]. Confirm that the "felt unheard" finding appears in the published version, not only in the preprint.
- **ev3:** "About 1 in 5 pregnancies in Al Ain's Mutaba'ah study had gestational diabetes. After the birth, only 1 in 4 women with gestational diabetes at an Al Ain hospital came back for the glucose test that can catch type 2 diabetes early." Cites [6][7].
- **ev4:** "Abu Dhabi is already moving: in September 2026 the Department of Health launched its Programme for the Future of Reproductive Health, built on prevention and early screening, and aiming to raise IVF success from 59% to 80% by 2030." Cites [8].

**Proposed `EVIDENCE` list** (and `PARAS`: ev1 → 1, 2, 3; ev2 → 4, 5; ev3 → 6, 7; ev4 → 8):
1. UAE Healthy Future Study, *Int J Women's Health* 2023: https://doi.org/10.2147/IJWH.S398651
2. Dubai hospital records study, *IJERPH* 2023: https://doi.org/10.3390/ijerph20095717
3. WHO fact sheet, Polycystic ovary syndrome (2026): https://www.who.int/news-room/fact-sheets/detail/polycystic-ovary-syndrome
4. Endometriosis diagnostic delay, scoping review, *Health Care for Women International* 2025: https://doi.org/10.1080/07399332.2024.2413056
5. Endometriosis in women of Arab ancestry in the UAE, *Frontiers in Global Women's Health* 2021: https://doi.org/10.3389/fgwh.2021.708410
6. Mutaba'ah Study, GDM incidence in the UAE, *Frontiers in Endocrinology* 2022: https://doi.org/10.3389/fendo.2022.1069477
7. Postpartum glucose testing after GDM in Al Ain, *IJERPH* 2022: https://doi.org/10.3390/ijerph192113946
8. Abu Dhabi Programme for the Future of Reproductive Health (DoH, Sept 2026): current URL

Optional: DOI links are stable and publisher-hosted. The current PubMed and PMC links served a verification page to the automated fetcher.

### 5.3 The same numbers elsewhere in the repo (update together)

- `MASTER_PROMPT.md` lines 38–41: the PCOS, endometriosis (6.6 years) and GDM (7.9–24.9%) lines.
- `docs/10_PITCH_AND_DEMO.md` line 6: the 0:00 script. Use the opener in section 2.
- `mockup/reprosense-mockup.html` and `mockup/template.html`: line ~404 ("Across 22 studies the average was 6.6 years") and lines ~696–707 (the 6.6-year bar, the 25.9% vs 1.6% bars, and "20–58% screened" with a "High-income countries" caption).
- `apps/web/messages/ar.json`: `landing.ev1`–`ev3`.
- `QUESTIONS.md` C10 (Malaffi) can be closed using R41.
- `knowledge_base/sources.yaml` lists only guidelines. If the assistant may be asked "how common is X in the UAE?", consider adding R5, R8, R9, R11, R14, R24 and R25, so that CLAUDE.md rule 6 (every answer cites a source) can be met.

### 5.4 Synthetic data consistency (optional)

- `data/synthetic/output/cohort_summary.json` has 9 women with a GDM history among 66 recent deliveries (13.6%).
- Current Abu Dhabi data suggest about 19–21% [R11, R14]. 13.6% matches only the older pooled UAE estimate (13.4%) [R13].
- Raising it to about 13–14 of 66 would show a clinician judge a familiar rate.
- Starting the dashboard's postpartum-glucose baseline near 25% [R14] would make "gaps closing" credible.
- Keep the file's existing note that its proportions are not epidemiological estimates.

---

## 6. Not verified / open gaps

- National UAE prevalence of heavy menstrual bleeding: none found.
- UAE infertility prevalence: none found. Do not state one.
- Postpartum glucose testing in the UAE after 2014: nothing found beyond R14. The Mutaba'ah cohort may hold newer data (not found).
- A national ferritin or iron-deficiency survey of UAE women: none found.
- Exact definitions of the Jawda postpartum KPI (R40): the PDFs would not open.
- The DoH mental-health release of 9 Oct 2025 (R39): snippets only.
- The BMJ 2020 figure of RR 9.51 (R21): seen in search results only.
- The Adekojo 2016 letter (R19), including its 20–58% background range and 12.2% / 17.8% audit figures: search snippets only.
- The IDF Diabetes Atlas UAE hyperglycaemia-in-pregnancy figure: the page looped on redirects, so not verified.
- The 2024 IVF-births figure (695): not verified.
- A final sweep for 2025–26 UAE PCOS and endometriosis studies: not run, because the search budget was exhausted.

---

## 7. References (all accessed 6 Nov 2026)

- **R1** Juber NF, et al. Association between self-reported polycystic ovary syndrome with chronic diseases among Emiratis: UAE Healthy Future Study. *Int J Womens Health* 2023;15:289–298. https://doi.org/10.2147/IJWH.S398651 (PMID 36814527; PMC9939944; read via Europe PMC). Accessed 6 Nov 2026.
- **R2** Mirza FG, Tahlak MA, Hazari K, Khamis AH, Atiomo W. Prevalence of PCOS amongst females aged 15–45 years at a major women's hospital in Dubai. *IJERPH* 2023;20(9):5717. https://doi.org/10.3390/ijerph20095717 (PMID 37174235; PMC10178028). Accessed 6 Nov 2026.
- **R3** Pramodh S. Lifestyle choices, reproductive health knowledge and PCOS awareness among female Emirati university students. *Int J Womens Health* 2020;12:927–938. https://doi.org/10.2147/IJWH.S272867 (PMID 33149703). Accessed 6 Nov 2026.
- **R4** Begum GS, et al. Prevalence of PCOS and its associated risk factors among medical students in two countries. *IJERPH* 2024;21(9):1165. https://doi.org/10.3390/ijerph21091165 (PMID 39338048). Accessed 6 Nov 2026.
- **R5** WHO. Polycystic ovary syndrome, fact sheet (22 Jan 2026). https://www.who.int/news-room/fact-sheets/detail/polycystic-ovary-syndrome. Accessed 6 Nov 2026.
- **R6** Fryer J, Mason-Jones AJ, Woodward A. Understanding diagnostic delay for endometriosis: a scoping review using the social-ecological framework. *Health Care Women Int* 2025;46(3):335–351 (online 17 Oct 2024). https://doi.org/10.1080/07399332.2024.2413056 (PMID 39418593). Accessed 6 Nov 2026.
- **R6p** Preprint of R6, medRxiv, posted 9 Jan 2024. https://www.medrxiv.org/content/10.1101/2024.01.08.24300988v1 (metadata via https://api.biorxiv.org/details/medrxiv/10.1101/2024.01.08.24300988). Accessed 6 Nov 2026.
- **R7** De Corte P, Klinghardt M, von Stockum S, Heinemann K. Time to diagnose endometriosis: a systematic literature review. *BJOG* 2025;132(2):118–130. https://doi.org/10.1111/1471-0528.17973 (PMID 39373298; PMC11625652). Accessed 6 Nov 2026.
- **R8** WHO. Endometriosis, fact sheet (15 Oct 2025). https://www.who.int/news-room/fact-sheets/detail/endometriosis. Accessed 6 Nov 2026.
- **R9** Mousa M, Al-Jefout M, Alsafar H, Becker CM, Zondervan KT, Rahmioglu N. Impact of endometriosis in women of Arab ancestry on health-related quality of life, work productivity and diagnostic delay. *Front Glob Womens Health* 2021;2:708410. https://doi.org/10.3389/fgwh.2021.708410 (PMID 34816238; full text at https://www.frontiersin.org/journals/global-womens-health/articles/10.3389/fgwh.2021.708410/full). Accessed 6 Nov 2026.
- **R10** The National. UAE experts urge action as endometriosis diagnosis delays take up to 20 years (28 Mar 2024). https://www.thenationalnews.com/news/uae/2024/03/28/uae-endometriosis-diagnosis-delay/ (snippet only). Accessed 6 Nov 2026.
- **R11** Bashir MM, et al. Incidence of gestational diabetes mellitus in the UAE; comparison of six diagnostic criteria: the Mutaba'ah Study. *Front Endocrinol* 2022;13:1069477. https://doi.org/10.3389/fendo.2022.1069477 (PMC9791114). Accessed 6 Nov 2026.
- **R12** Bashir MM, et al. Optimizing gestational diabetes diagnostic criteria to predict adverse perinatal outcomes in the UAE: the Mutaba'ah Study. *Front Endocrinol* 2025;16:1641326. https://doi.org/10.3389/fendo.2025.1641326 (PMID 41141339). Accessed 6 Nov 2026.
- **R13** Al-Rifai RH, Abdo NM, Paulo MS, Saha S, Ahmed LA. Prevalence of gestational diabetes mellitus in the Middle East and North Africa, 2000–2019: systematic review and meta-analysis. *Front Endocrinol* 2021;12:668447. https://doi.org/10.3389/fendo.2021.668447. Accessed 6 Nov 2026.
- **R14** Agarwal MM, Lal M, Vyas CD. Gestational diabetes mellitus in a multi-ethnic, high-risk population: adequacy of screening for diabetes 6 weeks after delivery. *IJERPH* 2022;19(21):13946. https://doi.org/10.3390/ijerph192113946 (PMID 36360827; PMC9658585; full text via Europe PMC). Accessed 6 Nov 2026.
- **R15** Alfitni D, Ageel M, Alsulami E, Alzahrani A. Prevalence and postpartum screening practice for type 2 diabetes following GDM in a tertiary care center in Western Saudi Arabia. *Cureus* 2024;16(12):e75691. https://pmc.ncbi.nlm.nih.gov/articles/PMC11726392/ (PMID 39807452). Accessed 6 Nov 2026.
- **R16** D'Amico R, et al. Patterns of postpartum primary care follow-up and diabetes-related care after diagnosis of gestational diabetes. *JAMA Netw Open* 2023;6(2):e2254765. https://doi.org/10.1001/jamanetworkopen.2022.54765 (PMID 36745454). Accessed 6 Nov 2026.
- **R17** Society for Maternal-Fetal Medicine. Special statement: quality metric on the rate of postpartum diabetes screening after pregnancies with GDM. *Am J Obstet Gynecol* 2023;228(4):B2–B9. https://doi.org/10.1016/j.ajog.2022.12.315 (PMID 36584961). Accessed 6 Nov 2026.
- **R18** Eng PC, Teo AED, Yew TW, Khoo CM. Implementing care for women with gestational diabetes after delivery: the challenges ahead. *Front Glob Womens Health* 2024;5:1391213. https://doi.org/10.3389/fgwh.2024.1391213. Accessed 6 Nov 2026.
- **R19** Adekojo O, Revell KR, Preece H, Morris S, Coleman MA, Holt RI. Low uptake of postpartum screening for type 2 diabetes in women after a diagnosis of gestational diabetes (letter). *Diabet Med* 2016;33(11):1599–1601. https://eprints.soton.ac.uk/394697 (doi:10.1111/dme.13084; PMID 26822981; full text returned 403, details from search snippets). Accessed 6 Nov 2026.
- **R20** Dennison RA, et al. The absolute and relative risk of type 2 diabetes after gestational diabetes: a systematic review and meta-analysis of 129 studies. *Diabetes Res Clin Pract* 2021;171:108625. https://pubmed.ncbi.nlm.nih.gov/33333204/ (read via Europe PMC). Accessed 6 Nov 2026.
- **R21** Vounzoulaki E, et al. Progression to type 2 diabetes in women with a known history of gestational diabetes: systematic review and meta-analysis. *BMJ* 2020;369:m1361. https://www.bmj.com/content/369/bmj.m1361 (snippet only). Accessed 6 Nov 2026.
- **R22** Bayoumi RAL, et al. Utility of oral glucose tolerance test in predicting type 2 diabetes following gestational diabetes: towards personalized care. *World J Diabetes* 2021;12(10):1778–1788. https://doi.org/10.4239/wjd.v12.i10.1778 (PMID 34754378; PMC8554365). Accessed 6 Nov 2026.
- **R23** Dennison RA, Fox RA, Ward RJ, Griffin SJ, Usher-Smith JA. Women's views on screening for type 2 diabetes after gestational diabetes: systematic review and qualitative synthesis. *Diabet Med* 2020;37(1):29–43. https://doi.org/10.1111/dme.14081 (PMC6916174, the paper docs/05 currently cites). Accessed 6 Nov 2026.
- **R24** Hanach N, et al. Prevalence and risk factors of postpartum depression among women living in the United Arab Emirates. *Soc Psychiatry Psychiatr Epidemiol* 2023;58(3):395–407. https://doi.org/10.1007/s00127-022-02372-1 (PMID 36239744; PMC9971080; full text via Europe PMC). Accessed 6 Nov 2026.
- **R25** Al Ahbabi S, Mubarak G, Al Khaldi S, Bin Mousa A, Baynouna Al Ketbi LM. Prevalence of postpartum depression among mothers in the Emirate of Abu Dhabi. *Matern Child Health J* 2024;28(10):1685–1693. https://doi.org/10.1007/s10995-024-03931-5 (PMID 38951298; PMC11420359; full text via Europe PMC). Accessed 6 Nov 2026.
- **R26** Green K, Broome H, Mirabella J. Postnatal depression among mothers in the United Arab Emirates: socio-cultural and physical factors. *Psychol Health Med* 2006;11(4):425–431. https://pubmed.ncbi.nlm.nih.gov/17129919/ (read via Europe PMC). Accessed 6 Nov 2026.
- **R27** Abu Dhabi Media Office. DoH launches Rewarding Exceptional Quality programme (30 July 2025). https://www.mediaoffice.abudhabi/en/health/department-of-health-abu-dhabi-launches-rewarding-exceptional-quality-programme-recognising-excellence-by-healthcare-providers/. Accessed 6 Nov 2026.
- **R28** Abu Dhabi Media Office. Abu Dhabi Programme for the Future of Reproductive Health (17 Sept 2026). https://www.mediaoffice.abudhabi/en/health/abu-dhabi-programme-for-the-future-of-reproductive-health-an-integrated-ecosystem-shaping-standards-research-and-innovation/. Accessed 6 Nov 2026.
- **R29** ARN News Centre. H.H. Sheikh Khaled approves programme to boost IVF success rates (17 Sept 2026). https://www.arnnewscentre.ae/en/news/uae/h-h-sheikh-khaled-approves-programme-to-boost-ivf-success-rates/. Accessed 6 Nov 2026.
- **R30** Gulf News. UAE society in demographic decline: FNC submits 15 recommendations (updated 24 Jan 2026; births data from MoHAP). https://gulfnews.com/uae/uae-society-in-demographic-decline-federal-national-council-submits-15-recommendations-to-government-1.500419015. Accessed 6 Nov 2026.
- **R31** Gulf News. Declining fertility rate causes concern in UAE (updated 30 Jan 2025; data from UAE.STAT). https://gulfnews.com/uae/government/declining-fertility-rate-causes-concern-in-uae-1.500025642. Accessed 6 Nov 2026.
- **R32** World Bank. Fertility rate, total (births per woman), UAE (SP.DYN.TFRT.IN; updated 8 Oct 2026). https://data.worldbank.org/indicator/SP.DYN.TFRT.IN?locations=AE (read via https://api.worldbank.org/v2/country/ARE/indicator/SP.DYN.TFRT.IN?format=json). Accessed 6 Nov 2026.
- **R33** WHO. Infertility, fact sheet (28 Nov 2025). https://www.who.int/news-room/fact-sheets/detail/infertility. Accessed 6 Nov 2026.
- **R34** WHO Global Health Observatory. Prevalence of anaemia in women of reproductive age, UAE (NUTRITION_ANAEMIA_REPRODUCTIVEAGE_PREV). https://ghoapi.azureedge.net/api/NUTRITION_ANAEMIA_REPRODUCTIVEAGE_PREV?$filter=SpatialDim%20eq%20'ARE'. Also World Bank SH.ANM.ALLW.ZS: https://data.worldbank.org/indicator/SH.ANM.ALLW.ZS?locations=AE. Accessed 6 Nov 2026.
- **R35** Al-Dabbagh B, Shawqi S, Yasin J, Al Essa A, Nagelkerke N, Denic S. Half of the Emirati population has abnormal red cell parameters. *Hemoglobin* 2014;38(1):56–59. https://pubmed.ncbi.nlm.nih.gov/24205932/ (read via Europe PMC). Accessed 6 Nov 2026.
- **R36** Alsalman M, et al. Heavy menstrual bleeding awareness among Saudi female population and clinical implications. *Health Sci Rep* 2021;4(1):e244. https://doi.org/10.1002/hsr2.244 (PMID 33614981). Accessed 6 Nov 2026.
- **R37** Alhaj Ahmad M, et al. Menstrual disturbances and associated factors among female university students in the UAE. *Cureus* 2025;17(4):e82169. https://doi.org/10.7759/cureus.82169 (PMID 40364890). Accessed 6 Nov 2026.
- **R38** Abu Dhabi Media Office. DoH launches Integrated Postnatal Care Programme (14 July 2025). https://www.mediaoffice.abudhabi/en/health/department-of-health-abu-dhabi-launches-integrated-postnatal-care-programme-to-enhance-maternal-and-infant-health. Accessed 6 Nov 2026.
- **R39** DoH Abu Dhabi. World Mental Health Day release (9 Oct 2025). https://www.doh.gov.ae/en/news/ad-reimagines-mental-health-a-society-where-seeking-support-is-a-sign-of-strength (page would not open; snippets only). Accessed 6 Nov 2026.
- **R40** DoH Abu Dhabi Jawda guidance (PDFs would not open; snippets only). Primary Care, 2022 update: https://www.doh.gov.ae/-/media/Feature/Muashir/Jawda/Jawda-Quarterly-Submission-Guidelines/PrimaryCare-JAWDA---Update-2022.ashx. Primary Care & Medical Centre, V1, from Q3 2026: https://www.doh.gov.ae/-/media/Feature/Muashir/Jawda/2026/Primary-Care-and-Medical-Center-Services-Jawda-Guidance_V1_2026_Effective-From-Q3-2026.ashx. Maternal & Perinatal, V7.1, from Q3 2026: https://www.doh.gov.ae/-/media/Feature/Muashir/Jawda/2026/Maternal-and-Perinatal-Care-Jawda-GuidanceV71Effective-from-Q3-2026.ashx. ART, V9 2026: https://www.doh.gov.ae/-/media/Feature/Muashir/Jawda/2026/ART-Jawda-Guidance_Version9_2026.ashx. Accessed 6 Nov 2026.
- **R41** Intelligent CIO Middle East. Malaffi reaches 3.5 billion clinical records (19 Aug 2025). https://www.intelligentcio.com/me/2025/08/19/malaffi-reaches-3-5-billion-clinical-records-setting-a-new-standard-for-healthcare-innovation-in-abu-dhabi/. Accessed 6 Nov 2026.
