---
name: add-explainable-observation
description: Use when adding or changing a clinical observation rule in ReproSense. Walks the full path from guideline source to YAML rule, feature, tests, synthetic persona, UI card, report line and assistant answer.
---

# Add an explainable observation (end to end)

Every observation must survive the judge question: "Where does that threshold come from, and which of her entries triggered it?"

## Steps
1. **Source first.** Find the guideline (2023 PCOS guideline, NICE, ESHRE, ADA, ASRM, NHS). Add it to
   `knowledge_base/sources.yaml` with id, title, url, year. Write a 5–10 line summary in our own words in
   `knowledge_base/summaries/<id>.md`. No source → no rule.
2. **Feature.** Define any new feature in `docs/03_AI_PIPELINE.md` (feature table) and implement it in
   `backend/app/rules/features.py`. Pure function of logs/events/labs, unit-tested.
3. **Rule.** Add to `rules/clinical_rules.yaml`: `id`, `title_en` (non-diagnostic), `when`, `explains`, `next_steps_en`,
   `urgency`, `source_ids`. Run the chief-healthcare-officer agent on it.
4. **Evidence mapping.** In `backend/app/rules/evidence.py`, return the `supporting_entry_ids` for the rule (the exact logs,
   cycles or events). The UI shows these as tappable chips.
5. **Synthetic persona.** Make sure one persona in `data/synthetic/generate_synthetic.py` triggers it and the others don't.
   Update `EXPECTED`. Run the generator: every line must print `[OK]`.
6. **Tests.** Positive case, negative case, boundary case (exactly at threshold), adolescent exclusion if cycle-based.
7. **UI.** Observation card shows: urgency chip, title, explanation, "Why we noticed" chips, next steps, questions, sources,
   data-completeness meter, and "How this was produced" trace link.
8. **Report + assistant.** Add the report line template and 1–2 assistant Q&As with citations to `backend/tests/rag_eval.jsonl`.
9. **Copy guard.** Run the `clinical-copy-guard` skill over every new string (EN + AR).
10. **Log it.** Add a line to PROGRESS.md and update docs/01 persona table.

## Data-completeness meter (not a probability)
Show how much data supports the observation, never how likely a disease is:
- Strong: ≥ 6 cycles logged and ≥ 2 supporting entries
- Building: 3–5 cycles
- Early: < 3 cycles → card says "Keep logging; this pattern is not clear yet."
