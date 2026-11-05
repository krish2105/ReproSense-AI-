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
  // CI: a line per test (so a hang shows where), annotations, and the HTML report; stop early when it is broken.
  reporter: process.env.CI ? [["list"], ["github"], ["html", { open: "never" }]] : [["list"]],
  maxFailures: process.env.CI ? 8 : undefined,
  globalTimeout: process.env.CI ? 15 * 60_000 : undefined,
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: WEB,
    channel: process.env.PW_CHANNEL || undefined,
    // Extra browser flags for debugging, e.g. PW_ARGS="--disable-gpu --use-angle=swiftshader" (CI's software GL).
    launchOptions: { args: process.env.PW_ARGS ? process.env.PW_ARGS.split(" ") : [] },
    // Reduced motion by default: CI has no GPU, and the always-on 3D (hero ring, spiral, region columns) would compete
    // with the tests for the runner's CPU. The WebGL path itself is tested with motion allowed in fallbacks.spec.ts.
    reducedMotion: "reduce",
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
      // `exec` keeps one process per server: a wrapper that exits early (pnpm, sh) would leave the real server
      // holding Playwright's output pipe, and the run would hang after the last test.
      // macOS drops DYLD_* when /bin/sh starts, so the Pango path for WeasyPrint is passed through env (no-op on Linux).
      command: `cd ../../backend && exec env DYLD_FALLBACK_LIBRARY_PATH=${process.env.DYLD_FALLBACK_LIBRARY_PATH ?? "/opt/homebrew/lib"} uv run uvicorn app.main:app --port 8010`,
      url: `${API}/healthz`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: { ...(process.env as Record<string, string>) }, // the job's environment: database URL, demo keys
    },
    { command: "exec ./node_modules/.bin/next start -p 3100", url: `${WEB}/robots.txt`, reuseExistingServer: !process.env.CI, timeout: 120_000 },
  ],
});
