import { en, expect, signIn, test } from "./fixtures";

// docs/31 §B: Back always works. The demo holds one sign-in at a time, so opening Clinician replaces Noura's sign-in.
// Before, Back to her app landed on Demo people. Now she is signed in again and lands on the exact page she left, and
// /demo/enter never becomes a history entry.
const header = (page: import("@playwright/test").Page) => page.getByRole("banner");

test("Back from the clinician view returns to Noura's exact page, still Noura", async ({ page }) => {
  await signIn(page, { persona: "noura" });
  await page.goto("/app/insights");
  await expect(page).toHaveURL(/\/app\/insights$/);

  await header(page).getByRole("link", { name: en.chrome.nav.clinic, exact: true }).click(); // one tap, replaces her sign-in
  await expect(page).toHaveURL(/\/clinic$/);
  await page.getByRole("navigation", { name: en.clinic.listLabel }).getByRole("link", { name: /Fatima/ }).click();
  await expect(page).toHaveURL(/\/clinic\/patients\/fatima$/);

  await page.goBack();
  await expect(page).toHaveURL(/\/clinic$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/app\/insights$/); // her page, not Demo people
  const me = await page.request.get("/api/v1/demo/whoami");
  expect(await me.json()).toMatchObject({ role: "patient", user_id: "noura" });

  const urls = await page.evaluate(() => performance.getEntriesByType("navigation").map((e) => (e as PerformanceNavigationTiming).name));
  expect(urls.join(" ")).not.toContain("/demo/enter");
});

test("Back into a staff view lands on the record that was open, not the list", async ({ page }) => {
  await signIn(page, { role: "clinician" });
  await page.goto("/clinic/patients/fatima");
  await signIn(page, { persona: "sara" }); // another view replaces the clinician's sign-in
  await page.goto("/app");
  await page.goBack();
  await expect(page).toHaveURL(/\/clinic\/patients\/fatima$/);
  await expect(page.getByRole("heading", { name: /Fatima/ }).first()).toBeVisible();
});

test("after a real sign-out, Back does not reopen her", async ({ page }) => {
  await signIn(page, { persona: "noura" });
  await page.goto("/app");
  await page.request.post("/api/v1/sessions/sign-out");
  await page.goto("/app");
  await expect(page).toHaveURL(/\/demo\?need=patient$/);
});

test("a re-entry path outside her area falls back to her home", async ({ page }) => {
  await page.goto("/demo/enter?role=patient&persona=noura&next=https%3A%2F%2Fexample.org%2F");
  await expect(page).toHaveURL(/\/app$/);
  await page.goto("/demo/enter?role=patient&persona=guest-x&next=%2Fapp");
  await expect(page).toHaveURL(/\/demo\?need=patient$/);
});
