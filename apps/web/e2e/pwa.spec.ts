import { en, expect, signIn, test } from "./fixtures";

// A6 · Installable web app: a valid manifest with the ReproSense icons, a service worker that keeps the public demo
// pages for offline viewing but never her pages or API answers, and reminders that ask permission only on her tap.
// Needs a production build (the worker registers only there), like the rest of the e2e suite.

test("the manifest makes the app installable", async ({ page }) => {
  const res = await page.request.get("/manifest.webmanifest");
  expect(res.ok()).toBeTruthy();
  const m = await res.json();
  expect(m).toMatchObject({ name: "ReproSense", short_name: "ReproSense", display: "standalone", scope: "/" });
  expect(m.start_url).toMatch(/^\/demo/);
  expect(m.icons.map((i: { sizes: string }) => i.sizes)).toEqual(expect.arrayContaining(["192x192", "512x512"]));
  expect(m.icons.some((i: { purpose?: string }) => i.purpose === "maskable")).toBe(true);
  for (const icon of m.icons as { src: string }[]) expect((await page.request.get(icon.src)).ok(), icon.src).toBeTruthy();
  await page.goto("/");
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", "/manifest.webmanifest");
});

test("offline: public demo pages still open, her pages show the offline page, nothing of hers is cached", async ({ page, context, consoleErrors }) => {
  test.skip(test.info().project.name === "mobile", "one browser is enough for the cache rules");
  await signIn(page, { persona: "noura" });
  await page.goto("/demo");
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  await page.reload(); // now controlled by the worker
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await page.goto("/app"); // her page, visited online: must not be stored
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();

  await context.setOffline(true);
  await page.goto("/demo");
  await expect(page.getByRole("heading", { level: 1, name: en.demo.title })).toBeVisible();
  await page.goto("/app");
  await expect(page.getByRole("heading", { level: 1, name: "You're offline" })).toBeVisible(); // public/offline.html
  await expect(page.getByText("In an emergency, call 998.")).toBeVisible();
  await context.setOffline(false);
  // Without a connection the browser logs failed fetches (prefetches, the API wake-up ping): expected here only.
  consoleErrors.length = 0;

  const cached = await page.evaluate(async () => {
    const out: string[] = [];
    for (const k of await caches.keys()) for (const r of await (await caches.open(k)).keys()) out.push(new URL(r.url).pathname);
    return out;
  });
  expect(cached).toContain("/offline.html");
  expect(cached.filter((p) => /^\/(app|clinic|admin|api|shared)(\/|$)/.test(p)), "nothing of hers in the cache").toEqual([]);
});

test("reminders ask for permission only when she taps, and say nothing about her health", async ({ page }) => {
  // Headless Chromium has no notification permission at all, so the page gets a stand-in Notification that starts
  // at "default" (nothing decided) and counts every permission request.
  await page.addInitScript(() => {
    const w = window as unknown as { __asked: number };
    w.__asked = 0;
    const fake = {
      permission: "default" as NotificationPermission,
      async requestPermission() {
        w.__asked += 1;
        fake.permission = "granted";
        return fake.permission;
      },
    };
    Object.defineProperty(window, "Notification", { value: fake, configurable: true });
  });
  await signIn(page, { persona: "noura" });
  await page.goto("/app");
  const box = page.getByRole("region", { name: en.pwa.title });
  await box.scrollIntoViewIfNeeded();
  await expect(box.getByText(en.pwa.remindersPrivacy)).toBeVisible();
  const asked = () => page.evaluate(() => (window as unknown as { __asked: number }).__asked);
  expect(await asked()).toBe(0); // nothing asked on load

  await box.getByRole("button", { name: en.pwa.remindersOn }).click();
  await expect.poll(asked).toBe(1);
  await expect(box.getByRole("button", { name: en.pwa.remindersOff })).toBeVisible();
  await expect(box.getByText(/^Reminders are on/)).toBeVisible();
  await box.getByRole("button", { name: en.pwa.remindersOff }).click();
  await expect(box.getByRole("button", { name: en.pwa.remindersOn })).toBeVisible();
});
