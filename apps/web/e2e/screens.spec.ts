import { expect, expectAccessible, expectNoSideScroll, signIn, test, useLanguage } from "./fixtures";

// Every key screen in English and Arabic (RTL): WCAG 2.2 AA through axe, no sideways scroll, the demo badge on screen,
// and no streamed table segments (see the last test). Runs at both widths through the two projects.
type Who = { persona: string } | { role: "clinician" | "admin" } | null;
const SCREENS: { path: string; who: Who }[] = [
  { path: "/", who: null },
  { path: "/demo", who: null },
  { path: "/status", who: null },
  { path: "/pricing", who: null },
  { path: "/join", who: null },
  { path: "/join?clinic=clinic_corniche", who: null },
  { path: "/app", who: { persona: "noura" } },
  { path: "/app/log", who: { persona: "noura" } },
  { path: "/app/insights", who: { persona: "noura" } },
  { path: "/app/assistant", who: { persona: "noura" } },
  { path: "/app/privacy", who: { persona: "noura" } },
  { path: "/app/checkin", who: { persona: "fatima" } },
  { path: "/app", who: { persona: "hessa" } },
  { path: "/clinic", who: { role: "clinician" } },
  { path: "/clinic/patients/fatima", who: { role: "clinician" } },
  { path: "/admin", who: { role: "admin" } },
];

for (const lang of ["en", "ar"] as const) {
  test.describe(`screens in ${lang === "en" ? "English" : "Arabic"}`, () => {
    for (const s of SCREENS) {
      const label = `${s.path}${s.who ? ` as ${"persona" in s.who ? s.who.persona : s.who.role}` : ""}`;
      test(label, async ({ page }) => {
        if (s.who) await signIn(page, s.who);
        await useLanguage(page, lang);
        await page.goto(s.path);
        await expect(page.locator("html")).toHaveAttribute("dir", lang === "ar" ? "rtl" : "ltr");
        await expect(page.getByText(lang === "ar" ? /بيانات العرض/ : "Demo data — fictional").first()).toBeVisible();
        await expectNoSideScroll(page, `${label} (${lang})`);
        await expectAccessible(page, `${label} (${lang})`);
      });
    }
  });
}

// The dark theme is its own palette (docs/06), so it gets its own contrast check on the screens judges see.
test.describe("dark theme", () => {
  test.use({ colorScheme: "dark" });
  for (const s of SCREENS.filter((x) => ["/", "/app", "/app/insights", "/clinic/patients/fatima", "/admin"].includes(x.path) && (x.path !== "/app" || (x.who && "persona" in x.who && x.who.persona === "noura")))) {
    test(`${s.path} (dark)`, async ({ page }) => {
      if (s.who) await signIn(page, s.who);
      await page.goto(s.path);
      await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
      await expectAccessible(page, `${s.path} (dark)`);
    });
  }
});

// React 19.2's streaming leaves table-context segments (<table hidden><tbody id="S:n">) behind in <body>, and on a
// full page load that raced with hydration on /admin (React error #418, 3 runs in 12). A page whose streamed content
// ends in tables must not sit under a loading.tsx boundary. This guards every page the demo opens with a full load.
test("no page streams table-context segments", async ({ page, isMobile }) => {
  test.skip(isMobile, "the HTML does not depend on the viewport");
  for (const s of SCREENS) {
    if (s.who) await signIn(page, s.who);
    const html = await (await page.request.get(s.path)).text();
    expect(html.includes('<table hidden><tbody id="S:'), `${s.path} streams a table segment`).toBe(false);
  }
});
