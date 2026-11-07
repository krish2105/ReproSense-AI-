# 21 · Android and iOS apps: roadmap

For Atharva and Krishna, working with Claude Code on Opus 5.5. Written 6 Nov 2026 (evening).
Same rules as `docs/18_ROADMAP_TO_95.md`: its gates G1–G7, its session opener and its card format apply here too.

## 0. Read this first

### The recommendation in one paragraph
- **Build her app** (the patient side) as **one Expo (React Native) app** for both iOS and Android, in `apps/mobile`, talking to the same FastAPI API.
- **Start after the showcase.**
  - Before 22 Nov, every hour goes to the cards in docs/18. Native work in build week would put the live demo at risk.
  - What can start now is card M0 (store accounts, which take days to verify) and, in build week, the small PWA card (M-PWA), so judges can add the web app to a phone's home screen.
- **Target dates:**
  - Internal testing builds (TestFlight and Google Play internal testing) about 4 weeks after the showcase.
  - A public store release only after UAE hosting, a privacy policy and the first clinic agreement. That rule exists because real women's data must never sit on the demo stack.

### Why Expo (React Native), and not the alternatives
| Option | Verdict | Reason |
| --- | --- | --- |
| **Expo (React Native) + expo-router + TypeScript** | **Chosen** | One codebase for iOS and Android. TypeScript like the web. Reuses the API, its OpenAPI types and our message files (`use-intl` is the core of next-intl and runs in React Native). EAS builds, submits and updates without a Mac for Android. |
| Capacitor wrapping the Next.js site | Rejected | Our web app renders on the server, so a wrapper would just load the website. Apple's App Review guideline 4.2 (minimum functionality) rejects apps that are a website in a frame. |
| Native Swift + Kotlin | Rejected | Two codebases and two sets of tests for a two-person team. |
| Flutter | Rejected | A new language (Dart) and no sharing with our TypeScript, messages or types. |

**Gate G2:** adding a mobile app extends the stack decided in CLAUDE.md. Krishna approves this choice before card M1 starts.

### What already exists that the apps reuse
- **The API:**
  - It accepts `Authorization: Bearer <token>` as well as the web cookie (`backend/app/security/auth.py`, `current_actor`), so the app needs no new auth on the server.
  - It publishes `/openapi.json`, so the app's types are generated, not hand-written.
- **Demo login:** `POST /v1/demo/login` with `{"persona": "noura"}` returns a token, so judges and testers can open any of the 8 fictional women.
- **Copy:** `apps/web/messages/en.json` and `ar.json` are the one source of truth for every string, Arabic included.
- **Design:** E · Mauve Pro (docs/06): Plus Jakarta Sans (IBM Plex Sans Arabic in RTL), plum `#4B3653`, four phase colours, round cards, pill buttons, a floating tab bar.
- **Safety:** the same API means the same rules, red flags, crisis path and guards. The app never decides anything clinical itself.

## 1. Scope of version 1: her app, every feature working

| Web route (today) | Mobile screen | Native piece | Must work |
| --- | --- | --- | --- |
| `/demo` | Demo people | — | Pick any of the 8 women; "Reset demo data" |
| `/join` | Join | `expo-camera` (scan the clinic QR) | Consent screens; AI unticked by default (Q46); clinic chosen from the QR |
| `/app` | Home | `react-native-svg` | Cycle arc; week strip; the five stage tabs; today's recommendation; mood row; record strength |
| `/app/log` | Log today | Haptics on save | Flow, pain 0–10, body map, symptoms, impact, sleep, note; red flags appear at once after saving |
| `/app/timeline` | Calendar and analytics | `react-native-svg` | Cycle-length line with the 21–35 day band, pain bars, 12-month timeline, all to scale, with a text summary for screen readers |
| `/app/insights` | Patterns | — | Cards with evidence (tap a day to open it), "How this was produced", questions for her doctor, "Draft my appointment request" (draft only, never sent) |
| `/app/assistant` | Assistant | Keyboard dictation | Citations under every answer; the 998 strip always above the input; **Call 998** opens `tel:998` |
| `/app/report` | Report | `expo-file-system`, `expo-sharing` | Prepare; download and share the PDF; share link with a clinic; stop sharing; the opening log |
| `/app/documents` | Lab reports | `expo-image-picker` / camera | Add a lab report photo; confirm the values she sees |
| `/app/checkin` | Mood check (EPDS) | `tel:998` | Item 10 above 0 opens the crisis path, never a pattern card (CLAUDE.md rule 5) |
| `/app/privacy` | Privacy centre | `expo-local-authentication` | AI switch; consents per clinic; export; delete (after sign-in, #27); **app lock with Face ID / fingerprint** (new, opt-in) |
| Sign-in (#27, build week) | Sign in | `expo-secure-store` | Email one-time code; the same record on phone and web |
| Footer, `/trust`, `/status` | Settings → About | `expo-web-browser` | AI disclosure, "Demo data — fictional", links to trust and status |

**Out of v1, on purpose:**
- **The clinician view and the clinic network** stay on the web, because clinicians work at desks. A tablet companion is card M11, later.
- **3D:** the app shows the posters, not the WebGL scenes.
- **Push notifications:** none in v1. If reminders come later, they must be generic ("Time to log today"), never health details on a lock screen.
- **Offline:** no health data is stored on the phone. The only thing kept on the device is the token, in the Keychain or Keystore through `expo-secure-store`.

## 2. Gates for the apps (on top of G1–G7)
| Gate | Rule |
| --- | --- |
| M-G1 Store honesty | The store listing, screenshots and in-app copy never claim to diagnose, predict or treat. Use the same "pattern worth discussing" language and the clinical-copy-guard skill. Apple reviews medical apps more strictly (App Review guideline 1.4.1, physical harm), and Google Play asks health apps for a declaration. Read the current text of both before submitting. |
| M-G2 Health data | Health data is never used for advertising, never stored in iCloud or a device backup, and never sent to analytics or crash tools. Apple's guideline 5.1.3 covers this. The privacy labels (Apple) and the Data safety form (Google) must match what the app really does. |
| M-G3 Synthetic until hosting moves | Store builds point at the demo API with synthetic data and keep the "Demo data — fictional" badge, until production runs on UAE hosting (docs/07) with agreements in place. |
| M-G4 Zero alignment issues | No screen merges until it passes the layout checks in section 3 on every device in the matrix, in EN and AR, light and dark. |
| M-G5 Safety parity | The red-flag and crisis tests that pass on the web pass on both platforms: 998 visible, `tel:998` works, the crisis path opens for EPDS item 10. |

## 3. "Zero alignment issues": how we make it true
1. **One set of tokens.** A script generates `apps/mobile/src/theme/tokens.ts` from the web's CSS variables (colours for both themes, radii, spacing on a 4-point grid, the type scale). No colour, size or radius is written by hand in a component.
2. **Layout rules, enforced by lint:**
   - Use only `start` and `end` (`marginStart`, `paddingEnd`, `start: 0`). An ESLint `no-restricted-syntax` rule rejects `left`, `right`, `marginLeft`, `paddingRight` and `textAlign: "left"`.
   - Use flexbox and avoid absolute positions, except for the floating tab bar.
   - Text always wraps, and no text box has a fixed height.
   - Numbers use tabular figures (`fontVariant: ["tabular-nums"]`).
3. **Safe areas and the keyboard.** Every screen sits in `react-native-safe-area-context`; the tab bar floats above the home indicator; forms use a keyboard-aware scroll view.
4. **Text size.** Every screen works at 200% system text size (`allowFontScaling` on; chips capped at `maxFontSizeMultiplier` 1.5).
5. **Right to left:**
   - Turn on `I18nManager.forceRTL` when she picks Arabic, then reload with `expo-updates`.
   - Direction icons (chevrons, arrows) mirror.
   - Numbers and dates stay left to right inside Arabic text, using Unicode isolates, as the web does.
6. **Touch and contrast.** Every tap target is at least 44 × 44 pt, and body text has a contrast ratio of at least 4.5:1 in both themes, as on the web.
7. **Screenshot matrix on every PR that touches UI.** Maestro flows run on the devices below, in EN and AR, light and dark. Each run is compared with approved baselines (pixel diff, threshold 0.1%).

   | Profile | Size (points) | Why |
   | --- | --- | --- |
   | iPhone SE (3rd gen) | 375 × 667 | The smallest iPhone still in use; no notch |
   | iPhone 16 Pro Max | 440 × 956 | The largest iPhone; Dynamic Island |
   | Pixel 8 | 412 × 915 | Standard Android |
   | Small Android | 360 × 640 | The smallest common Android width |
   | iPad mini (portrait) | 744 × 1133 | Checks the layout doesn't stretch |

8. **Two real phones before every store build:** one iPhone and one Android phone, the full demo path in both languages. Record the result in BUILD_STATUS.md.

## 4. Cards

### Mobile session opener (paste first, then the card)
```text
You are working in the ReproSense AI repository with me. First read CLAUDE.md, HANDOFF.md (sections 0 and 7),
docs/18_ROADMAP_TO_95.md (sections 0 and 1: gates and the session opener rules apply) and docs/21_MOBILE_APPS_ROADMAP.md
(sections 0-3 and the card I name below). Then: git switch main && git pull, and create the branch the card names.
Rules: the gates in docs/18 and docs/21 apply. Never diagnose, no probabilities, every health answer cites a source,
synthetic data only, 998 always visible, the crisis path for EPDS item 10. Use only the existing API: never move a
clinical decision into the app. Load the no-ai-slop-ui and clinical-copy-guard skills for any screen or copy; the
women-care-lead agent reviews every screen, the chief-healthcare-officer agent reviews any health wording.
Test first. Before you say a card is done, run in apps/mobile: npm run lint && npm run typecheck && npm test, and the
card's Maestro flows on one iOS simulator and one Android emulator, and show the output. Update BUILD_STATUS.md and
PROGRESS.md, push, open a PR with gh pr create ("Part of #<issue>"). Commit as me; no AI co-author or "Generated
with" lines. Card:
```

#### M0 · Store and build accounts · Krishna · start now (no code, outside G1) · #50
1. **Apple Developer Program:** enrol now. It costs USD 99 a year; an individual enrolment usually takes a day or two, and an organisation needs a D-U-N-S number.
2. **Google Play Console:** USD 25, paid once. Identity verification can take several days, so start now.
3. **Expo account** for EAS builds. The free plan has a limited number of builds a month and a slower queue.
4. **App IDs:** reserve the bundle ID and package name (for example `ae.reprosense.app`; Krishna decides).
5. **Privacy policy:** it lives on the web at `/trust` (or a new `/privacy` page) and is linked from both store listings.
6. **Secrets stay in EAS:** the App Store Connect API key and the Play service-account JSON live in **EAS secrets**, created by Krishna. They never go in the repo or in chat.
- **Done when:** both developer accounts are verified and the IDs are reserved.

#### M-PWA · Install the web app on a phone (build week, optional, 2 h) · Atharva · #51
```text
Card M-PWA. Branch: build-week/pwa. A feature, so only from 17 Nov (G1). Add a web app manifest
(apps/web/src/app/manifest.ts: name ReproSense, short_name ReproSense, start_url /demo, display standalone,
theme and background colours from the tokens, icons from apps/web/public/images/icons in 192 and 512 px, maskable),
the apple-touch-icon and apple-mobile-web-app tags, and nothing else (no service worker, no offline cache of
health data). Test: an e2e check that /manifest.webmanifest returns the fields, and Lighthouse stays >= 90.
```

#### M1 · Scaffold `apps/mobile` · Atharva · 1 day · Effort: high · #52
```text
Card M1. Branch: mobile/scaffold. Krishna approved Expo in docs/21 (gate G2). Create apps/mobile with the newest
stable Expo SDK and expo-router (TypeScript strict), as a standalone package like apps/web (with .npmrc
node-linker=hoisted if you use pnpm). Add: ESLint (including the no left/right style rule from docs/21 section 3),
Jest with @testing-library/react-native, expo-font with Plus Jakarta Sans and IBM Plex Sans Arabic, a script that
generates src/theme/tokens.ts from the web's CSS variables (light and dark), a ThemeProvider using
useColorScheme, and a GitHub Actions job "mobile" (lint, typecheck, unit tests) that runs only when apps/mobile
changes. One screen only: a "Demo data — fictional" badge and the app name, in EN and AR, light and dark.
Done when CI is green and a development build opens on an iOS simulator and an Android emulator.
```

#### M2 · API client, demo login, sign-in · Atharva · 1 day · Effort: high · #52
```text
Card M2. Branch: mobile/api. Generate src/api/schema.ts from the API's /openapi.json with openapi-typescript (a
script, re-run in CI to catch drift). Write src/api/client.ts: base URL from EXPO_PUBLIC_API_URL, a 15-second
timeout like the web (API_TIMEOUT_MS), typed errors, Authorization: Bearer <token>. Store the token only in
expo-secure-store. Demo login: POST /v1/demo/login {persona} and the Demo people screen listing the 8 women from
the API. If #27 (sign-in) is merged, add the email one-time code screens; otherwise write in BUILD_STATUS.md that
mobile sign-in follows #27, and ship nothing half-built in the app. Error, loading and empty states on every call.
Tests: client unit tests with a mocked fetch (timeout, 401, 5xx), and a Maestro flow: open the app, pick Noura,
see her name.
```

#### M3 · Home, stage tabs and the tab bar · Atharva · 2 days · Effort: high · #53
```text
Card M3. Branch: mobile/home. Load mauve-charts. Port the cycle arc from the web (apps/web/src/components, the
same math) to react-native-svg; the week strip; the five stage tabs; today's recommendation; the mood row; record
strength. A floating tab bar (Home, Calendar, Analytics, Patterns, Assistant, Report) above the safe area. Every
number comes from the API; phases say "estimate"; "Phase estimates are not contraception" stays. Tests: unit tests
for the arc geometry, and Maestro screenshots of Home for all 8 personas on the docs/21 device matrix, EN and AR,
light and dark.
```

#### M4 · Logging, calendar and analytics · Atharva · 2 days · #53
```text
Card M4. Branch: mobile/log. The daily log (flow, pain 0-10 slider, body map, symptoms, impact, sleep, note) with
the same validation as the web; after saving, a red flag shows at once with 998 first (test it with Sara's
heavy-bleeding-and-dizziness case and with "sudden severe pain" while trying to conceive). Calendar and analytics
charts (cycle-length line with the 21-35 band, pain bars, 12-month timeline) to scale, with a text summary for
screen readers. Tests: unit tests for the form; Maestro: log a day, see it on the calendar, see the red flag.
```

#### M5 · Patterns, evidence and drafts · Atharva · 1.5 days · #53
```text
Card M5. Branch: mobile/patterns. Pattern cards with "Worth discussing", the explanation, the evidence days (tap a
day to open that entry), the source links, "How this was produced", questions for her doctor, and "Draft my
appointment request", which only shows a draft she can copy or share herself (the care navigator never sends).
Tests: Maestro for Noura (2 cards, 8 and 12 entries) and Amina (the calm "nothing flagged" state).
```

#### M6 · Assistant · Atharva · 1.5 days · Effort: high · #54
```text
Card M6. Branch: mobile/assistant. Chat with the same API; citations under each answer, opening the source in
expo-web-browser; suggested questions; the 998 strip always visible above the input, with a Call 998 button using
Linking.openURL("tel:998"); the AI switch from the privacy centre respected. Tests: a Maestro flow for "What counts
as a heavy period?" (3 sources), a crisis message (the support reply, 998, no pattern cards), and an urgent one.
```

#### M7 · Report and sharing · Atharva · 1 day · #54
```text
Card M7. Branch: mobile/report. Prepare the report, download the PDF with expo-file-system (bearer token header),
open the share sheet with expo-sharing, create and stop a share link with a clinic, and show the opening log.
Tests: Maestro: prepare, download (file exists, size > 10 KB), share sheet opens, stop sharing updates the list.
```

#### M8 · Join, lab reports, mood check, privacy and app lock · Atharva · 2.5 days · Effort: high · #54
```text
Card M8. Branch: mobile/join-privacy. Join with consent screens and the clinic QR scan (expo-camera); AI unticked
by default. Lab reports: add a photo (expo-image-picker or camera) and confirm the values. Mood check (EPDS): item
10 above 0 opens the crisis path with 998, never a pattern card. Privacy centre: the AI switch, consents per
clinic, export, delete (after sign-in), and an opt-in app lock with Face ID or fingerprint
(expo-local-authentication) that also hides the app preview in the app switcher. Tests: Maestro for join via a
test QR, EPDS item 10 = 1 opens the crisis path, the app lock prompts on reopen.
```

#### M9 · Arabic, right to left, dark mode, accessibility: the zero-alignment pass · Atharva · 2 days · #55
```text
Card M9. Branch: mobile/polish. Run the full docs/21 section 3 matrix on every screen: 5 devices x EN/AR x
light/dark, plus 200% text size, VoiceOver on iOS and TalkBack on Android. Fix every clipped, overlapping,
misaligned or unlabelled element; approve the screenshot baselines in apps/mobile/e2e/baselines. The women-care-lead
agent reviews the Arabic screens; strings not yet reviewed by a native speaker stay marked AR-REVIEW in
docs/AR_REVIEW.md. Done when the matrix shows zero diffs above threshold and zero accessibility errors.
```

#### M10 · Build and release to testers · Krishna (accounts) + Atharva (builds) · 1–2 days · #56
```text
Card M10. Branch: mobile/release. Add eas.json with three profiles: development (dev client), preview (internal
distribution) and production. Version and build numbers from app.config.ts. Store listing text written with the
clinical-copy-guard skill (no diagnostic claims), screenshots from the M9 matrix, the privacy labels (Apple) and the
Data safety form (Google) filled from what the app really does, and review notes with the demo login. EAS Update
channels for preview and production. Do not put any Apple, Google or Expo credential in the repo: Krishna adds them as
EAS secrets.
```
- **Krishna:** `eas login`, then `eas submit` for each platform. Apple's two-factor prompt and the Play service account are his steps.

#### M11 · Clinician companion on tablet (later, optional)
- A read-only pre-visit summary for an iPad or Android tablet, built after v1 ships.

## 5. Build and deploy runbook (EAS)
Run these in `apps/mobile`. Every account step belongs to Krishna, and every secret lives in EAS.

```bash
npx eas-cli@latest login
```
```bash
npx eas-cli@latest build:configure
```
```bash
npx eas-cli@latest build --platform ios --profile preview
```
```bash
npx eas-cli@latest build --platform android --profile preview
```
```bash
npx eas-cli@latest submit --platform ios --latest
```
```bash
npx eas-cli@latest submit --platform android --latest
```
```bash
npx eas-cli@latest update --branch preview --message "Fixes from the tester round"
```

- **iOS:** the build goes to TestFlight. Add the testers in App Store Connect.
- **Android:** the build goes to the internal testing track in the Play Console.
- **EAS Update** ships JavaScript-only fixes to testers without a new store review. Changing native modules needs a new build.

## 6. Timeline and GitHub issues
| When | Cards | Who |
| --- | --- | --- |
| Now | M0 accounts (they take days to verify) | Krishna |
| Build week (optional) | M-PWA | Atharva |
| 23 Nov – 6 Dec | M1, M2, M3, M4 | Atharva with Opus 5.5 |
| 7 – 20 Dec | M5, M6, M7, M8, M9 | Atharva with Opus 5.5 |
| By about 23 Dec | M10: TestFlight and Play internal testing, synthetic data | Krishna + Atharva |
| Q1 2027 | Public store release, after UAE hosting, the privacy policy and the first clinic agreement (M-G3) | Team |

The GitHub issues for these cards are in the milestone **Mobile apps (after 22 Nov)**, apart from M-PWA, which is in Build week:

| Issue | Cards | Assigned to |
| --- | --- | --- |
| #50 | M0 store and build accounts | Krishna |
| #51 | M-PWA install the web app on a phone | Atharva |
| #52 | M1–M2 scaffold, tokens, API client, demo login | Atharva |
| #53 | M3–M5 home, logging, calendar, analytics, patterns | Atharva |
| #54 | M6–M8 assistant, report, join, mood check, privacy, app lock | Atharva |
| #55 | M9 zero-alignment pass | Atharva |
| #56 | M10 TestFlight and Play internal testing | Atharva (builds) and Krishna (accounts) |

## 7. Risks
| Risk | What we do |
| --- | --- |
| Store review rejects a health claim | Copy through the clinical-copy-guard skill; review notes explain "information, not a diagnosis" and give the demo login |
| Google identity verification is slow | M0 starts now |
| RTL bugs that appear only on device | The M9 matrix plus two real phones before every build |
| Scope creep before the showcase | No native work before 22 Nov except M0 and M-PWA |
| A phone stores health data by accident | The only thing on the device is the token in SecureStore; a test checks AsyncStorage holds no record data |
