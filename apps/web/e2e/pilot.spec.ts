import { ar, en, expect, expectAccessible, expectNoSideScroll, test, useLanguage } from "./fixtures";

// The public pilot scenario page (rewritten 22 Nov 2026). The clinic supplies its eligible women and today's completion,
// sets a target, and sees the additional completed follow-ups: one subtraction (see src/lib/pilot-roi.test.ts). The page
// shows no cases found, no money and no per-1,000 projection; the Al Ain figure is a historical reference with its limits.
test("a clinic manager sees the scenario, changes an input and the result follows", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: en.chrome.footerPilot }).click();
  await expect(page).toHaveURL(/\/pilot$/);
  await expect(page.getByRole("heading", { level: 1, name: en.pilot.title })).toBeVisible();
  await expect(page.getByText(en.pilot.basis.example).first()).toBeVisible();
  await expect(page.getByText(en.pilot.basis.assumption)).toBeVisible();
  await expect(page.getByTestId("extra-completed")).toHaveText("25"); // 100 eligible women, 25% to 50%
  await expect(page.getByText(en.pilot.notOutcome)).toBeVisible();

  const reference = page.getByTestId("pilot-reference");
  await expect(reference).toContainText(en.pilot.reference);
  await expect(reference.getByRole("link", { name: /265 of 1,043 women.*4 to 6 weeks.*one Al Ain hospital, 2013 to 2014 data/ })).toHaveAttribute(
    "href",
    "https://doi.org/10.3390/ijerph192113946",
  );

  const result = page.getByTestId("pilot-result");
  await expect(result).not.toContainText("AED"); // no money value, and no ReproSense price
  await expect(result).not.toContainText(/raised blood sugar|found early|per 1,000/i); // completed tests only, never cases
  await expectAccessible(page, "pilot scenario");
  await expectNoSideScroll(page, "pilot scenario");

  await page.getByLabel(en.pilot.inputs.eligible).fill("20"); // the pilot's own size
  await expect(page.getByTestId("extra-completed")).toHaveText("5");
  await page.getByLabel(en.pilot.inputs.afterPct).fill("20"); // a target below today's 25%
  await expect(page.getByTestId("extra-completed")).toHaveText("0"); // never a negative number of follow-ups
});

test("the pilot page reads right to left in Arabic", async ({ page }) => {
  await page.goto("/");
  await useLanguage(page, "ar");
  await page.goto("/pilot");
  await expect(page.getByRole("heading", { level: 1, name: ar.pilot.title })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByTestId("extra-completed")).toHaveText("25");
  await expect(page.getByText(ar.pilot.notOutcome)).toBeVisible();
  await expectAccessible(page, "pilot scenario, Arabic");
  await expectNoSideScroll(page, "pilot scenario, Arabic");
});
