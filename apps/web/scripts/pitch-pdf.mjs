// Print pitch/deck.html to pitch/ReproSense-pitch.pdf, one slide per page (the venue backup).
// Run: cd apps/web && PW_CHANNEL=chrome node scripts/pitch-pdf.mjs
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const deck = resolve(import.meta.dirname, "../../../pitch/deck.html");
const out = resolve(import.meta.dirname, "../../../pitch/ReproSense-pitch.pdf");
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto(pathToFileURL(deck).href);
await page.evaluate(() => document.fonts.ready);
await page.pdf({ path: out, width: "1280px", height: "720px", printBackground: true });
await browser.close();
console.log("wrote", out);
