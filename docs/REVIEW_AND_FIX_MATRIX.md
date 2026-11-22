# Review and fix matrix

Started 22 Nov 2026 (showcase day) from an external review brief. Baseline: `main` at `823d951`, live at
https://reprosense.vercel.app (web on Vercel, API on Render, fictional data only). Sources for every claim are in
[CLAIMS_REGISTER.md](CLAIMS_REGISTER.md).

State: **fixed** (merged), **in review** (pull request open), **planned** (not started), **blocked** (needs a person
or an approval we do not have). Reviewer "G2" means Krishna's written approval, the team's gate for safety wording,
clinical rules and sign-in. GitHub has no branch protection or CODEOWNERS configured, so that gate is the team's rule.

## 1. Reproducible problems

| # | Issue | Evidence | Where | Impact | Priority | Change | Reviewer | How it is verified | State |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | PC008 written as a current DoH reporting duty and as the reason clinics pay | DoH Jawda Primary Care guidance V9 (2026), printed page 41: PC006 to PC008 retired in the 2025 V8 changes; neither 2026 set has an after-birth indicator | Pitch script, speaker notes, deck text, Q&A pack, handoff, README | A DoH judge can see it is wrong; the buying argument rests on it | P0 | Reworded as historical; payment argument rests on completed follow-ups | Krishna | grep for "scorecard", "measures clinics on", "every quarter" in those files returns nothing | in review (PR 1) |
| 2 | Same claim in the app: `admin.pc008*`, `clinic.gapPc008`, `clinicAdmin.*`, `tour.steps.network.body`, `pricing.who.insurers.body`, `pilot.assumptions`, `pilotProposal.*`, `knowledge_base` summary "report quality indicators every quarter" | Same source | `/admin`, `/clinic`, `/clinic-admin`, `/pricing`, `/pilot`, judge tour | Same, on the live product | P0 | Display text only; keys and code identifiers stay | Krishna (G2) | Unit, e2e and a new test that fails if the text says PC008 is current | planned (PR 2) |
| 3 | `/pilot` chains rates from different populations and windows into "tests expected to show raised blood sugar" and an AED value; the pitch says "18 per 1,000" | `apps/web/src/lib/pilot-roi.ts`: births × 21.3% × (target − 25.4%) × 34.5% × cost | `/pilot`, speaker notes, docs/27, Q&A pack 16 | Presents a model as an outcome | P0 | Pitch text fixed now; calculator becomes eligible women, completion today, assumed target, extra completed follow-ups | Krishna | `pilot-roi.test.ts`, `e2e/pilot.spec.ts` rewritten | pitch text in review (PR 1); calculator planned (PR 2) |
| 4 | The Al Ain figure used without its limits | Agarwal 2022: one hospital, 2013 to 2014 data, 4 to 6 week window | Speaker notes, docs/27, README, handoff | Reads as today's Abu Dhabi baseline | P1 | Limits added wherever it is quoted | Krishna | Read-through | in review (PR 1) |
| 5 | A booking is narrated and counted next to completion: "One tap. Booked." then "the network sees these follow-ups close"; the funnel stage "Contacted / booked" includes closed | `pitch/speaker_notes.js` demo steps 5 and 6; `backend/app/api/admin.py` funnel | Demo, `/admin` | A booking is not a completed test | P1 | Narration fixed now. Product change: evidence levels and separate counts | Krishna (G2) | New status-transition and metrics tests | narration in review (PR 1); product planned (PR 3, after the pitch) |
| 6 | Competitor and partner wording too strong: "trackers log and predict", "Sahatna has no cycle or women's-health tracking", "plug into it through Malaffi and FHIR" | Flo's symptom checkers, Sahatna Space maternity features, Malaffi AI summaries (claims register) | docs/27 Q14b and Q15, handoff, Q&A pack, README comparison tables | Wrong in front of DoH and PureHealth judges | P0 | Rewritten around our narrow specialty; FHIR export never called an integration | Krishna | Read-through | in review (PR 1) |
| 7 | "The AI only rewords / only does language" | The model also extracts fields from voice and lab photos and gives a second safety classification | README, speaker notes, docs/27, Q&A pack | Understates what the model does | P1 | Accurate three-part description | Krishna | Read-through | in review (PR 1) |
| 8 | The EPDS questionnaire and the after-birth glucose test described as "DoH postnatal steps" | DoH Postnatal Care Program Standard (May 2025) names neither; it asks for depression screening | docs/27 theme table, Q&A pack, app postnatal step copy and its source ids | A sourcing error in health text | P1 | Pitch text fixed now; each postnatal step in the app checked against the standard | Clinical reviewer, Krishna (G2) | Source ids per step match what the source says | pitch text in review (PR 1); app check planned |
| 9 | With the model unavailable, chat safety falls back to word checks (crisis 11 of 30 on the held-out set) with no notice to her | `backend/app/ai/eval_results.json`; router fallback | Assistant | A weaker safety path, silently | P1 | A limited mode that says so, keeps rule-based urgent handling and the 998 strip | Krishna (G2) | New tests on the development set; held-out set stays frozen | planned (PR 4, after the pitch) |

## 2. Verified behaviour (checked today on the live site or in tests)

- Demo path end to end: her patterns with evidence, report, clinician view, follow-up booking, clinic network.
- English and Arabic at phone width with no sideways scroll on the screens tested (`e2e`).
- Counts-only network view, groups under 10 hidden, including by subtraction (`tests/test_population_view.py`).
- A clinician's session is refused the network numbers (403).
- About 900 server tests and 39 browser test files pass in CI on `main`.

## 3. Claims in the README or pitch not yet verified by anyone outside the team

- Every clinical rule (no clinician sign-off yet): `docs/safety/RULE_SIGNOFF.md`.
- The Arabic (no native review yet): `docs/AR_REVIEW.md`.
- "AI off sends nothing to a model": covered by tests that read the code path, not yet by watching outbound traffic.
- Row-level security: tested through the API's database role; not yet tested for background jobs separately.

## 4. Proposed improvements (not started)

- Completion evidence: due, contacted, booked, patient-reported, verified (test date, reference, verifier, time, audit
  entry), clinician-reviewed; and declined, deferred, cancelled, duplicate, lost to follow-up. None of the last five
  counts as success. Measures show numerator, denominator, window and "not yet observable".
- Ask once about hormonal contraception, medicines and thyroid conditions (changes when a rule fires: needs the
  clinical advisor).
- Isolated demo sessions so two judges cannot change each other's records.
- A pilot protocol for about 20 adults with clinician-documented gestational diabetes, written with the partner clinic.

## 5. Missing approvals and access (real gates, not done)

| What | Who | Needed before |
| --- | --- | --- |
| Clinical sign-off of the rules and of health wording | A licensed clinician (being recruited) | Any real user |
| Native Arabic review | A native speaker | Any real user |
| Device classification | Emirates Drug Establishment | Any real user, any marketing claim about device status |
| Privacy impact assessment, UAE hosting, ADHICS gap assessment, penetration test | Legal and security review | Any real data |
| Ethics approval and a signed agreement with a pilot clinic | The clinic and its ethics committee | The pilot |
| The clinic's current quality framework | The pilot clinic | Any claim about a reporting indicator |
