import type { Page } from "@playwright/test";

/** What the landing shows for its two 3D views after a pointer move and a scroll (fallback specs). */
export async function heroAndSpiral(page: Page) {
  await page.goto("/");
  await page.mouse.move(900, 300);
  await page.mouse.move(980, 320);
  await page.waitForTimeout(2500); // long enough for the ring to load if it were allowed to
  const hero = {
    canvas: await page.locator("#hero3d canvas").count(),
    poster: await page.locator("#hero3d svg circle").count(),
    tilt: await page.locator(".hero-vis .mini").evaluate((el) => (el as HTMLElement).style.transform),
  };
  await page.locator("#spiral-title").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  const spiral = {
    canvas: await page.locator(".y3d canvas").count(),
    poster: await page.getByRole("img", { name: /Noura's cycles as one loop per cycle/ }).count(),
  };
  return { hero, spiral };
}
