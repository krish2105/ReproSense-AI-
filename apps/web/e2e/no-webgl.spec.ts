import { en, expect, signIn, test } from "./fixtures";
import { heroAndSpiral } from "./landing-3d";

// A browser without WebGL (Playwright needs launch options at the top of a file, so this has its own file).
test.use({ launchOptions: { args: ["--disable-webgl", "--disable-3d-apis"] } });
test.skip(({ isMobile }) => isMobile, "the hero ring is desktop-only");

test("without WebGL the landing shows the posters and says why", async ({ page }) => {
  const { hero, spiral } = await heroAndSpiral(page);
  expect(hero.canvas).toBe(0);
  expect(hero.poster).toBe(46);
  expect(spiral.canvas).toBe(0);
  expect(spiral.poster).toBe(1);
  await expect(page.getByText(en.landing.spiralFlat)).toBeVisible();
});

test("without WebGL the log keeps the 2D body map, even with motion allowed", async ({ page }) => {
  await signIn(page, { persona: "noura" });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/app/log");
  const map = page.getByRole("group", { name: en.log.bodyTitle });
  await map.scrollIntoViewIfNeeded();
  const point = map.getByRole("button", { name: "Lower abdomen" });
  await point.click();
  await expect(point).toHaveAttribute("aria-pressed", "true");
  await expect(map.locator("canvas")).toHaveCount(0);
  await expect(map.locator(".bm-pt")).toHaveCount(4);
});
