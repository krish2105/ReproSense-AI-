# 06 — Design system: E · Mauve Pro (v4, team choice on 5 Nov 2026; builds on the v3 soft mauve tokens)

**This replaces the v2 "ledger" look.** Reference: a calm, warm women's-health phone app, mauve and lilac.
The working reference is `mockup/reprosense-mockup.html`. Copy its tokens exactly.

## Tokens (light / dark)
| Token | Light | Dark | Use |
|---|---|---|---|
| paper | #F6F1F4 | #17111A | page background (with soft pink/lilac/peach radial washes) |
| sheet | #FFFFFF | #221A27 | cards |
| tint | #F4EDF4 | #2B2131 | chat bubbles, logged-data tiles |
| ink / ink-2 / ink-3 | #2E2233 / #6E5D73 / #A08FA5 | #F6EFF7 / #C9BACD / #917F97 | text |
| plum | #4B3653 | #EBD7F0 | primary buttons, active tab pill, suggestion pills |
| accent | #C9559F | #EC8BCB | links, highlights |
| phase: period / follicular / fertile / luteal | #D35FA8 / #EAB09D / #EFB5D3 / #B88BE3 | brighter versions | cycle arc, legends, chart bars |
| ok / warn / urgent | #3A9886 / #A5680F / #C0352B | | 21–35 band, "Worth discussing", red flags |

## Type and shape
- Plus Jakarta Sans (400–800) for everything; IBM Plex Sans Arabic for RTL. Tabular numbers.
- Radii: cards 22–24px, tiles 18px, buttons and pills fully round. Soft plum-tinted shadows. Light glass blur only on the top nav and floating tab bar.

## Signature components
1. **Day pills**: a row of rounded day chips, past ones ticked, today filled plum with a dashed ring.
2. **Cycle arc**: 240° arc split into the four phase colours with a plum marker for today and "Day N" in the centre. If cycles are irregular, the label says "estimate" and a line says phases are estimates, not predictions. After birth, the arc shows weeks 0–12 with the glucose-test window (weeks 4–12).
3. **Log your symptoms**: a full-width plum pill button.
4. **Today's recommendation**: two cards (next step and a question for the doctor), taken from the rules and never invented.
5. **Mood row** of emoji chips. **Calendar** with period days filled magenta, then logged-data tiles (flow, pain, symptoms, daily life).
6. **Analytics**: 3/6/12-month pill switch, a smooth gradient line for cycle length with the 21–35 band, and rounded pill bars for pain.
7. **AI Copilot chat**: a header with an avatar, lilac bubbles, citations under every answer, plum suggested-question pills, and an input with mic and send buttons.
8. **Floating tab bar**: Home · Calendar · Analytics · Patterns · AI Chat · Report. The active tab shows a plum pill label.

## Still forbidden
Diagnostic words, fake probabilities, invented numbers, stock photos of real people, and "Powered by GPT" badges.
Every number on screen must come from the data.

## Version 4: chosen look "E · Mauve Pro"
Same tokens as above, grown into a life-stage journey. Reference boards: design board round 2 (E-Mauve-Web, E-Mauve-App).
- **Stage switch**: pill row under the greeting (Periods · Trying · Pregnancy · After birth · Perimenopause), active pill plum.
- **Pregnancy arc**: weeks 0–40 in trimester colours (blush, magenta, lavender) with "Week N" centre; red warning-signs card below.
- **Care navigator card**: plum card "Care navigator · due now", one action "Review draft" → dialog with message, questions, bring list, Approve.
- **Body map**: 3:4 box with the generated mannequin image (IMAGE_PROMPTS_CHATGPT.md D1/D2); round tap points (30px, white ring; selected = magenta
  fill with plum ring); soft magenta radial glow sized by painful days. Fallback: drawn outline if the image is missing.
- **Visit mode**: full dialog, SBAR rows with round letter badges, QR card, "Exit visit mode".
- **Discreet mode**: brand text becomes "My notes", avatar letter and name hidden.
- **Website**: hero ribbon with five orbs (image B1), five stage cards with orbs, 3D cycle ring, year spiral; clinic dashboard 3D region columns.
