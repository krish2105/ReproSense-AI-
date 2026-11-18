import { en, expect, signIn, test } from "./fixtures";

// Header "Clinician" and "Clinic network" open in one tap (Krishna, 18 Nov: "when clicked nothing works"). Before, a
// visitor who was not signed in as that role landed back on /demo with a notice, and the button was below 8 people.
const nav = (page: import("@playwright/test").Page) => page.getByRole("banner");

test("a new visitor opens the clinician view from the header in one tap", async ({ page }) => {
  await page.goto("/");
  await nav(page).getByRole("link", { name: en.chrome.nav.clinic, exact: true }).click();
  await expect(page).toHaveURL(/\/clinic$/);
  await expect(page.getByRole("navigation", { name: en.clinic.listLabel })).toBeVisible();
});

test("signed in as one of the women, the header opens the clinic network in one tap", async ({ page }) => {
  await signIn(page, { persona: "noura" });
  await page.goto("/demo");
  await nav(page).getByRole("link", { name: en.chrome.nav.admin, exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
});

test("her app still asks which woman to open", async ({ page }) => {
  await page.goto("/app");
  await expect(page).toHaveURL(/\/demo\?need=patient$/);
  await expect(page.getByText(en.demo.need.patient)).toBeVisible();
});
