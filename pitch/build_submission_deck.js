// The 3-slide submission deck (build week Y5): problem, solution, roadmap. Every number carries its source line
// (docs/05, docs/10, docs/19). Run: node pitch/build_submission_deck.js  ->  pitch/ReproSense-submission.pptx
// Then the PDF: soffice --headless --convert-to pdf pitch/ReproSense-submission.pptx (see pitch/README.md).
const path = require("path");
const NOTES = require("./speaker_notes"); // the words each of us says (Presenter View)
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
s1.addText("Noura knows something is wrong. She can't explain it", { placeholder: "title" });
s1.addText("Noura, 24, Al Ain (fictional). For a year her periods have come every six to eight weeks, with acne and extra hair. In a ten-minute visit she can't remember the dates, feels embarrassed, and is told to come back if it gets worse.", {
  x: 0.6, y: 1.3, w: 12.1, h: 0.95, fontSize: 18, color: "EBD7F0", margin: 0, isTextBox: true,
});
const STATS = [
  ["Up to 70%", "of women with PCOS don't know they have it", "WHO fact sheet, Jan 2026"],
  ["11.6 years", "from first symptoms to an endometriosis diagnosis (518 women, UAE)", "Frontiers in Global Women's Health, 2021"],
];
STATS.forEach(([big, label, src], i) => {
  const x = 0.6 + i * 6.2;
  s1.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y: 2.5, w: 5.9, h: 2.45, rectRadius: 0.2, fill: { color: C.accent6 }, line: { color: C.accent6 }, objectName: `stat-card-${i + 1}`,
  });
  s1.addText(big, { x: x + 0.35, y: 2.7, w: 5.2, h: 1.0, fontSize: 48, bold: true, color: C.accent2, margin: 0, isTextBox: true, fit: "shrink" });
  s1.addText(label, { x: x + 0.35, y: 3.75, w: 5.2, h: 0.75, fontSize: 18, color: C.background1, margin: 0, valign: "top", isTextBox: true });
  s1.addText(src, { x: x + 0.35, y: 4.5, w: 5.2, h: 0.35, fontSize: 11, italic: true, color: "C9BACD", margin: 0, isTextBox: true });
});
s1.addText(
  [
    { text: "The problem isn't tracking. It's explaining. ", options: { bold: true, color: C.accent2 } },
    { text: "Women hesitate, forget the details, or worry about being judged, so what her body has been telling her for months never reaches her doctor clearly." },
  ],
  { x: 0.6, y: 5.25, w: 12.1, h: 1.05, fontSize: 20, color: "EBD7F0", margin: 0, valign: "top", isTextBox: true },
);
s1.addText("Noura and every person in this deck and demo are fictional.", {
  x: 0.6, y: 6.45, w: 12.1, h: 0.35, fontSize: 11, italic: true, color: "C9BACD", margin: 0, isTextBox: true,
});
s1.addNotes(NOTES.SLIDE_1);

// ---------- 2 · The solution ----------
pres.addSection({ title: "Solution" });
const s2 = pres.addSlide({ masterName: "LIGHT_TITLE_ONLY", sectionTitle: "Solution" });
s2.addText("ReproSense does the explaining for her", { placeholder: "title" });
const ROWS = [
  ["She logs in seconds", "A tap, or a sentence in Gulf Arabic or English. A year of her days, pain, flow and lab results in one private record."],
  ["Her evidence, never a diagnosis", "Rules from published guidelines show the pattern, the exact days behind it and its source. Red flags come first, with 998."],
  ["Nura explains her body", "Plain words from NHS and guideline sources, with her own numbers. Never a diagnosis or a medicine. Held-out safety: crisis 30/30, emergencies 32/32."],
  ["Her doctor reads it in a minute", "With her consent: a two-page report and a pre-visit brief. No forgetting, no judging: her record speaks for her."],
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
    { text: "Why not a tracker or ChatGPT? ", options: { bold: true, color: C.text2 } },
    { text: "Trackers log; chatbots don't know her record. We turn her year into evidence her doctor can act on, Arabic first, and never sell health data.", options: { color: C.text1 } },
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
s2.addNotes(NOTES.SLIDE_2);

// ---------- 3 · The roadmap ----------
pres.addSection({ title: "Roadmap" });
const s3 = pres.addSlide({ masterName: "DARK_TITLE_ONLY", sectionTitle: "Roadmap" });
s3.addText("One clinic pilot, then a licensed company", { placeholder: "title" });
const STEPS = [
  ["Nov", "Claims frozen; device-classification memo for EDE; regulatory register"],
  ["Dec", "10 interviews; a clinic letter of intent; EDE enquiry; ADHICS gap assessment"],
  ["Feb", "UAE hosting and UAE PASS sign-in; penetration test; 15–20 women and 3 clinicians test"],
  ["Mar–May", "Consented pilot at one clinic, up to 20 women; licensed company; Malaffi link, ready for Sahatna"],
];
s3.addShape(pres.shapes.LINE, { x: 1.0, y: 1.95, w: 11.3, h: 0, line: { color: "C9BACD", width: 1.5 }, objectName: "timeline" });
STEPS.forEach(([when, what], i) => {
  const x = 0.6 + i * 3.08;
  s3.addShape(pres.shapes.OVAL, { x: x + 0.2, y: 1.75, w: 0.4, h: 0.4, fill: { color: C.accent2 }, line: { color: C.accent2 }, objectName: `milestone-${i + 1}` });
  s3.addText(when, { x, y: 2.3, w: 2.85, h: 0.45, fontSize: 20, bold: true, color: C.accent2, margin: 0, isTextBox: true });
  s3.addText(what, { x, y: 2.8, w: 2.85, h: 1.3, fontSize: 14, color: C.background1, margin: 0, valign: "top", isTextBox: true });
});
const CARDS = [
  ["Users, and who pays", "Women like Noura use it free; their doctors read her report. Clinics and primary-care networks pay a subscription, because it closes DoH's PC008 follow-up; insurers later, per follow-up closed. Price set with our pilot clinic."],
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
s3.addText("Team: Krishna Mathur (AI, backend, safety) · Atharva Soundankar (web, design) · Yash Petkar (product, venture) · Zebo (biology, women's health evidence)", {
  x: 0.6, y: 6.63, w: 11.5, h: 0.3, fontSize: 11, color: "C9BACD", margin: 0, isTextBox: true,
});
s3.addNotes(NOTES.SLIDE_3);

// ---------- 4 · The demo (organisers' format, 22 Nov: 3 to 4 slides, the 4th is the demo) ----------
pres.addSection({ title: "Demo" });
const s4 = pres.addSlide({ masterName: "LIGHT_TITLE_ONLY", sectionTitle: "Demo" });
s4.addText("The demo: her record, her clinic, the network", { placeholder: "title" });
const DEMO = [
  ["Her record", "Noura (fictional, 24): a pattern with the days behind it and its guideline. Nura explains what is happening in her body, with NHS sources. She logs by voice in Arabic."],
  ["Her clinic", "Fatima had diabetes in pregnancy. Her after-birth glucose test is due (DoH PC008); the clinician books it in one tap, with consent."],
  ["The network", "Follow-ups closing across clinics, counts only, never names: what a clinic or an insurer pays for."],
];
DEMO.forEach(([head, body], i) => {
  const x = 0.6 + i * 3.0;
  s4.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.6, w: 2.8, h: 3.1, rectRadius: 0.2, fill: { color: "F4EDF4" }, line: { color: "E6D9E8" }, objectName: `demo-card-${i + 1}` });
  s4.addShape(pres.shapes.OVAL, { x: x + 0.25, y: 1.85, w: 0.5, h: 0.5, fill: { color: C.accent1 }, line: { color: C.accent1 }, objectName: `demo-dot-${i + 1}` });
  s4.addText(String(i + 1), { x: x + 0.25, y: 1.85, w: 0.5, h: 0.5, fontSize: 16, bold: true, color: C.background1, align: "center", valign: "middle", margin: 0, isTextBox: true });
  s4.addText(head, { x: x + 0.25, y: 2.5, w: 2.35, h: 0.4, fontSize: 18, bold: true, color: C.text2, margin: 0, isTextBox: true });
  s4.addText(body, { x: x + 0.25, y: 2.95, w: 2.35, h: 1.65, fontSize: 13, color: C.text1, margin: 0, valign: "top", isTextBox: true });
});
s4.addImage({ path: path.join(HERE, "img", "qr-live.png"), x: 10.05, y: 1.6, w: 2.4, h: 2.4, altText: "QR code to reprosense.vercel.app", objectName: "qr-live" });
s4.addText("reprosense.vercel.app", { x: 9.75, y: 4.05, w: 3.0, h: 0.35, fontSize: 14, bold: true, color: C.text2, align: "center", margin: 0, isTextBox: true });
s4.addText("Live now. Recorded backup: ReproSense-demo.mp4", { x: 9.75, y: 4.4, w: 3.0, h: 0.3, fontSize: 10, italic: true, color: C.accent5, align: "center", margin: 0, isTextBox: true });
s4.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 5.05, w: 12.1, h: 1.15, rectRadius: 0.15, fill: { color: "FFFFFF" }, line: { color: "E6D9E8" }, objectName: "life-course" });
s4.addText(
  [
    { text: "One record for her whole reproductive life. ", options: { bold: true, color: C.text2 } },
    { text: "Periods and women's health, fertility and trying to conceive, pregnancy, after birth with her baby's first year, and perimenopause. For longevity, the follow-ups that protect her later health close: after diabetes in pregnancy, type 2 diabetes is about ten times more likely (BMJ, 2020).", options: { color: C.text1 } },
  ],
  { x: 0.85, y: 5.12, w: 11.6, h: 1.0, fontSize: 14, valign: "middle", margin: 0, isTextBox: true },
);
s4.addText("All people and data in the demo are fictional. AI use is disclosed in the app.", { x: 0.6, y: 6.45, w: 12.1, h: 0.3, fontSize: 11, italic: true, color: C.accent5, margin: 0, isTextBox: true });
s4.addNotes(NOTES.SLIDE_4);

// pptxgenjs writes each slide's notes as one run with raw line breaks, which PowerPoint's Presenter View shows as one
// block. Split them into real paragraphs, and bold the headings (the speaker line, IF ASKED, DEMO, TIMING, steps).
async function splitNotes(file) {
  const fs = require("fs");
  const JSZip = require("jszip");
  const zip = await JSZip.loadAsync(fs.readFileSync(file));
  const xmlEsc = (t) => t.replace(/&(?!(amp|lt|gt|quot|apos);)/g, "&amp;");
  const heading = (line) => /^[A-Z][A-Z &·]+(·|$)/.test(line) || /^=== /.test(line) || /^\d\. /.test(line);
  for (const name of Object.keys(zip.files).filter((n) => /^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(n))) {
    const xml = await zip.file(name).async("string");
    const out = xml.replace(/<a:p><a:r><a:rPr lang="en-US" dirty="0"\/><a:t>([\s\S]*?)<\/a:t><\/a:r>(<a:endParaRPr[^>]*\/>)?<\/a:p>/, (_, text) =>
      text
        .split(/\r?\n/)
        .map((line) =>
          line.trim() === ""
            ? '<a:p><a:endParaRPr lang="en-US" sz="1200" dirty="0"/></a:p>'
            : `<a:p><a:r><a:rPr lang="en-US" sz="1400"${heading(line) ? ' b="1"' : ""} dirty="0"/><a:t>${xmlEsc(line)}</a:t></a:r></a:p>`,
        )
        .join(""),
    );
    zip.file(name, out);
  }
  fs.writeFileSync(file, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}

(async () => {
  await pres.writeFile({ fileName: OUT });
  if (APPLY_THEME) {
    const { applyTheme } = require(APPLY_THEME);
    await applyTheme(OUT, THEME);
  }
  await splitNotes(OUT);
  console.log(OUT);
})();
