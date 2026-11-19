import { ar, en, expect, expectAccessible, expectNoSideScroll, resetDemo, signIn, test, useLanguage } from "./fixtures";

// Build week Y4: the family support view. Fatima makes a read-only link for her husband; he opens it in his own browser
// (no sign-in) and sees her upcoming care steps under neutral names and ways to help, with no health details because
// she did not tick them. His visit shows in her "who saw my data", and turning the link off stops it at once.
test.describe("family support", () => {
  test.describe.configure({ mode: "serial" });
  test.afterEach(resetDemo);

  test("she makes a link, he opens it, she sees the visit and turns it off", async ({ page, browser }) => {
    await signIn(page, { persona: "fatima" });
    await page.goto("/app/privacy#family");
    const section = page.getByTestId("family-support");
    await section.getByLabel(en.family.manage.relationLabel).selectOption("husband");
    const create = section.getByRole("button", { name: en.family.manage.create });
    await expect(create).toBeDisabled(); // nothing is shared until she says so
    await section.getByLabel(en.family.manage.consentLabel).check();
    await create.click();
    const made = page.getByTestId("family-link-made");
    await expect(made).toBeVisible();
    const url = (await made.locator(".mono").innerText()).trim();
    expect(url).toMatch(/\/family\/[\w-]{40,}$/);
    await expectAccessible(page, "privacy with a family link");

    const husband = await browser.newContext(); // his own browser: no session, no cookies of hers (and no baseURL)
    const view = await husband.newPage();
    await view.goto(url);
    await expect(view.getByRole("heading", { level: 1, name: /Supporting \u2068?Fatima\u2069?/ })).toBeVisible(); // name in isolates
    await expect(view.getByText(en.family.steps.glucose_test)).toBeVisible();
    await expect(view.getByText(en.family.tips.after_birth["0"])).toBeVisible();
    await expect(view.getByText(en.family.view.emergency)).toBeVisible();
    await expect(view.getByTestId("family-details")).toHaveCount(0); // she did not tick "include my health details"
    await expect(view.locator("body")).not.toContainText(/gestational|diabetes|mood|depress/i);
    await expectAccessible(view, "family view");
    await expectNoSideScroll(view, "family view");

    await page.reload();
    await expect(page.getByText(`${en.privacy.roles.family} · ${en.privacy.actions.view_family_link}`).first()).toBeVisible();
    await page.getByTestId("family-support").getByRole("button", { name: en.family.manage.revoke }).click();
    await expect(page.getByText(en.family.manage.revoked).first()).toBeVisible(); // the toast (also in its live region)

    await view.reload();
    await expect(view.getByRole("heading", { level: 1, name: en.family.view.invalidTitle })).toBeVisible();
    await husband.close();
  });

  test("with details ticked the page adds them, and it reads right to left in Arabic", async ({ page, browser }) => {
    await signIn(page, { persona: "fatima" });
    await page.goto("/app/privacy#family");
    const section = page.getByTestId("family-support");
    await section.getByLabel(en.family.manage.relationLabel).selectOption("mother");
    await section.getByLabel(en.family.manage.detailsLabel).check();
    await section.getByLabel(en.family.manage.consentLabel).check();
    await section.getByRole("button", { name: en.family.manage.create }).click();
    const url = (await page.getByTestId("family-link-made").locator(".mono").innerText()).trim();

    const mother = await browser.newContext();
    const view = await mother.newPage();
    await view.goto(new URL(url).origin);
    await useLanguage(view, "ar");
    await view.goto(url);
    await expect(view.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(view.getByRole("heading", { level: 2, name: ar.family.view.detailsTitle })).toBeVisible();
    await expect(view.getByText(ar.family.view.emergency)).toBeVisible();
    await expectNoSideScroll(view, "family view, Arabic");
    await mother.close();
  });
});
