# Asset integration report: Mauve Pro images S1 + A–F

> **Moved in Phase 0 (web):** every image now lives in `apps/web/public/images/` (served as `/images/...`). The `public/images/` paths below are the old locations.

Date: 5 Nov 2026 · Source: `ReproSense_Claude_Integration_Kit/ReproSense_Mauve_Pro_COMPLETE_S1_A_to_F.zip`

## 1. What exists in this repository (baseline)
| Area | Status on 5 Nov |
| --- | --- |
| Next.js web app (`apps/web`) | **Not built.** Hackathon rule: no product code before selection on 16 Nov. Planned for build week (BUILD_STATUS Phase 0). |
| Mobile app (Expo / React Native) | **Does not exist, and is out of scope.** MASTER_PROMPT §12 says "Native iOS/Android apps" must not be built. No `package.json`, `app.json` or native project exists. |
| Backend, database, APIs, auth, tests | Not built (Phase 0–1). |
| Interactive mockup (`mockup/`) | Exists. It is the only working UI and the visual reference the build copies. |
| Synthetic data generator | Exists and works (8 personas). Not changed here. |

So "integration" here means three things:
1. Put every asset at its canonical path.
2. Derive the files a web build needs.
3. Wire and test the one feature the existing mockup already has a slot for: the body map.

Every other screen is mapped below to the route that will use it in build week. **Nothing below claims a screen that does not exist yet.**

## 2. Archive checks
| Check | Result |
| --- | --- |
| ZIP integrity (`unzip -t`) | No errors; 40 entries = 38 PNG + README.txt + asset-manifest.csv |
| SHA-256 of every PNG vs `asset-manifest.csv` | 38/38 match (in the extracted folder and in the copies placed in the repo) |
| ZIP contents vs extracted folder | Identical (38/38) |
| Width × height vs manifest | 38/38 match |
| Transparency vs manifest | 38/38 match (23 RGBA with transparent corners, 15 opaque RGB) |
| Every image opened and inspected by eye | Done (contact sheets on a checkerboard) |

## 3. Image-by-image inventory (all 38 PNGs)
"Placed" means copied byte-for-byte to the path shown. The Next.js app will serve `public/images/x.png` as `/images/x.png`; in build week the folder is copied or moved to `apps/web/public/images` (QUESTIONS #24).

| ID | Deployed path | Size · alpha | Intended surface (route) | Status |
| --- | --- | --- | --- | --- |
| S1 | `public/images/brand/style-anchor.png` | 1536×1024 · no | Style reference only; not shown in the UI | Placed |
| A1 | `public/images/brand/app-icon.png` | 1024×1024 · no | Marketing art only. White corners (254,254,253), so it is **not** used as an icon | Placed; icons derived from A2 instead (§4) |
| A2 | `public/images/brand/logo-mark.png` | 1024×1024 · yes | Nav logo; source for every icon in §4 | Placed |
| A3 | `public/images/brand/splash.png` | 1024×1536 · no | Web loading/onboarding backdrop. No native splash, because there is no native app | Placed |
| B1 | `public/images/hero/hero-light.png` | 1536×1024 · no | `/` hero, light. Static fallback for the R3F cycle-bead ring (reduced motion / no WebGL) | Placed. Note: contains "particles", which the no-ai-slop-ui skill bans as a live background (QUESTIONS C7) |
| B2 | `public/images/hero/hero-dark.png` | 1536×1024 · no | `/` hero, dark fallback | Placed |
| B3 | `public/images/hero/hero-mobile.png` | 1024×1536 · no | `/` hero fallback < 768px | Placed |
| B4 | `public/images/sections/problem-fragments.png` | 1536×1024 · no | `/` "Why" section | Placed |
| B5 | `public/images/sections/solution-connected.png` | 1536×1024 · no | `/` "How it works" section | Placed |
| B6 | `public/images/sections/for-women.png` | 1536×1024 · no | `/` "For women" section. Generated image, face not visible, no real person | Placed |
| B7 | `public/images/sections/for-clinics.png` | 1536×1024 · no | `/` "For clinics" section. Illustrative, **not** a partner clinic | Placed |
| B8 | `public/images/sections/privacy-vault.png` | 1024×1024 · yes | `/` privacy section and `/app/privacy` header. A metaphor, **not** a certification | Placed |
| B9 | `public/images/sections/abu-dhabi-clay.png` | 1536×1024 · no | `/` Abu Dhabi section. Stylised relief, **not** a data map; the admin region view must use real cohort numbers | Placed |
| B10 | `public/images/og/og-image.png` | 1536×800 · no | Open Graph / Twitter card (ratio 1.92:1, fine for 1.91:1 previews) | Placed; metadata is wired in build week |
| C1 | `public/images/stages/periods.png` | 1024×1024 · yes | Stage switch + onboarding stage step | Placed; text labels go in code |
| C2 | `public/images/stages/trying.png` | 1024×1024 · yes | as above (Trying) | Placed |
| C3 | `public/images/stages/pregnancy.png` | 1024×1024 · yes | as above (Pregnancy) | Placed |
| C4 | `public/images/stages/after-birth.png` | 1024×1024 · yes | as above (After birth) | Placed |
| C5 | `public/images/stages/perimenopause.png` | 1024×1024 · yes | as above (Perimenopause) | Placed |
| D1 | `public/images/app/body-map-front.png` | 768×1024 · yes | `/app/log` body map, front | **Placed, wired into the mockup, calibrated and tested (§5)** |
| D1-mockup | `mockup/images/body-map-front.png` | 768×1024 · yes | Same file for the mockup | **Placed and in use** |
| D2 | `public/images/app/body-map-back.png` | 768×1024 · yes | `/app/log` body map, back | **Placed; a copy in `mockup/images/` is wired and tested (§5)** |
| D3 | `public/images/app/body-map-pelvis.png` | 1024×1024 · yes | Proposed: an educational image in "Explain like I'm new" | Placed but **deliberately not a tap target**: organ-level tapping would imply a localisation the rules can't support. Needs CHO/women-care-lead review |
| E1 | `public/images/app/onboarding-welcome.png` | 1024×1024 · yes | `/app/onboarding` step 1 | Placed |
| E2 | `public/images/app/onboarding-privacy.png` | 1024×1024 · yes | `/app/onboarding` consent step | Placed |
| E3 | `public/images/app/onboarding-stage.png` | 1024×1024 · yes | `/app/onboarding` stage step | Placed |
| E4 | `public/images/app/copilot-avatar.png` | 1024×1024 · yes | AI Chat header avatar | Placed |
| E5 | `public/images/app/care-navigator.png` | 1024×1024 · yes | Care navigator card + review dialog (Hessa) | Placed |
| E6 | `public/images/app/visit-mode.png` | 1024×1024 · yes | Visit mode dialog | Placed |
| E7 | `public/images/app/empty-state.png` | 1024×1024 · yes | Empty states (new user, Amina "nothing to discuss") | Placed |
| E8 | `public/images/app/red-flag.png` | 1024×1024 · yes | Urgent card for RF1–RF3, RF5, RF6 | Placed. Recommend **not** using the bell on the RF4 crisis screen (calm support, not an alarm); women-care-lead to confirm |
| E9 | `public/images/icons/logged-data.png` | 1536×512 · yes | Calendar "last logged" tiles | Placed + **split into 6 icons** (§4) |
| E10 | `public/images/icons/moods.png` | 1536×512 · yes | Mood row | Placed + **split into 5 icons** (§4). Open choice: clay faces or emoji (docs/06 says emoji) |
| F1 | `public/images/clinic/dashboard-header.png` | 1536×512 · no | `/clinic` and `/admin` header band | Placed |
| F2 | `public/images/pitch/title-slide.png` | 1536×864 · no | Pitch deck title slide | Placed; not used in the app |
| F3 | `public/images/pitch/impact.png` | 1536×864 · no | Pitch impact slide | Placed; not used in the app |
| F4 | `public/images/pitch/team.png` | 1536×864 · no | Pitch team slide | Placed; not used in the app |
| F5 | `public/images/social/post-square.png` | 1024×1024 · no | Social post | Placed; not used in the app |

The manifest is also copied to `public/images/asset-manifest.csv`.

## 4. Derived files (made by `tools/derive_image_assets.py`; source PNGs untouched)
| File | How it was made | Use |
| --- | --- | --- |
| `public/images/icons/logged-data/{flow,pain,symptoms,sleep,energy,mood}.png` | 240×240 crops of E9 centred on each icon. Cut lines come from the transparent gaps, clipped at neighbour midpoints. No resampling | Calendar tiles |
| `public/images/icons/moods/{calm,tired,in-pain,low,energetic}.png` | 256×256 crops of E10, same method | Mood row |
| `public/images/icons/sprites.json` | Source regions of every icon | Sprite use, if preferred |
| `public/images/brand/derived/icon-square-1024.png` | A2 on full plum #4B3653, opaque, no white corners | Master square icon (iOS-style, PWA) |
| `…/adaptive-foreground-1024.png` + `adaptive-background-1024.png` | Mark inside the 66% safe circle, on transparent; plum background layer | Android adaptive layers, kept in case native is ever approved |
| `…/apple-touch-icon.png` (180), `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` (80% safe zone), `favicon-32.png` | A2 on plum, LANCZOS resize | Next.js metadata / web manifest |

Checked by eye: each icon slug matches its art; brand icons have no white corners.

**Native icons and splash:** no mobile framework exists here, and native apps are out of scope (MASTER §12). The derived squares are framework-neutral masters. They have **not** been tested on iOS or Android because there is no build to test.

## 5. Body map: calibration and verification
**What the art actually measures** (alpha ≥ 128, per row):
| Landmark | Front (D1) | Back (D2) | Requested |
| --- | --- | --- | --- |
| Top of figure (neck) | 17.3% | 14.6–16% | 12% (shoulder top) |
| Shoulder line | ~22% | ~22% | 12% |
| Waist (narrowest torso) | ~49% | ~48% | 50% (navel) |
| Widest hip | ~75% | ~76% | 72% |
| Leg split | ~78% | ~79% | n/a |
| Body centre x | 49.6% | 52.0% | 50% |

The art does not match the requested framing, so the tap points are placed from these measurements, not from the prompt numbers.

**Bugs found in the old mockup tap points** (`mockup/template.html`):
1. "lower back" was drawn on the **front** figure at (50%, 78%). That pixel is on the inner thigh, just right of the leg split (row 78% has a gap at x 377–381 px). A tap recorded "lower back" on the groin.
2. "left pelvis" sat on the viewer's left (37%), which is **her right** on a front view. Left and right were recorded the wrong way round.
3. The SVG fallback was stacked above the image (`z-index:0` on a later element), so it would have covered the real art once the image loaded.
4. The page had no `<meta charset>` or viewport meta. Served over HTTP it showed garbled Arabic and a desktop layout on phones.

**Fixes** (in `mockup/template.html`, rebuilt into `reprosense-mockup.html`):
- Front/Back switch. Front: upper abdomen (49.6, 42), lower abdomen (49.6, 64), right pelvis (36, 70) = her right, left pelvis (63.2, 70) = her left. Back: lower back (52, 55). Site names are unchanged, so the generator's "lower abdomen" / "lower back" counts still drive the year glow.
- Accessible labels: "left pelvis (her left side)" etc. A visible hint reads "Front view: her left side is on your right."
- The fallback outline is hidden on image load and shown only if the image fails.
- Added `<meta charset="utf-8">` and the viewport meta.
- Geometry: box `aspect-ratio: 3/4`, image 768×1024 (3:4), `object-fit: contain`. Measured letterbox = 0 px, so % of box = % of image.

**Browser test** (in-app browser, mockup served from `mockup/` on 127.0.0.1, persona Priya):
| Viewport | View | Result |
| --- | --- | --- |
Checks at every size: each target's centre and a 12px ring around it sit inside the figure (alpha 253); hit-testing the centre returns that site (nothing covers it); each tap records only that site; targets are 30×30px; no horizontal page scroll; no console errors.

| Viewport | Box | Letterbox | Front (4 targets) | Back (lower back) | Closest pair of targets |
| --- | --- | --- | --- | --- | --- |
| 320×640 (small phone) | 210×280 | 0 | Pass | Pass | 33px |
| 375×812 (phone) | 260×347 | 0 | Pass | Pass | 41px |
| 768×1024 (tablet) | 260×347 | 0 | Pass | Pass | 41px |
| 1280×800 (desktop) | 260×347 | 0 | Pass | Pass | 41px |

Measured target positions are identical at every size (front 49.6/42, 49.6/64, 35.9/70, 63.2/70; back 52/55), so the % mapping holds as the box shrinks.

At 320px, targets are 33px apart centre to centre, which leaves only a 3px gap. That passes WCAG 2.2 target size (24px minimum), but it is tight. In the React build, keep the box at least 240px wide, or let the targets scale down to 26px below 360px.

Seen at 320px, not caused by this work: the floating tab bar labels overlap ("Calendar Analytics Patterns"). Fix that in the real app's tab bar.

For build week, the React body map must reuse these coordinates per image and keep `contain` with a 3:4 box. Add a Playwright test that repeats the alpha + hit-test check at 320, 390, 768 and 1280.

## 6. Files changed in this task
- `public/images/**`: 38 PNGs placed (previously only `.gitkeep`), `asset-manifest.csv`, `icons/logged-data/*` (6), `icons/moods/*` (5), `icons/sprites.json`, `brand/derived/*` (8)
- `mockup/images/body-map-front.png`, `mockup/images/body-map-back.png`: new
- `mockup/template.html`: body-map calibration, front/back switch, left/right fix, fallback stacking, charset/viewport meta
- `mockup/reprosense-mockup.html`: rebuilt with `python3 mockup/build_mockup.py`
- `tools/derive_image_assets.py`: new (reproducible derivation; needs Pillow)
- `.claude/launch.json`: new (static server for the mockup preview)
- `ASSET_INTEGRATION_REPORT.md`: this file

## 7. Tests and builds actually run
| Command / check | Result |
| --- | --- |
| `unzip -t` on the archive | Pass |
| SHA-256 / size / alpha audit of 38 PNGs (source + placed copies) | 38/38 pass |
| `tools/derive_image_assets.py` | Ran; 19 derived files written; each crop asserts it stays inside its neighbour midpoints |
| `python3 mockup/build_mockup.py` | Ran; wrote the 174 KB mockup |
| Body-map browser test at 320, 375, 768 and 1280 wide (front + back) | Pass at all 4 sizes (§5); console has no errors |
| Lint, typecheck, web build, unit/integration/e2e tests | **Not applicable.** No app code exists yet, so nothing was run |
| iOS / Android | **Not verifiable.** No native project, and out of scope |

Screenshots: an after-screenshot of the body map at phone width was taken in the in-app browser during testing. It is not saved into the repo. The "before" state was the drawn SVG outline, because the image file was missing.

## 8. Hackathon rules
Checked against the official event page on 5 Nov 2026 ([upstartbar.com/ajyal](https://upstartbar.com/ajyal/)). It is the **HealthX Ajyal Hackathon**, Department of Health – Abu Dhabi, delivered by Upstart Bar, with Replit as technology partner.

| Rule | Official page | Matches the kit? |
| --- | --- | --- |
| Themes | Fertility, Women's Health, Longevity, Alzheimer's (cover at least one) | Yes (fertility, women's health, longevity via GDM → diabetes) |
| Team | 2–4 people, at least one university student; 18+; in person at DOH Incubator, Masdar City | Yes (QUESTIONS #1) |
| Dates | Apply by Sat 14 Nov 23:59 GST · selection Mon 16 Nov · build 17–21 Nov · showcase Sun 22 Nov | Yes. **New detail:** teams may start building once selection is announced on 16 Nov |
| Judging | Venture 30 · Problem & health impact 20 · Innovation & evidence 20 · Prototype & execution 20 · Team & pitch 10; at least 60/100 for a grant | Yes |
| Data | No real data provided; no identifiable patient data; synthetic or open data | Yes |
| Prior work | Earlier code, research or designs allowed if disclosed at the start of the event | Yes. These images must be listed in the disclosure note (docs/15 template) |
| AI tools | Allowed if disclosed in the pitch | Yes |
| Prizes | 30,000 AED: 15,000 / 10,000 / 5,000; grant paid 50% / 10% / 15% / 25% at signing, 1, 3 and 6 months | Payment schedule matches docs/12; the prize amounts were not in the kit |

Pitch credit line: **"AI-generated images (ChatGPT); previously created assets disclosed where required."**

## 9. Risks and proposed next steps
1. **Image weight:** 38 PNGs total about 33 MB. In build week, serve them with `next/image` (AVIF/WebP, `sizes`, lazy loading below the fold) and keep the PNGs as sources. The hero needs `priority` and a small LCP-friendly size.
2. **Mood row style:** docs/06 says emoji chips, but the clay faces now exist. Pick one (team / CMO).
3. **D3 pelvis** stays educational only, pending clinical review.
4. **E8 bell on the crisis path:** recommend a calm alternative (women-care-lead).
5. **B1 particles vs the slop skill:** use B1 only as the static fallback and OG image.
6. Port the body-map alpha + hit-test check (§5) to Playwright in build week so it runs in CI.
7. QUESTIONS #23–#25 are answered by this work: web only, assets placed, body map calibrated.

## 10. Truthful demo walkthrough (what works today)
Open `mockup/reprosense-mockup.html`. To see the body-map images in an HTTP preview, serve the `mockup/` folder; the file still opens directly too.
1. Go to Her app → choose Priya → Calendar → "Where does it hurt?". The front figure shows a glow on the lower abdomen (38 painful days in her synthetic year).
2. Tap the pelvis points: the hint and labels give her side, not yours. Switch to Back and tap lower back.
3. Everything else in the mockup is unchanged.

The real app (Noura → Hessa → Fatima) is built in build week. None of it is claimed as working yet.
