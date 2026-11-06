import { ar, en, expect, expectAccessible, resetDemo, signIn, test, useLanguage } from "./fixtures";

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

// CLAUDE.md rule 5: EPDS item 10 > 0 opens the crisis path, never a score or a pattern card, in English and Arabic.
test.describe("the crisis path", () => {
  test.describe.configure({ mode: "serial" });
  test.afterAll(resetDemo); // the mood check writes an EPDS answer into Fatima's record

  for (const lang of ["en", "ar"] as const) {
    test(`a self-harm answer opens the support card only (${lang})`, async ({ page }) => {
      const m = lang === "ar" ? ar : en;
      await signIn(page, { persona: "fatima" });
      await useLanguage(page, lang);
      await page.goto("/app/checkin");
      for (let i = 0; i < 10; i++) {
        await page.locator(`input[name="epds-${i}"]`).nth(1).check(); // the second answer scores 1, so item 10 > 0
      }
      await page.getByRole("button", { name: m.checkin.submit }).click();
      const support = page.getByRole("region", { name: m.safety.crisisTitle });
      await expect(support).toBeVisible();
      await expect(support.getByRole("link", { name: m.safety.call })).toHaveAttribute("href", "tel:998");
      await expect(page.getByText(/(of|من) 30|EPDS total/)).toHaveCount(0); // no total, no score anywhere

      await page.getByRole("link", { name: m.checkin.back }).click();
      await expect(page).toHaveURL(/\/app$/);
      await expect(page.getByRole("region", { name: m.safety.crisisTitle })).toBeVisible();
      const main = await page.locator("#main").innerText();
      expect(main).not.toMatch(/EPDS total|(of|من) 30/);
      expect(main).not.toContain(lang === "ar" ? "لا يوجد في إدخالاتك نمط" : "No pattern in your entries");
      const first = await page.locator("#main").evaluate((el) => el.querySelector("section")?.getAttribute("aria-labelledby"));
      expect(first).toBe("crisis-title"); // the support card leads the page
      await expectAccessible(page, `home on the crisis path (${lang})`);
    });
  }
});
