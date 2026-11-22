// Screenshots of the running product for the pitch deck (pitch/img). Needs the API on :8010 and `next start -p 3100`.
// Run: cd apps/web && PW_CHANNEL=chrome node scripts/pitch-shots.mjs   (then: python3 ../../pitch/build_deck.py)
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3100";
const API = process.env.E2E_API_URL ?? "http://127.0.0.1:8010";
const OUT = resolve(import.meta.dirname, "../../../pitch/img");
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined });
async function as(who, viewport) {
  const ctx = await browser.newContext({ baseURL: BASE, viewport, deviceScaleFactor: 2, reducedMotion: "reduce", colorScheme: "light" });
  const page = await ctx.newPage();
  const res = await page.request.post("/api/v1/demo/login", { data: who });
  if (!res.ok()) throw new Error(`login ${JSON.stringify(who)}: ${res.status()}`);
  return { ctx, page };
}
async function settle(page) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
}

// Start from the seeded demo, so every number in the shots is the one the demo shows.
{
  const ctx = await (await import("@playwright/test")).request.newContext({ baseURL: API });
  const { token } = await (await ctx.post("/v1/demo/login", { data: { role: "admin" } })).json();
  const r = await ctx.post("/v1/demo/reset", { headers: { cookie: `rs_token=${token}` } });
  if (!r.ok()) throw new Error("reset failed");
  await ctx.dispose();
}

const phone = { width: 390, height: 844 };
const desk = { width: 1280, height: 860 };

{
  const { ctx, page } = await as({ persona: "noura" }, phone);
  await page.goto("/app/insights");
  await settle(page);
  await page.screenshot({ path: `${OUT}/noura-insights.png` });
  // The doctor report: prepare it, fetch the PDF, render page 1.
  await page.goto("/app/report");
  await settle(page);
  await page.getByRole("button", { name: /prepare/i }).first().click();
  const link = page.getByRole("link", { name: /download/i }).first();
  await link.waitFor();
  const pdf = await page.request.get(await link.getAttribute("href"));
  writeFileSync(`${OUT}/report.pdf`, await pdf.body());
  execFileSync("pdftoppm", ["-png", "-r", "110", "-f", "1", "-l", "1", "-singlefile", `${OUT}/report.pdf`, `${OUT}/report-page1`]);
  await ctx.close();
}
{
  const { ctx, page } = await as({ role: "clinician" }, desk);
  await page.goto("/clinic/patients/noura");
  await settle(page);
  await page.screenshot({ path: `${OUT}/clinic-record.png` });
  await ctx.close();
}
{
  const { ctx, page } = await as({ role: "admin" }, { width: 860, height: 1000 }); // narrow: the panel text stays readable on a slide
  await page.goto("/admin");
  await settle(page);
  const panel = page.locator("section").filter({ has: page.getByRole("heading", { name: /PC008/ }) });
  await panel.screenshot({ path: `${OUT}/admin-pc008.png` });
  await ctx.close();
}
await browser.close();
console.log("shots written to", OUT);
