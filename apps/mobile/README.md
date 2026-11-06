# ReproSense phone app (iOS and Android)

Her side of ReproSense as one Expo (React Native) app for iOS and Android, using the same FastAPI API as the web app.
The plan, the gates (M-G1 to M-G5) and the cards (M0 to M11) are in `docs/21_MOBILE_APPS_ROADMAP.md`.
The clinician view and the clinic network stay on the web.

Expo SDK 58 · React Native 0.88 · React 19 · TypeScript strict · expo-router · react-native-svg · use-intl
(the same EN/AR messages as the web).

## Run it

You need Node 24, the API on :8010 (`make api` in the repository root), and either Xcode (iOS simulator), Android
Studio (an emulator), or Expo Go on a phone on the same network.

```bash
npm install
```
```bash
npx expo start
```

Press `i` for the iOS simulator or `a` for the Android emulator. The app finds the local API at `127.0.0.1:8010` (iOS
simulator) or `10.0.2.2:8010` (Android emulator). For a phone, or for the live API, set the addresses:

```bash
EXPO_PUBLIC_API_URL=https://reprosense-api.onrender.com EXPO_PUBLIC_WEB_URL=https://reprosense.vercel.app npx expo start
```

`EXPO_PUBLIC_WEB_URL` is the site for the trust centre, the status page and shared-report links. A development build
without `EXPO_PUBLIC_API_URL` links shared reports to the local web app on :3000, because the web app that opens a
shared link must talk to the API that issued it.

## Checks (CI job `mobile`, `.github/workflows/mobile.yml`)

```bash
npm run lint && npm run typecheck && npm test && npm run sync:check
```

- **lint:** Expo's rules plus our layout rule: no `left`, `right`, `marginLeft`, `paddingRight` or `textAlign: "left"`
  in styles. Use `start` and `end`, so Arabic mirrors correctly (docs/21 section 3).
- **test:** 20 unit tests, covering:
  - the API client: bearer token, no cookies, timeout, 401;
  - safety: 998 strip, urgent and crisis answers, red-flag cards;
  - the care navigator: approve first, copy only after;
  - storage: only four keys, kept on this device;
  - the clinic QR parser and the chart labels.
- **sync:check:** the app copies these from the web app, so the two never drift:
  - API types and shared helpers (arc geometry, formatting, vocabulary, EPDS items, answer parser, cited sources);
  - the EN/AR messages and the demo lab report;
  - the colour tokens, generated from `apps/web/src/app/globals.css`.
  
  Edit the web file, then run `npm run sync`.

## What is built (6 Nov 2026)

Verified on the iPhone 17 Pro simulator (iOS 26.5) against the local API with the seeded fictional data, in English
and Arabic, light and dark. Android has not been run yet (see "Not done").

| Screen | What works |
| --- | --- |
| Demo people | The 8 fictional women. "Start your own record" opens Join. "Reset demo data" asks first, and uses an admin token once without storing it. |
| Join | Three steps like the web, with the same checks. The clinic comes from its patient QR code (camera) or the link `reprosense://join?clinic=<id>`. Sharing and AI both start off. The new record's token goes to SecureStore (the API now returns it, as `/demo/login` does). |
| Home | Red flags and the crisis card first. Then: the stage switch (fictional people only), week strip, cycle, pregnancy or after-birth arc, and the RF5 pregnancy warning with Call 998. Below: the mood-check card (pregnancy and after birth), the care-navigator card for the pattern that is due, recommendations, mood row, hot-flush count (perimenopause), top patterns and record strength. |
| Patterns | Red flags pinned first; pattern cards with evidence days (tap opens the day), what to consider, questions, sources, "How this was produced" (rule, version, the numbers used, the 7 steps), "Draft my appointment request" and "Ask the assistant". |
| Care navigator | Finds her open draft or drafts one. Approve or discard; copy only after approval. "Nothing was sent". |
| AI Chat | Follows the AI switch in Privacy each time the tab opens. Answers carry [n] markers and source links. Urgent and crisis replies lead with Call 998; crisis is support only. The 998 strip always sits above the input. |
| Report | Prepare, preview, download the PDF with her token and open the share sheet. Share for 7 days after a consent switch; the list shows active, expired and stopped shares. The link can be copied. Stop sharing. Visit mode shows the S-B-A-R summary and a QR code of the shared link for the doctor. |
| Log | Flow with bleeding-score items, pain 0–10, sites, symptoms, impact, sleep, a note and "Fill the form from my sentence". After saving, the screen scrolls to the result, so red flags (998 first) show at once. A haptic confirms the save, and a different one marks urgent guidance. |
| Calendar and analytics | 3, 6 or 12 months. Cycle length line with the 21–35 band, pain bars, and bleeding-score bars with the 100 line, all to scale. Each has a one-line summary, tap for the exact value, and a table view. Logged days follow. |
| Lab reports | Choose a PDF or text file (the API does not read photos yet), or Fatima's fictional demo report. Check and edit each value, then confirm. Nothing is saved before she confirms. |
| Mood check (EPDS) | The 10 standard items with the citation. Item 10 above 0 opens the crisis card with 998 and NICE CG192, never a score. |
| Privacy | Promises; AI, clinic-sharing and research choices; the opt-in app lock; who saw my data, with date and time (a doctor opening her share link shows as "Someone with your share link"); what is stored; JSON export through the share sheet; delete with confirmation. |
| More | Lab reports, calendar, mood check, privacy, about (AI disclosure, "Demo data — fictional", 998), trust centre and status (in-app browser), switch person. |

## Privacy on the phone (gate M-G2)
- **What the phone keeps:** only the sign-in token and three display settings (language, theme, app lock), in the
  Keychain or Keystore through `expo-secure-store`. They are this-device-only: no iCloud Keychain, no restore onto
  another phone. Android device backup is off (`allowBackup: false`).
- **No cookies.** API calls send `credentials: "omit"`, so the bearer token is the only session.
- **Nothing else is stored.** No health record, no analytics, no crash reporting, no push notifications.
- **App lock (opt-in):**
  - Face ID, a fingerprint or the passcode each time the app comes back from the background.
  - iOS shows a plain cover in the app switcher.
  - Android hides the app from recents thumbnails (FLAG_SECURE).

## Not done yet (honest list)
1. **Android:** not run on an emulator or phone yet. This Mac has no Android SDK. Run `npx expo start` and press `a`,
   or make a preview build.
2. **Arabic layout switch in Expo Go:**
   - Expo Go applies its own direction settings each time the app loads, so switching to Arabic inside Expo Go changes
     the words but not the layout, and the top bar asks her to reopen the app.
   - Development and store builds use expo-localization's native setup, which keeps the app's own switch.
   - To check the Arabic layout in Expo Go, add `"forcesRTL": true` under `expo.extra` in `app.json` for that session
     only, and remove it afterwards. The Arabic screens were checked that way on 6 Nov.
3. **Not checked on the simulator:**
   - The camera scan of a real clinic QR: the simulator has no camera. Join was tested through the app link instead.
   - Turning the app lock on: needs Face ID enrolled. The "no Face ID" message was checked.
4. **Not built yet:**
   - Sign-in with an email code: follows #27.
   - Maestro flows and the screenshot matrix (card M9).
   - The body-map picture: the phone uses labelled site buttons.
   - The month calendar grid: the phone lists logged days.
5. **Arabic strings only the phone uses** (`src/i18n/mobile.ar.json`): listed in `docs/AR_REVIEW.md` for the native
   review.

## Build for testers and the stores (card M10)

The profiles are in `eas.json`:
- **development:** an iOS simulator build and an Android APK, for the local API.
- **preview:** internal distribution, using the live API.
- **production:** the store build.

Every Apple, Google and Expo credential stays in EAS (Krishna's accounts, card M0). None goes in this repository.

```bash
npx eas-cli@latest build --platform ios --profile preview
```
```bash
npx eas-cli@latest build --platform android --profile preview
```

Store builds keep the "Demo data — fictional" badge and point at synthetic data until production runs on UAE hosting
(gate M-G3).
