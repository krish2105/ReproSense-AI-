import { ar, en, expect, expectAccessible, expectNoSideScroll, test, useLanguage } from "./fixtures";

// Build week Y3: the public pilot value page. Defaults cite Abu Dhabi studies (21.3% gestational diabetes, 25.4%
// follow-up) or say "assumption"; the result is arithmetic on the inputs (see src/lib/pilot-roi.test.ts).
test("a clinic manager sees the arithmetic, changes an input and the result follows", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: en.chrome.footerPilot }).click();
  await expect(page).toHaveURL(/\/pilot$/);
  await expect(page.getByRole("heading", { level: 1, name: en.pilot.title })).toBeVisible();
  await expect(page.getByRole("link", { name: /21\.3% of 2,546 pregnancies/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /265 of 1,043 women/ })).toBeVisible();
  await expect(page.getByText(en.pilot.basis.assumption).first()).toBeVisible();
  await expect(page.getByTestId("extra-closed")).toHaveText("52");
  await expect(page.getByTestId("net")).toHaveText("AED 2,319");
  await expectAccessible(page, "pilot value");
  await expectNoSideScroll(page, "pilot value");

  await page.getByLabel(en.pilot.inputs.afterPct).fill("20"); // a target below today's 25.4%
  await expect(page.getByTestId("extra-closed")).toHaveText("0"); // never a negative number of follow-ups
  await expect(page.getByTestId("net")).toHaveText("AED -23,880");
});

test("the pilot page reads right to left in Arabic", async ({ page }) => {
  await page.goto("/");
  await useLanguage(page, "ar");
  await page.goto("/pilot");
  await expect(page.getByRole("heading", { level: 1, name: ar.pilot.title })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByTestId("net")).toHaveText("2,319 درهم");
  await expectAccessible(page, "pilot value, Arabic");
  await expectNoSideScroll(page, "pilot value, Arabic");
});
