import { expect, test, useLanguage } from "./fixtures";

// The landing hero's two floating cards are anchored to Noura's phone and may cover only its empty edges (21 Nov:
// they had covered her avatar and the "Next step" card on wide screens). The phone shows both recommendations in
// full. Checked at three desktop widths and phone width, in English and in Arabic (right to left).
for (const lang of ["en", "ar"] as const) {
  for (const width of [1024, 1440, 1920]) {
    test(`hero cards never cover the phone's content (${lang}, ${width} px)`, async ({ page }, info) => {
      test.skip(info.project.name !== "desktop", "desktop widths; phone width is the next test");
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      if (lang === "ar") {
        await useLanguage(page, "ar");
        await page.goto("/");
      }
      await expect(page.locator(".hero-vis .floatc").first()).toBeVisible();
      const r = await heroLayout(page);
      expect(r.overlaps, "cards over the phone's content").toEqual([]);
      expect(r.recsInside, "both recommendations inside the phone").toBe(true);
      expect(r.sideScroll, "no sideways scroll").toBe(false);
    });
  }
}

test("on a phone the hero cards stack under the phone", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "phone width only");
  await page.goto("/");
  await expect(page.locator(".hero-vis .floatc").first()).toBeVisible();
  const r = await heroLayout(page);
  expect(r.overlaps).toEqual([]);
  expect(r.recsInside).toBe(true);
  expect(r.sideScroll).toBe(false);
});

async function heroLayout(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const box = (el: Element) => el.getBoundingClientRect();
    const hit = (a: DOMRect, b: DOMRect) => !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);
    const phone = document.querySelector(".hero-vis .mini");
    if (!phone) return { overlaps: ["no phone"], recsInside: false, sideScroll: false };
    const parts = [...phone.querySelectorAll(".hello, .ava, .gauge, .btn-wide, .recs > *")];
    const overlaps: string[] = [];
    for (const card of document.querySelectorAll(".hero-vis .floatc"))
      for (const part of parts) if (hit(box(card), box(part))) overlaps.push(`${card.className} over ${part.className}`);
    const recs = phone.querySelector(".recs");
    return {
      overlaps,
      recsInside: recs ? box(recs).bottom <= box(phone).bottom : false,
      sideScroll: document.documentElement.scrollWidth > window.innerWidth,
    };
  });
}
