import { en, expect, expectAccessible, signIn, test } from "./fixtures";

// CLAUDE.md rule 5 and the readiness checklist: red flags run first and the urgent action is never behind a tap.
// Sara's record has heavy bleeding with dizziness (RF1).
test("Sara's red flag comes before everything else, with 998 one tap away", async ({ page }) => {
  await signIn(page, { persona: "sara" });
  await page.goto("/app");
  const urgent = page.getByRole("region", { name: en.home.urgentTitle });
  await expect(urgent).toBeVisible();
  await expect(urgent).toContainText(en.urgent.action);
  await expect(urgent.getByRole("link", { name: en.urgent.call }).first()).toHaveAttribute("href", "tel:998");

  // Nothing in her record comes before it: the urgent region is the first thing in the page content.
  const first = await page.locator("#main").evaluate((main) => {
    const el = main.querySelector("section, h1, h2, article");
    return el?.getAttribute("aria-label") ?? el?.textContent?.slice(0, 40) ?? "";
  });
  expect(first).toBe(en.home.urgentTitle);
  await expectAccessible(page, "Sara's home with a red flag");
});
