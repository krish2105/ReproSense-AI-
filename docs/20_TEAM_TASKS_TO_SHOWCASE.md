# 20 · Team tasks from 11 Nov to the showcase (Krishna, Atharva, Yash)

Written 11 Nov 2026 by Krishna. Every item left before the HealthX Ajyal showcase has one owner, a deadline, steps and
a "done when". Detailed instructions and ready Claude Code prompts are in the docs/18 cards named in each task; this
file only says who does what, by when.

**Dates:** applications close **Sat 14 Nov 23:59 GST** · selection email **Mon 16 Nov** · build week **Tue 17 – Sat
21 Nov** (code freeze **Sat 21 Nov 18:00**) · showcase **Sun 22 Nov, DOH Incubator, Masdar City**.
Official page: https://upstartbar.com/ajyal/

## Where we stand (11 Nov)
- `main` is green: backend 358 tests, Playwright e2e 118 passed and 8 skipped by design (run locally on 11 Nov at
  `5feb506`), CI green on every merge.
- **The live site is not usable yet.** https://reprosense.vercel.app loads, but its demo page says "The demo server
  isn't answering": the API and database were never deployed. Judges cannot open a persona until K1 and A2 are done.
- Selection is decided on the application: how clearly the problem is defined and evidenced, what each person
  contributes, whether it can be demonstrated, how the skills fit together, and whether we will continue.

## How every task is done
1. Pull `main`, read `HANDOFF.md` section 0, `CLAUDE.md` and the docs/18 card named in your task.
2. `make env db seed test` once (expect 358 passed), `make hooks` once per clone.
3. Branch from `main`, one task per branch. With Claude Code, paste the card's prompt from docs/18.
4. **Commit as yourself. No AI co-author lines** ("Co-Authored-By: Claude", "Generated with Claude Code"); the hook
   refuses them. AI use is disclosed in the app footer and the pitch.
5. Test first: a failing test, then the fix. Put `make test` (and e2e for web changes) in the PR.
6. Open a PR, wait for green CI. **Safety logic, `rules/clinical_rules.yaml` and anything under `backend/app/agents/`
   or `backend/app/ai/` need Krishna's OK in the PR (gate G2).** Docs and web-only fixes can be merged by the author
   once CI is green.
7. Before 16 Nov only safety, privacy, truth and data-loss fixes, ops, docs and people work. Features start 17 Nov.
8. Tick your box in issue "Team plan 11–22 Nov" when done.

---

## Krishna
| # | Task | By | Done when |
| --- | --- | --- | --- |
| K1 | **Deploy the API and database** (docs/18 card A7, `docs/16_DEPLOY_NOW.md`, issue #22): Supabase project, Render blueprint from `render.yaml` (Frankfurt, free plan), set `API_URL` on Vercel for Production and Preview. The accounts are Krishna's, so only he can do this. Then hand over to Atharva (A2) | **Thu 12 Nov** | `https://<render-app>/readyz` answers 200 and https://reprosense.vercel.app/demo lists the eight women |
| K2 | **G2 approvals** for S1 and S2 (Atharva's safety fixes below), and for every PR that touches safety or rules | as PRs arrive | approval comment on each PR |
| K3 | Merge PR #97 (tracker docs from 7 Nov) | Wed 11 Nov | merged, CI green |
| K4 | Organiser follow-up: no reply yet to the 7 Nov email. Send `docs/drafts/44b-organiser-followup.md` once if nothing arrives by Fri 13 Nov | Fri 13 Nov | sent, reply saved without personal data |
| K5 | Tag the selection state: `git tag -a pre-selection-2026-11-16 -m "State at selection" && git push origin pre-selection-2026-11-16` (docs/15) | **Mon 16 Nov, before any build-week commit** | tag on GitHub |
| K6 | Model check score (card B2, #29), only if we get an API key | Fri 13 Nov | `make safety-eval` result in `eval_results.json` under `heldout_with_model` |

## Atharva (web app, build week, release)
| # | Task | By | Done when |
| --- | --- | --- | --- |
| A1 | **Apply** at https://docs.google.com/forms/d/e/1FAIpQLSejHaOPGYdiKos3PPc-yHDxIzsVY4DnU14mVFg20FXLiWZ8Nw/viewform with team name **ReproSense** (answers: `docs/drafts/application-answers.md`, write your own "What I contribute") | **Sat 14 Nov 23:59** | you have the form receipt |
| A2 | **Smoke test the live demo** after K1 (card A7 step 2, #22): the 3-minute demo path on https://reprosense.vercel.app at 390 and 1280 px, EN and AR. Then set the repo variables `LIVE_API_URL` and `LIVE_WEB_URL` so the uptime workflow (#30) stops skipping, and replace "Not deployed yet" in README.md and HANDOFF.md with the live URL | the day after K1 | demo path works live; uptime runs green |
| A3 | **S1 · late or missed period with severe pain** (QUESTIONS #59 follow-up from the 7 Nov rescore): the assistant still gives no urgent reply to e.g. "my period is 2 weeks late and I have severe pain on one side". Failing probes first in `backend/tests/test_safety_routing.py` (EN and AR), then the smallest change in `backend/app/agents/safety.py`; which urgent reply it gets is an advisor decision, so ask Krishna. Check 0 routing changes over the 702 eval questions | Fri 13 Nov (G2) | probes pass, `make test` green, Krishna approved |
| A4 | **S2 · the output guard passes diagnostic wording**: "your results suggest PCOS" and Arabic «يبدو أنك مصابة» get through `backend/app/ai/guards.py`. Failing tests first, then add the patterns; no change to any eval answer | Fri 13 Nov (G2) | tests pass, Krishna approved |
| A5 | **C0 · Next 16** (PR #72, #44): three green e2e runs in a row, then merge, or close it. This is also our best fix for the rare hydration error #418 | **Tue 17 Nov morning** | merged or closed |
| A6 | **C1 then C2 · clinic tenants, roles and the clinic-admin dashboard** (#28): merge `build-week/clinician-invites`, per-clinic dashboard and export | Thu 19 Nov | merged, e2e green |
| A7 | **C3 · sign-in for joined records** (#27) | Fri 20 Nov | merged, e2e green |
| A8 | **C4 · fixes from the people work** (#26, #23): what Yash's interviews, usability sessions and the Arabic review found | Fri 20 Nov | each finding fixed or listed as "after the event" |
| A9 | **C7 · release and code freeze** (#31): demo-readiness check every evening of build week (`demo-readiness` skill), release Sat 21 Nov, nothing merged after 18:00 | **Sat 21 Nov 18:00** | release tag, live demo checked |

## Yash (people work, quality, rehearsals)
| # | Task | By | Done when |
| --- | --- | --- | --- |
| Y1 | **Clinical advisor** (the biggest score lever, #26, card B6): send `docs/drafts/26-outreach.md` §1 to 5–10 OB-GYNs, residents, midwives or GPs, one name per message; book a 20-minute rules review | first messages **Thu 12 Nov**, review booked by Sun 15 Nov | an advisor has agreed; review date set |
| Y2 | **Interviews** (card B4): 5 clinicians and 3 clinic managers, using `docs/12_BUSINESS_MODEL.md` "Interview script" and `26-outreach.md` §2–3 (managers get the price test) | Fri 13 Nov | notes in `docs/interviews/C1.md…`, `M1.md…` by role only, no names |
| Y3 | **Usability sessions** (card B5): 5 women (Emirati and expatriate, 18–45), `docs/drafts/26-usability-script.md`, timed | Fri 13 Nov | notes in `docs/interviews/U1.md…`; findings handed to Atharva (A8) |
| Y4 | **Native Arabic review** (card B3, #23): find a native Arabic reviewer, start with the safety replies in `docs/AR_REVIEW.md`, collect decisions in its "OK" column | reviewer starts Thu 12 Nov, done Sun 15 Nov | every safety row decided; fixes PR by Atharva or Yash |
| Y5 | **Letter of intent** (card B7): ask a clinic manager from Y2, template `docs/drafts/26-letter-of-intent.md` | ask by Sun 15 Nov, signed by Fri 20 Nov | signed copy kept outside the repo; repo notes only "LOI received" |
| Y6 | **Rehearsals and backup video** (card B10, #31): rehearsal cards `docs/drafts/26-rehearsal-cards.md`, the 3-minute demo path, Q&A drill in docs/10 | rehearsals 1–3 by Mon 16 Nov, backup video v1 Sun 15 Nov, v2 Sat 21 Nov | video saved; timings recorded |
| Y7 | **C5 · FHIR validator warnings** (#47) and **C6 · status, support and the UAE runbook** (#30), with Claude Code and the docs/18 prompts | Fri 20 Nov | PRs merged, CI green |

## Day of the showcase (Sun 22 Nov, all)
- D1 morning checklist (#31): live demo opened on two laptops and a phone, backup video ready, demo data reset.
- D2 the pitch: 3 minutes, `pitch/deck.html`, rehearsal 5 at the venue.

## Rules that do not change
Never diagnose, no probabilities, every answer cites a source, red flags first with 998, synthetic data only, the care
navigator only drafts, and no personal data (names, phone numbers, emails) in the repository. See `CLAUDE.md`.
