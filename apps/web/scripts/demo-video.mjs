// The ~90-second submission demo (build week Y5): records the 3-minute path with captions, then makes an MP4.
// Every record shown is fictional demo data. Needs ffmpeg (with libx264) on PATH.
//
// Local stack (recommended: the demo is reset first, so every number is the seeded one):
//   make api                                                        # API on :8010
//   cd apps/web && pnpm build && pnpm start -p 3100                 # web on :3100 (another terminal)
//   cd apps/web && PW_CHANNEL=chrome node scripts/demo-video.mjs    # writes pitch/ReproSense-demo.mp4
//
// Live site: E2E_BASE_URL=https://reprosense.vercel.app DEMO_RESET=0 node scripts/demo-video.mjs
// (DEMO_RESET=0 leaves the shared live demo as it is; wake the API on /status first.)
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { chromium } from "@playwright/test";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3100";
const API = process.env.E2E_API_URL ?? "http://127.0.0.1:8010";
const RESET = process.env.DEMO_RESET !== "0";
const OUT = resolve(import.meta.dirname, "../../../pitch");
const RAW = join(OUT, ".video-raw");
const en = JSON.parse(readFileSync(resolve(import.meta.dirname, "../messages/en.json"), "utf8"));
const size = { width: 1280, height: 720 };

if (RESET) {
  const ctx = await (await import("@playwright/test")).request.newContext({ baseURL: API });
  const { token } = await (await ctx.post("/v1/demo/login", { data: { role: "admin" } })).json();
  const r = await ctx.post("/v1/demo/reset", { headers: { cookie: `rs_token=${token}` } });
  if (!r.ok()) throw new Error(`demo reset failed: ${r.status()}`);
  await ctx.dispose();
}

rmSync(RAW, { recursive: true, force: true });
mkdirSync(RAW, { recursive: true });
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined });
const ctx = await browser.newContext({
  baseURL: BASE,
  viewport: size,
  recordVideo: { dir: RAW, size },
  colorScheme: "light",
  locale: "en-GB",
});
const page = await ctx.newPage();
const tabs = () => page.getByRole("navigation", { name: en.chrome.tabsLabel });
const pause = (ms) => page.waitForTimeout(ms);

// A caption bar over the bottom of the frame; it survives client-side navigation and is re-added after a full load.
async function say(text, ms = 0) {
  await page.evaluate((t) => {
    let el = document.getElementById("rs-caption");
    if (!el) {
      el = document.createElement("div");
      el.id = "rs-caption";
      el.setAttribute("aria-hidden", "true");
      Object.assign(el.style, {
        position: "fixed", left: "50%", bottom: "28px", transform: "translateX(-50%)", zIndex: "2147483647",
        maxWidth: "980px", padding: "12px 22px", borderRadius: "14px", background: "rgba(43,22,48,.92)",
        color: "#fff", font: "600 21px/1.35 'Plus Jakarta Sans', system-ui, sans-serif", textAlign: "center",
        boxShadow: "0 8px 30px rgba(0,0,0,.25)", pointerEvents: "none",
      });
      document.body.appendChild(el);
    }
    el.textContent = t;
  }, text);
  if (ms) await pause(ms);
}
async function settle() {
  await page.waitForLoadState("load");
  await pause(900);
}
async function load(path) {
  await page.goto(path);
  await settle();
  await page.evaluate(() => document.fonts.ready);
}
async function scrollTo(locator) {
  await locator.scrollIntoViewIfNeeded();
  await pause(300);
}

// 1 · Landing (0:00)
await load("/");
await say("ReproSense AI: months of her own logs turned into explainable, non-diagnostic patterns. All data here is fictional.", 5000);

// 2 · Noura's home (0:06)
await page.getByRole("button", { name: en.landing.cta1, exact: true }).click();
await page.waitForURL(/\/app$/);
await settle();
await say("Noura, 24, Al Ain (fictional). Her cycle, today's phase and what stands out, built only from her entries.", 6000);

// 3 · Patterns with evidence (0:13)
await tabs().getByRole("link", { name: en.tabs.insights }).click();
await page.waitForURL(/\/app\/insights$/);
await settle();
const card = page.getByRole("article").first();
await say("Each pattern names the entries behind it, what to consider next and its guideline source. No diagnosis, no risk score.", 6000);
await card.getByRole("button", { name: en.insights.how }).click();
await say("Transparent rules decide; the trace shows the inputs and every step of the AI pipeline.", 5000);
await page.keyboard.press("Escape");

// 4 · Assistant with sources (0:24)
await tabs().getByRole("link", { name: en.tabs.assistant }).click();
await page.waitForURL(/\/app\/assistant$/);
await settle();
await say("She asks the assistant. Every answer cites its sources; urgent words get the UAE 998 guidance first.", 1500);
const ask = page.getByRole("textbox").last();
await ask.fill("What counts as a heavy period?");
await ask.press("Enter");
await page.getByRole("list", { name: en.assistant.sources }).last().waitFor({ timeout: 30_000 });
await scrollTo(page.getByRole("list", { name: en.assistant.sources }).last());
await pause(6000);

// 5 · Doctor report (0:33)
await tabs().getByRole("link", { name: en.tabs.report }).click();
await page.waitForURL(/\/app\/report$/);
await settle();
await say("One tap prepares a two-page doctor-ready report, in English or Arabic, shared only with her consent.", 1000);
const prepare = page.getByRole("button", { name: en.report.prepare });
if (await prepare.isVisible().catch(() => false)) await prepare.click();
await page.getByRole("link", { name: en.report.download }).waitFor({ timeout: 30_000 });
await pause(5500);

// 6 · Clinician view (0:40)
await load("/demo");
await page.getByRole("button", { name: en.demo.openClinic }).click();
await page.waitForURL(/\/clinic$/);
await settle();
await say("The clinician sees only patients who consented, most urgent first.", 4000);
await page.getByRole("navigation", { name: en.clinic.listLabel }).getByRole("link", { name: /Noura/ }).click();
await page.waitForURL(/\/clinic\/patients\/noura$/);
await settle();
await say("Same patient: a handover summary, her red flags and follow-ups, with the evidence a click away.", 4500);
const askRecord = page.getByRole("region", { name: en.clinic.askTitle });
await scrollTo(askRecord);
await askRecord.getByRole("textbox", { name: en.clinic.askLabel }).fill("pain that stopped work");
await askRecord.getByRole("button", { name: en.clinic.askSend, exact: true }).click();
await askRecord.locator(".msg.ai").waitFor({ timeout: 20_000 });
await say("Ask the record: answers come only from her own dated entries.", 5000);

// 7 · Fatima after the birth: the care gap closes (0:54)
await load("/clinic/patients/fatima");
await say("Fatima, 9 weeks after a birth with gestational diabetes: the glucose test is due under DoH's postnatal pathway.", 1000);
const gaps = page.getByRole("region", { name: en.clinic.gapsTitle });
await scrollTo(gaps);
await pause(4000);
const done = gaps.getByRole("button", { name: en.clinic.gapDone }).first();
if (await done.isVisible().catch(() => false)) {
  await done.click();
  await say("The clinic books and completes it: one care gap closed.", 4000);
}

// 8 · Clinic network (1:05)
await load("/demo");
await page.getByRole("button", { name: en.demo.openAdmin }).click();
await page.waitForURL(/\/admin$/);
await settle();
await say("The network view counts follow-ups closed live, by region, with a fairness check. Names never leave the clinic.", 6000);
await page.mouse.wheel(0, 700);
await pause(2500);

// 9 · Pilot value for a clinic or insurer (1:15)
await load("/pilot");
await say("For clinics and insurers: follow-ups closed and value per 1,000 women, with every assumption visible and editable.", 6000);

// 10 · Close (1:21)
await load("/");
await say("ReproSense AI · Understand your body. Recognise the patterns. Take informed action. Built with AI tools; demo data fictional.", 6000);

await page.close();
await ctx.close();
await browser.close();

const webm = readdirSync(RAW).filter((f) => f.endsWith(".webm")).map((f) => join(RAW, f))
  .sort((a, b) => statSync(b).size - statSync(a).size)[0];
const mp4 = join(OUT, "ReproSense-demo.mp4");
execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", webm, "-c:v", "libx264", "-preset", "slow", "-crf", "20",
  "-pix_fmt", "yuv420p", "-r", "30", "-movflags", "+faststart", "-an", mp4], { stdio: "inherit" });
rmSync(RAW, { recursive: true, force: true });
console.log(`wrote ${mp4}`);
