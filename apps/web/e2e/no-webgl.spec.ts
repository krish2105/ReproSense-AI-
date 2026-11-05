import { en, expect, test } from "./fixtures";
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
