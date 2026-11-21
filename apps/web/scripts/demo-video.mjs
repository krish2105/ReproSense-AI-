// The ~100-second submission demo: records the 3-minute path with captions, then makes a 4K MP4 (3840x2160).
// Every record shown is fictional demo data. Needs ffmpeg (with libx264) on PATH.
// Quality: the page is laid out at 1280x720 (the size judges know from the live site) and rendered at 3x, and Chrome's screencast sends each changed frame at
// full 4K resolution. The frames keep their real timestamps and are encoded at 30 fps with x264 (CRF 12), so text
// stays sharp. (Playwright's recordVideo is fixed at about 1 Mbit/s VP8, which made the first MP4 blurry.)
//
// Local stack (recommended: the demo is reset first, so every number is the seeded one):
//   make api                                                        # API on :8010
//   cd apps/web && pnpm build && pnpm start -p 3100                 # web on :3100 (another terminal)
//   cd apps/web && PW_CHANNEL=chrome node scripts/demo-video.mjs    # writes pitch/ReproSense-demo.mp4
//
// Live site: E2E_BASE_URL=https://reprosense.vercel.app DEMO_RESET=0 node scripts/demo-video.mjs
// (DEMO_RESET=0 leaves the shared live demo as it is; wake the API on /status first.)
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { chromium } from "@playwright/test";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3100";
const API = process.env.E2E_API_URL ?? "http://127.0.0.1:8010";
const RESET = process.env.DEMO_RESET !== "0";
const OUT = resolve(import.meta.dirname, "../../../pitch");
const RAW = join(OUT, ".video-raw");
const en = JSON.parse(readFileSync(resolve(import.meta.dirname, "../messages/en.json"), "utf8"));
const size = { width: 1280, height: 720 }; // CSS pixels; x3 = 3840x2160
const SCALE = 3;

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
  deviceScaleFactor: SCALE,
  colorScheme: "light",
  locale: "en-GB",
});
const page = await ctx.newPage();

// Chrome's screencast: one JPEG per changed frame at full device resolution, with its timestamp.
const frames = [];
const cdp = await ctx.newCDPSession(page);
cdp.on("Page.screencastFrame", async ({ data, metadata, sessionId }) => {
  const file = join(RAW, `f${String(frames.length).padStart(6, "0")}.jpg`);
  writeFileSync(file, Buffer.from(data, "base64"));
  frames.push({ file, t: metadata.timestamp });
  await cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
});
await cdp.send("Page.startScreencast", {
  format: "jpeg", quality: 95, maxWidth: size.width * SCALE, maxHeight: size.height * SCALE, everyNthFrame: 1,
});
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
        maxWidth: "1000px", padding: "12px 22px", borderRadius: "14px", background: "rgba(43,22,48,.94)",
        color: "#fff", font: "600 21px/1.35 'Plus Jakarta Sans', system-ui, sans-serif", textAlign: "center",
        margin: "0", border: "0", inset: "auto auto 28px 50%", overflow: "visible",
        boxShadow: "0 8px 30px rgba(0,0,0,.25)", pointerEvents: "none",
      });
      document.body.appendChild(el);
    }
    el.textContent = t;
    el.style.display = t ? "" : "none"; // say("") hides the caption, e.g. while the app shows its own toast
    // A popover sits in the browser's top layer, so the caption stays above open dialogs (re-shown to be the newest).
    if ("popover" in el) {
      if (!el.popover) el.popover = "manual";
      if (el.matches(":popover-open")) el.hidePopover();
      el.showPopover();
    }
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

// The order follows the 3-minute pitch script (docs/27 section 4), so the MP4 doubles as the stage backup.
// 1 · Landing (0:00)
await load("/");
await say("ReproSense AI: months of her own logs turned into explainable, non-diagnostic patterns. All data here is fictional.", 4500);

// 2 · Noura's home (0:05)
await page.getByRole("button", { name: en.landing.cta1, exact: true }).click();
await page.waitForURL(/\/app$/);
await settle();
await say("Noura, 24, Al Ain (fictional). Her whole cycle on one ring, built only from her own entries.", 5000);

// 3 · Patterns with evidence (0:10)
await tabs().getByRole("link", { name: en.tabs.insights }).click();
await page.waitForURL(/\/app\/insights$/);
await settle();
const card = page.getByRole("article").first();
await say("A pattern worth discussing: the exact days behind it and the 2023 PCOS guideline it comes from. No diagnosis, no risk score.", 5500);
await card.getByRole("button", { name: en.insights.how }).click();
await say("Written rules decide every pattern. This trace shows the rule, the numbers it used and every step.", 4500);
await page.keyboard.press("Escape");

// 4 · Assistant with sources (0:20)
await tabs().getByRole("link", { name: en.tabs.assistant }).click();
await page.waitForURL(/\/app\/assistant$/);
await settle();
await say("Every answer cites its sources. Urgent words get 998 first; crisis words get 998 and DoH's 800-SAKINA line.", 1500);
const ask = page.getByRole("textbox").last();
await ask.fill("What counts as a heavy period?");
await ask.press("Enter");
await page.getByRole("list", { name: en.assistant.sources }).last().waitFor({ timeout: 30_000 });
await scrollTo(page.getByRole("list", { name: en.assistant.sources }).last());
await pause(5000);

// 5 · Before your visit (0:28)
await tabs().getByRole("link", { name: en.tabs.report }).click();
await page.waitForURL(/\/app\/report$/);
await settle();
const brief = page.getByRole("region", { name: en.brief.title });
if (await brief.isVisible().catch(() => false)) await scrollTo(brief);
await say("Before her appointment: what changed since her last visit, from her own entries, and a two-page report her doctor reads in a minute.", 6000);

// 6 · Her own words, in Arabic (0:34)
await tabs().getByRole("link", { name: en.tabs.log }).click();
await page.waitForURL(/\/app\/log/);
await settle();
await say("She can tell it in her own words, in Arabic or English: cramps, missed work, pain 7 out of 10.");
const example = page.getByRole("button", { name: en.log.example });
await scrollTo(example);
await example.click();
await pause(1500);
const read = page.getByRole("button", { name: en.log.readNote });
if (await read.isEnabled().catch(() => false)) await read.click();
await pause(3500);
await say("The form fills itself; nothing is saved until she checks it.", 3500);

// 7 · The clinic acts: Fatima's follow-up, and its history (0:44)
await page.request.post("/api/v1/demo/login", { data: { role: "clinician" } });
await load("/clinic/patients/fatima");
await say("The clinic sees only women who chose to share. Fatima had gestational diabetes; 9 weeks after the birth her glucose test is due (DoH PC008).", 1000);
const gaps = page.getByRole("region", { name: en.clinic.gapsTitle });
await scrollTo(gaps);
await pause(4500);
const book = gaps.getByRole("button", { name: en.clinic.gapBook }).first();
if (await book.isVisible().catch(() => false)) {
  await say("", 0); // the app's own toast says it was booked
  await book.click();
  await pause(2800);
}
const story = gaps.getByTestId(/^history-/).first();
if (await story.isVisible().catch(() => false)) {
  await story.locator("summary").click();
  await scrollTo(story);
  await say("Every step of the loop is on record: which rule opened it and why, when she shared, who booked it. From the hash-chained audit log.", 6500);
}

// 8 · The network view: the loop, measured (0:58)
await page.request.post("/api/v1/demo/login", { data: { role: "admin" } });
await load("/admin");
await say("DoH's network view counts follow-ups closing across clinics. Counts only, never names.", 4500);
const loopBox = page.getByRole("heading", { name: en.loop.title }).first();
if (await loopBox.isVisible().catch(() => false)) {
  await scrollTo(loopBox);
  await say("The loop, measured: days from a follow-up opening to booking, and postnatal steps done inside their DoH window.", 5500);
}

// 9 · Built since acceptance: the build-week record (1:09)
await load("/evidence");
const built = page.locator("#since-acceptance");
if (await built.isVisible().catch(() => false)) {
  await scrollTo(built);
  await say("Built since acceptance: every pull request merged in build week, each one linked on GitHub.", 5000);
}

// 10 · Mother and baby: Fatima's own app (1:14)
await page.request.post("/api/v1/demo/login", { data: { persona: "fatima" } });
await load("/app");
await say("For a mother, the same record carries her through the first weeks after birth: DoH's postnatal steps and what happened with each follow-up.", 5000);
const baby = page.getByTestId("baby-card");
if (await baby.isVisible().catch(() => false)) {
  await scrollTo(baby);
  await say("And her baby's first year: newborn screening, well-baby visits and vaccinations from DoH Abu Dhabi's schedules, each with its source.", 6000);
}

// 11 · Close (1:26)
await load("/");
await say("ReproSense AI · Understand your body. Recognise the patterns. Take informed action. Built with AI tools; demo data fictional.", 5500);

await pause(800);
await cdp.send("Page.stopScreencast").catch(() => {});
await page.close();
await ctx.close();
await browser.close();

// Each frame lasts until the next one arrived; the last one holds for a second. Then a constant 30 fps 4K encode.
const list = frames
  .map((f, i) => `file '${f.file}'\nduration ${Math.max(0.001, (frames[i + 1]?.t ?? f.t + 1) - f.t).toFixed(4)}`)
  .join("\n");
writeFileSync(join(RAW, "frames.txt"), `${list}\nfile '${frames.at(-1).file}'\n`);
const mp4 = join(OUT, "ReproSense-demo.mp4");
execFileSync("ffmpeg", [
  "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", join(RAW, "frames.txt"),
  "-vf", `fps=30,scale=${size.width * SCALE}:${size.height * SCALE}:flags=lanczos:in_range=pc:out_range=tv,format=yuv420p`,
  "-c:v", "libx264", "-preset", "slow", "-crf", "12", "-profile:v", "high", "-level", "5.1",
  "-pix_fmt", "yuv420p", "-color_range", "tv", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
  "-movflags", "+faststart", "-an", mp4,
], { stdio: "inherit" });
rmSync(RAW, { recursive: true, force: true });
console.log(`wrote ${mp4} from ${frames.length} frames`);
