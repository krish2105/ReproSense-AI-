---
name: mauve-charts
description: Use before drawing any chart, arc, meter or figure in ReproSense (cycle arc, pregnancy and after-birth arcs, cycle-length line, pain bars, 12-month timeline, admin KPIs and funnels). Applies the dataviz method inside E · Mauve Pro, including the palette test results and the mitigations they make mandatory.
---

# Charts in E · Mauve Pro

Read the `dataviz` skill for the method (form first, colour last, one axis, thin marks, hover layer, table view).
This file adds what is specific to ReproSense. Charts are hand-built SVG; no chart library.

## 1. What the palette test found (5 Nov 2026, dataviz `validate_palette.js`)
| Set | Mode | Result |
| --- | --- | --- |
| Phases `#D35FA8 #EAB09D #EFB5D3 #B88BE3` | light | **FAIL**: follicular `#EAB09D` and fertile `#EFB5D3` are too light (OKLCH L 0.81 / 0.84) and low in chroma; they differ by ΔE 7.3 with normal vision (floor 15) and 6.8 for deuteranopia. Contrast on white: 1.88, 1.72, luteal 2.68 (non-text minimum 3:1). |
| Phases dark `#E879BE #F0BBA9 #F3C2DC #C7A1EE` | dark | **FAIL**: follicular vs fertile ΔE 6.7 (normal), 6.4 (deutan). Contrast on `#221A27` passes. |
| Status `#3A9886 #A5680F #C0352B` | light | **FAIL**: urgent vs warn ΔE 3.1 for deuteranopia (11.9 normal). |
| Status dark `#66C9B5 #EDB45E #FF8F80` | dark | **FAIL**: urgent vs warn ΔE 5.9 (deutan). |

The brand colours are fixed (docs/06), so the fixes are encoding, not new colours.

## 2. Mandatory mitigations
1. **Phases are never told apart by colour alone.** Every arc has a legend with words, and a text line near it
   ("Day 23 · luteal phase, estimate"). Segments are separated by a 2px gap in the surface colour.
2. **Fertile gets a texture.** Fill the fertile segment with a diagonal hatch (`<pattern>` at 45°, stroke = `--ph-l` at 40%)
   so it separates from follicular for every reader.
3. **Light-mode phase segments get a 1px `--rule-2` outline**, because peach and pink sit below 3:1 on white.
4. **Status is always a word.** `Tag` pills ("Urgent", "Worth discussing", "Due now") or an icon + label; never a coloured dot alone.
5. **Data marks use the strong tokens.** The cycle-length line is `--plum` (2px); pain bars are `--ph-m` with 4px rounded
   ends; the 21–35 day band is `--ok-soft` with a dashed `--ok` edge and its own label. Check 3:1 against `--sheet` in both themes.

## 3. Rules for every figure
- Numbers come from the API only. Irregular cycles say "estimate" and the line "phases are estimates, not predictions" (docs/06).
- One y-axis. Label the axis from the same scale the marks use; recessive grid (`--rule`).
- Each chart is a `<figure>`: the SVG has `role="img"` and `aria-labelledby` pointing at a title and a one-line summary in
  `<figcaption>` ("Cycle length, last 6 months: 4 of 6 cycles were longer than 35 days").
- A table view (toggle or `<details>`) gives the same numbers for screen readers and print.
- Hover and keyboard focus show a tooltip with the exact value and date; hit areas are larger than the marks.
- Reduced motion: no draw-in animation. Default animation, when used, is ≤ 300ms and only on first view.
- RTL: keep time running left to right inside charts (`dir="ltr"` on the SVG wrapper), with Arabic labels; mirror only
  the surrounding layout. Dates use `src/lib/format.ts` (Western digits).
- Both themes: colours are CSS variables in the SVG (`fill="var(--plum)"`), so the dark theme needs no second chart.

## 4. Arcs (docs/06 signature components)
- Cycle arc: 240°, four phase segments with gaps, plum marker for today, "Day N" in the centre. Copy the geometry from
  `arcSVG()` in `mockup/template.html` (~line 777) and keep it in a pure function with a unit test.
- Pregnancy arc: weeks 0–40 in trimester colours, "Week N" centre. After birth: weeks 0–12 with the glucose-test window
  (weeks 4–12) marked and labelled.

## 5. Running the validator
`node <dataviz skill>/scripts/validate_palette.js "#hex,#hex" --mode light --surface "#FFFFFF"` (and `--mode dark --surface "#221A27"`).
Any new categorical set must pass, or ship with the encodings in section 2 and a note in the PR.
