import { ar, en, expect, expectAccessible, expectNoSideScroll, signIn, test, useLanguage } from "./fixtures";

// Showcase day: "What the Department of Health would see" on the network dashboard. Counts from the synthetic cohort
// only: women whose entries match a pattern worth discussing, how many shared a report with a clinic (by region),
// patterns by age band, and fertility-assessment timing. Never a diagnosis count, never a name.
test.describe("the Department of Health view", () => {
  test("the network role sees pattern-to-clinic counts that add up", async ({ page }) => {
    await signIn(page, { role: "admin" });
    await page.goto("/admin");
    const panel = page.getByTestId("population-view");
    await expect(panel.getByRole("heading", { name: en.admin.population.title })).toBeVisible();
    const num = async (id: string) => Number((await panel.locator(`[data-pop="${id}"] dd`).innerText()).replace(/\D/g, ""));
    const [matched, shared, notShared] = [await num("matched"), await num("shared"), await num("not-shared")];
    expect(matched).toBeGreaterThan(0);
    expect(shared + notShared).toBe(matched);
    await expect(panel.locator("[data-region]")).toHaveCount(3);
    await expect(panel.locator('[data-region="Al Ain"]')).toContainText(/\d+ of \d+ shared/);
    await expect(panel.getByRole("table", { name: en.admin.population.ageTitle })).toBeVisible();
    await expect(panel.locator('[data-pop="trying"]')).toContainText("fertility assessment");
    await expect(panel.getByText(en.admin.population.note)).toBeVisible();
    await expect(panel).not.toContainText(/PCOS|endometriosis|diagnosed|prevalence of/i);
    await expectAccessible(page, "network dashboard with the Department of Health view");
  });

  test("in Arabic at 390 px", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await signIn(page, { role: "admin" });
    await useLanguage(page, "ar");
    await page.goto("/admin");
    const panel = page.getByTestId("population-view");
    await expect(panel.getByRole("heading", { name: ar.admin.population.title })).toBeVisible();
    await expect(panel.getByText(ar.admin.population.note)).toBeVisible();
    await expectNoSideScroll(page, "Arabic network dashboard with the Department of Health view");
  });

  test("the numbers are refused to a clinician's session", async ({ page }) => {
    // In the demo, opening /admin signs the visitor in as the demo network role (one tap), so the check that matters
    // is the API: a clinician's session never receives these counts.
    await signIn(page, { role: "clinician" });
    const res = await page.request.get("/api/v1/admin/metrics");
    expect(res.status()).toBe(403);
  });
});
