import { createServer, type Server } from "node:http";
import { expect, test } from "@playwright/test";
import en from "../messages/en.json" with { type: "json" };

// Issue #24 states audit: when the API is down or too slow, every screen shows the error state with a way forward
// (Try again, the demo people), the demo badge and the safety footer, never a blank page or an endless spinner.
// The web server on :3101 is the same build pointed at a stub on :8019 with a 3 s timeout (playwright.config.ts).
// The base test is used on purpose: the browser logs the server error here, and that is the point.
const WEB = "http://localhost:3101";
test.skip(({ isMobile }) => isMobile, "server-side states; one viewport is enough");
test.describe.configure({ mode: "serial" });

let stub: Server | undefined;
test.afterEach(async () => {
  await new Promise<void>((r) => (stub ? stub.close(() => r()) : r()));
  stub = undefined;
});

async function expectErrorScreen(page: import("@playwright/test").Page) {
  await expect(page.getByRole("heading", { name: en.states.errorTitle })).toBeVisible();
  await expect(page.getByRole("button", { name: en.states.retry })).toBeVisible();
  await expect(page.getByText(en.chrome.badge).first()).toBeVisible();
  await expect(page.getByText(/998/).first()).toBeVisible();
}

test("API down: her app shows the error screen with a way back to the demo people", async ({ page }) => {
  await page.goto(`${WEB}/app`);
  await expectErrorScreen(page);
  await expect(page.getByRole("link", { name: en.states.notFoundAction })).toBeVisible();
});

test("API down: the clinic shows the error screen too", async ({ page }) => {
  await page.goto(`${WEB}/clinic`);
  await expectErrorScreen(page);
});

test("API too slow: the demo roster gives up after the timeout instead of hanging", async ({ page }) => {
  stub = createServer((_req, res) => {
    setTimeout(() => res.writeHead(200, { "content-type": "application/json" }).end("{}"), 10_000);
  });
  await new Promise<void>((r) => stub!.listen(8019, "127.0.0.1", r));
  const started = Date.now();
  await page.goto(`${WEB}/demo`);
  // The roster has its own state for this: what happened, Try again, and the rest of the page still works.
  await expect(page.getByRole("heading", { name: en.demo.apiDownTitle })).toBeVisible();
  await expect(page.getByRole("link", { name: en.states.retry })).toBeVisible();
  expect(Date.now() - started, "state shown before the slow reply").toBeLessThan(9_000);
  await expect(page.getByText(en.chrome.badge).first()).toBeVisible();

  await page.goto(`${WEB}/app`); // her app: the same timeout ends in the error screen
  await expectErrorScreen(page);
});
