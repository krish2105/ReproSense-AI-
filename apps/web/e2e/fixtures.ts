import AxeBuilder from "@axe-core/playwright";
import { request, test as base, expect, type Page } from "@playwright/test";
import ar from "../messages/ar.json" with { type: "json" };
import en from "../messages/en.json" with { type: "json" };

export { ar, en, expect };
export const API = process.env.E2E_API_URL ?? "http://127.0.0.1:8010";

/** Every test fails if the browser logged an error or a page threw (issue #7: zero console errors). */
export const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      const where = () => new URL(page.url()).pathname;
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(`${m.text()} (on ${where()})`);
      });
      page.on("pageerror", (e) => errors.push(`${String(e)} (on ${where()})`));
      await use(errors);
      expect(errors, "errors in the browser console").toEqual([]);
    },
    { auto: true },
  ],
});

/** WCAG 2.2 A/AA through axe-core. Canvases are aria-hidden; their data is in text, posters or tables. */
export async function expectAccessible(page: Page, where: string) {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  const found = r.violations.map((v) => {
    const nodes = v.nodes.slice(0, 4).map((n) => {
      const d = n.any[0]?.data as { fgColor?: string; bgColor?: string; contrastRatio?: number; expectedContrastRatio?: string } | undefined;
      const contrast = d?.contrastRatio ? ` [${d.fgColor} on ${d.bgColor} = ${d.contrastRatio}, needs ${d.expectedContrastRatio}]` : "";
      return `${n.target.join(" ")}${contrast}`;
    });
    return `${v.id} (${v.impact}): ${nodes.join(" | ")}`;
  });
  expect(found, `accessibility violations on ${where}`).toEqual([]);
}

export async function expectNoSideScroll(page: Page, where: string) {
  const [scroll, client] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  expect(scroll, `horizontal scroll on ${where}`).toBeLessThanOrEqual(client);
}

/** Signs this browser context in as a demo person (the same call the /demo buttons make). */
export async function signIn(page: Page, who: { persona: string } | { role: "clinician" | "admin" }) {
  const res = await page.request.post("/api/v1/demo/login", { data: who });
  expect(res.ok(), `demo login ${JSON.stringify(who)}`).toBeTruthy();
}

/** Restores the seeded demo data (admin only), so every file starts from the same record. */
export async function resetDemo() {
  const ctx = await request.newContext({ baseURL: API });
  const login = await ctx.post("/v1/demo/login", { data: { role: "admin" } });
  expect(login.ok(), "admin demo login").toBeTruthy();
  const { token } = (await login.json()) as { token: string };
  const reset = await ctx.post("/v1/demo/reset", { headers: { cookie: `rs_token=${token}` } });
  expect(reset.ok(), "demo reset").toBeTruthy();
  await ctx.dispose();
}

/** Sets the language cookie the header toggle sets, before the next navigation. */
export async function useLanguage(page: Page, lang: "en" | "ar") {
  const url = new URL(page.url() === "about:blank" ? (process.env.E2E_BASE_URL ?? "http://localhost:3100") : page.url());
  await page.context().addCookies([{ name: "NEXT_LOCALE", value: lang, domain: url.hostname, path: "/" }]);
}
