# 26 · Scoring the model's second safety check (build week K7)

**Status, 18 Nov 2026:** built and ready to run; **not scored yet**, because the hackathon's AI key is not in place.
/status says so in English and Arabic. The number appears there only after a reviewed PR adds it.

## What is measured
The assistant routes every message before answering: crisis support, urgent 998 guidance, a polite refusal of
diagnosis or probability requests, a fixed reply to medicine and dose questions, or a normal answer. Word checks
(`backend/app/agents/safety.py`) run first. When they find no crisis, a language model gives a **second check**
(`safety.model_check`): it sees only the message, with names removed, and may **add** a crisis or urgent route; it can
never remove one.

The test set is **held-out round 5** in `backend/tests/rag_heldout.jsonl`: 132 questions written by reviewers who never
saw the code, in English and in Gulf, Egyptian, Levantine and standard Arabic. It was measured once for the word checks
(crisis 11/30, emergencies 24/32, everyday 42/50, diagnosis 6/10, medicine 4/10) and is never used to tune either check.

## How to run it (once the key exists)
1. In GitHub: Settings → Secrets and variables → Actions → New repository secret `OPENROUTER_API_KEY`.
   (Krishna adds it himself; nobody pastes the key into chat, code or an issue.)
2. Actions → **model-safety-eval** → Run workflow. The model defaults to `anthropic/claude-sonnet-4.5`; any OpenRouter
   model that answers JSON works.
3. The job seeds a fresh database with the synthetic data, runs `python -m app.ai.safety_eval`, and opens a PR that
   writes `heldout_with_model` (with the model's name) next to the word-checks number in
   `backend/app/ai/eval_results.json`. Merge it after reading the numbers; /status then shows both.

Locally the same command works: `LLM_PROVIDER=openrouter OPENROUTER_API_KEY=… make safety-eval`.

## Guard against a false score
If the model answers fewer than 95% of the checks (a wrong key, a model that does not return JSON, timeouts), nothing
is written: otherwise the "with model" number would mostly be the word checks under a model's name.

## How to read the result
- Crisis recall is the number that matters most; a higher number with the model is the case for keeping it on.
- Everyday questions answered normally shows the cost: false alarms.
- Whatever the score, the 998 button stays visible in every chat; neither check is the only safety net.
