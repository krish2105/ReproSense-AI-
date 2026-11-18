import { en, expect, signIn, test } from "./fixtures";

// A4 · Her year in 3D on the timeline: with WebGL and motion allowed the spiral of her own logged days appears and a
// tapped bead opens that day in the calendar; with reduced motion only the 2D year chart shows. Read-only.

test.describe("motion allowed", () => {
  test.use({ reducedMotion: "no-preference" });

  test("the 3D year draws her days and a tapped bead opens that day", async ({ page }) => {
    await signIn(page, { persona: "noura" });
    await page.goto("/app/timeline?months=12");
    const webgl = await page.evaluate(() => {
      const c = document.createElement("canvas");
      return Boolean(c.getContext("webgl2") ?? c.getContext("webgl"));
    });
    test.skip(!webgl, "this browser has no WebGL; the 2D year chart is covered below");

    await page.getByRole("heading", { name: en.analytics.yearTitle }).scrollIntoViewIfNeeded();
    const section = page.getByRole("region", { name: en.analytics.year3dTitle });
    await section.scrollIntoViewIfNeeded();
    await expect(section.locator('[data-3d="ready"]')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("heading", { name: en.analytics.yearTitle })).toBeVisible(); // the 2D chart stays

    // Beads are dense along the spiral: tap across the canvas until one opens a day.
    const box = (await section.locator("canvas").boundingBox())!;
    let opened = false;
    for (let y = 0.2; y <= 0.85 && !opened; y += 0.05) {
      for (let x = 0.12; x <= 0.88 && !opened; x += 0.04) {
        await page.mouse.click(box.x + box.width * x, box.y + box.height * y);
        opened = /\/app\/log\?date=\d{4}-\d{2}-\d{2}$/.test(page.url());
        if (!opened) opened = await page.waitForURL(/\/app\/log\?date=/, { timeout: 120 }).then(() => true, () => false);
      }
    }
    expect(opened, "a bead opened its day").toBe(true);
    await expect(page.getByRole("group", { name: en.log.bodyTitle })).toBeVisible();
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("shows only the 2D year chart", async ({ page }) => {
    await signIn(page, { persona: "noura" });
    await page.goto("/app/timeline?months=12");
    await page.getByRole("heading", { name: en.analytics.yearTitle }).scrollIntoViewIfNeeded();
    await expect(page.getByRole("heading", { name: en.analytics.yearTitle })).toBeVisible();
    await expect(page.getByRole("region", { name: en.analytics.year3dTitle })).toHaveCount(0);
    await expect(page.locator("canvas")).toHaveCount(0);
  });
});
