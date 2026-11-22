import type { Page } from "@playwright/test";
import { ar, en, expect, resetDemo, signIn, test, useLanguage } from "./fixtures";

// docs/31 §E: every button works, proven (CLAUDE.md rule 8). On the home page of each of the five areas, in English and
// Arabic, every visible link and button is clicked once, each from a clean start (signed in again, page reloaded):
// - a link must land on a real page (no 404, no server error, no console error) and Back must return to the start;
// - a button must visibly do something: the URL changes, a menu or dialog opens, or the page text changes. A click
//   that changes nothing is a dead button and fails the test.
// Not clicked, each for a stated reason, and covered elsewhere:
// - [data-destructive] (sign out, demo reset): their own specs (staff-signin, saas);
// - [data-global-toggle] (language, theme): they change every later page; screens.spec covers both;
// - tel:, mailto:, other sites, new tabs and downloads: requested instead of clicked (a download must answer 200).
// The fixtures' console check fails the test on any browser console error.

type Who = { persona: string } | { role: "clinician" | "admin" | "clinic_admin" };
interface Area {
  name: string;
  start: string;
  who?: Who;
  scope: string; // the public site crawls the header and footer too; inside an area only its main content
}
const AREAS: Area[] = [
  { name: "public site", start: "/", scope: "body" },
  { name: "her app (Noura)", start: "/app", who: { persona: "noura" }, scope: "main" },
  { name: "clinician", start: "/clinic", who: { role: "clinician" }, scope: "main" },
  { name: "clinic network", start: "/admin", who: { role: "admin" }, scope: "main" },
  { name: "clinic admin", start: "/clinic-admin", who: { role: "clinic_admin" }, scope: "main" },
];

interface Control {
  nth: number; // its position among every a[href] and button in the scope, the same on every load of the page
  kind: "link" | "button";
  name: string;
  href: string | null;
  skip: string | null; // why it is requested or left out instead of clicked
}

const all = (page: Page, scope: string) => page.locator(`${scope} a[href], ${scope} button`);

/** Every visible link and enabled button inside `scope`, in document order, with why some are not clicked. Read only:
 *  the page is never changed (tagging nodes before React hydrates shows up as a hydration mismatch). */
async function controls(page: Page, scope: string): Promise<Control[]> {
  const found = await all(page, scope).evaluateAll((els) =>
    els.map((el, nth) => {
      const r = el.getBoundingClientRect();
      const visible =
        r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden" && !el.closest("[hidden],[aria-hidden='true'],[inert]");
      const name = (el.getAttribute("aria-label") || el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 80);
      if (el.tagName === "BUTTON") {
        const b = el as HTMLButtonElement;
        const skip = b.closest("[data-destructive]") ? "destructive" : b.closest("[data-global-toggle]") ? "global toggle" : null;
        return { nth, kind: "button" as const, name, href: null, skip, keep: visible && !b.disabled };
      }
      const a = el as HTMLAnchorElement;
      const raw = a.getAttribute("href") ?? "";
      let skip: string | null = null;
      if (/^(tel|mailto):/i.test(raw)) skip = "phone or email";
      else if (a.target === "_blank") skip = "new tab";
      else if (a.hasAttribute("download") || /\.pdf(\?|$)/i.test(raw)) skip = "download";
      else if (new URL(a.href, location.href).origin !== location.origin) skip = "other site";
      return { nth, kind: "link" as const, name, href: raw, skip, keep: visible };
    }),
  );
  return found.filter((c) => c.keep).map((c) => ({ nth: c.nth, kind: c.kind, name: c.name, href: c.href, skip: c.skip }));
}

/** What a person can see change: the URL, opened menus and dialogs, and the page text. */
async function snapshot(page: Page) {
  return page.evaluate(() => ({
    url: location.href,
    expanded: Array.from(document.querySelectorAll("[aria-expanded]"))
      .map((e) => e.getAttribute("aria-expanded"))
      .join(","),
    pressed: Array.from(document.querySelectorAll("[aria-pressed]"))
      .map((e) => e.getAttribute("aria-pressed"))
      .join(","),
    dialogs: document.querySelectorAll("dialog[open], [role='dialog']:not([hidden])").length,
    text: document.body.innerText,
  }));
}

async function fresh(page: Page, area: Area) {
  if (area.who) await signIn(page, area.who);
  await page.goto(area.start);
  await page.waitForLoadState("networkidle").catch(() => undefined);
}

for (const lang of ["en", "ar"] as const) {
  const notFound = (lang === "ar" ? ar : en).states.notFoundTitle;
  for (const area of AREAS) {
    test(`every button works: ${area.name}, ${lang === "ar" ? "Arabic" : "English"}`, async ({ page }) => {
      test.slow(); // one clean start per control
      test.setTimeout(10 * 60_000);
      const serverErrors: string[] = [];
      page.on("response", (r) => {
        if (r.status() >= 500) serverErrors.push(`${r.status()} ${r.url()}`);
      });
      await useLanguage(page, lang);
      await fresh(page, area);
      const list = await controls(page, area.scope);
      expect(list.length, `no controls found on ${area.start}`).toBeGreaterThan(0);
      const report: { control: string; result: string }[] = [];
      const dead: string[] = [];
      const seenLinks = new Set<string>();

      for (let i = 0; i < list.length; i++) {
        const c = list[i]!;
        const label = `${c.kind} "${c.name}"${c.href ? ` → ${c.href}` : ""}`;
        if (c.kind === "link" && c.href && seenLinks.has(c.href)) {
          report.push({ control: label, result: "same link as above" });
          continue;
        }
        if (c.href) seenLinks.add(c.href);
        if (c.skip) {
          if (c.skip === "download" && c.href) {
            const r = await page.request.get(c.href);
            expect(r.status(), `${label} must download`).toBe(200);
          }
          report.push({ control: label, result: `not clicked: ${c.skip}` });
          continue;
        }

        await fresh(page, area);
        const now = await controls(page, area.scope);
        const same = now.find((x) => x.nth === c.nth);
        expect(same && same.kind === c.kind && same.name === c.name, `the page changed between loads at ${label}`).toBeTruthy();
        const target = all(page, area.scope).nth(c.nth);

        const before = await snapshot(page);
        // Keyboard activation (focus, Enter): it reaches skip links and anything under the tab bar, and proves each
        // control works without a mouse.
        await target.focus();
        await page.keyboard.press("Enter");
        await page.waitForLoadState("domcontentloaded");
        await page.waitForTimeout(700);
        const after = await snapshot(page);

        if (c.kind === "link") {
          await expect(page.getByRole("heading", { level: 1, name: notFound }), `${label} reached the 404 page`).toHaveCount(0);
          if (after.url !== before.url) {
            await page.goBack();
            await page.waitForLoadState("domcontentloaded");
            const back = new URL(page.url());
            const startPath = new URL(before.url);
            expect(`${back.pathname}${back.search}`, `Back after ${label}`).toBe(`${startPath.pathname}${startPath.search}`);
          }
          report.push({ control: label, result: after.url !== before.url ? `opened ${new URL(after.url).pathname}, Back ok` : "same page" });
        } else {
          const changed =
            after.url !== before.url ||
            after.expanded !== before.expanded ||
            after.pressed !== before.pressed ||
            after.dialogs !== before.dialogs ||
            after.text !== before.text;
          if (!changed) dead.push(label);
          report.push({ control: label, result: changed ? "did something" : "DEAD: nothing visible changed" });
        }
      }

      await test.info().attach(`every-button ${area.name} ${lang}`, { body: JSON.stringify(report, null, 2), contentType: "application/json" });
      expect(dead, `dead buttons on ${area.start}`).toEqual([]);
      expect(serverErrors, `server errors on ${area.start}`).toEqual([]);
    });
  }
}

test.afterAll(async () => {
  await resetDemo(); // buttons may have logged a mood or a feed; the next file starts from the seeded record
});
