import { ar, en, expect, expectAccessible, expectNoSideScroll, resetDemo, test } from "./fixtures";

// The 3-minute showcase path (CLAUDE.md "Definition of done", docs/10 script, demo story of MASTER §13):
// landing → Noura (home, timeline, body map, patterns with evidence, assistant with sources, report PDF, share)
// → Hessa (care navigator drafts, she approves, nothing is sent) → clinician (same patient's summary, Ask the
// record, Fatima's follow-up closes) → network admin (the closed count moves live, fairness check).
test.describe.configure({ mode: "serial" });
test.beforeAll(resetDemo);
test.afterAll(resetDemo);

const tabs = (page: import("@playwright/test").Page) => page.getByRole("navigation", { name: en.chrome.tabsLabel });
// Names inside sentences are wrapped in Unicode isolates (FSI … PDI) so they keep their direction in Arabic.
const hello = (name: string) => new RegExp(`Hi, \u2068?${name}\u2069?`);

test("the demo path runs end to end in under three minutes", async ({ page }) => {
  test.setTimeout(180_000);
  const started = Date.now();

  await test.step("landing shows Noura's live record and the disclosures", async () => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(en.landing.h1);
    await expect(page.getByText(en.chrome.badge).first()).toBeVisible();
    await expect(page.getByText(en.chrome.footer)).toBeVisible(); // 998, "fictional", "Built with AI tools"
    const hero = page.getByRole("group", { name: en.landing.phoneLabel });
    await expect(hero.getByText("Day 19", { exact: true })).toBeVisible();
    await expect(page.locator("#hero3d svg circle")).toHaveCount(46); // one bead per day of her cycle
    await expectNoSideScroll(page, "landing");
    await expectAccessible(page, "landing");
  });

  await test.step("open Noura's record: home and timeline", async () => {
    await page.getByRole("button", { name: en.landing.cta1, exact: true }).click();
    await expect(page).toHaveURL(/\/app$/);
    await expect(page.getByText(hello("Noura"))).toBeVisible();
    await expect(page.getByRole("heading", { name: "Irregular cycles together with skin and hair changes" }).first()).toBeVisible();
    await tabs(page).getByRole("link", { name: en.tabs.timeline }).click();
    await expect(page).toHaveURL(/\/app\/timeline$/);
    await expect(page.locator("#len-sum")).toContainText("outside 21–35 days");
    await expectAccessible(page, "timeline");
  });

  await test.step("calendar: the body map marks where it hurts", async () => {
    await tabs(page).getByRole("link", { name: en.tabs.log }).click();
    const map = page.getByRole("group", { name: en.log.bodyTitle });
    await expect(map).toBeVisible();
    const point = map.getByRole("button", { name: "Lower abdomen" });
    await point.click();
    await expect(point).toHaveAttribute("aria-pressed", "true");
  });

  await test.step("patterns: evidence and how the card was produced", async () => {
    await tabs(page).getByRole("link", { name: en.tabs.insights }).click();
    await expect(page).toHaveURL(/\/app\/insights$/);
    const card = page.getByRole("article", { name: "Irregular cycles together with skin and hair changes" });
    await expect(card).toBeVisible();
    await expect(card).toContainText("This is not a diagnosis"); // rule 1: never diagnose
    await expect(card).toContainText("Why we noticed"); // rule 3: the entries behind it
    await expect(card.getByRole("link", { name: /^\d{1,2} [A-Z][a-z]{2} ·/ }).first()).toBeVisible();
    await expect(card).toContainText("Sources: International Evidence-based Guideline"); // and its source
    await card.getByRole("button", { name: en.insights.how }).click();
    const trace = page.getByRole("dialog", { name: en.insights.traceTitle });
    await expect(trace).toBeVisible();
    await expect(trace.getByRole("heading", { name: en.insights.traceInputs })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(trace).toBeHidden();
    await expectAccessible(page, "patterns");
    // An evidence chip opens the day it came from (demo-readiness: "evidence chip jumps to the day").
    await card.getByRole("link", { name: /^\d{1,2} [A-Z][a-z]{2} ·/ }).first().click();
    await expect(page).toHaveURL(/\/app\/log\?date=\d{4}-\d{2}-\d{2}$/);
    await expect(page.getByRole("group", { name: en.log.bodyTitle })).toBeVisible();
  });

  await test.step("assistant: an answer with numbered sources, then Arabic", async () => {
    await tabs(page).getByRole("link", { name: en.tabs.assistant }).click();
    await page.getByRole("button", { name: "What is PCOS?" }).click();
    const sources = page.getByRole("list", { name: en.assistant.sources }).last();
    await expect(sources.getByRole("listitem")).toHaveCount(2);
    await expect(page.locator(".msg.ai").last()).toContainText("PCOS");
    await page.getByRole("button", { name: en.chrome.lang.toggle }).click(); // "عربي"
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(ar.assistant.title);
    await expectNoSideScroll(page, "assistant in Arabic");
    await page.getByRole("button", { name: ar.chrome.lang.toggle }).click(); // "English"
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  });

  await test.step("report: the PDF downloads and a consented share shows its expiry", async () => {
    await tabs(page).getByRole("link", { name: en.tabs.report }).click();
    await expect(page.getByRole("heading", { name: en.report.title, level: 1 })).toBeVisible();
    // After a reset she has no report yet: preparing it is the demo moment ("ten seconds: a two-page report").
    await page.getByRole("button", { name: en.report.prepare }).click();
    await expect(page.getByText(en.report.prepared).first()).toBeVisible(); // the toast, also in a live region
    const download = page.getByRole("link", { name: en.report.download });
    await expect(download).toBeVisible();
    const href = await download.getAttribute("href");
    expect(href).toMatch(/\.pdf$/);
    const pdf = await page.request.get(href!);
    expect(pdf.headers()["content-type"]).toContain("application/pdf");
    expect((await pdf.body()).subarray(0, 5).toString()).toBe("%PDF-");

    await page.getByRole("button", { name: en.report.share }).click();
    const dialog = page.getByRole("dialog", { name: en.report.shareTitle });
    const confirm = dialog.getByRole("button", { name: en.report.confirm });
    await expect(confirm).toBeDisabled(); // consent first
    await dialog.getByRole("checkbox", { name: en.report.consent }).check();
    await confirm.click();
    await expect(page.getByText(/Shared until/).first()).toBeVisible();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: en.report.stop }).first().click();
    await expect(page.getByText(en.report.stopped).first()).toBeVisible();
  });

  await test.step("Hessa: the care navigator drafts, she approves, nothing is sent", async () => {
    await tabs(page).getByRole("link", { name: en.tabs.home }).click();
    await page.getByRole("group", { name: en.home.stagesLabel }).getByRole("button", { name: en.stages.pregnancy }).click();
    await expect(page.getByText(hello("Hessa"))).toBeVisible();
    await page.getByRole("button", { name: en.navigator.review }).click();
    const draft = page.getByRole("dialog", { name: en.navigator.dialogTitle });
    await expect(draft).toBeVisible();
    await draft.getByRole("button", { name: en.navigator.approve }).click();
    await expect(page.getByText(/Approved\. Nothing was sent/).first()).toBeVisible();
  });

  await test.step("clinician: the same patient's summary and Ask the record", async () => {
    await page.goto("/demo");
    await page.getByRole("button", { name: en.demo.openClinic }).click();
    await expect(page).toHaveURL(/\/clinic$/);
    await page.getByRole("navigation", { name: en.clinic.listLabel }).getByRole("link", { name: /Noura/ }).click();
    await expect(page).toHaveURL(/\/clinic\/patients\/noura$/);
    await expect(page).toHaveTitle(/^Noura A\. · Clinician/);
    await expect(page.getByRole("region", { name: en.clinic.sbarTitle })).toBeVisible();
    const ask = page.getByRole("region", { name: en.clinic.askTitle });
    await ask.getByRole("textbox", { name: en.clinic.askLabel }).fill("pain that stopped work");
    await ask.getByRole("button", { name: en.clinic.askSend, exact: true }).click();
    const reply = ask.locator(".msg.ai");
    await expect(reply).toBeVisible();
    await expect(reply).toContainText(/\d{1,2} [A-Z][a-z]{2}/); // answers come only from her entries, with dates
    await expect(reply.locator("li.ev").first()).toBeVisible();
    await expectAccessible(page, "clinician record");
  });

  await test.step("clinician closes Fatima's after-birth glucose follow-up", async () => {
    await page.goto("/clinic/patients/fatima");
    const gaps = page.getByRole("region", { name: en.clinic.gapsTitle });
    await expect(gaps.getByText(en.clinic.gapType.postpartum_glucose_test)).toBeVisible();
    await gaps.getByRole("button", { name: en.clinic.gapDone }).first().click();
    await expect(page.getByText(/Follow-up marked/).first()).toBeVisible();
  });

  await test.step("network admin: the closed count moved live", async () => {
    await page.goto("/demo");
    await page.getByRole("button", { name: en.demo.openAdmin }).click();
    await expect(page).toHaveURL(/\/admin$/);
    const figs = page.getByRole("definition").filter({ hasText: /^\d/ });
    await expect(figs.first()).toBeVisible();
    await expect(page.getByLabel(en.admin.kpiLabel)).toContainText("102"); // 101 seeded + Fatima's
    // Her glucose test is part of DoH Jawda KPI PC008: 3 of the 9 synthetic follow-ups done, plus Fatima's now
    await expect(page.getByRole("region", { name: en.admin.pc008Title })).toContainText("4 of 10 done");
    await expect(page.getByRole("heading", { name: en.admin.fairnessTitle })).toBeVisible();
    await expect(page.getByRole("heading", { name: en.admin.map3dTitle })).toBeVisible();
    await expectAccessible(page, "admin");
  });

  expect(Date.now() - started, "the whole path takes under three minutes").toBeLessThan(180_000);
});
