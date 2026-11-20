import { ar, en, expect, expectAccessible, expectNoSideScroll, resetDemo, signIn, test, useLanguage } from "./fixtures";

// Build week D2: the feeding log after a birth. Fatima's baby is 9 weeks old; the demo holds her last 7 days of feeds
// and one feed 3 days ago where she marked pain. A worry gets a fixed line to talk to her midwife, nurse or doctor, with
// its NHS source. No amounts, no score, no red flag.
const fill = (s: string, values: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k: string) => values[k] ?? "");

test.describe("feeding log", () => {
  test.describe.configure({ mode: "serial" });
  test.afterEach(resetDemo); // the first test saves a feed into Fatima's demo record

  test("Fatima logs a formula feed with a worry and sees the sourced line", async ({ page }) => {
    await signIn(page, { persona: "fatima" });
    await page.goto("/app");
    const card = page.getByTestId("feeding-card");
    await expect(card.getByRole("heading", { name: en.feeding.title })).toBeVisible();
    await expect(card.getByTestId("feeding-today")).toHaveText("4 feeds today");
    await expect(card.locator('[data-worry="pain"]')).toContainText("midwife, nurse or breastfeeding specialist");
    await expect(card.getByRole("link", { name: /Common breastfeeding problems/ })).toHaveAttribute("href", /nhs\.uk/);
    await expect(card.getByRole("img", { name: new RegExp(en.feeding.chartTitle) })).toBeVisible();

    const worry = card.getByRole("button", { name: en.feeding.worry.few_wet_nappies });
    await worry.click();
    await expect(worry).toHaveAttribute("aria-pressed", "true");
    await card.getByRole("button", { name: fill(en.feeding.logAs, { kind: en.feeding.kind.formula }) }).click();

    await expect(page.getByRole("status")).toContainText(fill(en.feeding.saved, { kind: en.feeding.kind.formula }));
    await expect(card.getByTestId("feeding-today")).toHaveText("5 feeds today");
    await expect(card.locator('[data-worry="few_wet_nappies"]')).toContainText("at least 6 heavy wet nappies");
    await expect(card.getByRole("link", { name: /is my baby getting enough milk/ })).toBeVisible();
    await expect(worry).toHaveAttribute("aria-pressed", "false");
    await expectAccessible(page, "home with the feeding log");
  });

  test("in Arabic at 390 px", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await signIn(page, { persona: "fatima" });
    await useLanguage(page, "ar");
    await page.goto("/app");
    const card = page.getByTestId("feeding-card");
    await expect(card.getByRole("heading", { name: ar.feeding.title })).toBeVisible();
    await expect(card.getByRole("button", { name: fill(ar.feeding.logAs, { kind: ar.feeding.kind.breast }) })).toBeVisible();
    await expect(card.locator('[data-worry="pain"]')).toContainText("القابلة");
    await expectNoSideScroll(page, "Arabic home with the feeding log");
  });

  test("not offered without a birth in the last 12 months", async ({ page }) => {
    await signIn(page, { persona: "noura" });
    await page.goto("/app");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByTestId("feeding-card")).toHaveCount(0);
  });
});
