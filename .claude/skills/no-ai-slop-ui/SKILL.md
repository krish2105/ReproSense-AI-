---
name: no-ai-slop-ui
description: Use before writing or reviewing ANY ReproSense UI (landing page, app screen, dashboard, deck visual). Prevents the generic "AI-generated" look and enforces the project's own visual identity, E · Mauve Pro (docs/06).
---

# No AI slop — ReproSense UI rules

Judges and users now recognise vibe-coded design at a glance. Research on the common tells (sources at the end) shows the
same handful of defaults on most AI-built sites. ReproSense must look like a product designed for **one** subject:
a woman's reproductive health record. Every choice below comes from that subject.

## 1. Our identity: E · Mauve Pro (v4; supersedes the old ledger look; full tokens in docs/06)
| Decision | Ours | Never |
| --- | --- | --- |
| Type | Plus Jakarta Sans 400–800; IBM Plex Sans Arabic for RTL | random font mixes, serif-italic accent word |
| Colour | plum #4B3653 for actions + 4 phase colours (magenta, peach, pink, lavender) | purple-to-blue tech gradients, neon, indigo-500 |
| Shape | round cards 22–24px, pill buttons and tabs | sharp generic boxes, default shadcn |
| Depth | soft plum-tinted shadows; glass only on nav and tab bar | heavy glows, particle backgrounds |
| 3D | data-driven only: cycle-day ring, year spiral, phone tilt | abstract blobs or DNA helixes with no data |
| Icons | one stroke set; emoji only in the mood row | emoji sprinkled in headings |
| Numbers | always from the data; phases labelled "estimate" when irregular | invented stats, fake probabilities |

## 2. Banned patterns (reject in review)
1. Gradient text or gradient buttons. Emphasis = weight or size.
2. More than one badge above the hero H1 (one short eyebrow is allowed).
3. Centered hero with two generic CTAs ("Get started" / "Learn more") and a blob.
4. Three identical icon cards in a row; identical stat-banner row of big numbers.
5. Coloured top/left accent stripe on cards.
6. Glows, particle backgrounds, or 3D with no data behind it.
7. Numbered 01/02/03 markers on content that isn't a real sequence.
8. Weightless slogans ("Empower your health journey", "AI-powered insights"). If a competitor could paste the line unchanged, rewrite it.
9. Same "Get started" label on every button. Labels say the exact action ("Open Noura's record", "Book glucose test").
10. Mixed picture styles (3D render + stock photo + cartoon). One style: real product screens; photos only where people matter.
11. Lorem ipsum, fake logos ("Trusted by…"), invented testimonials, invented metrics.

## 3. Required moves (each page must have them)
- **Show the product working in the first screen**, using persona data (cycle chart, observation with its evidence).
- **One subject-specific detail as content**: cycle days, the 21–35 day band, PBAC score ≥ 100, OGTT 4–12 weeks — not decoration.
- **Charts to scale**, labelled from the same scale, readable in both themes, with a one-line text summary for screen readers.
- **Asymmetry with purpose**: headline beside the chart; prose beside its figure; let one section lead.
- **Specific copy**: who, what number, what happens next. Plain sentences, no em-dash asides, no "not X, but Y".
- **Both themes designed**, not inverted. Check contrast ≥ 4.5:1 for body text in dark mode.
- **States**: loading (skeleton matching layout), empty (what will appear + how to add the first entry), error (what happened + fix).

## 4. Review procedure (run on every PR that touches UI)
1. Screenshot at 1280px light and 400px dark.
2. Walk the banned list; any hit = fix before merge.
3. Squint test: is the accent used for ≤ 2 kinds of things? Does one element clearly lead?
4. Swap test: replace "ReproSense" with a competitor name — if the page still works, the copy and hero are too generic.
5. Count: ≤ 2 radii, ≤ 3 font families, ≤ 8 type sizes, 1 shadow (dialog).
6. Record the result in PROGRESS.md as "UI slop check: pass/fail + fixes".

## Sources (research, Nov 2026)
- DevelopersDigest — 16 patterns that mark a site as vibe-coded: https://www.developersdigest.tech/blog/ai-design-slop-and-how-to-spot-it
- 925 Studios — font and gradient tells: https://www.925studios.co/blog/ai-slop-design-tells
- Illos — AI slop website checklist and fixes: https://illos.dev/guides/ai-slop-website-checklist
- DEV — why AI sites look the same (Tailwind indigo-500 default): https://dev.to/alanwest/why-every-ai-built-website-looks-the-same-blame-tailwinds-indigo-500-3h2p


## v3 update (5 Nov 2026): the team chose the "Soft mauve" look
The team explicitly chose soft gradients, round cards, glass on the nav and tab bar, and emoji mood chips. That is allowed now, but only in the forms set out in docs/06.
Slop is still: generic copy, invented stats, purple-blue tech gradients, random 3D blobs that carry no data, default shadcn styling, and "Powered by AI" badges.
Every decorative element must carry real data (the arc is the cycle; the bars are pain).
