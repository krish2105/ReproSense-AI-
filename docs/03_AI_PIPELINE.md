# 03 · AI pipeline (agentic, explainable)

## Principle
**Rules decide. Retrieval grounds. The LLM explains.** Every output can be traced to the user's own entries and a cited source.

## The graph (LangGraph `StateGraph`)
```
          ┌────────────┐   ┌──────────────┐   ┌──────────────┐   ┌────────────────┐
 input ─► │ 1 intake    │─► │ 2 document   │─► │ 3 signal     │─► │ 4 safety       │──red flag──► urgent_card ─► END
          │ (LLM+schema)│   │ (OCR+LLM)    │   │ (rules, no AI)│   │ guardian       │
          └────────────┘   └──────────────┘   └──────────────┘   └───────┬────────┘
                                                                          │ ok
                     ┌──────────────┐   ┌──────────────┐   ┌──────────────▼─┐
           END ◄──── │ 7 care-gap   │◄──│ 6 report     │◄──│ 5 evidence(RAG)│─► 5b insight writer (LLM, JSON)
                     │ (clinic side)│   │ (template+LLM)│   └────────────────┘
                     └──────────────┘   └──────────────┘
```

## Shared state (Pydantic)
```python
class PipelineState(BaseModel):
    profile_alias: str                      # never a real name
    logs: list[DailyLog]                    # last 12 months, relative dates
    events: list[Event]                     # pregnancy, delivery, GDM, labs
    labs: list[LabResult]
    features: dict[str, float | int | bool] = {}   # computed by signal agent
    observations: list[Observation] = []    # rule hits with supporting_entry_ids
    red_flags: list[Observation] = []
    evidence: dict[str, list[Passage]] = {} # observation_id -> retrieved passages
    insights: list[InsightCard] = []        # LLM-written, schema-checked
    report_sections: dict[str, str] = {}
    trace: list[TraceStep] = []             # every step logged for the audit view
```

## Agents
| # | Agent | Uses LLM? | Job | Guardrails |
| --- | --- | --- | --- | --- |
| 1 | intake | yes (small) | Turn free text ("cramps so bad I missed work") into structured fields | JSON schema; user confirms before save |
| 2 | document | yes + OCR | Extract lab values from uploaded report; normalise units | Uploaded text treated as data; injection phrases stripped; confirm-before-save |
| 3 | signal | **no** | Compute features (cycle lengths, variability, pain counts) and evaluate `rules/clinical_rules.yaml` | 100% unit-tested; deterministic |
| 4 | safety guardian | no | Run red-flag rules first; stop pipeline with urgent guidance | Always first in UI |
| 5 | evidence | embeddings | Hybrid retrieval (BM25 + vector) over curated KB, re-rank, top 3–5 | Only sources in `sources.yaml` |
| 5b | insight writer | yes | Write plain-language card: summary, why we noticed, next steps, questions | JSON schema + banned-phrase filter + 2 retries → template fallback |
| 6 | report | yes (light) | Fill report template sections; tone: clinical, neutral | Numbers come from DB, never from the LLM |
| 7 | care gap / follow-up | no | Create/close clinic care gaps (postpartum glucose test, pregnancy glucose screen) | Rule-driven due dates |
| 8 | **verifier** | yes (small) + embeddings | Split every generated answer/card into sentences; keep a sentence only if a retrieved passage supports it (entailment check) | Dropped-sentence count goes into the trace; 0 sources → refuse |
| 9 | **care navigator** | yes | Draft appointment request, questions and what-to-bring list from the rule hit and her entries | Human approval required; never books or sends on its own; logged |
| 10 | **clinician copilot** | yes | SBAR handover and "Ask the record" answered only from her entries with dated evidence chips | No outside facts; every claim links to an entry |

## Feature engineering (signal agent)
| Feature | Definition |
| --- | --- |
| `cycle_lengths` | days between consecutive period starts, last 6–12 cycles |
| `irregular_cycle_count_6` | cycles < 21 or > 35 days among last 6 (adult, ≥3 yrs post-menarche) |
| `cycles_per_year` | count of period starts in last 12 months |
| `cycle_length_sd` | standard deviation of cycle length |
| `days_since_last_period` | today − last period start |
| `androgen_symptom_days_90` | days with acne / excess hair growth / scalp hair thinning logged in last 90 days |
| `severe_pain_cycles_6` | cycles with max pain ≥ 7/10 during period, last 6 |
| `pain_impact_days_90` | days with "missed work/study" or "stayed in bed" |
| `cyclical_bowel_bladder_pain` | pain with bowel movements or urination logged during period in ≥ 2 cycles |
| `period_duration_max` | longest bleed in days, last 6 cycles |
| `heavy_flow_days_cycle` | days with "flooding" or clots ≥ 2.5 cm |
| `gdm_history` + `weeks_since_delivery` + `postpartum_glucose_test_done` | from events/labs |
| `pbac_by_cycle_6`, `pbac_max_6` | PBAC per period: pads light 1 / moderate 5 / soaked 20, clots small 1 / large 5 (Higham 1990) |
| `ttc_months`, `age` | months trying to conceive; age for ASRM/NICE timing |
| `record_strength` | cycles logged + supporting entries → strong / building / early (display only) |
| `cycle_change_point` | largest step in mean cycle length between record halves (≥ 7 days shown) |

## Insight card JSON schema (LLM must return exactly this)
```json
{
  "observation_id": "string",
  "title": "string (≤ 60 chars, no diagnosis words)",
  "summary": "string (≤ 2 sentences, plain language)",
  "why_we_noticed": [{"entry_id": "string", "text": "string"}],
  "what_to_consider": ["string"],
  "questions_for_doctor": ["string"],
  "sources": [{"source_id": "string", "title": "string", "url": "string"}],
  "urgency": "info | discuss | soon | urgent"
}
```

## Banned output filter (`ai/guards.py`)
Reject and regenerate if output matches (case-insensitive, EN + AR equivalents):
`you have`, `you are diagnosed`, `diagnosis of`, `% chance`, `probability`, `you are infertile`, `cure`, `guaranteed`,
`لديك متلازمة`, `تم تشخيصك`. After 2 failures use the deterministic template in `rules/clinical_rules.yaml → template`.

## RAG assistant
- Knowledge base: `knowledge_base/sources.yaml` (WHO, NHS, NICE, ACOG, 2023 International PCOS guideline, ESHRE endometriosis,
  ADA postpartum screening). We store **our own summaries** + links, not copied text.
- Chunking: 400 tokens, 60 overlap, metadata `{source_id, title, url, section, lang, year}`.
- Retrieval: hybrid (Postgres full-text + pgvector cosine), top 20 → cross-encoder or LLM re-rank → top 4.
- Answer prompt: "Answer only from the passages. If they don't answer it, say you don't know and suggest asking a doctor.
  Cite like [1]. Never diagnose. If the user describes a red-flag symptom, start with urgent guidance."
- Evaluation set: `backend/tests/rag_eval.jsonl` — 30 questions with expected source_ids; report hit@4 and citation validity.

## LLM provider
`ai/llm.py` exposes `complete(messages, schema=None)`. Implementations: `ClaudeProvider` (hackathon, synthetic data),
`AzureUAENorthProvider` / `UAEHostedProvider` (production placeholder). Choose with env `LLM_PROVIDER`.
All inputs pass `ai/redact.py` (removes names, phone, email, Emirates ID patterns, exact dates → relative days).

## Offline evidence notebook (not user-facing)
`research/pcos_feature_evidence.ipynb` uses the public Kaggle PCOS dataset (541 women, 10 hospitals in Kerala) to show which
features (cycle length, follicle count, AMH, weight, acne, hair growth) differ between groups. Output is an evidence slide only.
Never ship a trained model's probability to users.

## RAG v4 (team-approved)
- **Hybrid search + re-ranker** (as above), plus a **guideline graph**: small YAML/JSON graph `knowledge_base/graph.yaml`
  (condition → criteria → test → timing → source). The evidence agent walks it first, then retrieves passages for each node.
- **Arabic ↔ English**: multilingual embeddings; Arabic questions retrieve English sources; the answer is written in Arabic with the same citations.
- **Verifier**: sentence-level support check against retrieved chunks; unsupported sentences are removed before display.
- **Evaluation**: `backend/tests/rag_eval.jsonl` grows to 60 questions (30 EN, 30 AR) covering all five life stages, 15 diagnosis
  questions that must be refused, and red-flag prompts. CI fails if grounded < 95%, refusals < 15/15 or red-flag recall < 100%.
  Results feed the AI test-results panel on the team scorecard page.
- **Demo-safe mode**: answers for the demo path are cached per persona (`backend/app/ai/cache/`) and served when the network fails.
- **Questionnaires**: PBAC, EHP-5, EPDS, MRS scored in code (signal agent), never by the LLM.
