import AxeBuilder from "@axe-core/playwright";
import { ar, en, expect, expectAccessible, expectNoSideScroll, pickDate, resetDemo, signIn, test, useLanguage } from "./fixtures";

// Build week D1: her baby's first 12 months from DoH Abu Dhabi's own schedules (newborn screening standard, the ADPHC
// immunisation schedule of April 2026, the well-child visits standard). Fatima's baby was born on 20 Sep, 9 weeks
// before the demo date: the hospital screenings, the birth doses and the 1-month visit are done, and the 2-month
// visit and vaccinations are due. Nothing is ever "missed"; the clinician sees the same schedule, read-only.
const RECORD = new RegExp(`^${en.baby.record}`);

test.describe("baby's first year", () => {
  test.describe.configure({ mode: "serial" });
  test.afterEach(resetDemo); // the second test records a step in her demo record

  test("Fatima sees what is due for her baby first, then the year, with sources a tap away", async ({ page }) => {
    await signIn(page, { persona: "fatima" });
    await page.goto("/app");
    const card = page.getByTestId("baby-card");
    await expect(card.getByRole("heading", { name: en.baby.title })).toBeVisible();
    await expect(card.getByText("7 of 14 recorded")).toBeVisible();

    const next = card.getByTestId("baby-next");
    await expect(next.locator("[data-item]")).toHaveCount(2);
    const vaccines = next.locator('[data-item="vaccines_2m"]');
    await expect(vaccines.getByText(en.baby.status.due, { exact: true })).toBeVisible();
    await expect(vaccines).toContainText("PCV20");
    await expect(vaccines.getByRole("link", { name: /Immunization Schedule, updated April 2026/ })).toBeVisible();
    await expect(next.locator('[data-item="check_2m"]').getByRole("button", { name: RECORD })).toBeVisible();

    const heel = card.locator('[data-item="heel_prick"]');
    await expect(heel.getByText(en.baby.status.done, { exact: true })).toBeVisible();
    await expect(heel.getByRole("link", { name: /Newborn Screening Requirements/ })).toBeHidden();
    await heel.locator("summary").click();
    await expect(heel.getByRole("link", { name: /Newborn Screening Requirements/ })).toBeVisible();
    await expect(card.locator('[data-item="vaccines_4m"]').getByText(en.baby.status.upcoming, { exact: true })).toBeVisible();
    await expect(card).not.toContainText(/missed/i);
    await expectAccessible(page, "home with the baby's first-year card");
    await expectNoSideScroll(page, "home with the baby's first-year card");
  });

  test("she records the 2-month vaccinations and the clinician sees them, read-only", async ({ page }) => {
    await signIn(page, { persona: "fatima" });
    await page.goto("/app");
    const card = page.getByTestId("baby-card");
    await card.getByTestId("baby-next").locator('[data-item="vaccines_2m"]').getByRole("button", { name: RECORD }).click();
    const dialog = page.getByRole("dialog", { name: en.baby.recordTitle });
    await pickDate(dialog, en.baby.dateLabel, "2026-11-21");
    await dialog.getByRole("button", { name: en.baby.save }).click();
    await expect(page.getByText(en.baby.saved).first()).toBeVisible();
    await expect(card.getByText("8 of 14 recorded")).toBeVisible();
    await expect(card.locator('[data-item="vaccines_2m"]').getByText(en.baby.status.done, { exact: true })).toBeVisible();

    await signIn(page, { role: "clinician" });
    await page.goto("/clinic/patients/fatima");
    const section = page.getByTestId("clinic-baby");
    await expect(section.getByRole("heading", { name: en.baby.clinic.title })).toBeVisible();
    await expect(section.locator('[data-item="vaccines_2m"]').getByText(en.baby.status.done, { exact: true })).toBeVisible();
    await expect(section.locator('[data-item="check_2m"]').getByText(en.baby.status.due, { exact: true })).toBeVisible();
    await expect(section.getByRole("button")).toHaveCount(0); // read-only: only she records a step
  });

  test("a woman with no birth in the last 12 months has no baby card", async ({ page }) => {
    await signIn(page, { persona: "noura" });
    await page.goto("/app");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByTestId("baby-card")).toHaveCount(0);
  });
});

test.describe("baby's first year in Arabic, dark", () => {
  test.use({ colorScheme: "dark" });

  test("the card reads right to left and passes axe", async ({ page }) => {
    await signIn(page, { persona: "fatima" });
    await useLanguage(page, "ar");
    await page.goto("/app");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    const card = page.getByTestId("baby-card");
    await expect(card.getByRole("heading", { name: ar.baby.title })).toBeVisible();
    const vaccines = card.getByTestId("baby-next").locator('[data-item="vaccines_2m"]');
    await expect(vaccines).toContainText("تطعيمات بعمر شهرين");
    await expect(vaccines.getByText(ar.baby.status.due, { exact: true })).toBeVisible();
    await card.locator('[data-item="vaccines_birth"] summary').click();
    await expect(card.locator('[data-item="vaccines_birth"]')).toContainText("BCG");
    await expectNoSideScroll(page, "Arabic home with the baby card");
    const r = await new AxeBuilder({ page }).include('[data-testid="baby-card"]').withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`), "axe on the Arabic dark baby card").toEqual([]);
  });
});
