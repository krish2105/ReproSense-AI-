import { en, expect, signIn, test } from "./fixtures";

// A1 · 3D body pain map: with WebGL and motion allowed she taps a region on the figure (or its toggle in the list) and
// it is marked in the log form; with reduced motion the 2D map stays. No WebGL is covered in no-webgl.spec.ts.
// Read-only: nothing is saved, so the demo data is unchanged.

test.describe("motion allowed", () => {
  test.use({ reducedMotion: "no-preference" });

  test("the 3D figure marks a tapped region, and the list carries the same choices", async ({ page }) => {
    await signIn(page, { persona: "noura" });
    await page.goto("/app/log");
    const webgl = await page.evaluate(() => {
      const c = document.createElement("canvas");
      return Boolean(c.getContext("webgl2") ?? c.getContext("webgl"));
    });
    test.skip(!webgl, "this browser has no WebGL; no-webgl.spec.ts covers the 2D map");

    const map = page.getByRole("group", { name: en.log.bodyTitle });
    await map.scrollIntoViewIfNeeded();
    const canvas = map.locator(".bodymap canvas");
    await expect(canvas).toBeVisible();
    await expect(map.locator('.bodymap[data-3d="ready"]')).toBeVisible({ timeout: 30_000 }); // first frame drawn, poster gone
    await expect(map.locator(".bm-pt")).toHaveCount(0); // the 2D tap points are replaced, not doubled
    await expect(map).toContainText(en.log.heat3d);

    const list = map.getByRole("group", { name: en.log.sitesList });
    await expect(list.getByRole("button")).toHaveCount(5); // front and back sites, always reachable by keyboard
    const lowerAbdomen = list.getByRole("button", { name: "Lower abdomen" });
    await expect(lowerAbdomen).toHaveAttribute("aria-pressed", "false");

    // Tap the lower abdomen on the figure: centre, a little below the middle of the canvas (BodyMap3D camera).
    const box = (await canvas.boundingBox())!;
    await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.556);
    await expect(lowerAbdomen).toHaveAttribute("aria-pressed", "true");
    await expect(map).toContainText("Marked: Lower abdomen");

    // The list toggles too (keyboard and screen-reader path).
    const lowerBack = list.getByRole("button", { name: "Lower back" });
    await lowerBack.focus();
    await page.keyboard.press("Enter");
    await expect(lowerBack).toHaveAttribute("aria-pressed", "true");

    await map.getByRole("button", { name: en.log.back }).click();
    await expect(map.getByRole("button", { name: en.log.back })).toHaveAttribute("aria-pressed", "true");
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
