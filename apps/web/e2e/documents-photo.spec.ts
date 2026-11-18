import { ar, en, expect, expectAccessible, expectNoSideScroll, signIn, test, useLanguage } from "./fixtures";

// Rule 8, no dead buttons: with no AI model configured (CI and the live demo until the key is set), the lab-report page
// does not offer "Take a photo of a report"; it says why and the PDF or text upload still works.
test("without a model the photo option is hidden and the page says why", async ({ page }) => {
  await signIn(page, { persona: "fatima" });
  await page.goto("/app/documents");
  await expect(page.getByRole("button", { name: en.documents.choose })).toBeVisible();
  await expect(page.getByRole("button", { name: en.documents.photo })).toHaveCount(0);
  await expect(page.getByTestId("photo-off")).toHaveText(en.documents.photoOffModel);
  await expect(page.locator('input[type="file"]')).toHaveAttribute("accept", ".pdf,.txt,application/pdf,text/plain");
  await expectAccessible(page, "documents without photo reading");
  await expectNoSideScroll(page, "documents without photo reading");
});

test("the same in Arabic", async ({ page }) => {
  await signIn(page, { persona: "fatima" });
  await useLanguage(page, "ar");
  await page.goto("/app/documents");
  await expect(page.getByTestId("photo-off")).toHaveText(ar.documents.photoOffModel);
  await expect(page.getByRole("button", { name: ar.documents.photo })).toHaveCount(0);
});

// The landing page wakes the API once per visit (a free instance sleeps when idle), so the demo opens without a wait.
test("the landing page wakes the API once", async ({ page }) => {
  const ping = page.waitForRequest((r) => r.url().endsWith("/api/v1/ping"));
  await page.goto("/");
  expect((await ping).method()).toBe("GET");
});
