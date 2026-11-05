# 04 · Data plan — synthetic and open data only

Hackathon rule: no real data is provided and identifiable patient data is not allowed. Everything we use is synthetic or open.

## Sources
| Source | Used for | Where |
| --- | --- | --- |
| `data/synthetic/generate_synthetic.py` (ours) | 5 demo personas, 1,200-woman clinic cohort, lab report texts | `data/synthetic/output/` |
| Kaggle PCOS dataset (541 women, 10 hospitals in Kerala, ~41 features) | Evidence notebook only: which features differ with PCOS | `research/` (download yourself; check licence) |
| Synthea (MITRE, open source) | Optional: FHIR-shaped pregnancy records if we need more postpartum examples | `data/synthea/` (optional) |
| Curated guideline summaries | RAG knowledge base | `knowledge_base/` |

## The generator (already built and tested)
```
python3 data/synthetic/generate_synthetic.py --seed 2026 --ref-date 2026-11-22 --cohort 1200
```
- Same seed → byte-identical output (stable demo).
- Each persona is re-simulated until it shows its intended observations, so the demo story never breaks.
- Validates itself: prints `[OK]` per persona; exits 1 on mismatch (use in CI).

| Persona | Expected rule hits |
| --- | --- |
| amina | none |
| noura | OBS_IRREGULAR_CYCLES, OBS_IRREGULAR_PLUS_ANDROGEN |
| priya | OBS_SEVERE_CYCLICAL_PAIN, OBS_CYCLICAL_BOWEL_BLADDER_PAIN |
| fatima | CARE_POSTPARTUM_GLUCOSE_TEST |
| sara | RF1_heavy_bleeding_with_dizziness, OBS_HEAVY_OR_LONG_PERIODS (PBAC 158–161) |
| mariam | OBS_TTC_FERTILITY_ASSESSMENT (36, trying 7 months) |

## Why it looks real to judges
- 12 months of day-level logs with natural noise (pain fades after day 2, sleep varies, notes in plain language).
- PBAC (Higham 1990) bleeding score computed per period day from pad and clot counts.
- Cohort includes trying-to-conceive women and an equity table by nationality group and age band.
- Lab reports formatted like a real lab printout (alias, sample date, units, reference ranges, H/L flags) — clearly labelled fictional.
- Cohort spread across Abu Dhabi City / Al Ain / Al Dhafra, clinics, age bands, care-gap states.
- Proportions are plausible but explicitly **not** epidemiological estimates (stated in `cohort_summary.json` and on screen).

## Honesty rules
- Badge "Demo data — fictional" on every screen that shows data.
- Pitch line: "All data is synthetic; real-world validation with a partner clinic is our month-3 milestone."
- Never present a model accuracy number as clinical accuracy.

## Version 4 personas (generator output, all [OK])
| id | Stage | Story | Expected rules |
| --- | --- | --- | --- |
| amina | periods | regular, calm state | none |
| noura | periods | irregular + androgen signs | OBS_IRREGULAR_CYCLES, OBS_IRREGULAR_PLUS_ANDROGEN |
| priya | periods | severe pain, bowel pain | OBS_SEVERE_CYCLICAL_PAIN, OBS_CYCLICAL_BOWEL_BLADDER_PAIN |
| sara | periods | heavy + dizziness day + tiredness | RF1, OBS_HEAVY_OR_LONG_PERIODS, OBS_HEAVY_WITH_FATIGUE |
| mariam | trying to conceive | 36, 7 months trying | OBS_TTC_FERTILITY_ASSESSMENT |
| hessa | pregnancy | week 24, glucose screen not booked | CARE_PREGNANCY_GLUCOSE_SCREEN |
| fatima | after birth | GDM, no glucose test, EPDS 11 | CARE_POSTPARTUM_GLUCOSE_TEST, OBS_POSTPARTUM_MOOD |
| layla | perimenopause | 47, hot flushes, MRS 17→21 | OBS_PERIMENOPAUSE_SYMPTOMS |
New event types: antenatal_visit, appointment_planned, questionnaire (EPDS, MRS). New log fields: pregnancy_week. Profile: life_stage, pregnancy_weeks.
