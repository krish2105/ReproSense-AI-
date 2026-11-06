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
