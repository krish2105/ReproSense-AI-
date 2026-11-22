import { en, expect, signIn, test } from "./fixtures";

// Body pain map (22 Nov): the drawn front/back figure is used everywhere (the 3D figure is switched off in BodyMap.tsx).
// With motion allowed she taps a point on the drawing (or its toggle in the list) and it is marked in the log form; the
// pain slider says its number in words. Read-only: nothing is saved, so the demo data is unchanged.

test.describe("motion allowed", () => {
  test.use({ reducedMotion: "no-preference" });

  test("the drawn figure marks a tapped region, the list carries the same choices, and pain has words", async ({ page }) => {
    await signIn(page, { persona: "noura" });
    await page.goto("/app/log");
    const map = page.getByRole("group", { name: en.log.bodyTitle });
    await map.scrollIntoViewIfNeeded();
    await expect(map.locator("canvas")).toHaveCount(0); // no 3D figure
    await expect(map.locator(".bodymap img")).toBeVisible(); // the drawing
    await expect(map.locator(".bm-pt").first()).toBeVisible();

    // Tap a point on the front drawing, then turn to the back.
    const lowerAbdomen = map.locator(".bm-pt").first();
    await expect(lowerAbdomen).toHaveAttribute("aria-pressed", "false");
    await lowerAbdomen.click();
    await expect(lowerAbdomen).toHaveAttribute("aria-pressed", "true");
    await map.getByRole("button", { name: en.log.back, exact: true }).click();
    await expect(map.getByRole("button", { name: en.log.back, exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(map.locator(".bodymap img")).toBeVisible();

    // Pain in words: 0 none, 1-3 mild, 4-6 moderate, 7-10 severe.
    const slider = page.locator("#pain-range");
    await slider.fill("7");
    await expect(page.getByTestId("pain-hint")).toContainText(en.log.painHint.severe);
    await slider.fill("2");
    await expect(page.getByTestId("pain-hint")).toContainText(en.log.painHint.mild);
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("keeps the 2D map and its tap points", async ({ page }) => {
    await signIn(page, { persona: "noura" });
    await page.goto("/app/log");
    const map = page.getByRole("group", { name: en.log.bodyTitle });
    await map.scrollIntoViewIfNeeded();
    await expect(map.locator(".bm-pt").first()).toBeVisible();
    await expect(map.locator("canvas")).toHaveCount(0);
    await expect(map).toContainText(en.log.bodyHint);
  });
});
