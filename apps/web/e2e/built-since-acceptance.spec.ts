import { ar, en, expect, expectAccessible, expectNoSideScroll, test, useLanguage } from "./fixtures";
import buildWeek from "../src/data/build-week.json";

// The jury scores the prototype on work built after acceptance: /evidence lists every pull request merged since build
// week began (tools/build_week.py), each linked to GitHub.
test("a judge sees what was built since acceptance, each pull request linked", async ({ page }) => {
  await page.goto("/evidence");
  const panel = page.locator("#since-acceptance");
  await expect(panel.getByRole("heading", { level: 2, name: en.evidence.built.title })).toBeVisible();
  await expect(panel.getByTestId("built-per-day").locator("li")).not.toHaveCount(0);
  await panel.getByText(new RegExp(`^Show all ${buildWeek.prs.length} pull requests$`)).click();
  const first = buildWeek.prs[0];
  expect(first, "tools/build_week.py found no pull requests").toBeTruthy();
  if (!first) return;
  await expect(panel.getByRole("link", { name: new RegExp(`#${first.number}\\b`) })).toHaveAttribute("href", new RegExp(`/pull/${first.number}$`));
  await expectAccessible(page, "evidence, built since acceptance open");
  await expectNoSideScroll(page, "evidence, built since acceptance open");
});

test("the build-week list reads right to left in Arabic", async ({ page }) => {
  await page.goto("/");
  await useLanguage(page, "ar");
  await page.goto("/evidence");
  await expect(page.getByRole("heading", { level: 2, name: ar.evidence.built.title })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
});
