# Pitch deck (3 minutes, 10 slides)

`deck.html` is the deck: one self-contained page in the product's own look (E · Mauve Pro), built from the repo's data.
It works offline (font and screenshots sit next to it). `ReproSense-pitch.pdf` is the printed backup.

## Present
- Open `deck.html` in Chrome. **F** full screen, **→ / ←** or a clicker (PageDown / PageUp), **N** speaker notes, **Home / End**.
- The notes hold the one sentence for each slide from the run-of-show (research/2026-11-06/05 §9).
- Light theme only; set browser zoom so the slide fills the projector.

## Fill in before the pitch (say only what is true)
- Slide 8: interview counts and the letter of intent. If there are none, delete the dashed box rather than guess.
- Slide 10: team names and roles, the clinical advisor, and the image tool used.
- Slide 10: tag the repo on 16 Nov (`pre-selection-2026-11-16`, docs/15) so the disclosure line is exact.

## Where every number comes from
| Slide | Number | Source |
| --- | --- | --- |
| 1 | Noura's seven cycles, 42–56 days | `data/synthetic/output/personas/noura.json` (fictional) |
| 2 | 265 of 1,043; about 1 in 5 | Agarwal et al., IJERPH 2022; Bashir et al., Front Endocrinol 2022 |
| 3 | Up to 70%; 11.6 years | WHO PCOS fact sheet 2026; Mousa et al. 2021 |
| 5 | PC008 3 of 10 → 4 of 10 | synthetic cohort + live demo, `/v1/admin/metrics` |
| 6 | 60 questions, 100%, 15 of 15, 100%, 0, no failures | `backend/app/ai/eval_results.json` |
| 8 | Prices; 14 centres, 45 facilities, ~700 OB-GYNs | research/2026-11-06/04 §9; Abu Dhabi Media Office, Jul 2025 |

## Rebuild after the product or data changes
```
make api                                              # API on :8010
cd apps/web && pnpm build && pnpm start -p 3100       # web on :3100 (another terminal)
cd apps/web && PW_CHANNEL=chrome node scripts/pitch-shots.mjs   # screenshots of the live screens
python3 pitch/build_deck.py                           # deck.html from the data
cd apps/web && PW_CHANNEL=chrome node scripts/pitch-pdf.mjs     # the PDF backup
```

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
`ReproSense-demo.mp4`: about 95 seconds, 1280×720, captions burned in, no sound (add a voice-over if you like). It
follows the pitch script's demo order (docs/27 section 4), so it doubles as the stage backup: landing → Noura's home →
a pattern with its evidence and "How this was produced" → the assistant answering "What counts as a heavy period?"
with sources → "Before your visit" → her Arabic sentence filling the log form → the clinician books Fatima's
after-birth glucose follow-up and opens its history → the network's loop metrics → Fatima's postnatal steps and her
baby's first year → close. Refreshed on 20 Nov from `main` at e2e0bdb.
Every record is fictional. Recorded by `apps/web/scripts/demo-video.mjs` from a freshly reset local stack, so every
number is the seeded one; re-record after any screen change:
```
make api                                              # API on :8010
cd apps/web && pnpm build && pnpm start -p 3100       # web on :3100 (another terminal)
cd apps/web && PW_CHANNEL=chrome node scripts/demo-video.mjs    # writes pitch/ReproSense-demo.mp4 (needs ffmpeg)
```
Against the live site, without resetting the shared demo: `E2E_BASE_URL=https://reprosense.vercel.app DEMO_RESET=0`.
