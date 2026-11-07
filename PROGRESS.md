# PROGRESS LOG — ReproSense AI

Append one entry per work session, newest at the top. Keep it short and factual.

Template:
```
## YYYY-MM-DD — Phase N — <who>
Done:
- ...
Tests: web X/Y pass · backend X/Y pass
Senior-judge score: Venture _/30 · Impact _/20 · Innovation _/20 · Prototype _/20 · Pitch _/10 = __/100
Next:
- ...
Blockers / questions:
- ...
```

---

## 2026-11-07 (night) — A4e: irregular-cycles next steps (#43 e, waits for Krishna's G2 OK) — Atharva with Claude Code
Done:
- `OBS_IRREGULAR_CYCLES` now leads with "Consider discussing your irregular cycles with a gynaecologist or family doctor." The
  logging step reads "Keep logging the day each period starts. Each new cycle makes the pattern clearer." (text from
  docs/18 card A4e; the women-care-lead review named the pattern in step 1, because home shows the step without the card title). It no longer tells Noura, who has 7 cycles, that the pattern is clearer with 6, and the banned
  dash is gone. Arabic reordered to match; the new Arabic line is in docs/AR_REVIEW.md for the native review.
- Test written first and watched failing: `test_api.py::test_noura_recommendation_leads_with_the_doctor_step`.
Tests: backend 306 passed + the PDF test, which needs GTK and fails only on Windows (CI runs it on Linux)
Next:
- Krishna approves the text in the PR (gate G2), then merge.

## 2026-11-07 (night) — Full e2e, senior-judge rescore, fixes from the rescore — Atharva with Claude Code
**Build and e2e on main (`31ca72d`, Windows, Chrome, production build, no retries):**
- `pnpm build` passes (22 routes).
- Run 1, API run natively on Windows: 112 passed, 8 skipped, 2 failed. Both failures were the PDF step of the demo path
  (desktop and mobile). WeasyPrint has no Pango on Windows, so the API answered 503. CI runs that step on Linux.
- From run 2 on, the API ran from the project's own Linux image (`backend/Dockerfile`), in CI's demo-safe setup: dummy key,
  dead model address, `E2E_DEMO_SAFE=1`.
- Run 2: **114 passed, 8 skipped, 0 failed**.
- Run 3: 113 passed, 1 failed. The mobile demo path passed its 3-minute budget while backend tests and installs ran
  alongside it (20.8 min for the run, against 6.2). This was load, not a code fault, and is not counted as a green run.
- **Runs 4, 5 and 6, back to back on a quiet machine: 114 passed, 8 skipped, 0 failed each**, with 0 hydration errors
  (React #418) in any run. That meets the docs/17 target of 3 green runs in a row locally. #418 stays open as documented
  (Next 15.5's React canary; Next 16 in PR #72), because it is rare.
- The 8 skips are by design: desktop-only or server-side checks skip on the phone project.

**Senior-judge rescore (docs/18 §5; main `31ca72d`; 6 Nov evening values in brackets):**

| Scorecard | 7 Nov night | Moved by |
| --- | --- | --- |
| Jury | **72.0** (68.5) | Venture 20.0 (venture pack #77), Impact 15.5, Innovation 15.5 (NG126 and crisis sources #74, safety case #75), Prototype 15.0, Pitch 6.0 |
| Real MVP | **76** (75) | Arabic 6.5 (#76), pilot-ready 5.5 (safety case) |
| Real SaaS | **72** (72) | No change; every gap is build-week work (C1, C2, C6) or needs people (B4, B12) |
| Clinical safety | **26/35** (23) | Red flags 4.5 (#40, #71, #79), sources 4.5, edge cases 3, governance 3.5. Guards went down to 4.5: the judge's probes found the Arabic and hedged-English gaps |
| Women's experience | **27/35** (26) | Clarity 4.5 (A4a–d, #73), Arabic 2.5 |
| Trust pack | **7/7** | Kept |

**Fixes from the rescore (opened tonight, all test-first, all inside gate G1):**
- #82 A4e next-step wording (rules YAML, **needs Krishna's G2 approval**).
- #83 Safety and data loss:
  - The crisis path keeps her other red flags on Patterns and in the check-in reply.
  - The log form reopens the day's saved entry, so a second save adds to the first instead of replacing it.
- #84 Truth:
  - A converted lab value keeps its range in the same unit.
  - "<5" stays "<5".
  - The pain card names the bed days it counts.
- #85 Arabic screens write the fictional personas' names in Arabic script.
- #86 Guard gaps (diacritised and Gulf Arabic, hedged English) and urgent replies citing sources that cover their text
  (NG126; the NHS crisis pages). **Needs Krishna's G2 approval.** Across 702 eval questions: 0 routing changes and 0
  answer-text changes.
- This PR:
  - `CHANGE_LOG.md` rows for #71 and #79.
  - A CI `change-log` job that fails a PR changing clinical logic without a change-log row.
  - A status update in `HAZARD_LOG.md`.
  - The docs/18 "Now" columns.
  - Fixes to doc drift (README test counts, the docs/19 letter-of-intent line).
  - The deck's team line, true names and roles only, no advisor. The deck HTML and PDF were rebuilt, and no slide overflows.

**Health wording review (gate G4):** the chief-healthcare-officer and women-care-lead agents read #82–#86.
- Applied:
  - #82 step 1 names the pattern ("your irregular cycles"), because home shows the step without the card title.
  - #83 the reopened-day line says she can change any answer.
  - #84 the lab flag is set in the printed unit before rounding (101 mg/dL against <100 kept its H), and the pain
    sentence uses the log form's own words, with Arabic number agreement that works for any count.
- Not applied: widening the NG194 and NG126 summaries so the after-birth reply's every claim has a source. That changed
  145 of 702 answers and could not be checked against NICE (403). It is written up in #86 for its own judged PR.
Tests: backend 306 on main (each fix branch adds its own; the PDF test needs GTK and fails only on Windows) · web unit 52 ·
e2e 114 passed / 8 skipped, 3 runs in a row
Senior-judge score: Venture 20/30 · Impact 15.5/20 · Innovation 15.5/20 · Prototype 15/20 · Pitch 6/10 = 72/100
Next (the judge's points per hour):
- Krishna:
  - Approve #82 and #86 (G2).
  - Deploy on Mon 9 Nov (A7).
- Atharva:
  - Send the advisor, clinician and manager messages (A8). Both trackers are still empty, and this is the only route to
    the ~17 people points.
Not done tonight, and why:
- The ferritin next step contradicts NG88 (`clinical_rules.yaml:133`): an advisor decision (Q35, Q49).
- The model timeout (30 s × 2 retries) is longer than the web's 15 s limit. It is latent while the model is off; fix it
  with B2.
- `/readyz` briefly shows an empty index while demo data resets: warm up after every reset.
- The EPDS items are in English in the Arabic app: they need the validated Arabic EPDS.

## 2026-11-07 (late) — Safety fix: "severe bleeding" wordings (PR #79, G2 approved, merged) — Krishna with Claude Code
Done:
- The assistant's urgent check now treats "severe bleeding", "bleeding really badly", "lots of / so much blood",
  "haemorrhaging" and Arabic نزيف حاد / شديد / قوي, أنزف بقوة, دم كثير as the heavy half of RF1. With dizziness or fainting
  they now get the 998 bleed reply. Before, they got `urgent: None` (HANDOFF section 0, known gap).
- Each cue must sit next to a bleeding word (never a bare "severe" or «شديد»). Blood tests, blood donation and cuts
  anywhere in the message are excluded. Block `severe bleeding gap` in `backend/app/agents/safety.py`.
- Tests written first and watched failing (14 failed), then passing: 26 probes in `backend/tests/test_safety_routing.py`.
- 0 routing changes across all 702 eval questions (60-question eval + held-out rounds 1–5); `eval_results.json` unchanged.
Tests: backend 306/306 pass (`make test`)
Next:
- Krishna approved (G2) and #79 was merged after 14/14 CI checks. Known limitation, shared with the existing "heavy" wording: a past event
  ("bad bleeding last year, dizzy from the heat now") still routes to 998.

## 2026-11-06 (night) — Judge panel, research-driven fixes, deck — Krishna with Claude Code
**Independent judge panel (6 agents, read-only, live API + web + code):**
- Panel: senior judge (DoH + OB-GYN + VC + founder), chief healthcare officer, women's care lead, CEO/VC, MVP auditor, and a chief judge who merged them.
- Scored on main through PR #20, before tonight's fixes.

| Scorecard | Chief judge's call | Range / note |
| --- | --- | --- |
| Jury rubric (docs/09 A) | **61.5/100**: Venture 16.5/30 · Impact 15/20 · Innovation 13/20 · Prototype 12/20 · Pitch 5/10 | 53.5–65.5, depending on how disclosed pre-selection code is scored (QUESTIONS #44) |
| Real MVP (docs/09 B) | **66/100** | |
| Real SaaS (docs/09 C) | **61/100** | |
| Clinical safety | **20/35** | |
| Women's experience | **23/35** | |
| Trust pack | **5/7** | Assistant failed held-out phrasings; demo-safe mode only checked by inspection |

- **Winning odds today:** grant-eligible about 50%, top 3 about 20%, first place about 7%.
  - With the code fixes plus deploy and a team slide: about 68.
  - With a clinical advisor, interviews, an LOI and rehearsals as well: about 78–83 (first place about 25–30%).

**Fixed tonight (only defects in disclosed work: safety, privacy, truth, data loss; QUESTIONS #51):**
- **Assistant safety routing** (`app/agents/safety.py`, QUESTIONS #50).
  - Every round of questions was written by reviewers who never saw the code. Each round was measured as written, then used to improve the checks.

    | Round (before it was used) | Crisis | Emergencies | Diagnosis | Medicine | Everyday answered normally |
    | --- | --- | --- | --- | --- | --- |
    | 1 | 9/36 | 4/44 | 2/16 | 1/12 | 25/26 |
    | 2 | 9/30 | 28/32 | 6/10 | 5/10 | 35/40 |
    | 3 | 12/30 | 18/32 | 7/10 | 5/10 | 35/40 |
    | 4, held-out before the review fixes (measured once, never used for tuning) | 12/30 | 18/32 | 7/10 | 3/10 | 46/50 |
    | **5, held-out after the review fixes (new writers, measured once, word checks only)** | **11/30** | **24/32** | **6/10** | **4/10** | **42/50** |

  - Each new community or dialect brings phrasings the checks have never seen. That is why the assistant now always shows a 998 strip above the question box: detection can miss things.
  - Round 4 (132 questions, written after the last change) adds voice-typed and very short messages, and husbands, sisters,
    mothers and friends writing about her. Round 5 (132 questions by new writers, written after the review fixes) is now the held-out number on /status and deck slide 6.
  - Word checks do not generalise: crisis stayed at 12/30 from round 3 to round 4, and was 11/30 on round 5. So the assistant now has a **second
    check by the language model** (`safety.model_check`). It runs only with a model key and her AI switch on, reads
    redacted text, can add the crisis or urgent route but never remove one, and any error leaves the word checks in
    charge. 11 unit tests with a fake model. Its held-out score is not measured yet: `make safety-eval` with a key
    (synthetic questions only) writes it next to the word-checks number, never in its place.
  - Routing is concept-based, in EN and Gulf, Egyptian, Levantine, Iraqi, Sudanese and Yemeni Arabic. It includes a medicine and dose guard.
  - A near-miss probe (alarming words used innocently) finds 0 false alarms.
- **Crisis path** (rule 5): no RF4 alarm card, no EPDS total and no mood pattern card; recommendations are hidden. Covered by backend and e2e tests in EN and AR.
- **Privacy:**
  - Joined records no longer appear on the public roster or open by id.
  - Clinic sharing goes only to her own clinic, named before she allows it (no more default Seaside).
  - The stage switch is hidden on joined records.
- **Data loss:** periods entered for earlier dates now become cycles.
- **Errors:** two HTTP 500s now return 422 or 404.
- **Evidence and voice:**
  - A card cites its own clause first, for example the androgen days.
  - "And N more" replaces silent caps.
  - The doctor PDF and the clinician view are in clinician voice, with an NG88-consistent iron line.
  - PBAC shows "not recorded" instead of 0.
- **Truth:**
  - Malaffi overclaim removed.
  - Data years added to the Al Ain figure.
  - Share copy says "anyone with this link".
  - "AI features are off" no longer blames her.
  - Home empty state and stage-aware next steps.
  - No fertile window or next-period date from irregular or too few cycles, plus a "not contraception" line.
  - /trust gains the intended-use statement, banned claims and the 25-year retention note.
  - The fictional "Oasis" clinic is renamed, because Oasis Hospital is the real study site.
- **Deck:**
  - Placeholders are hidden until filled with true facts.
  - Slide 9 follows the regulatory gate plan.
  - Slide 6 shows counts plus the held-out rows.
  - The demo badge appears only on synthetic slides.
- **Parked for build week:** clinician invites (`build-week/clinician-invites`).

**Needs Krishna or a clinician:**
- #44: prior-work ruling and the tag.
- #45: second competition (closes 10 Nov).
- #48: cycles_per_year false positive.
- #49: rules YAML R1–R10.
- Interviews, LOI, clinical advisor, Arabic review, deploy.

## 2026-11-06 — Demo readiness and scorecard (docs/09) — Krishna with Claude Code
Scored inline and strictly, on what runs today, not on what is planned. The senior-judge agent was not run, because agents are paused at Krishna's request; run it for an independent read.

**Demo readiness (skill `demo-readiness`)**
- §1 Path: every step passes in the e2e at 1280 and 390 px, in 5–16 s automated (target ≤ 3:00 spoken):
  - landing with Noura's real cycles (mobile LCP 1.1 s, Lighthouse 100);
  - /demo → Noura → home → timeline → patterns (an evidence chip opens its day) → the trace;
  - "What is PCOS?" with 2 citations, then the Arabic toggle;
  - report → PDF → consented share with its expiry;
  - clinician → Fatima's follow-up done → the admin KPI moves 101 → 102;
  - Ask the record answers with dates;
  - the fairness table renders.
- §2 Safety: the demo badge shows on every key screen (EN/AR); Sara's 998 card comes first; the guard tests pass (backend 104/104); AI use is in the footer. The deck's last slide doesn't exist yet.
- §3 Fallbacks: no LLM key is needed (extractive answers), so nothing depends on the network at demo time. The demo reset works. **Not done:** backup video, second URL (Replit), and a rehearsal with the network off.
- §4 People: for the team.

Senior-judge score (inline): Venture 18/30 · Impact 16/20 · Innovation 16/20 · Prototype 16/20 · Pitch 6/10 = **72/100**

| Criterion | /5 | Weighted | Why |
| --- | --- | --- | --- |
| Venture (30) | 3 | 18 | Price model on the landing and in docs/12; FHIR export as the integration path; regulatory plan in the docs. No named first clinic, 0 of 5 interviews, no letter of intent. |
| Health impact (20) | 4 | 16 | Sourced UAE numbers on the landing; the clinic loop closes care gaps live; free for women. No clinician quote or pilot outcome. |
| Innovation & evidence (20) | 4 | 16 | Rules from the YAML with sources (8/8 personas); 96.7% grounded answers, 15/15 refusals, 100% red-flag recall; every card shows its entries, the rule inputs and the pipeline steps. Rules not yet signed off by a clinician (QUESTIONS #17, #26–#28, #35). |
| Working prototype (20) | 4 | 16 | The whole path passes the e2e at both widths in EN/AR, axe-clean, Lighthouse 100, with a PDF, sources and no dead buttons on the path. **Not deployed**: a judge can't open a URL yet. |
| Team & pitch (10) | 3 | 6 | Script and Q&A in docs/10; AI disclosure in the footer. No deck, no rehearsal, no backup video. |

Real MVP (B): 7 pass, 2 partial, 1 fail.
- **Fail:** sign-up for a new user (demo personas only).
- **Partial:** loading states (link feedback instead of route skeletons, QUESTIONS #43); pilot readiness (real auth, deploy and CSP still to do).
- **Pass:** persistence, evidence links, the PDF, consent-only clinician view (RLS tests), EN/AR, Lighthouse, automated tests.

Real SaaS (C): 3 pass, 6 partial, 1 fail.
- **Pass:** roles, residency story, FHIR path.
- **Partial:** tenants (one clinic wired), metrics (network level only), pricing tiers (two-sided model only), audit export (verify only), status page (no SLA), unit economics (docs only).
- **Fail:** clinic onboarding.

Trust pack: grounded 96.7% ✓ · refusals 15/15 ✓ · red-flag recall 100% ✓ · rules 8/8 ✓ · banned words 0 ✓ · navigator never sends ✓ (e2e) · network-off run not yet done.

Below 4/5, and the single most valuable fix for each:
- **Venture 3:** five clinic interviews and one letter of intent (docs/12, docs/15). Team work, not code.
- **Pitch 3:** a 10-slide deck from docs/10, three timed rehearsals, and the backup video. Team work. The deck can be drafted on request.

Top fixes by points gained per hour:
1. **Deploy** (docs/08): prototype +4 for ~3 h. Krishna; needs the Vercel, Render and Supabase accounts.
2. **Deck, rehearsals and video:** pitch +2 for ~3 h.
3. **A clinician advisor signs off the rules and gives one quote:** innovation and impact +8. This is the biggest lever per docs/15.
4. **Five interviews and an LOI:** venture +6, over several days.
5. **A network-off rehearsal of the e2e path:** trust pack, about 30 min.

Hardest questions on stage, grading the docs/10 answers:
- **"Is this a medical device?"** Answer B. Add that it never outputs a diagnosis or treatment, that it only flags patterns worth discussing, and that red flags route to 998.
- **"How do you know it helps?"** Answer B-. Add the measured numbers above and the pilot measure: care gaps closed per 100 shared reports.
- **"Who signs the first cheque?"** Answer C. There is no named clinic or LOI yet, which is fix 4.

## 2026-11-06 — Step 3: Playwright e2e in CI — Krishna with Claude Code
Done:
- `apps/web/e2e` (Playwright 1.64, axe-core 4.14) against the real stack: the seeded API and the production build, at 1280 px and 390 px. Any console error fails a test. Demo data is reset before and after.
- The 3-minute path in one timed test: landing (Noura's live arc, 46 ring beads, disclosures) → her record (home, timeline with the 21–35 band, body map, patterns with dated evidence and the trace) → assistant ("What is PCOS?" with 2 numbered sources, then Arabic and back) → report (prepare, PDF is a real PDF, consented share with expiry, stop sharing) → Hessa (care navigator draft approved, "Nothing was sent") → clinician (Noura's handover, Ask the record with dates) → Fatima's after-birth glucose follow-up done → admin closed count 102. 13–16 s per viewport.
- Every key screen in English, Arabic (RTL) and dark through axe (WCAG 2.2 AA) with no sideways scroll; Sara's 998 red flag comes first; reduced motion and no-WebGL show the posters; a guard that no page streams table segments.
- CI job `e2e`: pgvector Postgres service, seeded API (no LLM key), production build, Playwright Chromium; the report is uploaded when it fails.
- Real bugs the suite found and fixed:
  - **Stale prefetched redirect.** A fresh visitor could not open Noura's record from the landing: an anonymous prefetch of `/app` cached a redirect to `/demo`. Logins now do a full navigation (`enterAs`), and links into the signed-in areas don't prefetch.
  - **Hydration race (React #418).** Intermittent on full page loads with route-level `loading.tsx`, from the React canary bundled in Next 15.5.29. Route skeletons were removed; links show loading with `useLinkStatus` (QUESTIONS #43).
  - **WCAG AA contrast** in four tones (QUESTIONS #42).
  - **Keyboard access to wide tables** (`TableScroll`).
  - **Day-pill names** that missed their visible text (WCAG 2.5.3).
  - **Future calendar days** are now `aria-disabled`.
  - **The tab bar's glass** let dark cards show through, so it is now 94% opaque.
  - **Body-map tap points** are now in a named group.
  - **The clinician tab title** showed the URL slug; it now shows her name.
  - **drei `<Html>` labels** raced React roots; they are now plain DOM.
Tests: web e2e 69 passed, 3 skipped (3 runs in a row) · web unit 50/50 · lint, typecheck, build pass · backend 104/104 (unchanged)
Lighthouse (landing): mobile 100/100/100/100 · desktop 100/100/100/100.
UI slop check: pass. The contrast shades keep each hue; nothing new on screen except the link loading state.
Next:
- Demo-readiness checklist; scorecard against docs/09.
Blockers / questions:
- QUESTIONS #43 (route skeletons replaced by link feedback) is a decision made while building: confirm or ask for another approach.

## 2026-11-06 — Phase 7 (web) — Krishna with Claude Code
Done:
- Landing `/` on Noura's live record (the server reads it with a demo token, cached 10 minutes). Hero: her phone as she sees it today (the real arc "Day 19 · follicular phase · estimate", "Log your symptoms" opens her log, her two recommendations) tilting towards the mouse, over a React Three Fiber ring with one bead per day of her cycle (API phases, today in plum, days ahead lighter because they are estimates). Observation card with its entry count; assistant example with its sources.
- Year in 3D: the spiral (one loop per cycle) beside the cycle ledger drawn to scale with the 21–35 day band; table toggle. Then the five stage cards, evidence with numbered sources, the four-step trace, the two-sided model and the promises.
- `/admin`: follow-ups by region in 3D (one slab per region, one column per status, live counts, drag to turn), with a flat grouped-column chart of the same numbers and a link to the table.
- 3D rules (skill `mauve-3d`): canvases load only on the client and never in first-load JS (landing 129 kB); each poster is the same data in the scene's resting pose; the WebGL probe runs only near the screen; the hero ring starts after the first sign of use or 8 s; reduced motion or no WebGL keep the posters and an upright phone; colours come from the theme tokens.
- Found and fixed while checking: grey-brown phase colours (R3F tone mapping + physical light units → `flat`, lights × π); a THREE.Clock deprecation warning from every canvas (only that notice dropped); sideways overflow at 1024 and 800 px; RTL cards covering the greeting (logical insets); the six-link header wrapping inside the pill at 761–1140 px; footer layout shift while streaming (skeleton one screen tall); the WebGL probe costing ~1 s of mobile TBT.
- Smaller pages: each area sends only its own message namespaces (landing HTML 146 → 115 kB before the phone was added, 135 kB now); the Arabic font is no longer preloaded; metadata is always in `<head>`; robots.txt keeps crawlers out of `/app`, `/clinic`, `/admin`, `/api` and the token links.
Tests: web 49/49 unit (ring projection and fit, regions) · lint, typecheck, build pass · backend 104/104
Lighthouse (landing, local `next start`, two runs each): mobile 100/100/100/100 (LCP 1.1 s, TBT 0 ms, CLS 0) · desktop 100/100/100/100 (LCP 0.6 s, TBT 0 ms, CLS 0).
Browser check: landing at 390, 600, 800, 1024 and 1280 px, EN and AR, light and dark: no horizontal scroll, tilt follows the mouse, poster hands over to WebGL; `/admin` region columns. Chrome runs: normal, `prefers-reduced-motion` and `--disable-webgl`, zero console errors in each.
UI slop check: pass. Every 3D object is data (beads are days, columns are follow-ups); the mockup's decorative blobs are left out (QUESTIONS C7); buttons name their action.
Deviations from the mockup: on phones the two hero cards stack under the phone instead of being hidden, so the observation stays on screen; the hero still image is an SVG of the same ring, not image B1 (C7 allows either, and B1 has particles); the cards sit a little lower because our phone has no stage pills.
Next:
- Step 3: Playwright e2e of the 3-minute path (axe, console errors, 390 and 1280) wired into CI; demo-readiness; scorecard.
Blockers / questions:
- None new. Arabic strings still need the native review before the pitch.

## 2026-11-05 — Phase 6 (web) — Krishna with Claude Code
Done:
- EPDS check-in `/app/checkin`: the 10 standard items (scores stored per option, reverse items handled) with the citation RCPsych requires; mood-check card on Home for pregnancy and after birth. Crisis (item 10 > 0) → support card only, no score, and Home then leads with it and hides patterns. In Arabic the items stay in English with a note (validated Arabic pending, QUESTIONS #40).
- Lab reports `/app/documents`: choose a file or (for Fatima) the demo OGTT report, read → every value editable with a keep checkbox → Confirm and save; reports list with status. Confirming Fatima's demo report closed her after-birth follow-up (navigator card gone from Home).
- Privacy centre `/app/privacy`: promises, three choices (allow/stop), who saw my data (audit trail in plain words), stored counts, JSON export, FHIR check (9 resources, no validation errors) + download, discreet mode ("My notes", name and initial hidden; server-rendered from a cookie, saved to the profile), delete my entries with a confirmation dialog.
- Home: "Your record" links (lab reports, privacy, mood check).
- Safety fix: forms post only by fetch. A click before hydration had put EPDS answers into the URL in dev; the EPDS button no longer submits natively and every form is method="post".
Tests: web 37/37 unit (EPDS scoring added) · lint, typecheck pass · backend 104/104
Browser check (Fatima): demo report → 3 results saved → follow-up closed; EPDS normal (total 9 of 30, no URL leak) and crisis (support only, no score; Home leads with it); privacy: FHIR check, discreet on/off, delete with confirmation → all counts 0. Zero console errors. Demo data reset afterwards.
Next:
- Phase 7: landing page with Noura's real data, 3D (data-driven, lazy, with fallbacks), dark/RTL/states polish, accessibility, Lighthouse.

## 2026-11-05 — Phase 5 (web) — Krishna with Claude Code
Done:
- `/clinic`: "Seaside Women's Clinic (fictional)", consented patients most urgent first (red flags, then due care, then patterns) with open counts and reviewed/new, and the follow-ups due across the clinic.
- `/clinic/patients/[id]`: pre-visit summary (SBAR from the API), red flags, follow-ups (Mark booked, Mark done, Reopen, Draft reminder in EN + AR that is never sent), Ask the record (suggested questions + free text; answers only from her entries with dated evidence), cycle-length and pain charts, patterns with evidence chips and "How this was produced", labs with printed ranges, her questions, editable visit note (saved), Mark reviewed. Amina (no consent) gets "No shared record". On phones the list hides and a back link appears.
- `/admin`: KPIs (women, reports shared, follow-ups closed, share closed), live demo follow-ups box, funnel, regions with status bars, fairness tables by nationality group and age band (gap flags, suppression under 10), clinician-time calculator with the API's stated assumptions (cost only if the viewer enters one), audit hash-chain check, refresh every 10 seconds.
- Language toggle now writes its cookie in the browser (a server action id from an older build failed after a redeploy); `data-scroll-behavior="smooth"` set on <html>.
Tests: web 34/34 unit (message parity now uses the real ICU parser) · lint, typecheck pass · backend 104/104
Browser check: clinic list and Fatima at 1280; Hessa: Ask the record (cycle lengths with dates), reminder draft, Mark reviewed, visit note saved; Amina consent gate and the record layout at 390. **Demo moment verified:** Mark done on Fatima's glucose-test follow-up → admin: closed 101 → 102, share closed 40.4% → 40.8%, still open 88 → 87, live box Open 1 · Done 1. Zero console errors after the fixes. Demo data reset afterwards.
Found (backend copy, QUESTIONS #41): clinician SBAR in patient voice; Ask-the-record ranges without years.
Next:
- Phase 6: EPDS check-in (pending wording, QUESTIONS #40), documents upload → confirm (Fatima's OGTT closes her gap), privacy centre (consents, who saw my data, export, FHIR, delete), discreet mode.

## 2026-11-05 — Phase 4 (web) — Krishna with Claude Code
Done:
- Report `/app/report`: "Prepare my report" (POST /v1/reports) then a preview built from the same payload as the PDF: identity, entries and bleeding days, cycle lengths, bleeding score per period (100+ highlighted), red flags, patterns (not a diagnosis) with entry counts, labs as printed with ranges and flags, questions for the doctor, sources. Dates use the report's pinned date.
- Download PDF and Open PDF (the PDF renders inline in Chrome through the proxy despite the API's CSP); Update report.
- Share with my clinic: consent dialog (checkbox required) → 7-day link, copy link; sharing list with status and Stop sharing. The token is shown once by the API, so this browser session keeps it for the QR.
- Visit mode: handover rows (situation, background, what the record shows, next step from the guideline) built from the payload, a real QR code of the share link, expiry caption, Exit visit mode; asks for consent first when nothing is shared.
- `/shared/[token]`: public, noindex, no referrer; preview + PDF download; revoked/unknown and expired links each get their own message.
- Fixed: the clinic is "Seaside Women's Clinic (fictional)" everywhere, as in the database (the mockup's "Corniche" name is a real Abu Dhabi hospital's).
Tests: web 34/34 unit · lint, typecheck pass · backend 104/104
Browser check: Noura's report at 1280 and 390 (Arabic), share with consent → link → visit mode QR → shared page opens → Stop sharing → link "doesn't open"; expired path checked by back-dating a share in the demo DB (API 410 → "This link has expired"). Zero console errors. Demo data reset afterwards.
Next:
- Phase 5: clinic list + patient record (SBAR, Ask the record, review, visit note, care gaps + reminder draft) and the admin dashboard (KPIs move live when Fatima's gap closes).

## 2026-11-05 — Phase 3 (web) — Krishna with Claude Code
Done:
- Patterns `/app/insights`: red flags pinned first; full cards with summary, the rule's explanation, "Why we noticed" chips that open that day in the calendar, record-strength meter, what to consider next, questions for the doctor, draft request (navigator), ask the assistant, how it was written (template or model, sentences matched to a source) and sources. "How this was produced" shows the rule id, rules version, the numbers the rule used and the 7 pipeline steps with timings. Crisis replaces everything with support. Amina gets an empty state that says what will appear.
- AI Chat `/app/assistant`: header with the copilot avatar, suggested questions (EN/AR from the API), thread kept for the session, answers with numbered citation links and a source list under every answer, refusals rendered as written, urgent answers in the urgent style with Call 998, crisis answers as support only, voice input only where the browser supports it, ?q= prefill from a pattern card.
- Tab bar now shows Home, Calendar, Analytics, Patterns, AI Chat; Home's "See all patterns" links appear.
Tests: web 34/34 unit (answer parser added) · lint, typecheck pass · backend 104/104
Browser check: Noura's Patterns at 1280 (trace dialog, evidence chip → 28 Nov 2025 in the calendar), AI Chat with a suggested question, "Do I have PCOS?" (refusal with sources) and an urgent question (998 first, Call 998, sources); Arabic chat at 390 with an Arabic answer; zero console errors.
Fixed during the check: English chat text reversed inside the Arabic layout (direction now set on the message text, not the bubble).
Found (backend, QUESTIONS #39): off-topic questions get unrelated passages instead of "no source found".
Next:
- Phase 4: doctor report preview + PDF, share with consent (7-day expiry), revoke, /shared/[token], visit mode with SBAR + QR.

## 2026-11-05 — Phase 2 (web) — Krishna with Claude Code
Done:
- Home `/app`: red flags first (RF card with the action line, date, evidence, source, Call 998), crisis card (RF4 wording, no score), greeting, stage switch (logs in as Noura, Mariam, Hessa, Fatima or Layla), day pills (link to that day), the signature arc for cycle, pregnancy (weeks 0–40 + glucose window ring) and after birth (weeks 0–12 + test window), RF5 pregnancy warning box with sources, recommendations, mood row (POST /v1/mood), up to three pattern cards, record strength.
- Care navigator (pulled forward from #6 for the demo path, HANDOFF §5 order): card for "due now" care rules; the dialog drafts (or reuses) the request, shows message, questions, what to bring and sources; Approve → "Approved. Nothing was sent", Copy message; Discard.
- Calendar `/app/log`: month grid with bleeding and logged days (links to each day), day detail tiles with the E9 icons, log form (flow, PBAC counters matching the backend weights, pain slider, calibrated body map front/back with yearly glow, symptoms, daily life, sleep, sentence capture via /v1/logs/parse with confirmation), red flags shown immediately and focused after saving.
- Analytics `/app/timeline`: 3/6/12-month links, summary built from the numbers (EN/AR plurals), cycle-length line with the 21–35 band, pain and bleeding-score bars with thresholds, change noticed, top symptoms, day-by-day year dots, table view. Charts follow mauve-charts (hatch, gaps, outlines, LTR time, summaries).
Tests: web 31/31 unit (arc geometry incl. overlapping phases, vocabulary checked against the API code, PBAC weights, sources checked against sources.yaml) · lint, typecheck, build pass · backend 104/104
Browser check: Noura, Hessa, Fatima and Sara at 1280; Noura at 390 (Home, Calendar, Analytics) in EN light and AR dark; navigator approve flow; mood save; stage switch; red-flag log (heavy flow + flooding + dizziness → RF1 card at once); no horizontal scroll; zero console errors. Demo data reset afterwards.
Fixed during the check: header overflow at 390 (duplicate "Switch person" removed), pain-chart threshold label collision, Arabic month agreement ("12 شهراً"), state kept across persona switch.
UI slop check: pass (mockup classes, data-only decoration, specific labels, no gradient text, one icon set).
Next:
- Phase 3: Patterns (full cards, evidence chips → /app/log?date=, trace drawer, record strength) and AI Chat (citations, suggested pills, EN/AR, urgent/crisis).

## 2026-11-05 — Phase 0 (web) — Krishna with Claude Code
Done:
- `apps/web`: Next.js 15.5 App Router, React 19, TypeScript 5.9 strict, Tailwind v4 (no preflight, default palette off), next-intl 4 without i18n routing (cookie `NEXT_LOCALE`, EN + AR, `dir="rtl"`), pnpm 12.
- Tokens and component CSS copied from `mockup/template.html` by script (lines 11–330); four documented deviations (badge always visible, fixed tab bar, native `<dialog>`, next/font variables).
- `/api/v1/*` → API rewrite (same-origin `rs_token`), `apiServer` (forwards only the cookie), `apiClient`, `requireRole`; separate `/app`, `/clinic`, `/admin` layouts; `/` → `/demo` until the landing page exists.
- UI kit: Button, Tag, Box/Panel, Dialog (native), Toast, Pills/Seg, Skeleton, Empty/Error states, UrgentCard (action first, tel:998), one stroke icon set; header, demo badge, language and theme toggles (cookie `rs_theme`, no flash), footer, skip link, tab bar with ready flags.
- `/demo` roster (login per persona, clinician, admin, reset), `/tokens` gallery, 404/error/loading states. Images moved to `apps/web/public/images`.
- CI: new `web` job (lint, typecheck, unit tests, build). New project skills: `web-screen`, `mauve-charts`, `mauve-3d`. Research kept in `research/2026-11-05-web-build-notes.md`.
Tests: web 16/16 unit (lint, typecheck and build pass) · backend 104/104
Browser check (in-app browser): /demo at 1280 and 390, light and dark, EN and AR (RTL); login → /app; role redirects; dialog Esc + focus return; no horizontal scroll at 390; zero console errors. Fixed during the check: English names/stories reversing inside Arabic (now isolated), roster button squeezed between 541–980px, underlined header link.
UI slop check: pass (mockup classes only, no gradient text/buttons, no default palette, one icon set, specific labels).
Senior-judge score: not run for the scaffold (agents paused by the user); run once the demo path exists.
Next:
- Phase 2: Home (stage switch, day pills, cycle/pregnancy/after-birth arcs, recommendations, mood), Hessa's navigator card + dialog, Calendar/log + body map, Analytics.
Blockers / questions:
- QUESTIONS #38 (palette fails the colour-blind test; encodings added, colours unchanged).

## 2026-11-05 — Phases 0, 1, 3, 4, 5, 6 (backend) and 8 (partial) — Krishna with Claude Code
Done:
- Repo initialised and pushed to github.com/krish2105/ReproSense-AI- (branch `main`). CI: backend lint + tests on Postgres/pgvector, generator check, gitleaks.
- Postgres schema with **forced row-level security**. The API runs every query as the restricted role `reprosense_app` with app.role/user_id/clinic_id. The database rejects any non-synthetic person.
- Rules engine reads only `rules/clinical_rules.yaml` (safe parser, no eval). Red flags run first with a 14-day window; EPDS item 10 opens the crisis path and hides the mood card.
- LangGraph pipeline: intake → signal → safety → (crisis: end) → evidence → writer → verifier → care_gap, traced per step. Claude provider (`claude-opus-5-5`, refusal fallbacks on) is used when a key is set; otherwise deterministic templates.
- Knowledge base: 28 summaries in our own words (EN + AR, AR-REVIEW), a guideline graph and Arabic rule copy. Hybrid retrieval (full-text + pgvector + RRF + IDF re-rank) with an Arabic↔English glossary and light stemming.
- Assistant: citations on every answer, polite refusal of diagnosis or probability questions, 998 guidance first, crisis message only for self-harm.
- APIs: home/timeline/analytics/logs (PBAC, natural-language capture), insights, EPDS, lab upload → confirm (injection lines stripped), privacy (consents, audit timeline, export, delete), FHIR R4 bundle, care navigator (draft → approve, never sends), report PDF (WeasyPrint), 7-day revocable share links, clinic list and record (handover summary, Ask the record, visit note, care gaps, reminder drafts), admin metrics (k ≥ 10, fairness), quality panel, demo login/reset.
- Security: AES-256-GCM notes and documents, hash-chained append-only audit log, headers, rate limits, CORS, PII redaction before any LLM call.
- Fictional demo upload `data/synthetic/demo_uploads/fatima_postnatal_ogtt.txt`: confirming it closes Fatima's after-birth gap automatically.
Tests: web — (not started) · backend **104/104 pass** · AI eval grounded 96.7% · refusals 15/15 · red-flag recall 100% · banned 0
Senior-judge score: not run yet (run it after the web demo path exists; scoring the prototype now would only measure the missing UI)
Next:
- Atharva: Next.js app, Phases 2→7 UI against the ready APIs (HANDOFF.md §5).
- Krishna: deploy, Playwright e2e, LLM key + cache warm-up, clinician sign-off items, disclosure note.
Blockers / questions:
- QUESTIONS #34 (code before selection must be disclosed) and #35 (NG88 ferritin wording) are new.

## 2026-11-05 — Pre-build — image integration (no product code)
Done:
- Verified the Mauve Pro archive: CRC ok; 38/38 PNGs match manifest hash, size and alpha. Placed all of them at their manifest paths in public/images (+ mockup/images).
- tools/derive_image_assets.py: split the E9/E10 strips into 11 icons; made plum full-bleed brand icons from A2 (fixes A1's white corners).
- Mockup body map: fixed 4 bugs. Lower back was on the groin of the front figure; left/right pelvis were the wrong way round; the fallback covered the image; no charset/viewport meta. Added a front/back switch with tap points measured from the art.
- ASSET_INTEGRATION_REPORT.md written. Planning: QUESTIONS.md #11–#29 and C1–C13 logged.
Tests: no app yet · body-map browser check pass at 320/375/768/1280 (front + back), no console errors
- Official rules page re-checked: everything matches the kit; building may start once selection is announced on 16 Nov; prizes 15k/10k/5k AED.
Next:
- Pre-build tasks in BUILD_STATUS (interviews, clinician, LOI, Arabic reviewer, disclosure note listing these images).

## 2026-11-05 (v2) — Anti-slop redesign, new features, score path to 96
Done:
- Researched AI-generated design tells; replaced "Blush & Deep Navy" glass/gradient look with "The record she carries"
  (cycle-chart identity, one accent, Familjen Grotesk / Public Sans / IBM Plex Mono). New skill: no-ai-slop-ui.
- New skills: clinical-copy-guard, add-explainable-observation, synthetic-data-realism, demo-readiness.
- Generator: PBAC bleeding score per period (Higham 1990), Mariam persona (fertility timing, ASRM/NICE NG257),
  cohort fairness table. 6/6 personas [OK], output identical across runs.
- Rules: heavy bleeding now includes PBAC ≥ 100; new OBS_TTC_FERTILITY_ASSESSMENT.
- Mockup: cycle ledger hero, scaled evidence charts, observation trace, record-strength meter, change detection,
  Arabic voice sample, PBAC counter, SBAR handover, Ask the record, fairness check, 3-stage scorecard + winning confidence.
  Tested headless: 6 views × 2 widths, 6 personas × 6 tabs, no errors, no horizontal overflow.
- docs/15_WIN_PLAN.md: 75 → 82 → 96 path, confidence, LOI + disclosure templates.
UI slop check: pass (no gradients, glass, glows, all-caps labels, stat-card rows or generic CTAs).
Senior-judge estimate: Venture 24/30 · Impact 19/20 · Innovation 18/20 · Prototype 7/20 · Pitch 7/10 = 75/100

## 2026-11-05 — Kit created
Done:
- Master prompt, CLAUDE.md, architecture, AI pipeline, data plan, design system, security, deploy rules,
  scorecards, image prompts, 9 role agents, clinical rules, knowledge-base source list.
- Synthetic data generator written and tested (5 personas, 1,200-woman cohort, lab reports); output is byte-identical across runs.
- Interactive team mockup: mockup/reprosense-mockup.html (rebuild with `python3 mockup/build_mockup.py`).
  Tested headless at 1280px light and 400px dark: all 6 views, all patient tabs, gap-closing flow, Arabic RTL, no script errors.
Senior-judge estimate (no product code yet): Venture 24/30 · Impact 18/20 · Innovation 17/20 · Prototype 6/20 · Pitch 7/10 = 72/100
Next:
- Submit applications by 14 Nov. Run interviews. Generate images. Wait for selection (16 Nov) before writing product code.


## 5 Nov 2026 — v3 UI
The team picked the soft mauve reference. The mockup was rebuilt with day pills, the cycle arc, recommendations, a mood row, a calendar, analytics, the AI Copilot and a floating tab bar. docs/06 and the no-ai-slop-ui skill were updated.

## 5 Nov 2026 — v4 (Mauve Pro + full feature set)
- Generator: 8 personas, 5 life stages, all [OK]; new rules (pregnancy glucose screen, EPDS mood, perimenopause, iron check, RF4–RF6).
- Mockup: stage switch, pregnancy arc, body map (image slot), care navigator, visit mode, FHIR export, discreet mode, 3D clinic map, AI test panel. Tested: no errors.
- New IMAGE_PROMPTS_CHATGPT.md (40 images incl. body map framing). Docs 01/03/04/06/09/15, CLAUDE.md, MASTER_PROMPT §13, START_PROMPT updated.
