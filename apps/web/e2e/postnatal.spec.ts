import { ar, en, expect, expectAccessible, expectNoSideScroll, resetDemo, signIn, test, useLanguage } from "./fixtures";

// Build week K1: her first 6 weeks after a birth, following DoH Abu Dhabi's Postnatal Care Program Standard.
// Fatima gave birth on 20 Sep (9 weeks before the demo date): her mood check is done, the glucose test after
// gestational diabetes is due, and the visits are "not recorded" (never "missed").
test.describe("postnatal pathway", () => {
  test.describe.configure({ mode: "serial" });
  test.afterEach(resetDemo); // the second test records a check in her demo record

  test("Fatima sees her first 6 weeks with sources", async ({ page }) => {
    await signIn(page, { persona: "fatima" });
    await page.goto("/app");
    const card = page.getByTestId("postnatal-card");
    await expect(card.getByRole("heading", { name: en.postnatal.title })).toBeVisible();
    const mood = card.locator('[data-step="mood"]');
    await expect(mood.getByText(en.postnatal.status.done, { exact: true })).toBeVisible();
    await expect(card.locator('[data-step="glucose_test"]').getByText(en.postnatal.status.due, { exact: true })).toBeVisible();
    await expect(card.locator('[data-step="visit_6w"]').getByText(en.postnatal.status.not_recorded, { exact: true })).toBeVisible();
    await expect(card.getByRole("link", { name: /Postnatal Care Program Standard/ }).first()).toBeVisible();
    await expect(card).not.toContainText(/missed/i);
    await expectAccessible(page, "home with the postnatal card");
    await expectNoSideScroll(page, "home with the postnatal card");
  });

  test("she records her 6-week visit and the clinician sees it", async ({ page }) => {
    await signIn(page, { persona: "fatima" });
    await page.goto("/app");
    const step = page.getByTestId("postnatal-card").locator('[data-step="visit_6w"]');
    await step.getByRole("button", { name: en.postnatal.record }).click();
    const dialog = page.getByRole("dialog", { name: en.postnatal.recordTitle });
    await dialog.getByLabel(en.postnatal.dateLabel).fill("2026-11-02");
    await dialog.getByRole("button", { name: en.postnatal.save }).click();
    await expect(step.getByText(en.postnatal.status.done, { exact: true })).toBeVisible();

    await signIn(page, { role: "clinician" });
    await page.goto("/clinic/patients/fatima");
    const section = page.getByTestId("clinic-postnatal");
    await expect(section.getByRole("heading", { name: en.postnatal.clinic.title })).toBeVisible();
    await expect(section.getByText(en.postnatal.status.done, { exact: true }).first()).toBeVisible();
  });

  test("the card reads right to left in Arabic", async ({ page }) => {
    await signIn(page, { persona: "fatima" });
    await useLanguage(page, "ar");
    await page.goto("/app");
    const card = page.getByTestId("postnatal-card");
    await expect(card.getByRole("heading", { name: ar.postnatal.title })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expectNoSideScroll(page, "Arabic home with the postnatal card");
  });
});
