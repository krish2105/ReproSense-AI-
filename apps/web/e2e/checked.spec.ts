import { ar, en, expect, expectAccessible, expectNoSideScroll, signIn, test, useLanguage } from "./fixtures";

// Showcase day: "What we checked and did not show" on Patterns. Her own numbers next to each rule's threshold, with
// its source, so an absent card is explained too (acne without irregular cycles never becomes a pattern). The list
// never reassures: the note under it says that not being shown is not a sign that nothing is wrong.
test.describe("what we checked", () => {
  test("Amina has no pattern and sees what was checked, with sources", async ({ page }) => {
    await signIn(page, { persona: "amina" });
    await page.goto("/app/insights");
    const list = page.getByTestId("checked-list");
    await expect(list.getByText(en.insights.checkedTitle)).toBeVisible();
    await expect(list.locator('[data-check="cycles"]')).toContainText("0 of your last 6 cycles");
    await expect(list.locator('[data-check="cycles"]')).toContainText("A pattern is shown from 2 such cycles");
    await expect(list.locator('[data-check="bleeding"]')).toContainText("A pattern is shown above 7 days");
    await expect(list.locator('[data-check="cycles"]').getByRole("link").first()).toHaveAttribute("href", /^https:/);
    await expect(list.getByText(en.insights.checkedNote)).toBeVisible();
    await expectAccessible(page, "patterns with the checked list");
  });

  test("Noura's cards are not repeated in the list, which starts closed", async ({ page }) => {
    await signIn(page, { persona: "noura" });
    await page.goto("/app/insights");
    const list = page.getByTestId("checked-list");
    await expect(list.locator('[data-check="cycles"]')).toHaveCount(0); // irregular cycles is a card already
    await expect(list.locator('[data-check="pain"]')).toBeHidden();
    await list.getByText(en.insights.checkedTitle).click();
    await expect(list.locator('[data-check="pain"]')).toContainText("A pattern is shown from 3 such periods");
  });

  test("in Arabic at 390 px", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await signIn(page, { persona: "amina" });
    await useLanguage(page, "ar");
    await page.goto("/app/insights");
    const list = page.getByTestId("checked-list");
    await expect(list.getByText(ar.insights.checkedTitle)).toBeVisible();
    await expect(list.locator('[data-check="cycles"]')).toContainText("دورتين");
    await expectNoSideScroll(page, "Arabic patterns with the checked list");
  });

  test("not shown in pregnancy", async ({ page }) => {
    await signIn(page, { persona: "hessa" });
    await page.goto("/app/insights");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByTestId("checked-list")).toHaveCount(0);
  });
});
