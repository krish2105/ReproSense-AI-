import { expect, resetDemo, signIn, test } from "./fixtures";

// Attack 8 of the attack suite (backend/tests/test_attack_suite.py, docs/07 "Attack suite"): a <script> typed into a
// note is text. Her day's note and the clinician's visit note come back from the API exactly as typed; the pages show
// them as text and nothing in them runs. React escapes text, and the content security policy refuses inline scripts
// and handlers anyway (the shared fixture fails the test on any console error, a refused script included).
const XSS = `<script>window.__rsXss=1</script><img src=x onerror="window.__rsXss=2">"><svg onload="window.__rsXss=3">`;

test.describe.configure({ mode: "serial" });
test.afterAll(resetDemo);

async function nothingRan(page: import("@playwright/test").Page) {
  expect(await page.evaluate(() => (window as unknown as { __rsXss?: number }).__rsXss ?? null)).toBeNull();
  await expect(page.locator('img[src="x"], svg[onload]')).toHaveCount(0);
}

test("a script typed into her note shows as text on her calendar and never runs", async ({ page }) => {
  await signIn(page, { persona: "noura" });
  const saved = await page.request.post("/api/v1/logs", { data: { date: "2026-11-21", flow: "none", pain: 0, note: XSS } });
  expect(saved.ok(), "log with the note").toBeTruthy();
  await page.goto("/app/log?date=2026-11-21");
  await expect(page.getByText(XSS, { exact: true })).toBeVisible();
  await nothingRan(page);
});

test("the same text in the clinician's visit note stays text", async ({ page }) => {
  await signIn(page, { role: "clinician" });
  const saved = await page.request.put("/api/v1/clinic/patients/noura/visit-note", { data: { text: XSS } });
  expect(saved.ok(), "visit note saved").toBeTruthy();
  const record = await page.request.get("/api/v1/clinic/patients/noura");
  const day = ((await record.json()) as { timeline: { days: { date: string; note: string }[] } }).timeline.days.find((d) => d.date === "2026-11-21");
  expect(day?.note, "her note reaches the clinician as the exact text").toBe(XSS);
  await page.goto("/clinic/patients/noura");
  await expect(page.locator("#visit-note")).toHaveValue(XSS);
  await nothingRan(page);
});

test("every page has a content security policy with a fresh nonce on each of its scripts", async ({ page }) => {
  const res = await page.request.get("/");
  const policy = res.headers()["content-security-policy"] ?? "";
  expect(policy).toContain("default-src 'self'");
  expect(policy).toContain("frame-ancestors 'none'");
  const scriptSrc = policy.split(";").map((d) => d.trim()).find((d) => d.startsWith("script-src ")) ?? "";
  expect(scriptSrc).toMatch(/^script-src 'self' 'nonce-[^']+' 'strict-dynamic'$/); // no 'unsafe-inline', no eval
  const nonce = /'nonce-([^']+)'/.exec(scriptSrc)?.[1];
  const tags = (await res.text()).match(/<script\b[^>]*>/g) ?? [];
  expect(tags.length).toBeGreaterThan(0);
  for (const tag of tags) expect(tag, "every script in the page carries this response's nonce").toContain(`nonce="${nonce}"`);
  const again = (await page.request.get("/")).headers()["content-security-policy"] ?? "";
  expect(/'nonce-([^']+)'/.exec(again)?.[1], "a new nonce for every response").not.toBe(nonce);
  // The browser loads the page under the policy with nothing refused (the fixture fails on any console error).
  await page.goto("/");
  await expect(page.locator("main")).toBeVisible();
});
