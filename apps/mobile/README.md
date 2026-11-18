# ReproSense phone app (iOS and Android)

Her side of ReproSense as one Expo (React Native) app for iOS and Android, using the same FastAPI API as the web app.
The plan, the gates (M-G1 to M-G5) and the cards (M0 to M11) are in `docs/21_MOBILE_APPS_ROADMAP.md`.
The phone has her app and a demo clinician view (patient list and one patient's summary); the clinic network
dashboard stays on the web.

Expo SDK 58 · React Native 0.88 · React 19 · TypeScript strict · expo-router · react-native-svg · use-intl
(the same EN/AR messages as the web).

## Run it

The app talks to the **live demo API** (`https://reprosense-api.onrender.com`) unless you say otherwise, so you don't
need the backend on your Mac. That API runs on Render's free tier and sleeps when idle: the app's first call is
`GET /healthz`, retried for up to 60 seconds behind a "Waking the demo server" screen (998 stays one tap away), with
"Try again" if it never answers.

Demo sign-in works as on the web: `POST /v1/demo/login` with `{"persona":"noura"}` (her app) or `{"role":"clinician"}`
(the clinician view). The API returns the token in JSON and the app sends it as `Authorization: Bearer …`, which the API
accepts in place of the `rs_token` cookie (`backend/app/security/auth.py`, `current_actor`). Tokens are never logged.

You need Node 24 (or newer) and, once, the app's packages:

```bash
cd apps/mobile && npm install
```

### iOS Simulator (Mac)

You need the full **Xcode** from the Mac App Store; the Command Line Tools alone are not enough. After installing it:

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```
```bash
sudo xcodebuild -license accept
```
```bash
xcodebuild -downloadPlatform iOS
```

Then build and open the app in the simulator (the first build takes a few minutes; it generates `ios/`, which is not
committed):

```bash
npx expo run:ios
```

Or, without a native build, open it in Expo Go inside the simulator: `npx expo start`, then press `i`.

### Your own iPhone with Expo Go (quickest, no Apple account)

1. Install **Expo Go** from the App Store. It must support Expo SDK 58.
2. On the Mac: `npx expo start --tunnel` (`--tunnel` works on any network; on the same Wi‑Fi `npx expo start` is
   enough).
3. Scan the QR code with the iPhone's Camera app. The app opens in Expo Go and talks to the live API.

In Expo Go, switching to Arabic changes the words straight away, but the right-to-left layout needs a development or
Release build (see "Not done yet" below).

### Your own iPhone as an installed app (a development or Release build)

Xcode signed in with your Apple ID (Xcode → Settings → Accounts); a free Apple ID works for 7 days at a time.
1. Plug the iPhone in, unlock it, and turn on Settings → Privacy & Security → Developer Mode.
2. Build and install it. A Release build carries its own JavaScript, so it runs without the Mac afterwards:
   ```bash
   npx expo run:ios --device --configuration Release
   ```
   Pick the iPhone from the list. If Xcode asks for a team, open `ios/ReproSense.xcworkspace`, choose your Personal
   Team under Signing & Capabilities, and run the command again.
3. The first time, trust the developer on the iPhone: Settings → General → VPN & Device Management.

### Against a local API instead

Start the API on :8010 (`make api` in the repository root), then point the app at it:

```bash
EXPO_PUBLIC_API_URL=http://127.0.0.1:8010 npx expo start
```

Use `http://10.0.2.2:8010` for the Android emulator, or the Mac's Wi‑Fi address for a phone (details under "Install
the iOS app without Expo Go"). `EXPO_PUBLIC_WEB_URL` sets the site for the trust centre, the status page and
shared-report links; with a local API, shared links go to the local web app on :3000 of the same host.

## The 3-minute demo on the phone

1. **Demo people:** pick Noura.
2. **Home:** red flags first, then her cycle, "Log your symptoms", "Prepare doctor report" and "Before your visit".
3. **Log a day:** flow, pain, symptoms, and "Fill the form from my sentence" for a typed note. There is no voice
   button on the phone (the web's voice logging uses the browser's speech API); iOS keyboard dictation can fill the
   note box.
4. **Patterns:** each card with the entries behind it, what to consider, its sources and "How this was produced".
5. **AI Chat:** ask a suggested question; the answer cites its sources.
6. **Report:** prepare it, then "Download PDF" opens the share sheet with the PDF.
7. **More → Open clinician view:** the clinic's list, red flags first, then Noura's summary (SBAR, patterns,
   follow-ups, pre-visit brief). "Leave the clinician view" goes back.

Build-week screens: **Fatima** shows the first-6-weeks pathway on Home with "I had this"; **Hessa** (pregnant) shows
the blood-pressure card, and **More → Blood pressure** logs a reading, with urgent guidance and 998 first when it is
very high.

## Checks (CI job `mobile`, `.github/workflows/mobile.yml`)

```bash
npm run lint && npm run typecheck && npm test && npm run sync:check
```

- **lint:** Expo's rules plus our layout rule: no `left`, `right`, `marginLeft`, `paddingRight` or `textAlign: "left"`
  in styles. Use `start` and `end`, so Arabic mirrors correctly (docs/21 section 3).
- **test:** 31 unit tests, covering:
  - the API client: bearer token, no cookies, timeout, 401; the live API by default, and waking it (`wake.test.ts`);
  - build-week features: the postnatal pathway, the pre-visit brief (998 on her urgent line, clinic wording for the
    clinician), the blood-pressure card, and the clinician token kept in memory only (`care.test.tsx`);
  - safety: 998 strip, urgent and crisis answers, red-flag cards;
  - the care navigator: approve first, copy only after;
  - storage: only four keys, kept on this device;
  - the clinic QR parser and the chart labels.
- **sync:check:** the app copies these from the web app, so the two never drift:
  - API types and shared helpers (arc geometry, formatting, vocabulary, EPDS items, answer parser, cited sources);
  - the EN/AR messages and the demo lab report;
  - the colour tokens, generated from `apps/web/src/app/globals.css`.
  
  Edit the web file, then run `npm run sync`.

## Added 18 Nov 2026 (build week)

- **Live API by default**, with the "Waking the demo server" screen in front of the first call.
- **Clinician view** (`src/app/clinician/`): its own route group, layout and role. `{"role":"clinician"}` demo
  sign-in, the token kept in memory only (never in the Keychain), the patient list (red flags first) and one patient's
  summary: SBAR, red flags, follow-ups (mark booked or done, as on the web), the after-birth pathway, blood-pressure
  readings, patterns in clinician wording with their evidence, the pre-visit brief and her questions.
- **Postnatal pathway (K1)** on Home when a birth is in the last 12 weeks (Fatima), with "I had this"
  (`POST /v1/postnatal/{step}`).
- **Blood pressure (K6)** for pregnancy and the 12 weeks after birth (Hessa, Fatima): the card on Home and the log
  screen (`POST /v1/bp`), urgent cards first.
- **Before your visit (K3):** `GET /v1/brief`, from Home and More.
- `src/shared/bp.ts` is now synced from the web (`apps/web/src/lib/bp.ts`).

**Not verified yet:** on 18 Nov the build Mac had no full Xcode, so these screens have not been run in the iOS
Simulator. Typecheck, lint, the 31 unit tests and `npx expo export --platform ios` (the full iOS JavaScript bundle)
pass, and every API call above was checked against the live API.

## What was built first (6 Nov 2026)

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
1. **Android on a real phone:** the release APK runs on a Pixel 7 emulator (Android 14), where the demo people and
   Noura's Home loaded through the temporary link. It hasn't been tried on a physical Android phone yet.
2. **Arabic layout switch in Expo Go:**
   - Expo Go applies its own direction settings each time the app loads, so switching to Arabic inside Expo Go changes
     the words but not the layout, and the top bar asks her to reopen the app.
   - Development and store builds use expo-localization's native setup, which keeps the app's own switch.
     Checked 6 Nov in a standalone Release build on the simulator: switching to Arabic reloads once and flips the
     whole layout to right to left.
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

## Install the iOS app without Expo Go (standalone Release build)

The native `ios/` project is generated from `app.json` by `npx expo prebuild` and is not committed. Editing
`app.json` and building again regenerates it. A Release build carries its own JavaScript, so it runs with no Metro
server, and `EXPO_PUBLIC_*` addresses are fixed when it is built.

**On the iOS simulator** (the API on :8010 on this Mac):

```bash
npm run ios:release
```

**On your own iPhone** (Xcode signed in with your Apple ID; a free Apple ID works for 7 days at a time):
1. **Connect the iPhone.** Plug it in or have it on the same Wi‑Fi, unlock it, and turn on Settings → Privacy &
   Security → Developer Mode.
2. **Start the API so the phone can reach it.** On the Mac, in `backend`:
   ```bash
   DYLD_FALLBACK_LIBRARY_PATH=/opt/homebrew/lib uv run uvicorn app.main:app --host 0.0.0.0 --port 8010
   ```
   If macOS asks whether Python may accept incoming connections, allow it. Anyone on the same Wi‑Fi can then reach
   the demo API, which holds fictional data only.
3. **Build with the Mac's Wi‑Fi address,** from `ipconfig getifaddr en0`:
   ```bash
   EXPO_PUBLIC_API_URL=http://<mac-ip>:8010 npx expo run:ios --device --configuration Release --no-bundler
   ```
   Pick the iPhone from the list.
4. **The first time,** trust the developer on the iPhone: Settings → General → VPN & Device Management.

**Limits with a free Apple ID:**
- **Three apps at a time:** a phone holds at most three apps signed with a free developer profile. If the install
  fails with `ApplicationVerificationFailed`, `xcrun devicectl device install app --device <udid> <path to .app>`
  names the apps already installed; remove one of them.
- **Seven days:** the app stops opening after seven days, so build it again then.

A paid Apple Developer account and TestFlight (card M10) remove both limits.

The app reaches the API over plain HTTP only on the local network (`NSAllowsLocalNetworking`); every other address
needs HTTPS. iOS asks once to allow local-network access (`NSLocalNetworkUsageDescription`). Shared-report links
point at the website, so they open only once the deployed API is live.

**If the app says "The server could not be reached",** open `http://<mac-ip>:8010/v1/demo/personas` in Safari on the
iPhone.
- **Safari can't connect either:** the Wi‑Fi stops devices from reaching each other, which is common on office and
  university networks. Turn on the iPhone's Personal Hotspot, keep it plugged into the Mac (the Mac gets an "iPhone
  USB" connection), and build again with the Mac's address on that connection (172.20.10.x).
- **Safari shows the data:** allow ReproSense in Settings → Privacy & Security → Local Network.
- **No hotspot (no mobile data):** start a temporary HTTPS link to the local API, then build with the
  `https://….trycloudflare.com` address it prints:
  ```bash
  cloudflared tunnel --url http://127.0.0.1:8010
  ```
  Anyone with that address can reach the demo API (fictional data, demo reset included) while it runs. Stop it with
  Ctrl+C when you're done. The address changes on every start, so the app needs building again each time. Checked
  6 Nov on an iPhone 16 Pro: every screen loaded through it.

Once the API is deployed with HTTPS, a build with `EXPO_PUBLIC_API_URL=https://reprosense-api.onrender.com` works on
any network.

## Build the Android APK on this Mac

You need JDK 17 (Homebrew's `openjdk@17` works) and the Android SDK, with build tools, the NDK and CMake. The native
`android/` project is generated by `npx expo prebuild` and is not committed. The API address is fixed when you build,
as on iOS.

```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home ANDROID_HOME=$HOME/Library/Android/sdk
```
```bash
npx expo prebuild --platform android
```
```bash
cd android && EXPO_PUBLIC_API_URL=https://<api address> ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a,armeabi-v7a
```

- **The APK:** it lands at `android/app/build/outputs/apk/release/app-release.apk`, about 60 MB for phones (64-bit and
  32-bit ARM). The first build takes about 9 minutes.
- **Signing:** the APK is signed with the Android debug key. Testers can install it directly ("Install unknown apps"),
  but Google Play needs an upload key, which EAS manages (card M10).
- **Sending it:** for a small APK, build for 64-bit phones only with compressed native code. That's 22 MB
  (checked on Android 14) and fits file-size limits in chat apps:
  ```bash
  ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a -Pexpo.useLegacyPackaging=true
  ```

## Build for testers and the stores (card M10)

The profiles are in `eas.json`:
- **development:** an iOS simulator build and an Android APK (live API unless `EXPO_PUBLIC_API_URL` is set).
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
