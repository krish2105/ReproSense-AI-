# Drafts ready to use (6 Nov 2026)

| File | For | Who acts | By |
| --- | --- | --- | --- |
| `45-second-competition.md` | Decide on the Future Health challenge (QUESTIONS #45) | Krishna | **10 Nov** (registration closes) |
| `application-answers.md` | Copy-paste answers for the HealthX Ajyal application | Every member, separately, same team name | **14 Nov 23:59 GST** |
| `44-organiser-email.md` | Ask how disclosed pre-selection code is scored (QUESTIONS #44) | Krishna sends | Before 16 Nov |
| `26-outreach.md` | Messages for the clinical advisor, 5 clinicians, 3 clinic managers (price test, LOI) and 5 usability volunteers; notes rules and tracker | Atharva and Krishna | Start now; before 16 Nov |
| `26-usability-script.md` | 20-minute timed session: safety rules, 8 tasks, note sheet, what to report | Atharva | 5 sessions before 16 Nov |
| `26-rehearsal-cards.md` | Pre-flight checklist, 5 timed demo cards, failure plan, rehearsal log, Q&A drill | Both | 5 rehearsals before 22 Nov |
| `26-letter-of-intent.md` | Non-binding letter of intent to pilot, for the most engaged clinic (card B7 in docs/18) | Atharva or Krishna | Ask by 15 Nov, signed by 20 Nov |

## Selection day (16 Nov): tag the pre-selection state
Run once on 16 Nov, before any build-week commit, so the jury can see exactly what existed before selection:
```bash
git fetch origin && git tag -a pre-selection-2026-11-16 origin/main -m "State of main at selection, 16 Nov 2026" && git push origin pre-selection-2026-11-16
```
After that, list build-week work as "built 16–22 Nov" (research/2026-11-06/01 §0.2).
