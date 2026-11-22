# 31 · V5 "Watertight": exactly what we are building (22 Nov 2026)

Owner: Yash. Reviewers: Krishna (backend, security; G2 for anything touching safety), Atharva (web).
Branch `v5/watertight`. **Not merged before the showcase**: Render and Vercel deploy `main` automatically.

## The idea in one paragraph
Same product, same safety rules, made **easy**, **precise** and **watertight**.
- **Easy:** one header everywhere, Back always returns you to where you were, every date is picked from a calendar, and
  the sign-in pages say what to do.
- **Precise:** her words are read correctly ("no cramps" is not cramps), and her next period is an honest date range
  worked out from her own cycles, not a 28-day default.
- **Watertight:** every open finding from the 20 Nov security assessment is closed, and a test clicks every button in
  every area and fails on any error, dead click or broken Back.

## What does not change (guard rails)
1. Patterns and red flags stay in `rules/clinical_rules.yaml`. No model decides a pattern or removes an urgent route
   (CLAUDE.md rules 1, 2, 5). The urgent and crisis word checks run on her raw words, unchanged, before anything else.
2. No probabilities. A forecast is a date range with how it was worked out, never a percentage.
3. No click tracking or analytics. "Backtrack" means navigation that always goes back correctly, plus the audit log we
   already keep. Our Q&A pack promises "no advertising or analytics trackers".
4. Patient, clinician and network stay separate routes, layouts and roles (rule 9).
5. Synthetic data only; every screen keeps the "Demo data — fictional" badge (rule 4).

---

## A. One header everywhere (easy)
**Today:** five different headers (site, her app, clinician, network admin, clinic admin). Inside Clinician the public
links vanish and "Your sign-in" and "Sign out" appear as nav links. Nothing says clearly where you are.

**Build:** one header, identical on every page (built 22 Nov):
`[ReproSense → home] [Product · Demo people · Team scorecard | Her app · Clinician · Clinic admin · Clinic network] … [Account ▾] [Demo badge] [عربي] [Dark]`
- **The same seven links in the same order everywhere.** A quiet divider separates the product pages from the four
  views. The view you are in is the plum pill, so "where am I" is always answered.
- **Every view stays one tap away.** That keeps Krishna's 18 Nov fix ("when clicked nothing works"). A hidden "switch
  view" menu was considered and dropped: two taps, and harder to find.
- **Account ▾, staff areas only:** "Account & security" and "Sign out". These two were nav links before. Her app keeps
  Privacy on her Home and sign-out in Privacy.
- **Deep pages show a path:** `All patients › Fatima K.`, `Home › Privacy` (also Documents and Check-in), and
  `Clinician › Account & security` (§D). Every part but the last is a link.
- Below 1380 px the links take their own scrolling row, as below 760 px before.

**Done when:**
- The header component and order are identical in all five areas.
- The current area is always visible, with at most 3 plain links.
- Menus open by click or Enter, close on Esc or outside click, return focus, and mirror in Arabic.
- axe shows no violations.

## B. Back always works (easy)
**Today:** the demo holds one sign-in at a time. Opening Clinician replaces Noura's sign-in, so pressing Back to her
app lands on Demo people (`apps/web/src/lib/session.ts` `requireRole`).

**Build:**
- A patient demo sign-in stores the woman's public persona id in `rs_demo_persona`: httpOnly, SameSite=Lax, demo mode
  only, never a joined record's id.
- `requireRole("patient")` with no patient session, in demo mode, with that cookie set: redirect to
  `/demo/enter?role=patient&persona=<id>&next=<path>`. It signs her back in and lands on the exact page.
- `/demo/enter` accepts `role=patient` with a persona id that must be in the public roster. `next` is accepted only as
  a same-origin path inside that role's area (allow-list), otherwise the area's home.
- The proxy passes the requested path to the layouts (`x-pathname`).
- Redirects are server redirects, so `/demo/enter` never becomes a history entry.
- A joined record (`guest-…`) is never re-entered automatically. She goes to `/signin` with "Sign in again to open
  your record".

**Done when** an e2e test passes: Noura's Home → Demo people → Clinician → Fatima → Back, Back, Back lands on Noura's
Home showing Noura, and no step in history is `/demo/enter`.

## C. One date picker for every date (easy)
**Today:** the browser's own date box. On Chrome for Windows it shows no calendar icon, and a half-typed "10/11/yyyy"
is silently invalid. Used in 4 places: join, baby card, postnatal card, admin event timeline.

**Build:** `DateField`, hand-built in E · Mauve Pro (no new dependency):
- **A button showing the date in her language** ("Mon 10 Nov"; in Arabic "الإثنين ١٠ نوفمبر") opens a month calendar.
- **Only allowed days can be picked:** min and max are enforced, future days are greyed out.
- **Quick choices** where they help: "Today", "About a week ago", "About 2 weeks ago", "I don't remember" (clears).
- **Keyboard:** arrows move a day, PageUp and PageDown a month, Home and End the week, Enter picks, Esc closes.
- **Screen readers:** the calendar is a dialog with a labelled grid. Right-to-left in Arabic.
- **Forms:** a hidden input still carries `YYYY-MM-DD`, so forms work unchanged.
- **On join**, after she picks a date: "That makes today day N since your period started."

**Done when:**
- Unit tests cover date maths, min and max, and month edges.
- e2e picks a date by mouse and by keyboard, in English and Arabic.
- An invalid date cannot be entered.
- axe shows no violations.

## D. Sign-in pages that say what to do (easy)
**Staff door, `/staff/signin` (built 22 Nov):**
- The lede says who it is for and that the demo needs no account.
- **"Trying the demo?" comes first** with the one-tap buttons (Open the demo clinician view, Open the demo clinic
  admin, Open the demo page). Most visitors are judges.
- **"Have a staff account?"** follows, with "Sign in with a passkey". "What's a passkey?" opens: your phone's or
  laptop's screen lock used as your key; nothing to remember, and a fake site cannot use it.
- Then "No passkey yet?" and the DoH door, unchanged.

**"Your sign-in" became "Account & security"** (`/clinic/sign-in`, `/clinic-admin/sign-in`, `/admin/sign-in`). It moved
into the Account menu (§A).
- **Breadcrumb:** `Clinician › Account & security`.
- **Status card:** "Signed in as Dr. Example (fictional). Nothing to do here for the demo." Shared accounts add their
  note. "Back to Clinician" sits under it.
- **"What you can do here":** a short list linking to each section (add a passkey, see devices, sign out everywhere).
- **The passkey section** has the same "What's a passkey?" explainer.
- **Numbered 1-2-3 steps were considered and dropped.** These are not a real sequence, and numbered markers on
  non-sequences are on the no-AI-slop banned list.
- Every sign-out from here also forgets this tab's chat and share links (L7).

## E. Every button works, proven (watertight)
**Build:** a Playwright spec, `e2e/every-button.spec.ts`, run in CI.
- **Where:** five areas (public site, Noura's app, Clinician, Clinic network, Clinic admin), each in English and
  Arabic.
- **What it does:** collects every visible link and button and clicks each one.
- **Excluded:** controls marked `data-destructive` (reset, delete, sign out). They have their own tests.
- **Each click must:**
  - log no console error;
  - get no API response of 500 or more;
  - not reach the 404 page;
  - visibly do something: the URL changes, a dialog or menu opens (`aria-expanded`), or a status message appears.
- **Then** Back returns to the start URL.
- **The report** lists every control with its result.

**Done when** the spec is green 3 runs in a row.

## F. Her words, read precisely (precise)
**Today:** `backend/app/services/lognote.py` matches words with no idea of "no" or "not", and some patterns match
inside other words:
- "no cramps today" → cramps;
- "not tired" → fatigue;
- "poor sleep" → pain with bowel movements ("poo");
- "calm down" → low mood;
- "room temperature" → fever.

**Build:**
1. **Negation.** "no / not / never / without / don't have / didn't" (and Arabic "ما عندي / ما في / مافي / بدون / لا
   يوجد / ما فيني") within 3 words before a word cancels that field. The reply lists it: "Not logged: cramps (you said
   no cramps)".
2. **Word boundaries** on every English pattern, plus tighter phrases ("feeling down", "high temperature").
3. **When:** "yesterday / أمس / البارحة" sets the log date to yesterday, for her to confirm.
4. **Ask back instead of guessing.** Examples: "Did your period start today?" when she mentions her period with no
   detail; "How bad, 0 to 10?" when she says pain with no number. Each question has answer chips that fill the field.
5. **What kind of message it is** (`intent`):
   - log: the form fills;
   - question: offers "Ask the assistant" with her words;
   - worry: logs and offers the assistant;
   - urgent or crisis: unchanged, red flags first.
6. **The model prompt** follows the same rules. Its reply still passes the fixed vocabulary check; where rules and model
   disagree, she is asked.
7. **A labelled test set,** `backend/tests/lognote_cases.jsonl`: at least 120 sentences in English and Gulf Arabic,
   covering negation, boundaries, time, ambiguity and the urgent words. CI fails if the rules-only reader gets any of
   them wrong.

**Not changed:** the urgent and crisis checks (`safety.py`, `assistant._crisis`) run first on her raw words. Negation
never hides an urgent sign.

## G. Next period: an honest range from her own cycles (precise)
**Today** (`backend/app/services/views.py`): the median of her last 6 cycles. With fewer than 2 cycles it falls back to
28 days and hides the date. With irregular cycles it hides the date.

**Build** (a transparent statistical model on her own data, no fixed 28):
- **2 or more complete cycles, regular:**
  - the centre is the median of her last 6 lengths;
  - the half-width is max(2, ⌈1.4826 × MAD⌉) days, capped at 7;
  - the screen shows "Next period likely 9–13 Dec".
- **Irregular** (the rules' irregular-cycles pattern, a standard deviation over 7 days, or perimenopause): the range runs
  from her shortest to her longest recent cycle. "Your cycles have varied (42–56 days), so this is a wide range." Never
  a fertile window (unchanged).
- **Fewer than 2 complete cycles:** no date. "Log one more period to see a forecast."
- **"How this was worked out"** lists the cycles used. No percentages.
- **Back-test** on the synthetic cohort (`python -m app.services.forecast_eval`):
  - for every woman with 4 or more cycles, predict each cycle from the ones before it;
  - report the mean absolute error in days and how often the real start fell inside the range;
  - label it "on fictional data". The result is stored as JSON and listed in this doc.

**Done when:**
- Unit tests cover each case.
- The back-test runs.
- The wording passes the clinical-copy guard and the chief healthcare officer's review.

## H. Security: close every open finding (watertight)
From `docs/30_SECURITY_ASSESSMENT.md` (kept local until H2 ships; see the showcase note). Each item ships with a test
that fails before the fix.

| ID | Finding | Build |
| --- | --- | --- |
| H2 | Client address forgeable on the API's direct origin; rate limits dodged | `EDGE_SECRET`: the web proxy and server-side calls add `x-rs-edge`. The API trusts the leftmost `X-Forwarded-For` only with a valid edge header (constant-time compare), otherwise the entry the nearest proxy appended. With the secret set, `/v1` without it gets 403 (health checks exempt) |
| H2b | Auth tables can grow without limit | Expired challenges deleted on every insert; demo sign-ins counted in the `sensitive` limit group per client |
| H3 | Anyone can one-tap admin and reset the demo once a minute | With `DEMO_RESET_KEY` set, the reset needs the operator key. The admin screen asks for it only when the API says so |
| M2 | Clinicians' visit notes stored in plain text | Encrypted like her notes (`visit_note_enc`); old rows moved on seed; three readers decrypt |
| M3 | One random signing secret per process when unset | Boot fails without `DEMO_TOKEN_SECRET` when `DEMO_MODE` is off; tokens carry a key id; `DEMO_TOKEN_SECRET_PREVIOUS` verifies during rotation |
| M4 | Field encryption has no key version | Ciphertext gets a key-id prefix; `NOTES_KEY_PREVIOUS` decrypts during rotation; old ciphertext still reads |
| M6 | Uploaded PDFs parsed in the request thread, no time limit | Parsed in a worker process with a time limit (the PDF render pool's pattern); timeout returns 422 "couldn't read this file" |
| M7 | Audit verify loads the whole log on every call | Verifies from a stored checkpoint; the CSV export is paged |
| L3 | `/docs` and `/openapi.json` public | Only with `EXPOSE_API_DOCS=true` (off by default) |
| L4 | `/readyz` publishes counts, provider and the demo flag | Public reply is `{"ok": true}` |
| L6 | Session token returned in JSON bodies | Only to the phone app (it sends `X-RS-Client: mobile`) |
| L7 | Chat history kept in `sessionStorage` after sign-out | Cleared on every sign-out |
| L8 | One clinician note per patient, not per clinic | Keyed by (patient, clinic) |
| L9 | Actions and images pinned by tag | GitHub Actions pinned by commit SHA, Docker images by digest |
| — | No CSP violation reports | `report-to` endpoint that logs violations (no personal data) |
| — | Attack suite | Adds attack 15 (hostile upload must not freeze the API) and 16 (forged client address). `/status` then shows 16 of 16, and the team agrees the new number before merge |

**Waiting on a decision, not built here:**
- **M5:** a Redis-backed rate limiter adds Redis to the stack; CLAUDE.md says ask first.
- **Infrastructure items:** UAE hosting, backups and a penetration test.

## I. Fast and error-free (watertight)
- **`scripts/load_check.py`:** 50 concurrent users over the demo path. Target 95% of requests under 0.8 s locally; the
  report is committed.
- **No 5xx anywhere in the e2e run.** An API error in the browser shows the existing error screen with its request ID.
- **Keeping the live API awake** is a Render setting (paid instance), not code.

---

## Order and gates
1. **Web, low risk:** A, B, C, D, E.
2. **Security and speed:** H, I.
3. **Precision:** F, G. These need the chief healthcare officer's wording review; safety code is not touched, so no G2.

**After each step:**
- backend `ruff` and `pytest` in the CI-mirror container;
- web `lint`, `typecheck` and `test`;
- e2e for the screens touched;
- the senior judge after the last step.

**Merge:** after the showcase, with Krishna's review. The team decides when it goes live.

## Open questions (logged in QUESTIONS.md)
- **66:** Redis for the rate limiter (M5): add it to the stack?
- **67:** `/status` attack count from 14 to 16 once attacks 15 and 16 land: agreed?
- **68:** "Retail IQ" as a design reference: which of Krishna's repos is meant?
