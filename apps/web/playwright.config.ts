import { defineConfig } from "@playwright/test";

// End-to-end tests of the demo path against the real stack: FastAPI on :8010 (seeded synthetic data, no LLM key, so
// answers are extractive and repeatable) and the production web build on :3100. Locally the servers you already run
// are reused; set PW_CHANNEL=chrome to use the installed Chrome instead of Playwright's Chromium.
const WEB = process.env.E2E_BASE_URL ?? "http://localhost:3100";
const API = process.env.E2E_API_URL ?? "http://127.0.0.1:8010";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  // One worker: the demo path changes shared demo data (an approved draft, a closed follow-up), reset between files.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: WEB,
    channel: process.env.PW_CHANNEL || undefined,
    locale: "en-GB",
    timezoneId: "Asia/Dubai",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1280, height: 900 } } },
    { name: "mobile", use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 } },
  ],
  webServer: [
    {
      command: "cd ../../backend && uv run uvicorn app.main:app --port 8010",
      url: `${API}/healthz`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      // The job's environment (database URL, demo keys) plus WeasyPrint's Pango path on macOS (ignored on Linux).
      env: { ...(process.env as Record<string, string>), DYLD_FALLBACK_LIBRARY_PATH: process.env.DYLD_FALLBACK_LIBRARY_PATH ?? "/opt/homebrew/lib" },
    },
    { command: "pnpm start -p 3100", url: `${WEB}/robots.txt`, reuseExistingServer: !process.env.CI, timeout: 120_000 },
  ],
});
