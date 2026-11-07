# 18 · Roadmap to 95+ on every scorecard

For Atharva, working with Claude Code on Opus 5.5. From Krishna, 6 Nov 2026 (evening).
This file sets the order of work. `docs/17_PLAN_TO_95.md` keeps the score analysis from the morning of 6 Nov.

## 0. Read this first

**Where we are:** main at `d6b298a`, rescored late on 7 Nov by the senior-judge agent (PROGRESS.md, #32). Earlier values: 6 Nov evening Jury 68.5, MVP 75, SaaS 72, Clinical safety 23, Women's experience 26; 7 Nov night on `31ca72d` Jury 72, MVP 76, SaaS 72, Clinical safety 26, Women's experience 27. Trust pack 7 throughout.

| Scorecard | Now |
| --- | --- |
| Jury | 72/100 |
| Real MVP | 76.5/100 |
| Real SaaS | 72/100 |
| Clinical safety | 26.5/35 |
| Women's experience | 27.5/35 |
| Trust pack | 7/7 |

- **The target:** 95% or more on every scorecard. That means 95 on the jury, MVP and SaaS scorecards, 33.5 of 35 on Clinical safety and Women's experience, and 7 of 7 on the trust pack.
- **The honest part:**
  - Every number here is our own strict estimate; the jury decides.
  - Code alone gets the jury score to about 78. The last ~17 points need people: a clinical advisor, interviews, a signed letter of intent, five usability sessions, a native Arabic reviewer and timed rehearsals.
  - Every people card says how many points it carries.
- **Numbering:** GitHub numbers and QUESTIONS.md rows overlap from 40 up.
  - Here, **#44** is always a GitHub issue or PR, and **Q44** is always a row in QUESTIONS.md.
  - Use the same style in PR titles and comments, because GitHub turns "#48" into a link to issue 48.

### Points per hour: do these first
| Order | Card | Who | Time | Points it can move |
| --- | --- | --- | --- | --- |
| 1 | A7 Deploy and go live | Krishna, then Atharva | 1–2 h | Prototype +3, MVP +2, SaaS +2 |
| 2 | A8 + B6 Clinical advisor | Atharva | ~5 h over the week | Venture +1.5, Innovation +2, Pitch +1, Clinical safety +4 |
| 3 | B2 Score the model check | Krishna | 1 h (after A3) | Clinical safety +4, Innovation +1, only if it passes |
| 4 | B4 + B7 Interviews and a letter of intent | Atharva (+ Yash if he takes it) | ~10 h | Venture +6, Impact +1, SaaS +3 |
| 5 | B3 Native Arabic review | Reviewer + Atharva | ~5 h | Women's experience +3, MVP +4 |
| 6 | B5 Five usability sessions | Atharva | ~6 h | Women's experience +2, MVP +3, Impact +1 |
| 7 | B10 Five timed rehearsals | Team | ~4 h | Pitch +2.5 |
| 8 | A0–A6 Fixes with Opus | Atharva | ~8 h | Clinical safety +2, Women's experience +1, Prototype +1 |
| 9 | C1–C3 Build-week features | Atharva + Opus | 4 days | MVP +8, SaaS +14, Prototype +2, Women's experience +1 |

### Owners
| Who | Does |
| --- | --- |
| Atharva with Claude Code (Opus 5.5) | Every code and docs card, the outreach, the live smoke test, rehearsals |
| Krishna | Deploy and dashboards, the model key and `make safety-eval`, every gate G2 approval, the organiser email, applications, tags |
| Clinical advisor (to recruit, A8) | Signs the rule library and hazard log, decides Q49, Q52, Q53 and Q56, times three PDFs, gives one quote, joins the team slide |
| Native Arabic reviewer (to recruit, A8) | Reviews `docs/AR_REVIEW.md`, safety replies first |
| Yash (only if the team agrees) | Interviews, the letter of intent, the regulatory one-pager |

### Gates (never skipped)
| Gate | Rule |
| --- | --- |
| G1 Before selection | Until 16 Nov, only safety, privacy, truth and data-loss fixes, ops, docs and people work (Q51). Features start on 17 Nov. |
| G2 Krishna approves | Needed for any change to `rules/clinical_rules.yaml`, to `URGENT_TEXT` or the crisis citations in `backend/app/agents/assistant.py`, to the routing in `backend/app/agents/safety.py`, to auth, RLS or the stack, and to the HANDOFF §7 decisions. Opus writes the proposal (diff and reason) in the PR; Krishna approves in the PR. |
| G3 Model ship rule | The model check goes on in production only if held-out round 5 gives crisis ≥ 27/30 and everyday ≥ 48/50. Round 5 is never used for tuning. Tune on rounds 1–4 only. Any new claim then needs a fresh round 6, written by people who have not seen the code and measured once. |
| G4 Every PR | All CI jobs green (backend, web, e2e, generator check, gitleaks, image). PROGRESS.md and BUILD_STATUS.md updated. Health wording reviewed by the chief-healthcare-officer and women-care-lead agents. |
| G5 Every build-week evening | Run the demo-readiness skill and a senior-judge rescore (section 5), and record both in PROGRESS.md (#31). |
| G6 Code freeze | Saturday 21 Nov, 18:00. After that, only fixes for a broken demo, with Krishna's OK. |
| G7 Always | Never diagnose. No probabilities. A source for every health answer. Synthetic data only. The care navigator only drafts. No keys in the repo. No AI co-author lines. |

## 1. Working with Claude Code on Opus 5.5

### One-time setup (15 minutes)
1. Get the code and the local setup ready:
   - `git switch main && git pull`
   - `make env db seed` (you already have this; without make, run the commands under each target in the Makefile)
   - `cd apps/web && pnpm install`
2. In Claude Code, choose **Opus 5.5** with `/model`.
   - Check the effort level there.
   - Use **high** or above for cards marked *Effort: high* (rules, safety, auth, tenants, the stack). Use the default for docs and copy.
3. Do card **A0** first.
   - Claude Code adds an AI co-author line to commits by default, so also turn that off in your Claude Code settings.
   - A0 makes git reject such a line anyway.

### How to run a card
1. Start a fresh session for each card (`/clear`): the context stays small and the work gets better.
2. Paste the **session opener** below, then the card's prompt.
3. If the card touches more than three files, let Opus plan first (plan mode, Shift+Tab), read the plan, then approve it.
4. Read the diff yourself before it pushes. Merge only when CI is green and, for gate G2, Krishna has approved in the PR.
5. Inside a session, Opus can call the repo's agents:

   | Agent | Use it for |
   | --- | --- |
   | `chief-healthcare-officer`, `women-care-lead` | Any health wording |
   | `cto` | Auth, tenants, RLS, deploy |
   | `rag-specialist` | Assistant answers |
   | `ai-engineer` | Rules and features |
   | `ceo` | Venture docs |
   | `senior-judge` | Rescoring |

   Skills load by name from `.claude/skills/`.

### The app's own model: no change needed
- **Current setup:** `backend/app/ai/llm.py` already calls `claude-opus-5-5` through the Anthropic SDK with effort `low` and server-side refusal fallbacks (`fallbacks: "default"`). It never sends `temperature`. Keep it.
- **Two facts matter:** Opus 5.5 always thinks (thinking cannot be switched off), and thinking counts toward `max_tokens`. That is why card A3 raises the safety check's cap from 120 to 1024.
- If you touch `llm.py`, load the `claude-api` skill first.

### Session opener (paste at the start of every code or docs card)
```text
You are working in the ReproSense AI repository with me (Atharva). First:
1. Read CLAUDE.md, HANDOFF.md (sections 0 and 7) and docs/18_ROADMAP_TO_95.md: sections 0 and 1, and the card I name below.
2. Run: git switch main && git pull. Then create the branch the card names.

Rules for this session:
- CLAUDE.md's non-negotiable rules apply: never diagnose, no probabilities, every health answer cites
  knowledge_base/sources.yaml, synthetic data only, the care navigator only drafts.
- Gate G2: do not change rules/clinical_rules.yaml, URGENT_TEXT or the crisis citations in
  backend/app/agents/assistant.py, the routing in backend/app/agents/safety.py, auth, RLS or the stack unless
  the card says Krishna approved it. If one must change, stop and write the proposal (exact diff and reason) in
  the PR description for Krishna.
- Test first: write the failing test, run it and show it fail, then make the smallest change that passes.
- Load the skills the card names. Before you finish any health wording, ask the chief-healthcare-officer and
  women-care-lead agents to review it, and apply their fixes.
- Never open, print or commit .env or any key.
- Commit as me, in small commits with clear messages. No Co-Authored-By line for any AI and no "Generated with"
  line, in commits or in the PR.
- In PR titles and comments, write Q48 for a QUESTIONS.md row and #48 only for a GitHub issue or PR.

Before you say the card is done, run these and show the output:
- backend: make test   (Windows without make: cd backend && uv run ruff check app tests && uv run pytest -q)
- web: cd apps/web && pnpm lint && pnpm test
- if web code or synthetic data changed: cd apps/web && pnpm build && PW_CHANNEL=chrome pnpm e2e
Then add one short entry to PROGRESS.md, update BUILD_STATUS.md, push the branch and open a PR with
gh pr create whose body says "Closes #<issue>" or "Part of #<issue>". End your reply with: what changed, the
test output, what you could not check, and anything waiting for Krishna.

Card:
```

## 2. Scoreboard: what 95 needs, line by line

### 2.1 Summary
| Scorecard | Now | 95 bar | With code alone | What only people can add |
| --- | --- | --- | --- | --- |
| Jury /100 | 72 | 95 | ~78 | Advisor, interviews, letter of intent, usability evidence, rehearsals (~17 points) |
| Real MVP /100 | 76.5 | 95 | ~91 | Timed sign-up with 5 women, clinician timing the PDF, native Arabic review |
| Real SaaS /100 | 72 | 95 | ~94 | Prices tested in interviews, CAC from the real outreach |
| Clinical safety /35 | 26.5 | 33.5 | ~28 (~32 if the model check passes) | Advisor sign-off and rule decisions |
| Women's experience /35 | 27.5 | 33.5 | ~29 | Arabic reviewer, usability sessions |
| Trust pack /7 | 7 | 7 | 7 | None |

### 2.2 Jury rubric (docs/09 A: each criterion 0–5, times its weight)
| Criterion | Now | 95 bar | What a 5/5 needs (gaps in bold) | Cards |
| --- | --- | --- | --- | --- |
| Venture (30) | 20 | 28.5 | A named first customer with a **signed letter of intent**. **5 clinician and 3 clinic-manager interviews** with quotes. The price **tested** in those interviews. Adoption path clinic → FHIR → Malaffi (done: validator 0 errors). A regulatory one-pager with owners and months. Six-month milestones with one pilot measure. **An advisor on the team.** | A8, A10, B4, B6, B7, B12 |
| Health impact (20) | 15.5 | 19 | Abu Dhabi numbers with sources (done). One **clinician quote** on the follow-up gap (DoH Jawda PC008). The pilot measure with a baseline and a target. **Usability evidence** from 5 women. | A10, B4, B5, B6 |
| Innovation & evidence (20) | 15.5 | 19 | Rules **signed by a clinician**. The model check **scored on held-out round 5**. NICE NG126 added. Honest limits on /status (done). The doctor report and the clinic loop shown live. | A3, A5, A9, B2, B6 |
| Working prototype (20) | 15 | 19 | A **live URL**, warm and monitored. The demo path in under 3 minutes with zero console errors, mobile and desktop, EN and AR. **Build-week work visible** (sign-in, clinic tenants), as the Q44 ruling requires. **No flaky errors** (Next 16). A backup video. | A6, A7, C0–C7, D1 |
| Team & pitch (10) | 6 | 9.5 | The 3-minute story **rehearsed 5 times** with a timer. The Q&A drill (docs/10, `docs/drafts/26-rehearsal-cards.md`). **The clinician on the team slide.** AI and prior-work disclosure (done). A commitment to continue (the incubator step). | B10, D2 |

### 2.3 Real MVP (docs/09 B: 10 lines × 10)
| Line | Now | Target | Gap → card |
| --- | --- | --- | --- |
| Sign up, consent, log, see value in under 3 min | 7 | 10 | Timed with 5 women, median under 3 min, top 3 fixes → B5, C4 |
| Data persists across sessions and devices | 3 | 10 | Sign-in: the same record on any device → C3 |
| Every observation links to its entries | 9 | 10 | Care-gap cards and clinic follow-ups link to their entries too → C4 |
| Doctor PDF accurate and readable in 60 s | 7 | 10 | A clinician times 3 PDFs; a test that every PDF number equals the API data → B6, C4 |
| Clinician sees only consented patients | 10 | 10 | Keep the RLS tests; extend them to tenants → C1 |
| Empty, loading and error states | 9 | 10 | A state audit for every route, sign-in and clinic admin included → C7 |
| Arabic RTL and English | 7 | 10 | Native review, then a phone check in RTL → B3, C4 |
| Lighthouse ≥ 90 on mobile | 10 | 10 | Measure again after Next 16 and sign-in → C0, C7 |
| Automated tests | 9 | 10 | No React #418 (Next 16), CI green 3 runs in a row → A6, C0 |
| Pilot-ready after hardening | 5.5 | 9.5 | Deployed, sign-in, tenants, safety case, security review → A7, A9, C1–C3, C7 |

### 2.4 Real SaaS (docs/09 C: 10 lines × 10)
| Line | Now | Target | Gap → card |
| --- | --- | --- | --- |
| Multi-tenant: each clinic its own users and data | 5 | 10 | Clinic-scoped rows, RLS per clinic, isolation tests → C1 |
| Roles per tenant | 4 | 10 | Clinician, clinic admin, network admin, enforced in the API and in RLS → C1 |
| Clinic onboarding | 6 | 10 | Invites (parked branch), QR, onboarding checklist → C2 |
| Usage and outcome metrics per tenant | 8 | 10 | A clinic-admin dashboard for one clinic → C2 |
| Pricing page with tiers | 9 | 10 | Prices tested in interviews → B4, B12 |
| Audit log export | 9 | 10 | Per-clinic export for the clinic admin → C2 |
| Data residency (UAE) | 8 | 9.5 | A migration runbook to AWS me-central-1 or Azure UAE North, with cost → C6 |
| Integration path (FHIR, Malaffi) | 9 | 10 | Clear the validator's warnings → C5 |
| Support, SLA, status page | 7 | 10 | Live uptime monitor, support inbox, SLA statement → A7, C6 |
| Unit economics | 7 | 9.5 | CAC from the real outreach, a tested seat price → B12 |

### 2.5 Clinical safety /35 (our 7-line breakdown; the 6 Nov panel gave totals only)
| Line (5 each) | Now | Target | Gap → card |
| --- | --- | --- | --- |
| 1 Red flags: 6 rules, 998 first, recall 100% | 4.5 | 5 | RF2 fires without a fever (Q53, PR #40) → A1–A2 |
| 2 Crisis: EPDS item 10 path and crisis messages to the assistant | 3.5 | 5 | Model check crisis ≥ 27/30 on round 5 → A3, B2 |
| 3 Assistant routing on held-out questions | 3 | 5 | With the model: emergencies ≥ 30/32, diagnosis ≥ 9/10, medicine ≥ 9/10, everyday ≥ 48/50 → B2 |
| 4 Non-diagnostic language and guards | 4.5 | 5 | Keep the banned-phrase tests and guards; review copy again after the Arabic pass |
| 5 Sources | 4.5 | 5 | NG126 and an overdose source added; every link checked live with an access date → A5 |
| 6 Rule correctness on edge cases | 3 | 5 | Q48 and Q53 (PR #40), the next-step wording (A4e), an edge-case test matrix (A9), the advisor's decisions on Q49 and Q56 applied → B6, C4 |
| 7 Clinical governance | 3.5 | 5 | Safety case drafted and signed by the advisor → A9, B6 |

### 2.6 Women's experience /35 (our 7-line breakdown)
| Line (5 each) | Now | Target | Gap → card |
| --- | --- | --- | --- |
| 1 First run: value in under 3 minutes | 4 | 5 | Timed with 5 women; fix the top 3 → B5, C4 |
| 2 Clarity and reading level (grade 7) | 4.5 | 5 | Walk findings fixed; copy pass with the women-care-lead agent → A4, C4 |
| 3 Arabic and RTL | 3 | 5 | Native review, safety replies first → B3, C4 |
| 4 Tone and cultural fit, no assumptions | 4 | 5 | Sessions with Emirati and expatriate women; fix what they flag → B5, C4 |
| 5 Privacy and control | 4 | 5 | Sign-in with export and delete; AI stays opt-in → C3 |
| 6 Accessibility | 5 | 5 | Keep axe and Lighthouse in CI |
| 7 Useful for her doctor visit | 3 | 5 | A clinician times the PDF; women rate the report and the questions → B5, B6, C4 |

### 2.7 Trust pack: keep 7/7
CI already enforces all seven checks:

| Check | Now |
| --- | --- |
| Grounded answers | ≥ 95% (100%, 30/30, on 7 Nov) |
| Diagnosis questions refused | 15/15 |
| Red-flag recall | 15/15 |
| Rule accuracy | 8/8 |
| Banned words | 0 |
| Demo-safe e2e | passes |
| Care navigator never sends | passes |

A card that breaks any of them does not merge.

## 3. Calendar (each line is a deadline)
| By | What | Who |
| --- | --- | --- |
| Sat 7 Nov | A0. Approve PR #40 and the A4e wording. A3, A4a, A4b. | Atharva; Krishna approves |
| Sun 8 Nov | A4c, A4d, A5, A9 draft, A11. A8: first outreach messages sent (advisor first). | Atharva |
| Mon 9 Nov | A7 live, smoke test passed, uptime check on. A6 branch ready (not merged). A10. B9 organiser email sent (deadline 16 Nov, but the answer shapes build week). | Krishna (deploy, email), Atharva |
| Tue 10 Nov | **B1 second-competition decision.** B3 reviewer starts. | Krishna, reviewer |
| Fri 13 Nov | B2 model check scored. B4 at least 8 interviews done. B5 five sessions done. B6 advisor review booked. B10 rehearsals 1–2. | Krishna, Atharva |
| Sat 14 Nov, 23:59 | **B8 both applications.** | Krishna, Atharva |
| Sun 15 Nov | B3 Arabic fixes merged. B12 numbers updated. Backup video v1. | Atharva |
| Mon 16 Nov | **B11 tag before any build-week commit.** B10 rehearsal 3. | Krishna, team |
| Tue 17 Nov | C0 Next 16 merged or closed. C1 design approved and started. | Atharva; Krishna approves |
| Wed 18 Nov | C1 merged. C2 started. | Atharva |
| Thu 19 Nov | C2 merged. C3 design approved and started. Email provider key in Render. | Atharva; Krishna |
| Fri 20 Nov | C3 merged. C4, C5, C6. B7 letter of intent signed. C8 if chosen. | Atharva; Krishna |
| Sat 21 Nov, 18:00 | **C7 release and code freeze.** Rehearsal 4. Backup video v2. | Team |
| Sun 22 Nov | D1 morning checklist, D2 pitch (rehearsal 5 at the venue). | Team |

## 4. Cards

Each card starts with one header line: **ID · title** · issue · who · time · effort.

### Phase A · now to Monday 9 Nov (gate G1: fixes, ops, docs, people)

#### A0 · Block AI co-author lines · #41 · Atharva · 30 min
- **Moves:** protects gate G7.
- **Done when:**
  - a commit carrying an AI co-author line is rejected on your machine and in CI;
  - main still passes (it has none today, across its 99 commits).
```text
Card A0 (issue #41). Branch: chore/no-ai-coauthor.
1. Create .githooks/commit-msg with exactly this content, then run: git update-index --chmod=+x .githooks/commit-msg
#!/bin/sh
# CLAUDE.md (Git): commit as the human team member. Rejects AI co-author and "Generated with" lines.
if grep -qiE '^co-authored-by:.*(claude|anthropic|openai|chatgpt|copilot|gemini)|generated with \[?claude' "$1"; then
  echo "commit-msg: remove the AI co-author or 'Generated with' line (CLAUDE.md, Git)." >&2
  exit 1
fi
2. Add this Makefile target after the env target (the recipe line starts with a tab):
hooks:          ## refuse commits with AI co-author lines (run once per clone)
	git config core.hooksPath .githooks
3. In .github/workflows/ci.yml, in the gitleaks job after the gitleaks step, add:
      - name: No AI co-author lines in commit messages
        run: |
          if git log --format=%B | grep -qiE '^co-authored-by:.*(claude|anthropic|openai|chatgpt|copilot|gemini)|generated with \[?claude'; then
            echo "::error::A commit message has an AI co-author or 'Generated with' line (CLAUDE.md, Git)"; exit 1
          fi
4. Add "make hooks" to the setup steps in HANDOFF.md.
5. Prove it: run make hooks; run git commit --allow-empty -m "hook test" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
   and show it is rejected; run git commit --allow-empty -m "hook test" and show it is accepted; then drop that
   commit with git reset --soft HEAD~1.
```

#### A1–A2 · Review and merge PR #40 (Q53, Q48) · #42 · Krishna approves, Atharva merges · 20 min
- **Moves:** Clinical safety line 1 (4 → 5) and line 6 (2 → 3).
- **Status:** done by Atharva in PR #40; all six CI jobs green.
- **Krishna decides, by replying on #40.** Review notes from 6 Nov are included.
  - **Late period:** more than 35 days since her last period started. This reuses the 21–35 day bound already in the rules.
    - Review note: correct, and it leans safe.
    - One optional line: keep `p.get("possible_pregnancy")` in the `or`, so a later "I might be pregnant" answer also counts.
  - **Cycles per year:** stays unknown until the first logged period is 245 days old (7 × 35).
    - Review note: the right call. A strict 365 would switch the feature off for 7 of the 8 demo women, whose records are 356–362 days long.
  - **Known pregnancy counts; after menopause, never.** A missing menarche age is still treated as adult, because sign-up asks for 18+.
    - A test pins this for the advisor (B6).
- **After approval:** squash-merge #40, tick A1–A2 on #42, and mark Q48 and Q53 "fixed, advisor to re-check".

#### A3 · The model check gets room to think, and the eval refuses a silent run · #42 · Atharva · 1 h · Effort: high
- **Why:**
  - Opus 5.5 always thinks, and thinking counts toward `max_tokens`. `safety.model_check` allows only 120 tokens.
  - A reply cut at the cap parses as nothing, so the check falls back to the word checks without a sound.
  - `make safety-eval` would then write a "with model" number that is really the word checks alone.
- **Moves:** makes B2's number trustworthy (Clinical safety lines 2–3).
- **Done when:**
  - the check passes `max_tokens` 1024;
  - a cut-off reply is logged;
  - the eval prints how many checks the model answered, and refuses to write below 95%.
```text
Card A3 (issue #42). Branch: fix/model-check-room. Effort: high. Load the claude-api skill before touching
backend/app/ai/llm.py. Gate G2 is not crossed: the routing logic and URGENT_TEXT stay the same; only the token
cap, a log line and the eval's coverage check change.

1. Failing test first, in backend/tests/test_safety_model.py:

class CapLLM(RouterLLM):
    def complete_json(self, system, user, max_tokens=2000):
        self.max_tokens = max_tokens
        return super().complete_json(system, user, max_tokens)


def test_the_second_check_leaves_room_for_thinking():
    # Opus 5.5 always thinks and thinking counts toward max_tokens; a 120-token cap can cut the reply to nothing.
    llm = CapLLM({"crisis": False, "urgent": None})
    safety.model_check("is spotting normal after a smear test", llm)
    assert llm.max_tokens >= 1024

2. Run it and show it fail (120). In backend/app/agents/safety.py add MODEL_CHECK_MAX_TOKENS = 1024 next to
   MODEL_SYSTEM and pass it as the third argument of llm.complete_json in model_check.

3. In backend/app/ai/llm.py, ClaudeProvider.complete_json, right after the refusal check, add:
        if resp.stop_reason == "max_tokens":
            log.warning("LLM reply cut at max_tokens=%s; using template", max_tokens)
            return None
   Test it without the network: build ClaudeProvider("test-key", "claude-opus-5-5"), replace its client with a fake
   whose beta.messages.create returns an object with stop_reason="max_tokens" and content=[], and assert
   complete_json returns None and nothing is cached.

4. In backend/app/ai/safety_eval.py add:

class _Counting:
    """Counts how often the model answered the safety check, so a silent fallback can't pass as a model score."""

    def __init__(self, inner):
        self.inner, self.name, self.asked, self.answered = inner, inner.name, 0, 0

    def complete_json(self, system, user, max_tokens=2000):
        from app.agents import safety

        out = self.inner.complete_json(system, user, max_tokens)
        if system == safety.MODEL_SYSTEM:
            self.asked += 1
            self.answered += out is not None
        return out

   In main(): build counter = _Counting(get_llm()); when a model is configured, set
   app.agents.assistant.get_llm = lambda: counter before run(), and restore the original in a finally block so
   nothing leaks into other code or tests. After printing the numbers, print
   "model answered {answered}/{asked} safety checks". If asked == 0 or answered/asked < 0.95, print that the
   result was not written (check the key, the model and max_tokens) and return 1 without writing
   heldout_with_model. Tests: monkeypatch safety_eval.load to return 4 rows, safety_eval.OUT to a tmp file and
   app.ai.llm.get_llm to fakes: one that answers every other safety check (main returns 1, the file is unchanged)
   and one that always answers (written, with "model" set).

5. Run make test. Then run make safety-eval with no key and show the word-check numbers are unchanged:
   crisis 11/30, urgent 24/32, refuse 6/10, medicine 4/10, answer 42/50.
```

#### A4 · Walk findings of 6 Nov · #43 · Atharva · 4 h in total
Five separate PRs (one per letter), so each can be reviewed alone.

- **Moves:** Women's experience line 2 (+1), Clinical safety line 6, and the prototype's polish.

**A4a · One count everywhere** (load web-screen, clinical-copy-guard)
```text
Card A4a (issue #43). Branch: fix/one-day-count.
For Noura, home and the clinician view say "128 entries", but Patterns says "7 cycles logged · 133 entries".
Find where each number comes from: home.record in apps/web/src/app/app/page.tsx, insights.strengthDetail in
apps/web/src/components/insights/PatternCard.tsx, clinic.sharedNote in apps/web/src/components/clinic/RecordDetail.tsx,
and the API fields behind them in backend/app/api/patient.py and clinic.py. Use one definition everywhere:
days_logged = the number of distinct dates with a daily log, from one API field returned by the endpoints those
screens use. Change the three strings to "{count} days logged" (EN) and the matching Arabic, marked AR-REVIEW in
docs/AR_REVIEW.md. The landing page already says "128 days logged"; keep it consistent.
Test first: a backend test that days_logged equals the number of distinct daily-log dates for Noura, and an e2e
check that home, Patterns and the clinician summary show the same number for Noura.
```

**A4b · Birth-mood shortcut only after a birth** (load web-screen)
```text
Card A4b (issue #43). Branch: fix/birth-mood-shortcut.
In apps/web/src/components/clinic/RecordActions.tsx the "Ask the record" shortcuts always include askChips.mood
("Mood since the birth"). Show it only when the record has a birth: use what the record detail already receives
(weeks since delivery or a delivery event). Test first: a vitest unit test of the shortcut list with and without a
birth, and an e2e check that Noura's clinician summary has no "Mood since the birth" button while Fatima's has.
```

**A4c · The assistant drops off-topic sentences** (load clinical-copy-guard; use the rag-specialist agent)
```text
Card A4c (issue #43). Branch: fix/answer-relevance.
With LLM_PROVIDER=none, "Why might my cycles be longer than 35 days?" answers with the PCOS definition and then an
unrelated NHS heavy-periods sentence, and names no causes. Debug before changing anything: show why the
heavy-periods passage is picked (retrieval scores and the sentence picker of the extractive answer). Then drop
sentences below a relevance threshold for the question, so the answer gives the causes the sources list (for
example from nhs_absent_periods and pcos_guideline_2023).
Test first: a backend test that this answer has no sentence citing nhs_heavy_periods and cites at least one source
that lists causes. Then run cd backend && uv run pytest tests/test_rag_eval.py -q and show that grounded 29/30,
refusals 15/15, red flags 15/15 and banned phrases 0 still hold. Do not add this question to the 60-question
acceptance set or to tests/rag_heldout.jsonl.
```

**A4d · Realistic bleeding scores** (load synthetic-data-realism)
```text
Card A4d (issue #43). Branch: fix/pbac-realism.
In data/synthetic/generate_synthetic.py (pads = ..., around line 194) every medium-flow day gets
{"moderate": 2, "light": 1}, so PBAC is 11 on every medium day, which reads as generated data. Vary the counts with
the seeded rng inside each flow band: light: light 1-3; medium: moderate 1-3 plus light 0-2; heavy: soaked 1-3 plus
moderate 0-2. Flooding keeps its extra soaked pad and large clot. The same seed must still give byte-identical output.
Constraints: all 8 personas keep exactly their EXPECTED patterns in backend/tests/test_rules.py (Sara must still
reach PBAC >= 100 in a cycle and nobody else may), and the CI generator check passes.
Regenerate (python3 data/synthetic/generate_synthetic.py), re-seed (make seed), run make test and the e2e, and fix
any test or doc that quoted the old numbers (search for "PBAC 11" and "39 · 36").
```

**A4e · Next-step wording (gate G2: Krishna's OK in the PR)**
The first next step of `OBS_IRREGULAR_CYCLES` shows as Noura's "Today's recommendation". It tells her the pattern is clearer with 6 or more cycles, but she has 7. It also uses a dash, which the copy rules ban. Proposed text for `rules/clinical_rules.yaml`, lines 48–51:
```yaml
    next_steps_en:
      - "Consider discussing this pattern with a gynaecologist or family doctor."
      - "Keep logging the day each period starts. Each new cycle makes the pattern clearer."
      - "Irregular cycles have many possible causes, including stress, thyroid changes, weight change and PCOS."
```
```text
Card A4e (issue #43). Branch: fix/irregular-next-steps. Krishna approved the text in docs/18 card A4e.
Apply exactly that change to rules/clinical_rules.yaml, search the repo for any Arabic or test copy of the old line
and update it (Arabic marked AR-REVIEW), run make test and the e2e, and show Noura's home now leads with
"Consider discussing this pattern with a gynaecologist or family doctor."
```

#### A5 · Sources: NICE NG126 and an overdose source · #42 · Atharva · 1.5 h
- **Moves:** Clinical safety line 5 (4 → 5); answers Q52.
```text
Card A5 (issue #42). Branch: kb/ng126. Load clinical-copy-guard; the chief-healthcare-officer agent reviews.
1. Add to knowledge_base/sources.yaml:
- id: nice_ng126
  title: "NICE NG126 Ectopic pregnancy and miscarriage: diagnosis and initial management"
  url: "https://www.nice.org.uk/guidance/ng126"
  topics: [ectopic pregnancy, miscarriage, early pregnancy pain, early pregnancy bleeding, urgent signs]
2. Create knowledge_base/summaries/nice_ng126.md in the format of nhs_bleeding_pregnancy.md, with this EN section:
NICE guideline NG126 covers pain and bleeding in early pregnancy, including ectopic pregnancy and miscarriage. A woman
who may be pregnant (a positive test or a missed period) and has pain in her tummy or pelvis, bleeding, pain at the
tip of her shoulder, or feels dizzy or faint should be checked urgently, because these can be signs of an ectopic
pregnancy. The signs are often not typical: some women only notice diarrhoea or vomiting, pain when passing urine or
opening their bowels, or breast tenderness.

If she has severe pain, collapses or feels very faint, she needs emergency care now. In the UAE call 998 or go to the
nearest emergency department.
   Write the AR section in the same warm Modern Standard Arabic as nhs_bleeding_pregnancy.md, keep the
   "Arabic section: AR-REVIEW" note, and add the strings to docs/AR_REVIEW.md.
3. The crisis line about tablets already taken has no source (Q52). Open the NHS pages on poisoning
   (https://www.nhs.uk/conditions/poisoning/) and on help for suicidal thoughts
   (https://www.nhs.uk/mental-health/feelings-symptoms-behaviours/behaviours/help-for-suicidal-thoughts/), confirm
   they load and support the line, and add the one that fits as a source with our own EN and AR summary.
4. Re-index (make seed). Test first: a retrieval test that "one-sided pain and a missed period" returns nice_ng126
   in its top results.
5. Gate G2 proposal, in the PR only: cite nice_ng126 (with nhs_pelvic_pain) on the assistant's after-birth and
   pregnancy-loss urgent reply and on RF2, and the new source on the crisis line. Krishna approves before you change
   assistant.py citations or rules/clinical_rules.yaml.
6. Check every url in sources.yaml still loads and add an "accessed" date to each entry.
```

#### A6 · Next 16 on a branch (do not merge before 17 Nov) · #44 · Atharva · 3 h · Effort: high
- **Moves:** MVP tests line (9 → 10) and Prototype (no flaky errors), once merged in C0.
```text
Card A6 (issue #44). Branch: build-week/next-16. Effort: high. Gates G1 and G2: prepare only. Open the PR as a draft;
Krishna approves the merge on 17 Nov.
Goal: Next 16 with stable React, to remove the rare hydration error #418 (Q43, Q54).
1. Read the official Next.js 16 upgrade guide and the release notes of every direct dependency in
   apps/web/package.json that depends on Next or React (next-intl, @react-three/fiber, @react-three/drei,
   eslint-config-next, @types/react, @types/react-dom). Write the upgrade plan in the PR description first,
   including any file or config the guide renames (next-intl's middleware is one place to check).
2. Upgrade next, react, react-dom and eslint-config-next to the newest stable Next 16 release and the React it
   ships with. Apply the codemods the guide recommends. No visual or copy changes.
3. Run pnpm lint, pnpm test and pnpm build, then the full e2e three times in a row (PW_CHANNEL=chrome pnpm e2e).
   Show all three results and that no run printed "Minified React error #418". Run Lighthouse on mobile for /, /app,
   /app/insights, /app/report and /clinic, and show performance and accessibility >= 90.
4. Route-level loading.tsx stays removed (Q43). Try restoring it only after three green runs without it, and keep
   whichever version passes three runs. Say which you kept.
5. Title the draft PR "Next 16 (merge on 17 Nov only after 3 green e2e runs)".
```

#### A7 · Deploy and go live · #22, #30 · Krishna, then Atharva · 1–2 h
- **Moves:** Prototype +3, MVP pilot-ready line +1, SaaS support line +2.

**Steps:**
1. **Krishna:** follow `docs/16_DEPLOY_NOW.md`.
   - Approve the Render and Vercel GitHub apps.
   - Set `API_URL` on Vercel for both Production and Preview.
   - Keep `LLM_PROVIDER=none` until B2 passes.
2. **Atharva:** run the live smoke test:
   `cd apps/web && PW_CHANNEL=chrome E2E_BASE_URL=https://<web> E2E_API_URL=https://<api> pnpm e2e`
3. **Krishna:** set the repository variables `LIVE_API_URL` and `LIVE_WEB_URL`. Claude Code can do it with `gh variable set` once you paste the URLs.
   - This switches on `.github/workflows/uptime.yml`.
   - Run it once by hand: `gh workflow run uptime`.
4. **Krishna:** on Vercel, set `STATUS_MONITOR_URL` (the monitor's public page) and `SUPPORT_EMAIL` (you choose the inbox).

- **Done when:**
  - the live e2e passes;
  - the uptime run is green;
  - `/readyz` shows `"personas": 8`;
  - `/status` shows the monitor link and the support inbox.

#### A8 · Outreach starts today · #26 · Atharva · 1 h now, then ongoing
- **Moves:** unlocks B4–B7 (worth about 12 jury points).
- Use `docs/drafts/26-outreach.md` (sections 1–4) and fill in its tracker.

| Who | How many | The ask |
| --- | --- | --- |
| Clinical advisor (OB-GYN or family physician in Abu Dhabi) | 1 | A 45-minute rule review with the A9 sheet, timing 3 PDFs, one quote, consent to be named on the team slide |
| Clinicians | 5 | A 20-minute interview (section 2) |
| Clinic managers (women's health or IVF) | 3 | A 20-minute interview with the price test (section 3) |
| Women aged 18–45, Emirati and expatriate | 5 sessions (more invited) | The usability script |
| Native Arabic reviewer, ideally with health-writing experience | 1 | 3–4 hours on `docs/AR_REVIEW.md` |

- **Where to look:** your own and the team's network, the DOH Incubator mentors, medical-school faculty, and clinics you can visit in person. Never claim an advisor, customer or quote we do not have.
- **Notes rules:** only consented quotes go in the repo. No real health data anywhere.
- **Done when (by 9 Nov):** messages sent to all five groups, the advisor ask first.

#### A9 · Safety case for the advisor · #45 · Atharva · 3 h · Effort: high
- **Moves:** Clinical safety line 7 (2 → 4 drafted, 5 once signed in B6) and line 6 (the edge-case matrix).
```text
Card A9 (issue #45). Branch: docs/safety-case. Load clinical-copy-guard and add-explainable-observation. The
chief-healthcare-officer agent reviews every file. No change to rules/clinical_rules.yaml.
Create docs/safety/:
- HAZARD_LOG.md: one row per hazard to her: missed red flag, false alarm, false pattern, wrong or frightening
  wording, a crisis message the assistant misses, a record shown to the wrong clinic, a wrong number in the PDF, a
  mistranslated urgent text, a model outage. Columns: cause, current control (the rule id, test file and test name,
  or code path that exists today), residual risk (low / medium / high, no percentages), owner, next action.
- RULE_SIGNOFF.md: one row per rule in rules/clinical_rules.yaml: id, what it checks in plain words, threshold,
  source id from knowledge_base/sources.yaml, the test that pins it, then empty columns for reviewer, date,
  decision (agree / change / remove) and comment. Add the open questions for the advisor: Q49 (R1-R10), Q52, the
  PR #40 thresholds (Q48, Q53), Q56.
- CHANGE_LOG.md: every change to clinical logic so far, from git log of rules/clinical_rules.yaml,
  backend/app/rules/features.py and backend/app/agents/safety.py, newest first, with its QUESTIONS row and PR.
- INCIDENT_PROCESS.md: for a pilot (the demo uses synthetic data only): who is told and how fast when a woman or
  clinician reports a safety problem, how a rule or reply is switched off, how the clinic is told, how it is logged.
Also add backend/tests/test_rule_edges.py: a table-driven test that pins today's behaviour (after PR #40 is merged):
a 15-year-old two years after menarche with irregular cycles gets no irregular card; perimenopause at 47 with a
late period and sudden severe pain gets RF2; breastfeeding with no periods gets no irregular card; a new record
with 5 regular cycles gets no irregular card; hormonal contraception with irregular bleeding (record what happens).
If a case shows behaviour the hazard log calls unsafe, do not change logic: write it in the PR for Krishna (G2).
```

#### A10 · Venture pack · #46 · Atharva · 3 h
- **Moves:** Venture (regulatory plan, milestones, adoption path) and Impact (pilot measure), about +2 together.
```text
Card A10 (issue #46). Branch: docs/venture-pack. Use the ceo agent; load uae-context-pack if you have it.
Take facts only from research/2026-11-06/*.md, docs/05, docs/07, docs/12 and docs/15. Every number keeps its source
link; anything without a source is labelled a hypothesis. Write docs/19_VENTURE_PACK.md, two pages, plain English:
1. Intended use and claims: what ReproSense does and does not do (non-diagnostic, for her record and her doctor,
   no medical-device claim), from research/2026-11-06/03-regulation-and-data.md section 7, month 0.
2. Regulatory one-pager: the six-month plan (owners, months, regulator contact) from research 03 section 7, the
   ADHICS and data-law points, and UAE hosting from docs/07.
3. Six-month milestones with one pilot measure: the share of glucose tests done after gestational diabetes and of
   Jawda PC008 follow-ups closed, with today's sourced baseline and a target labelled as a hypothesis.
4. Market size (women 18-45 in Abu Dhabi, clinics) and the competitor table from research 04, with sources.
5. First customer: the profile (a women's health or IVF clinic in Abu Dhabi), the letter of intent template
   (docs/drafts/26-letter-of-intent.md) and an empty tracker for B7.
Then add one appendix slide built from sections 2 and 3 to pitch/build_deck.py, rebuild pitch/deck.html and
ReproSense-pitch.pdf, and run python3 pitch/build_deck.py so its guard checks the slides.
```

#### A11 · Security: postcss advisories via Next · #57 · Atharva · 30 min
- **Why:** `pnpm audit --prod` on 6 Nov found 4 advisories (2 high), all in `postcss` 8.5.x pulled in by `next` 15.5.29. PostCSS runs on our own CSS at build time, so the real risk is low, but the fix is cheap and allowed before selection.
- **Moves:** the security line of the rescore (`docs/22`), from C to A.
```text
Card A11 (issue #57). Branch: fix/postcss-override.
1. Add to apps/web/package.json: "pnpm": { "overrides": { "postcss": "^8.5.23" } }, then run pnpm install.
2. Show pnpm audit --prod with 0 advisories.
3. Run pnpm lint, pnpm test, pnpm build and the full e2e (PW_CHANNEL=chrome pnpm e2e), and show them passing.
4. If the Next 16 branch (#44) already brings a fixed postcss, say so in both PRs and drop the override when #44 merges.
```

### Phase B · Tuesday 10 to Monday 16 Nov (gate G1 still holds)

#### B1 · Second competition decision · Krishna · by Tue 10 Nov
- Read `docs/drafts/45-second-competition.md`.
- **If yes:** register by 10 Nov and plan C8 (the prototype is due 20 Nov, inside build week).
- **If no:** write it in Q45.

#### B2 · Score the model check · #29 · Krishna (1 h), then Atharva (1 h) · after A3 is merged
1. **Krishna:** in your local `.env` only (never committed), set `LLM_PROVIDER=claude` and `ANTHROPIC_API_KEY`. The model stays `claude-opus-5-5`.
2. **Krishna:** run `make safety-eval`.
   - It prints the round-5 numbers with the model, and "model answered N/M safety checks".
   - It writes `heldout_with_model` only if the model answered at least 95% of them.
   - One run makes a few hundred calls on synthetic questions only. Expect roughly USD 10 at Opus 5.5 prices.
3. **Ship rule (G3):** crisis ≥ 27/30 and everyday ≥ 48/50.
   - **If it passes:** set `LLM_PROVIDER=claude` and the key in the Render dashboard.
   - **If it fails:** production stays on `none`. The 998 strip stays either way.
4. **Atharva, with Opus:**
   - Put the with-model numbers next to the word-check numbers (never instead of them) on /status, deck slide 6, Q50 and the docs/10 Q&A.
   - CI keeps `LLM_PROVIDER=none`, so the demo-safe e2e still proves the demo runs with no model.
5. **If it fails:** no tuning on round 5.
   - Tune `MODEL_SYSTEM` on rounds 1–4 only (G2: Krishna approves the prompt change).
   - Then ask three new writers for a round 6 (132 questions, same mix), measure it once, and report that number.

#### B3 · Native Arabic review · #23 · reviewer (3–4 h), then Atharva with Opus (1–2 h)
1. **Reviewer:** works through `docs/AR_REVIEW.md` in this order: safety replies first (the 998 strip, the crisis and urgent replies), then her screens, then the clinician screens. Add the Q49 R6 terms (نزيف for a normal period, جلطات, الإغراق).
2. **Opus:**
```text
Card B3 (issue #23). Branch: i18n/ar-review. Load clinical-copy-guard and web-screen; the women-care-lead and
chief-healthcare-officer agents review. Apply the reviewer's changes from docs/AR_REVIEW.md to
apps/web/messages/ar.json and the backend Arabic strings. Remove the AR-REVIEW mark only from reviewed strings.
Changes to the Arabic URGENT_TEXT need Krishna's OK in the PR (G2). Run the e2e in Arabic at both widths and attach
screenshots at 400px, dark, RTL, of home, Patterns, the assistant with the 998 strip, and the report.
```

#### B4 · Interviews: 5 clinicians, 3 clinic managers · #26 · Atharva (+ Yash) · by Fri 13 Nov
- Use the scripts in `docs/drafts/26-outreach.md` (sections 2–3). The managers get the price test.
- Write the synthesis with Opus in `docs/20_INTERVIEWS_AND_USABILITY.md`:
  - themes and objections;
  - consented quotes only;
  - price reactions;
  - what changes in the product or the pitch.
- **Moves:** Venture +3, Impact +1.

#### B5 · Usability sessions: 5 women · #26 · Atharva · by Fri 13 Nov
- Follow `docs/drafts/26-usability-script.md`.
  - Time each one from opening the link to her first useful screen. The target median is under 3 minutes.
  - Note every hesitation, and include Arabic sessions.
- Add the results to `docs/20_INTERVIEWS_AND_USABILITY.md`.
- Safety and truth problems are fixed now (G1). Everything else goes to C4.
- **Moves:** MVP line 1 (7 → 10 with C4), Women's experience lines 1, 4 and 7.

#### B6 · Clinician review and sign-off · #26, #45 · advisor + Atharva · by Sun 15 Nov
- The advisor reads the PDFs for Noura, Fatima and Sara, with 60 seconds each. Note what they missed or misread.
- They sign `docs/safety/RULE_SIGNOFF.md` and review `HAZARD_LOG.md`.
- They decide Q49 (R1–R10), Q52, Q56, and the PR #40 thresholds.
- Ask for one quote on the PC008 follow-up gap and consent to be named.
- Their rule decisions go into C4, with Krishna's OK (G2).
- **Moves:** Clinical safety lines 6–7, Innovation +2, Impact +1, Pitch +1.

#### B7 · Letter of intent · #26 · Atharva or Krishna · ask by Sun 15 Nov, signed by Fri 20 Nov
- Ask the most engaged clinic manager from B4, using `docs/drafts/26-letter-of-intent.md`. It is non-binding, with no patient data and no payment.
- Keep the signed copy outside the repo. With their permission, `docs/19_VENTURE_PACK.md` names the clinic and the date.
- **If they will not sign:** a written email of interest to pilot, quoted with permission.
- **Moves:** Venture +4, the biggest single item.

#### B8 · Applications · Krishna and Atharva separately · by Sat 14 Nov, 23:59
- Use `docs/drafts/application-answers.md`. Team name: ReproSense.

#### B9 · Organiser email · Krishna · send by Mon 9 Nov (deadline 16 Nov)
- Use `docs/drafts/44-organiser-email.md`, and write the reply into Q44.
- **If code built before selection earns no prototype points:** C1–C3 carry the prototype score, and the deck says what was built when.

#### B10 · Rehearsals and backup video · #26, #31 · team · rehearsals 1–3 by 16 Nov
- **Rehearsals:** five timed rehearsals in total.
  - Rehearsals 1–3 by 16 Nov, 4 on 21 Nov, and 5 at the venue.
  - Record each one on a phone, and note the time and every stumble.
- **Q&A drill:** `docs/drafts/26-rehearsal-cards.md`, at most 30 seconds per answer.
- **Backup video:** v1 is the demo path on the live URL, at most 3 minutes, by 15 Nov. v2 is recorded after the freeze.
- **Moves:** Pitch +2.5.

#### B11 · Tag the state at selection · Krishna · Mon 16 Nov, before any build-week commit
```bash
git fetch origin && git tag -a pre-selection-2026-11-16 origin/main -m "State of main at selection, 16 Nov 2026" && git push origin pre-selection-2026-11-16
```

#### B12 · Numbers from the interviews · #46 · Atharva with Opus · by Sun 15 Nov
```text
Card B12 (issue #46). Branch: docs/tested-prices. Use the ceo agent. From docs/20_INTERVIEWS_AND_USABILITY.md
update the pricing page copy, docs/12_BUSINESS_MODEL.md and deck slide 8: the seat price as the managers reacted
to it, and the CAC funnel from docs/drafts/26-outreach.md's tracker (messages sent, replies, interviews, letters,
hours spent). Measured numbers say "measured, n = ..."; everything else stays labelled a hypothesis. Rebuild the
deck and run its guard.
```

### Phase C · build week, Tuesday 17 to Saturday 21 Nov (features allowed; freeze Sat 18:00)

#### C0 · Merge Next 16 or close it · #44 · Tue 17 Nov morning
- **If** #44 shows three green e2e runs and Lighthouse ≥ 90: Krishna approves in the PR, Atharva merges, and CI must pass on main.
- **If not:** close it and write the reason in Q54. CI keeps its retry.

#### C1 · Clinic tenants and roles · #28 · Tue–Wed · Effort: high
- **Moves:** SaaS lines 1–2 (+11) and MVP pilot-ready.
```text
Card C1 (issue #28). Branch: build-week/tenants. Effort: high. Gate G2: auth and RLS change, so Krishna approves the
design before any code. Load web-screen; the cto agent reviews the design; run /security-review before the PR.
1. Merge origin/build-week/clinician-invites into this branch first (it is 31 commits behind main). Resolve
   conflicts keeping main's behaviour, and get backend/tests/test_invites.py green.
2. In plan mode, read backend/app/db/schema.sql (clinics, profiles, shares, care_gaps, clinic_reviews, audit_log
   and the RLS block with app_role(), app_user(), clinician_can_see()), backend/app/security/auth.py and
   backend/app/api/clinic.py and admin.py. Propose the smallest design in which: every clinician and clinic admin
   belongs to one clinic; a clinician sees only women who shared with that clinic (consent stays hers); a clinic
   admin sees only their clinic's roster, follow-ups, metrics and audit log; the network admin sees totals only,
   with groups under 10 women hidden. Put the design in the PR description and stop for Krishna's OK.
3. After the OK, test first. Required tests: a clinic A clinician gets nothing for a clinic B patient through every
   clinic endpoint and directly in SQL under that role; a clinic A admin cannot read B's audit log or metrics; a
   woman who shares with A appears only in A; revoking her share removes her from A at once; the network view never
   shows a group under 10.
4. The demo path keeps working: the demo clinician stays in Seaside Women's Clinic, and the e2e passes at both
   widths in EN and AR.
```

#### C2 · Clinic admin: dashboard, onboarding, per-clinic export · #28 · Wed–Thu
- **Moves:** SaaS lines 3, 4 and 6 (+7).
```text
Card C2 (issue #28). Branch: build-week/clinic-admin. Load web-screen, no-ai-slop-ui and mauve-charts.
After C1 is merged, build for the clinic-admin role:
1. A dashboard for one clinic: reports received, follow-ups open / booked / done, and the glucose follow-ups behind
   Jawda PC008. Reuse the /admin components and the same numbers, scoped to that clinic.
2. An onboarding checklist: invite clinicians (from the merged invites), share the clinic QR, first shared report
   received, first follow-up closed. Each step shows done or how to do it.
3. A per-clinic audit export (CSV) that includes the hash-chain check line.
4. A "Clinic admin" entry on /demo, so a judge can open it in one click.
Empty, loading and error states; EN and AR; axe-clean. Tests: an API test per endpoint for scope, and an e2e that
opens the dashboard, sees the checklist and downloads the export.
```

#### C3 · Sign-in for joined records · #27 · Thu–Fri · Effort: high
- **Moves:** MVP line 2 (3 → 10), Women's experience line 5, Q55.
```text
Card C3 (issue #27). Branch: build-week/sign-in. Effort: high. Gate G2: auth change, so Krishna approves the design
first; the cto agent reviews it; run /security-review before the PR.
Design in plan mode: a one-time code by email (6 digits, hashed at rest, 10-minute expiry, 5 tries, rate limits per
email and per IP, the same reply whether or not the email exists); a session cookie (HttpOnly, Secure,
SameSite=Lax); after she confirms, the joined record links to her email, and on a second device the same record
opens. After sign-in she can export (JSON and the PDF) and delete; delete really deletes, leaves an audit entry and
is covered by RLS tests. Krishna chooses the email provider and puts its key in the Render dashboard (never in the
repo). In demo mode without a provider, the code is shown only for addresses ending in @example.com, on a clearly
labelled demo screen.
Tests: code flow (unit and API), the rate limit, the reply that hides whether an email exists, and an e2e that
joins, signs in from a second browser context to the same record, exports, deletes, and finds the record gone.
```

#### C4 · Fixes from the people work · #26, #23 · Fri
- **Moves:** MVP lines 1, 3, 4 and 7; Women's experience lines 1–4 and 7; Clinical safety line 6.
```text
Card C4 (issue #26). Branch: build-week/people-fixes. Load web-screen and clinical-copy-guard.
1. The top 3 problems from the usability sessions (docs/20_INTERVIEWS_AND_USABILITY.md) and what the clinician
   missed in the PDF (B6), one commit each.
2. Remaining Arabic fixes from B3.
3. Care-gap cards and clinic follow-ups link to the exact entries behind them, like the pattern cards do.
4. A test that every number in the doctor PDF equals the API data for the same woman (cycle lengths, bleeding
   scores, labs), for all 8 personas.
5. The advisor's rule decisions from B6 (Q49, Q52, Q56), only those Krishna approved in the PR (G2), each through
   the add-explainable-observation skill with its tests.
```

#### C5 · FHIR: clear the validator's warnings · #47 · Fri · 2 h
```text
Card C5 (issue #47). Branch: build-week/fhir-warnings. In backend/app/services/fhir.py add narrative text
(text.status "generated" with a short XHTML div) to the Patient and every Observation, an effectiveDateTime on the
pattern Observations (the evaluation date), and a performer where it applies. Keep tests/test_fhir_models.py green,
then run the official HL7 validator (the same version as in docs/07) on all 8 personas and write the result,
0 errors and the remaining warning count, into docs/07.
```

#### C6 · Status, support, SLA and the UAE runbook · #30 · Fri · 2 h
```text
Card C6 (issue #30). Branch: build-week/status-sla. On /status and /trust: the pilot SLA statement (support hours,
first reply within one working day, what counts as an incident), the support inbox (SUPPORT_EMAIL), the uptime
monitor link (STATUS_MONITOR_URL) and the incident process from docs/safety/INCIDENT_PROCESS.md. In docs/07 add the
UAE migration runbook: AWS me-central-1 or Azure UAE North, Postgres with pgvector, the API container and the web
app, the exact steps, cost from docs/12, data transfer and rollback.
```

#### C7 · Release day and code freeze · #31 · Sat 21 Nov until 18:00
1. Three full e2e runs in a row pass on main.
2. Lighthouse on mobile for 5 screens, plus axe.
3. Run the demo-readiness skill and a senior-judge rescore (section 5), recorded in PROGRESS.md.
4. Write a state audit table (every route: empty, loading, error) into BUILD_STATUS.md.
5. Reset the demo data, record backup video v2, and do rehearsal 4.
6. Krishna tags the freeze:
```bash
git fetch origin && git tag -a freeze-2026-11-21 origin/main -m "Code freeze, 21 Nov 2026 18:00" && git push origin freeze-2026-11-21
```

#### C8 · Second competition submission · Krishna · by Fri 20 Nov, only if B1 said yes

### Phase D · showcase, Sunday 22 Nov

#### D1 · Morning checklist · #31
- **Before the demo:**
  - Run the demo-readiness skill.
  - Pay for a Render instance for the day.
  - Warm both URLs 30 minutes before, and reset the demo data.
- **At the venue:** test on the venue Wi-Fi and on a phone hotspot.
- **Backups:** the video on two laptops, and the Q&A cards printed.
- **Last checks:** the AI disclosure in the footer, and the "Demo data — fictional" badge on every screen.

#### D2 · The pitch
- **The talk:** 3 minutes, following the story in docs/10.
- **The clinician:** on stage, or a 15-second video quote with consent.
- **The close:** the ask and the commitment to continue (the incubator step).
- **The last slide:** the AI and prior-work disclosure.

## 5. Rescoring
After each phase, and every build-week evening, start a fresh session and paste:
```text
Use the senior-judge agent. Score main (and the live URL if it is up) with docs/09_SCORECARDS.md and the line
tables in docs/18_ROADMAP_TO_95.md section 2. Judge what works, not what is promised. Output the six tables with
the score per line, the totals, and the 5 fixes with the most points per hour, each with the card it belongs to.
```
Then:
- record the result in PROGRESS.md with the date;
- post the summary table on #32;
- update the "Now" column in section 2 of this file.

## 6. Risks and fallbacks
| Risk | Fallback |
| --- | --- |
| Deploy blocked (GitHub apps, Supabase, Render) | Replit backup (the hackathon's tech partner); demo from a laptop plus the backup video |
| The model check misses the bar | It stays off; the 998 strip stays; say so on /status and in the Q&A |
| Next 16 breaks something | Close #44; keep 15.5 and the CI retry; demo from a warm page |
| No advisor by 16 Nov | One clinician reviews the rule sheet and gives a quote; keep looking through build week; never claim an advisor we don't have |
| No signed letter of intent | An email of interest to pilot, quoted with permission; never imply a customer we don't have |
| Arabic reviewer late | Safety replies first; leave the rest marked AR-REVIEW and say so if asked |
| Q44 ruling: pre-built code earns no prototype points | C1–C3 carry the prototype score; the deck says what was built when |
| Build week runs late | Cut in this order: C5, the C6 runbook, then the C2 export. Never cut C7 or the e2e |
