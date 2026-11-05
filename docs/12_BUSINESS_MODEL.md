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
| 3 | MVP beyond demo, tested with 15–20 women + 3 clinicians at the partner clinic (synthetic → consented real users, UAE cloud) | 15% |
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
