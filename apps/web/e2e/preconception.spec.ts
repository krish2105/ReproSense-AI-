import { ar, en, expect, expectAccessible, expectNoSideScroll, resetDemo, signIn, test, useLanguage } from "./fixtures";

// Build week Y1: the planning-a-pregnancy checklist for the Trying stage. Mariam has been trying for long enough that
// OBS_TTC_FERTILITY_ASSESSMENT fires, so "When to ask about a fertility check" says her entries point to it. Every
// item cites its sources; a tick is saved to her record and can be undone.
test.describe("planning a pregnancy", () => {
  test.describe.configure({ mode: "serial" });
  test.afterEach(resetDemo); // the second test ticks an item in her demo record

  test("Mariam sees five sourced items, one pointed to by her entries", async ({ page }) => {
    await signIn(page, { persona: "mariam" });
    await page.goto("/app");
    const card = page.getByTestId("preconception-card");
    await expect(card.getByRole("heading", { name: en.preconception.title })).toBeVisible();
    await expect(card.locator("[data-item]")).toHaveCount(5);
    await expect(card.locator('[data-item="fertility_check"]').getByText(en.preconception.relevant)).toBeVisible();
    await expect(card.locator('[data-item="folic_acid"]').getByText(en.preconception.relevant)).toHaveCount(0);
    await expect(card.getByRole("link", { name: /Premarital Screening Standard/ })).toHaveCount(2); // two items cite it
    await expect(card.getByText(en.preconception.note)).toBeVisible();
    await expectAccessible(page, "home with the planning-a-pregnancy checklist");
    await expectNoSideScroll(page, "home with the planning-a-pregnancy checklist");
  });

  test("she ticks folic acid, it stays ticked after a reload, and she can untick it", async ({ page }) => {
    await signIn(page, { persona: "mariam" });
    await page.goto("/app");
    const card = page.getByTestId("preconception-card");
    const box = card.getByRole("checkbox", { name: en.preconception.items.folic_acid.title });
    await box.check();
    await expect(card.getByText("1 of 5 ticked")).toBeVisible();
    await page.reload();
    await expect(page.getByTestId("preconception-card").getByRole("checkbox", { name: en.preconception.items.folic_acid.title })).toBeChecked();
    await page.getByTestId("preconception-card").getByRole("checkbox", { name: en.preconception.items.folic_acid.title }).uncheck();
    await expect(page.getByTestId("preconception-card").getByText("0 of 5 ticked")).toBeVisible();
  });

  test("only for the Trying stage, and right to left in Arabic", async ({ page }) => {
    await signIn(page, { persona: "noura" });
    await page.goto("/app");
    await expect(page.getByTestId("preconception-card")).toHaveCount(0);
    await signIn(page, { persona: "mariam" });
    await useLanguage(page, "ar");
    await page.goto("/app");
    const card = page.getByTestId("preconception-card");
    await expect(card.getByRole("heading", { name: ar.preconception.title })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expectNoSideScroll(page, "Arabic home with the checklist");
  });
});
