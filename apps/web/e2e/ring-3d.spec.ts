import { en, expect, signIn, test } from "./fixtures";

// A7 · 3D pregnancy and fourth-trimester ring on Home: where she is now, what is due when, each with its sources on
// tap (the list rows carry the same choices as the bands on the ring). Reduced motion keeps only the 2D arc. Read-only.
const r = en.ring3d;

async function webgl(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") ?? c.getContext("webgl"));
  });
}

test.describe("motion allowed", () => {
  test.use({ reducedMotion: "no-preference" });

  test("Hessa, week 24: the ring shows now and the glucose window with its sources", async ({ page }) => {
    await signIn(page, { persona: "hessa" });
    await page.goto("/app");
    test.skip(!(await webgl(page)), "this browser has no WebGL; the 2D arc is covered below");
    const ring = page.getByRole("region", { name: r.title });
    await ring.scrollIntoViewIfNeeded();
    await expect(ring.locator('[data-3d="ready"]')).toBeVisible({ timeout: 30_000 });
    await expect(ring).toContainText("Week 24 of 40");
    const row = ring.getByRole("list", { name: r.list }).getByRole("button", { name: /Glucose test window, weeks 24–28/ });
    await expect(row).toHaveAttribute("aria-pressed", "true"); // the due window opens first
    await expect(ring.getByRole("link", { name: "NICE NG3 Diabetes in pregnancy" })).toBeVisible();
    await row.click();
    await expect(row).toHaveAttribute("aria-pressed", "false");
    await expect(ring.getByRole("link", { name: "NICE NG3 Diabetes in pregnancy" })).toHaveCount(0);

    // Tapping the raised band on the ring itself opens the same row (scan the canvas: the camera fits each width).
    const box = (await ring.locator("canvas").boundingBox())!;
    let hit = false;
    for (let y = 0.5; y < 0.97 && !hit; y += 0.03)
      for (let x = 0.1; x < 0.9 && !hit; x += 0.03) {
        await page.mouse.click(box.x + box.width * x, box.y + box.height * y);
        hit = (await row.getAttribute("aria-pressed")) === "true";
      }
    expect(hit, "a tap on the band selects it").toBe(true);
    await expect(ring.getByRole("link", { name: "NICE NG3 Diabetes in pregnancy" })).toBeVisible();
  });

  test("Fatima, 9 weeks after the birth: her postnatal steps sit on the ring with status and sources", async ({ page }) => {
    await signIn(page, { persona: "fatima" });
    await page.goto("/app");
    test.skip(!(await webgl(page)), "this browser has no WebGL; the 2D arc is covered below");
    const ring = page.getByRole("region", { name: r.title });
    await ring.scrollIntoViewIfNeeded();
    await expect(ring.locator('[data-3d="ready"]')).toBeVisible({ timeout: 30_000 });
    await expect(ring).toContainText("Week 9 after the birth");
    const list = ring.getByRole("list", { name: r.list });
    await expect(list.getByRole("button")).toHaveCount(5);
    const glucose = list.getByRole("button", { name: new RegExp(en.postnatal.steps.glucose_test) });
    await expect(glucose).toContainText(en.postnatal.status.due);
    await expect(glucose).toContainText("Weeks 4–12 after the birth");
    if ((await glucose.getAttribute("aria-pressed")) !== "true") await glucose.click();
    await expect(ring.getByRole("link", { name: "NICE NG3 Diabetes in pregnancy" })).toBeVisible(); // the step's own sources
    const visit = list.getByRole("button", { name: new RegExp(en.postnatal.steps.visit_6w) });
    await visit.click();
    await expect(ring.getByRole("link", { name: /Postnatal Care Program Standard/ }).first()).toBeVisible();
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("keeps only the 2D arc", async ({ page }) => {
    await signIn(page, { persona: "hessa" });
    await page.goto("/app");
    await expect(page.getByText("Week 24").first()).toBeVisible();
    await expect(page.getByRole("region", { name: r.title })).toHaveCount(0);
    await expect(page.locator("canvas")).toHaveCount(0);
  });
});
