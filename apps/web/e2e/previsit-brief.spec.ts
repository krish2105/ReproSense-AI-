import { ar, en, expect, expectAccessible, expectNoSideScroll, resetDemo, signIn, test, useLanguage } from "./fixtures";

// K3 pre-visit brief: "what changed since your last visit", from her own entries. Noura has no visit recorded in the
// seeded demo, so the brief covers the 90 days before the demo date (24 Aug to 22 Nov 2026).
test.describe.configure({ mode: "serial" });
test.beforeAll(resetDemo);

test("Noura's report page shows the brief, each line with the entries behind it", async ({ page }) => {
  await signIn(page, { persona: "noura" });
  await page.goto("/app/report");
  const brief = page.getByRole("region", { name: en.brief.title });
  await expect(brief).toBeVisible();
  await expect(brief.getByText(en.brief.since.default_90_days.replace("{date}", "24 Aug 2026"))).toBeVisible();
  await expect(brief.getByRole("heading", { name: en.brief.groups.patterns })).toBeVisible();
  await expect(brief.getByText(/Still in the record: Your cycle lengths have been irregular/)).toBeVisible();
  await expect(brief.getByText(/56 days is the longest cycle in the record/)).toBeVisible();
  await expect(brief.getByText(/Total testosterone: 2\.4 nmol\/L on 1 Nov, above the lab's range/)).toBeVisible();
  await expect(brief.getByText(en.brief.template)).toBeVisible();
  // An entry chip opens the day it came from.
  const chip = brief.getByRole("link", { name: /^9 Sep · medium flow/ }).first();
  await expect(chip).toHaveAttribute("href", "/app/log?date=2026-09-09");
  await expectAccessible(page, "report page with the pre-visit brief");
  await expectNoSideScroll(page, "report page with the pre-visit brief");
});

test("the brief reads in Arabic", async ({ page }) => {
  await signIn(page, { persona: "noura" });
  await page.goto("/app/report");
  await useLanguage(page, "ar");
  await page.goto("/app/report");
  const brief = page.getByRole("region", { name: ar.brief.title });
  await expect(brief).toBeVisible();
  await expect(brief.getByRole("heading", { name: ar.brief.groups.cycle })).toBeVisible();
  await expect(brief.getByText(/ما زال في السجل: أطوال دوراتك كانت غير منتظمة/)).toBeVisible();
  await expectAccessible(page, "report page with the brief (Arabic)");
  await expectNoSideScroll(page, "report page with the brief (Arabic)");
});

test.describe("dark theme", () => {
  test.use({ colorScheme: "dark" });
  test("the brief is readable in the dark theme", async ({ page }) => {
    await signIn(page, { persona: "noura" });
    await page.goto("/app/report");
    await expect(page.getByRole("region", { name: en.brief.title })).toBeVisible();
    await expectAccessible(page, "report page with the brief (dark)");
  });
});

test("the clinician's record view shows the same brief in clinician voice", async ({ page }) => {
  await signIn(page, { role: "clinician" });
  await page.goto("/clinic/patients/noura");
  const brief = page.getByRole("region", { name: en.brief.clinicTitle });
  await expect(brief).toBeVisible();
  await expect(brief.getByText(/Still in the record: Irregular cycle lengths/)).toBeVisible();
  await expect(brief.getByText(/56 days is the longest cycle in the record/)).toBeVisible();
  await expect(brief.getByRole("heading", { name: en.brief.groups.clinicQuestions })).toBeVisible();
  await expect(brief.getByText(en.brief.clinicTemplate)).toBeVisible();
  await expectAccessible(page, "clinician record with the pre-visit brief");
  await expectNoSideScroll(page, "clinician record with the pre-visit brief");
});
