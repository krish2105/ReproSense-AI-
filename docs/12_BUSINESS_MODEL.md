# 12 · Business model (real SaaS)

## Who pays
| Segment | Pain | What they buy | Price model (hypothesis — validate in interviews) |
| --- | --- | --- | --- |
| Women (users) | Hard to explain months of symptoms; feel unheard | Free app | Free forever; optional premium later |
| Women's health & IVF clinics (first customer) | Short visits, messy histories, no-shows on follow-up | Clinician console + care-gap engine + branded patient invite | Per clinician seat / month |
| Clinic networks & hospitals | Population follow-up, quality metrics | Network dashboard, SSO, FHIR export | Annual licence |
| Payers & employers (phase 2) | Cost of late diagnosis, diabetes after GDM | Outcomes reporting on closed care gaps | Per enrolled member / month + outcome bonus |

Abu Dhabi tailwinds: DoH's Rewarding Exceptional Quality programme already pays fertility providers for quality — ReproSense
can produce the follow-up metrics clinics need.

## Go-to-market (first 6 months, matched to grant milestones)
| Month | Milestone | Grant tranche |
| --- | --- | --- |
| 0 | Win; sign grant agreement | 50% |
| 1 | Founders' agreement, venture plan, 10 interviews, 1 clinic LOI | 10% |
| 3 | UAE stack live, approvals filed, usability sessions on synthetic personas with 15–20 women and 3 clinicians (real data only after the month-4 gate review, research/2026-11-06/03 §7) | 15% |
| 6 | UAE commercial licence, ADHICS gap assessment, first paid pilot | 25% |

## Interview script (5 clinicians, 3 clinic managers, 5 women)
1. How long does it take to understand a new patient's cycle and pain history?
2. What do patients bring today (apps, photos, nothing)?
3. Which follow-ups are most often missed (postpartum glucose test, review after PCOS work-up)?
4. Would a structured 2-page report save time? How much?
5. Who in your clinic decides to buy software? What would you pay per clinician per month?
6. (Women) What stops you telling your doctor everything? Would you share a report if you control it?

## Moat
A rule library that shows its sources (clinician-reviewed once the advisor signs the rules header) + bilingual guideline
knowledge base + clinic workflow data (consented, de-identified) + FHIR R4 export into the clinic's EMR, which feeds
Malaffi + DoH's own quality indicator (Jawda PC008) on the dashboard. Hard to copy for a consumer tracker. Note: Flo
and Clue already sell doctor PDFs, so the report alone is not the moat (research/2026-11-06/04 §0.3).

## Unit economics (hypothesis, 6 Nov 2026; validate in the pilot)
Every number below is a **hypothesis** with its source. Prices are on `/pricing` and in research/2026-11-06/04 §9. Costs
are public list prices read on 6 Nov 2026 (sources at the end). We have no sales data yet, so margin and payback are
arithmetic on these inputs, not results. AED = USD × 3.6725 (the dirham's fixed peg).

| Line | Hypothesis | Source | How the pilot measures it |
| --- | --- | --- | --- |
| Price | AED 399 per clinician a month (AED 349 paid yearly); small clinic AED 1,990 a month for up to 5 | research/2026-11-06/04 §9 | Willingness to pay in 5+ clinician and 3+ manager interviews; the LOI terms |
| Hosting, pilot stack in the UAE | **≈ AED 122 a month**: AWS Middle East (UAE) `me-central-1`, one t4g.small server (USD 14.89), PostgreSQL db.t4g.micro single-AZ (USD 13.87), 20 GB storage (USD 2.80) = USD 31.56, plus 5% UAE VAT. Shared by every clinic on the stack. Not yet included: the server's own disk (EBS), data transfer and a public IP address | [1] [2] [5] | The monthly cloud bill ÷ active clinics |
| Hosting, production stack | Not priced yet: high availability (a second database in another availability zone roughly doubles its cost), backups, monitoring and ADHICS controls come on top | [2] | The bill in pilot month 3 |
| Model cost per report | **Zero** in the shipped mode: rules find every pattern, cards use template wording, answers are extractive. Real data can only use a model hosted in the UAE, which is not priced yet | `LLM_PROVIDER=none` (docs/16); UAE law [6] | Model calls per report × price per call, once a UAE-hosted model is chosen |
| Model cost, synthetic demo only | About **USD 0.06 a report** (AED 0.22) with Claude Opus 5.5 at USD 4 / 20 per million input / output tokens, *assuming* 3 cards × (2,000 input + 600 output tokens). The token counts are assumptions until #29 measures them with a key | [3] | `response.usage` per card in `make safety-eval` / the writer |
| Gross margin, infrastructure only | One small clinic on the pilot stack: (1,990 − 122) ÷ 1,990 ≈ **94%**. Excludes support, compliance work, high availability and a model. Not a company gross margin | arithmetic on the rows above | (revenue − hosting − model − support) ÷ revenue, pilot month 3 |
| Customer acquisition (CAC) | Not known. Founder-led: one paid pilot per clinic, AED 5,000–10,000, credited to year 1 | research/2026-11-06/04 §9 | Founder hours and spend per signed pilot; pilot → paid conversion |
| Sales cycle | Not known | — | Days from first meeting to LOI, and LOI to paid pilot |
| Payback | Scenarios, not estimates: at AED 1,868 infrastructure-only gross profit a month per small clinic, a CAC of AED 10,000 / 20,000 / 40,000 pays back in **5.4 / 10.7 / 21.4 months** (support costs would lengthen this) | arithmetic | CAC ÷ measured monthly gross profit per clinic |
| Seat revenue ceiling, Abu Dhabi | ~700 OB-GYN specialists × AED 399 × 12 ≈ AED 3.35M a year; with midwives ≈ AED 5.15M | research/2026-11-06/04 | Shows why networks (from AED 150,000 a year) and payer programmes are needed for a venture |

**Sources (read 6 Nov 2026).** [1] AWS EC2 on-demand price list, Middle East (UAE), Linux:
`https://b0.p.awsstatic.com/pricing/2.0/meteredUnitMaps/ec2/USD/current/ec2-ondemand-without-sec-sel/Middle%20East%20(UAE)/Linux/index.json`.
[2] AWS Price List API, RDS, `me-central-1`: `https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonRDS/current/me-central-1/index.json`.
[3] Anthropic API list prices, Claude Opus 5.5 (input USD 4, output USD 20 per million tokens).
[4] Azure Retail Prices API, `uaenorth` (the alternative stack: B1ms VM + PostgreSQL Flexible B1MS + storage ≈ USD 39.75 a month): `https://prices.azure.com/api/retail/prices`.
[5] AWS UAE tax help, 5% VAT on UAE accounts: `https://aws.amazon.com/tax-help/uae/`. List prices exclude VAT.
[6] Federal Law No. 2 of 2019, Art. 13 (health data stays in the UAE); docs/07.

The first proof point for payers is the after-birth glucose test after gestational diabetes: DoH's Jawda PC008 already
measures it, and the network dashboard shows its completion (synthetic until a pilot).
