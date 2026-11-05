---
name: web-screen
description: Use when adding or changing any screen, route or component in apps/web (the Next.js app). The ReproSense recipe for data flow, i18n, states, safety copy, accessibility, Arabic RTL, dark mode, tests and the browser check before a PR.
---

# Building a screen in apps/web

Load `no-ai-slop-ui` and `clinical-copy-guard` first. Charts: `mauve-charts`. 3D: `mauve-3d`.
The source of truth for routes and APIs is HANDOFF.md §5; the visual reference is `mockup/template.html`.

## 1. Where things go
| What | Where |
| --- | --- |
| Patient screens (role `patient`) | `src/app/app/**` — the layout calls `requireRole("patient")` |
| Clinician screens | `src/app/clinic/**` — `requireRole("clinician")` |
| Network admin | `src/app/admin/**` — `requireRole("admin")` |
| Public pages (demo roster, tokens, landing, shared report) | `src/app/(site)/**` |
| Shared UI | `src/components/ui/*` (Button, Tag, Box, Panel, Dialog, Toast, Pills, Seg, Skeleton, EmptyState, ErrorState, UrgentCard, Icon) |
| Header, footer, badge, toggles, tab bar | `src/components/chrome/*` |
| API types | `src/lib/api/types.ts` (check every field against a live `curl` first) |
| Strings | `messages/en.json` + `messages/ar.json` (same keys) |

Never import a clinician component into `/app` or the reverse (CLAUDE.md rule 9).

## 2. Data
- Server components: `apiServer<T>(path, {query, method, body})`. It forwards only the `rs_token` cookie, as a cookie
  (the API rate limiter keys on it). `getSession()` and `getPersonas()` are cached per request.
- Client mutations: `apiClient<T>(path, {body})` through the same-origin proxy `/api/v1/*`, then `router.refresh()`.
- "Today" is the API's `ref_date` (2026-11-22). Never use `new Date()` for anything a judge sees.
- Errors: `ApiError.status` + `.detail` (FastAPI's message). 401 means the demo session expired → link to `/demo`.

## 3. Look
- Use the mockup classes in `src/app/globals.css` (`.box .obs .tag .btn-a .btn-o .pills .seg .chips .dp .msg .askbar .sbar .figs` …).
  Tailwind utilities are for layout glue only; the default palette is switched off, so only token colours exist.
- No new radii, shadows, gradients on text or buttons, or emoji (except the mood row). One icon set: `<Icon name=…/>`.
- The badge and the footer come from the layouts. Every page has exactly one `h1`.

## 4. Copy
- Every visible string, `aria-label` and `alt` comes from messages. `pnpm test` checks key parity, ICU arguments and
  the banned diagnostic phrases (TypeScript port of `backend/app/ai/guards.py` in `src/lib/copy-guard.ts`).
- Clinical text from the API (cards, answers, SBAR, red-flag text) is rendered as-is, never rewritten.
  Give API text `dir="auto"`, and put names or values inside sentences through `isolate()` (or `<bdi>` in JSX),
  otherwise English names break inside Arabic ("Noura A." became ".Noura A" before this rule).
- Arabic: Modern Standard Arabic; feminine address on her screens; neutral forms in shared chrome; Western digits
  (`src/lib/format.ts`). Mark new Arabic as AR-REVIEW in the PR.
- Labels name the exact action ("Open Noura's record", "Approve draft"); the toast repeats the same verb.

## 5. Safety (CLAUDE.md rules 1, 5, 11)
- Red flags render first, with `UrgentCard` (the action sentence and `tel:998` come first, never behind a tap).
- Crisis (EPDS item 10 or RF4): the crisis screen only, with no score and no pattern card.
- The care navigator only drafts: statuses are `draft | approved | discarded`; after approval say "Nothing was sent".
- Never write "you have <condition>", probabilities or "cure". Observations say "a pattern worth discussing".

## 6. States (every screen)
- No route-level `loading.tsx`: in Next 15.5 its streamed boundary raced with hydration on full page loads (React
  #418; research notes §6). Navigation feedback comes from `LinkPending` inside every `Link` (tab bar, header nav,
  `ButtonLink`, list rows). Use `Skeleton`/`LoadingRegion` inside a component for client-side loading.
- Empty: `EmptyState` says what will appear and how to add the first entry.
- Error: `ErrorState` says what happened and how to fix it, with a retry. Errors never apologise.
- Pending buttons: `pending` prop (disabled + `aria-busy`).
- Rule 8: no dead links. Flip `ready: true` in `TabBar.tsx` only when the screen exists.

## 7. Accessibility, RTL, responsive
- Text in a tone colour uses the text shades (`--faint-text`, `--accent-text`, `--warn-text`, `--ok-text`); the
  plain tokens are for fills, marks and borders (QUESTIONS #42). Wide tables go in `TableScroll` (named, focusable).
- An `aria-label` must contain the visible text, starting with it (WCAG 2.5.3, axe label-content-name-mismatch).
- After a demo login, open the area with `enterAs()` (full load); links into `/app`, `/clinic`, `/admin` from public
  pages never prefetch (`isSignedInArea`).
- Dialogs: the `Dialog` component (native `<dialog>`: Esc, focus in and back, inert page). Toasts: `useToast()`.
- Focus must not hide behind the fixed tab bar (`scroll-padding-bottom` is set when it exists). Targets ≥ 24px, aim
  for 44px (`.hit` extends a hit area without changing the drawing).
- Colour is never the only signal: tags carry words; chart series carry labels.
- Check 320, 390 and 1280 px: `document.documentElement.scrollWidth === clientWidth`. Mockup breakpoints: 980/760/540.
- Both themes are designed: switch with the header toggle (cookie `rs_theme`) and look again.

## 8. Before the PR
1. `cd apps/web && pnpm lint && pnpm typecheck && pnpm test && pnpm build`, and `make test` at the root.
   Then `PW_CHANNEL=chrome pnpm e2e` with the API on :8010 and `pnpm start -p 3100` (both reused when running): the
   demo path, every key screen in EN/AR/dark through axe, the 998 red flag and the 3D fallbacks, at 1280 and 390 px.
2. Run it: API with a background shell (`cd backend && DYLD_FALLBACK_LIBRARY_PATH=/opt/homebrew/lib uv run uvicorn app.main:app --port 8010`),
   web with `pnpm dev`. The desktop preview launcher cannot start servers inside `~/Downloads`; open the URL in the browser pane instead.
3. In the browser: EN and AR, light and dark, 390 and 1280, zero console errors, every button does what it says.
   The pane's screenshot can lag one step after a client-side change; take a second screenshot before judging.
4. Walk the `no-ai-slop-ui` banned list; record "UI slop check: pass/fail" in PROGRESS.md.
5. Branch `web/phase-N-<slug>`, PR body says `Closes #N`, no AI co-author lines; merge only when CI is green.
