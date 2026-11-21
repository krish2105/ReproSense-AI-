// The 3-slide submission deck (build week Y5): problem, solution, roadmap. Every number carries its source line
// (docs/05, docs/10, docs/19). Run: node pitch/build_submission_deck.js  ->  pitch/ReproSense-submission.pptx
// Then the PDF: soffice --headless --convert-to pdf pitch/ReproSense-submission.pptx (see pitch/README.md).
const path = require("path");
const pptxgen = require("pptxgenjs");

const HERE = __dirname;
const OUT = process.argv[2] || path.join(HERE, "ReproSense-submission.pptx");
const APPLY_THEME = process.env.APPLY_THEME_JS; // the pptx skill's apply_theme.js, optional

// E · Mauve Pro (docs/06): plum dominant, the app's pink accent, ink for text. Calibri renders the same everywhere.
const THEME = {
  name: "ReproSense Mauve",
  headFontFace: "Calibri",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "2E2233", // ink
    lt1: "FFFFFF",
    dk2: "4B3653", // plum
    lt2: "F6F1F4", // paper
    accent1: "C9559F", // accent
    accent2: "EC8BCB", // accent on dark
    accent3: "B88BE3", // luteal
    accent4: "3A9886", // ok
    accent5: "6E5D73", // ink-2
    accent6: "5E4667", // plum, lighter (cards on dark)
    hlink: "C9559F",
    folHlink: "6E5D73",
  },
};

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5 in
pres.title = "ReproSense AI: HealthX Ajyal 2026";
pres.author = "Team ReproSense";
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
const C = pres.SchemeColor;
const FOOTER = "ReproSense AI · HealthX Ajyal 2026 · All people and data shown are fictional · Built with AI tools (Claude, ChatGPT)";

for (const [name, dark] of [
  ["DARK_TITLE_ONLY", true],
  ["LIGHT_TITLE_ONLY", false],
]) {
  pres.defineSlideMaster({
    title: name,
    background: { color: dark ? THEME.colors.dk2 : THEME.colors.lt2 },
    objects: [
      {
        placeholder: {
          options: { name: "title", type: "title", x: 0.6, y: 0.4, w: 12.1, h: 0.9, fontSize: 36, bold: true, color: dark ? C.background1 : C.text2, valign: "top", margin: 0 },
          text: "",
        },
      },
      { text: { text: FOOTER, options: { x: 0.6, y: 7.0, w: 11.2, h: 0.3, fontSize: 10, color: dark ? "C9BACD" : "6E5D73", margin: 0 } } },
    ],
    slideNumber: { x: 12.3, y: 7.0, w: 0.5, h: 0.3, fontSize: 10, color: dark ? "C9BACD" : "6E5D73", align: "right" },
  });
}

// ---------- 1 · The problem ----------
pres.addSection({ title: "Problem" });
const s1 = pres.addSlide({ masterName: "DARK_TITLE_ONLY", sectionTitle: "Problem" });
s1.addText("The story exists. It arrives in pieces", { placeholder: "title" });
s1.addText("Women in Abu Dhabi reach a gynaecologist with months of scattered period logs, symptoms and lab results, and no clear record of the pattern.", {
  x: 0.6, y: 1.35, w: 11.5, h: 0.7, fontSize: 18, color: "EBD7F0", margin: 0, isTextBox: true,
});
const STATS = [
  ["Up to 70%", "of women with PCOS are unaware of it", "WHO fact sheet, Jan 2026"],
  ["11.6 years", "from first symptoms to an endometriosis diagnosis (518 women, UAE)", "Frontiers in Global Women's Health, 2021"],
  ["1 in 5", "pregnancies in Al Ain had gestational diabetes (21.3% of 2,546)", "Frontiers in Endocrinology, 2022"],
  ["1 in 4", "came back for the glucose test after it (265 of 1,043, one Al Ain hospital)", "IJERPH, 2022"],
];
STATS.forEach(([big, label, src], i) => {
  const x = 0.6 + i * 3.08;
  s1.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y: 2.45, w: 2.85, h: 3.0, rectRadius: 0.2, fill: { color: C.accent6 }, line: { color: C.accent6 }, objectName: `stat-card-${i + 1}`,
  });
  s1.addText(big, { x: x + 0.25, y: 2.7, w: 2.4, h: 1.0, fontSize: 40, bold: true, color: C.accent2, margin: 0, isTextBox: true, fit: "shrink" });
  s1.addText(label, { x: x + 0.25, y: 3.8, w: 2.4, h: 1.1, fontSize: 16, color: C.background1, margin: 0, valign: "top", isTextBox: true });
  s1.addText(src, { x: x + 0.25, y: 4.95, w: 2.4, h: 0.4, fontSize: 10, italic: true, color: "C9BACD", margin: 0, isTextBox: true });
});
s1.addText(
  [
    { text: "That test is part of DoH Jawda PC008. ", options: { bold: true } },
    { text: "Lifting it from 1 in 4 to 1 in 2 would mean about 18 more mothers per 1,000 births with raised blood sugar found early." },
  ],
  { x: 0.6, y: 5.75, w: 12.1, h: 0.7, fontSize: 16, color: "EBD7F0", margin: 0, valign: "top", isTextBox: true },
);
s1.addText("Arithmetic, not a result: 1,000 × 21.3% × (50% − 25.4%) × 34.5% of tests showing raised sugar (pooled from 18 studies, Endocrine 2025). Every input is editable at reprosense.vercel.app/pilot.", {
  x: 0.6, y: 6.5, w: 12.1, h: 0.35, fontSize: 10, italic: true, color: "C9BACD", margin: 0, isTextBox: true,
});
s1.addNotes(
  "Up to 70% of women with PCOS don't know they have it. In a UAE study, endometriosis took 11.6 years from first symptoms to diagnosis. " +
    "In Al Ain about one pregnancy in five has gestational diabetes, and at one hospital only one in four of those women came back for the glucose test after birth. " +
    "The information exists; it just arrives in pieces. If a clinic lifted that follow-up from one in four to one in two, that is about 18 more mothers per 1,000 births whose raised blood sugar is found early: arithmetic from these studies, not a result we have measured. Sources: WHO 2026; Frontiers in Global Women's Health 2021; Frontiers in Endocrinology 2022; IJERPH 2022 (docs/05).",
);

// ---------- 2 · The solution ----------
pres.addSection({ title: "Solution" });
const s2 = pres.addSlide({ masterName: "LIGHT_TITLE_ONLY", sectionTitle: "Solution" });
s2.addText("ReproSense turns her record into a next step", { placeholder: "title" });
const ROWS = [
  ["Her record in 20 seconds", "Logs by tap or voice in Arabic or English. Lab reports read from a PDF or photo, and she checks every value."],
  ["Patterns, never a diagnosis", "Written rules from published guidelines. Each pattern shows the entries behind it and its source. Red flags come first, with 998."],
  ["AI that is checked", "Rules decide. AI reads her voice and lab photos and answers from cited sources. Held-out safety: crisis 30/30, emergencies 32/32. 14 of 14 attacks blocked."],
  ["The clinic loop", "With consent: a pre-visit brief, a doctor report, follow-ups that close DoH's PC008. After birth: DoH postnatal steps and the baby's first year."],
];
ROWS.forEach(([head, body], i) => {
  const y = 1.55 + i * 1.12;
  s2.addShape(pres.shapes.OVAL, { x: 0.6, y: y + 0.05, w: 0.55, h: 0.55, fill: { color: C.accent1 }, line: { color: C.accent1 }, objectName: `step-dot-${i + 1}` });
  s2.addText(String(i + 1), { x: 0.6, y: y + 0.05, w: 0.55, h: 0.55, fontSize: 18, bold: true, color: C.background1, align: "center", valign: "middle", margin: 0, isTextBox: true });
  s2.addText(head, { x: 1.4, y, w: 6.7, h: 0.4, fontSize: 20, bold: true, color: C.text2, margin: 0, isTextBox: true });
  s2.addText(body, { x: 1.4, y: y + 0.42, w: 6.7, h: 0.62, fontSize: 14, color: C.text1, margin: 0, valign: "top", isTextBox: true });
});
s2.addShape(pres.shapes.ROUNDED_RECTANGLE, {
  x: 0.6, y: 6.05, w: 7.5, h: 0.8, rectRadius: 0.15, fill: { color: "F4EDF4" }, line: { color: "E6D9E8" }, objectName: "edge-card",
});
s2.addText(
  [
    { text: "Why not a period tracker? ", options: { bold: true, color: C.text2 } },
    { text: "Trackers now print reports too. Our edge is the clinic loop, rules that cite their source, Arabic first, and we never sell health data.", options: { color: C.text1 } },
  ],
  { x: 0.8, y: 6.1, w: 7.1, h: 0.7, fontSize: 14, valign: "middle", margin: 0, isTextBox: true },
);
const IMG_H = 5.25;
const IMG_W = IMG_H * (780 / 1688);
s2.addImage({
  path: path.join(HERE, "img", "noura-insights.jpg"), x: 9.55, y: 1.45, w: IMG_W, h: IMG_H, altText: "Noura's Patterns screen: a pattern with the entries behind it and its guideline source",
  shadow: { type: "outer", color: "4B3653", opacity: 0.25, blur: 8, offset: 3, angle: 90 }, objectName: "screenshot-patterns",
});
s2.addText("Noura (fictional): a pattern, its evidence and its source", { x: 8.75, y: 6.8, w: 4.0, h: 0.25, fontSize: 10, italic: true, color: C.accent5, align: "center", margin: 0, isTextBox: true });
s2.addNotes(
  "She logs in seconds, by voice if she likes, in Arabic or English. Written rules from published guidelines find patterns worth discussing; every card shows the entries and the guideline, never a diagnosis, and red flags come first with 998. " +
    "The AI is checked: rules decide every pattern; the AI fills the log from her voice, reads lab photos and answers from a cited library, and sentences her data doesn't support are dropped; she can switch AI off. On 132 held-out questions written separately from the code and never used to tune it, the AI second check routed every crisis message (30 of 30) and every emergency (32 of 32) to support or 998, and an attack suite of 14 attacks, all blocked, runs on every change. " +
    "With her consent the clinic gets a pre-visit brief and a doctor report, and follow-ups close DoH's PC008 indicator. After a birth, the same record carries DoH's postnatal steps and her baby's first year: newborn screening, well-baby visits and vaccinations, each with its source. " +
    "Trackers like Flo and Clue print reports too; our moat is the clinic loop, cited rules, Arabic first, and no selling of health data.",
);

// ---------- 3 · The roadmap ----------
pres.addSection({ title: "Roadmap" });
const s3 = pres.addSlide({ masterName: "DARK_TITLE_ONLY", sectionTitle: "Roadmap" });
s3.addText("One clinic pilot, then a licensed company", { placeholder: "title" });
const STEPS = [
  ["Nov", "Claims frozen; device-classification memo for EDE; regulatory register"],
  ["Dec", "10 interviews; a clinic letter of intent; EDE enquiry; ADHICS gap assessment"],
  ["Feb", "UAE-hosted stack live; penetration test; 15–20 women and 3 clinicians test"],
  ["Mar–May", "Consented pilot: up to 20 women, 3 clinicians, one clinic; licensed company"],
];
s3.addShape(pres.shapes.LINE, { x: 1.0, y: 1.95, w: 11.3, h: 0, line: { color: "C9BACD", width: 1.5 }, objectName: "timeline" });
STEPS.forEach(([when, what], i) => {
  const x = 0.6 + i * 3.08;
  s3.addShape(pres.shapes.OVAL, { x: x + 0.2, y: 1.75, w: 0.4, h: 0.4, fill: { color: C.accent2 }, line: { color: C.accent2 }, objectName: `milestone-${i + 1}` });
  s3.addText(when, { x, y: 2.3, w: 2.85, h: 0.45, fontSize: 20, bold: true, color: C.accent2, margin: 0, isTextBox: true });
  s3.addText(what, { x, y: 2.8, w: 2.85, h: 1.3, fontSize: 14, color: C.background1, margin: 0, valign: "top", isTextBox: true });
});
const CARDS = [
  ["Who pays", "Women's health and IVF clinics: AED 399 per clinician a month (a price we are testing). Primary-care networks for the after-birth module (PC008). Payers and employers later. Women use it free."],
  ["What we need", "A pilot clinic. A clinical advisor to sign the rules. The HealthX Ajyal grant to reach a licensed company by month 6."],
];
CARDS.forEach(([head, body], i) => {
  const x = 0.6 + i * 6.2;
  s3.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 4.2, w: 5.9, h: 1.65, rectRadius: 0.2, fill: { color: C.accent6 }, line: { color: C.accent6 }, objectName: `card-${i + 1}` });
  s3.addText(head, { x: x + 0.3, y: 4.32, w: 5.3, h: 0.4, fontSize: 20, bold: true, color: C.accent2, margin: 0, isTextBox: true });
  s3.addText(body, { x: x + 0.3, y: 4.77, w: 5.3, h: 1.0, fontSize: 14, color: C.background1, margin: 0, valign: "top", isTextBox: true });
});
s3.addText(
  [
    { text: "Pilot measure: ", options: { bold: true } },
    { text: "the share of women with gestational diabetes who complete the glucose test within 12 weeks of birth (draft, pending clinician review)." },
  ],
  { x: 0.6, y: 5.98, w: 12.1, h: 0.35, fontSize: 14, color: "EBD7F0", margin: 0, isTextBox: true },
);
s3.addText("Since acceptance (17–21 Nov): 57 merged pull requests, each listed at reprosense.vercel.app/evidence. We are forming the company to run the pilot.", {
  x: 0.6, y: 6.33, w: 12.1, h: 0.3, fontSize: 12, bold: true, color: "EBD7F0", margin: 0, isTextBox: true,
});
s3.addText("Team: Krishna Mathur (AI, backend, safety) · Atharva Soundankar (web, design) · Yash Petkar (product, demo) · Dareen (mother and baby, Arabic)", {
  x: 0.6, y: 6.63, w: 11.5, h: 0.3, fontSize: 11, color: "C9BACD", margin: 0, isTextBox: true,
});
s3.addNotes(
  "In November we freeze our claims and write the device memo for the Emirates Drug Establishment. In December: ten interviews, a clinic letter of intent and the ADHICS gap assessment. " +
    "By February the stack runs in the UAE, pen-tested, with women and clinicians testing it. From March, a consented pilot at one clinic, judged on one number: how many women with gestational diabetes complete their glucose test within 12 weeks of birth. " +
    "Clinics pay per clinician seat; primary-care networks for the after-birth module. We need a pilot clinic, a clinical advisor and the grant (docs/19). " +
    "Since acceptance we merged 57 pull requests, every one listed with its date on /evidence, and we are forming the company to run this pilot.",
);

(async () => {
  await pres.writeFile({ fileName: OUT });
  if (APPLY_THEME) {
    const { applyTheme } = require(APPLY_THEME);
    await applyTheme(OUT, THEME);
  }
  console.log(OUT);
})();
