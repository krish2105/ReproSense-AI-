import { en, expect, test } from "./fixtures";
import { heroAndSpiral } from "./landing-3d";

// Issue #7 "the 3D fallback works" and the mauve-3d skill: with reduced motion or without WebGL the posters show the
// same data, the phone stays upright and the page still makes sense. Desktop only: phones never load the hero ring.
test.skip(({ isMobile }) => isMobile, "the hero ring is desktop-only");

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("keeps the still ring, an upright phone and the flat spiral", async ({ page }) => {
    const { hero, spiral } = await heroAndSpiral(page);
    expect(hero.canvas).toBe(0);
    expect(hero.poster).toBe(46);
    expect(hero.tilt).toBe("");
    expect(spiral.canvas).toBe(0);
    expect(spiral.poster).toBe(1);
    await expect(page.getByText(en.landing.spiralFlat)).toBeVisible();
  });
});
