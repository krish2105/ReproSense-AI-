# Pitch deck

**Speaker notes:** `ReproSense-submission.pptx` carries each speaker's lines in its notes (from `speaker_notes.js`).
Present from PowerPoint in **Presenter View** (Keynote: Presenter Display) so each of us sees our script under the slide;
the PDF has no notes. Rebuild after editing the notes (see "The 3-slide submission deck" below).

**On stage (organisers' format, 21 Nov):** the four slides (problem, solution, roadmap, demo; the organisers allow 3 to 4) in 1 to 1.5 minutes,
then the live demo. The script is docs/27 section 4 and the PPTX speaker notes.

**What's in this folder (everything else was removed on 21 Nov):**
- `ReproSense-submission.pptx`: the deck, with each speaker's lines in the notes. Present from this one.
- `ReproSense-submission.pdf`: the same 3 slides, no notes. Upload it, and use it as the backup if PowerPoint fails.
- `ReproSense-demo.mp4`: the 97-second demo in 4K (3840×2160). Upload it, and use it as the backup if the site is slow.
- `build_submission_deck.js` and `speaker_notes.js`: they build the PPTX.
- `img/noura-insights.jpg`: the slide 2 screenshot. `apps/web/scripts/pitch-shots.mjs` can re-take it.

The old 10-slide deck (`deck.html`, `ReproSense-pitch.pdf`, `build_deck.py`) was from 6–7 Nov and out of date (old
safety numbers, a two-person team), so it was deleted. It is still in the git history.

## The 3-slide submission deck (build week Y5)
The organisers ask for a 3-slide PDF or PPT plus an MP4 demo, submitted at programs.upstartbar.com by Sun 22 Nov 15:15.
`ReproSense-submission.pptx` and `ReproSense-submission.pdf`: problem (Abu Dhabi evidence, every number with its source),
solution (what we built, how the AI is checked, why it beats a period tracker) and roadmap (milestones from docs/19,
who pays, what we need, the pilot measure, the team). Speaker notes carry the talk track. Built by
`build_submission_deck.js` (pptxgenjs, Calibri, the E · Mauve Pro palette), so edit the script and rebuild rather than
editing the PPTX by hand:
```
npm i pptxgenjs@3.12.0                                # once, anywhere on NODE_PATH
node pitch/build_submission_deck.js                   # writes pitch/ReproSense-submission.pptx
soffice --headless --convert-to pdf --outdir pitch pitch/ReproSense-submission.pptx   # the PDF
```
The slide-2 picture is `img/noura-insights.jpg` (fictional persona, demo badge visible).

## The MP4 demo (build week Y5)
`ReproSense-demo.mp4`: 97 seconds, **4K (3840×2160)**, H.264 High at 30 fps, about 36 MB, captions burned in, no sound (add a voice-over if you like). It
follows the pitch script's demo order (docs/27 section 4), so it doubles as the stage backup: landing → Noura's home →
a pattern with its evidence and "How this was produced" → the assistant answering "What counts as a heavy period?"
with sources → "Before your visit" → her Arabic sentence filling the log form → the clinician books Fatima's
after-birth glucose follow-up and opens its history → the network's loop metrics → "Built since acceptance" on /evidence → Fatima's postnatal steps and her
baby's first year → close. Re-recorded in 4K on 21 Nov from `main` at b79a608: the page is laid out at 1280×720 and
rendered at 3×, Chrome's screencast captures each frame at 3840×2160, and x264 encodes it at CRF 12.
Every record is fictional. Recorded by `apps/web/scripts/demo-video.mjs` from a freshly reset local stack, so every
number is the seeded one; re-record after any screen change:
```
make api                                              # API on :8010
cd apps/web && pnpm build && pnpm start -p 3100       # web on :3100 (another terminal)
cd apps/web && PW_CHANNEL=chrome node scripts/demo-video.mjs    # writes pitch/ReproSense-demo.mp4 (needs ffmpeg)
```
Against the live site, without resetting the shared demo: `E2E_BASE_URL=https://reprosense.vercel.app DEMO_RESET=0`.
