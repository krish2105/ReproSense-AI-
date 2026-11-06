// Copied from apps/web/src/lib/epds.ts by apps/mobile/scripts/sync-shared.mjs. Edit the web file, then run npm run sync.
/**
 * Edinburgh Postnatal Depression Scale (EPDS), the standard 10 items with each option's score (0–3; items 3 and
 * 5–10 are reverse-ordered on the form, so the score is stored with each option, never inferred from position).
 * Reproduced with the citation the copyright holder requires: Cox, J.L., Holden, J.M. and Sagovsky, R. 1987.
 * Detection of postnatal depression: development of the 10-item Edinburgh Postnatal Depression Scale.
 * British Journal of Psychiatry 150: 782–786. © The Royal College of Psychiatrists 1987.
 * The Arabic version must be the validated translation (QUESTIONS #40), so the items are not machine-translated.
 * Item 10 > 0 opens the crisis path in the API (rules RF4): the UI then shows support only, never a score.
 */
export interface EpdsItem {
  text: string;
  options: ReadonlyArray<{ label: string; score: 0 | 1 | 2 | 3 }>;
}

export const EPDS_CITATION =
  "Cox, J.L., Holden, J.M. and Sagovsky, R. (1987). Detection of postnatal depression: development of the 10-item Edinburgh Postnatal Depression Scale. British Journal of Psychiatry 150: 782–786.";
export const EPDS_URL = "https://doi.org/10.1192/bjp.150.6.782";

export const EPDS_ITEMS: readonly EpdsItem[] = [
  {
    text: "I have been able to laugh and see the funny side of things",
    options: [
      { label: "As much as I always could", score: 0 },
      { label: "Not quite so much now", score: 1 },
      { label: "Definitely not so much now", score: 2 },
      { label: "Not at all", score: 3 },
    ],
  },
  {
    text: "I have looked forward with enjoyment to things",
    options: [
      { label: "As much as I ever did", score: 0 },
      { label: "Rather less than I used to", score: 1 },
      { label: "Definitely less than I used to", score: 2 },
      { label: "Hardly at all", score: 3 },
    ],
  },
  {
    text: "I have blamed myself unnecessarily when things went wrong",
    options: [
      { label: "Yes, most of the time", score: 3 },
      { label: "Yes, some of the time", score: 2 },
      { label: "Not very often", score: 1 },
      { label: "No, never", score: 0 },
    ],
  },
  {
    text: "I have been anxious or worried for no good reason",
    options: [
      { label: "No, not at all", score: 0 },
      { label: "Hardly ever", score: 1 },
      { label: "Yes, sometimes", score: 2 },
      { label: "Yes, very often", score: 3 },
    ],
  },
  {
    text: "I have felt scared or panicky for no very good reason",
    options: [
      { label: "Yes, quite a lot", score: 3 },
      { label: "Yes, sometimes", score: 2 },
      { label: "No, not much", score: 1 },
      { label: "No, not at all", score: 0 },
    ],
  },
  {
    text: "Things have been getting on top of me",
    options: [
      { label: "Yes, most of the time I haven't been able to cope at all", score: 3 },
      { label: "Yes, sometimes I haven't been coping as well as usual", score: 2 },
      { label: "No, most of the time I have coped quite well", score: 1 },
      { label: "No, I have been coping as well as ever", score: 0 },
    ],
  },
  {
    text: "I have been so unhappy that I have had difficulty sleeping",
    options: [
      { label: "Yes, most of the time", score: 3 },
      { label: "Yes, sometimes", score: 2 },
      { label: "Not very often", score: 1 },
      { label: "No, not at all", score: 0 },
    ],
  },
  {
    text: "I have felt sad or miserable",
    options: [
      { label: "Yes, most of the time", score: 3 },
      { label: "Yes, quite often", score: 2 },
      { label: "Not very often", score: 1 },
      { label: "No, not at all", score: 0 },
    ],
  },
  {
    text: "I have been so unhappy that I have been crying",
    options: [
      { label: "Yes, most of the time", score: 3 },
      { label: "Yes, quite often", score: 2 },
      { label: "Only occasionally", score: 1 },
      { label: "No, never", score: 0 },
    ],
  },
  {
    text: "The thought of harming myself has occurred to me",
    options: [
      { label: "Yes, quite often", score: 3 },
      { label: "Sometimes", score: 2 },
      { label: "Hardly ever", score: 1 },
      { label: "Never", score: 0 },
    ],
  },
];
