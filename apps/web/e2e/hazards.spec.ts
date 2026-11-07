import { en, expect, resetDemo, signIn, test } from "./fixtures";

// Safety-case actions found in the 7 Nov rescore (docs/safety/HAZARD_LOG.md).
test.describe("hazard log actions", () => {
  test.describe.configure({ mode: "serial" });
  test.afterEach(resetDemo); // both tests write into a demo record

  // The crisis path hides the self-harm card only. Sara's heavy bleeding with dizziness (RF1) keeps its 998 action
  // in the check-in reply and on Patterns, as it already did on Home.
  test("a crisis check-in keeps Sara's other red flag", async ({ page }) => {
    await signIn(page, { persona: "sara" });
    await page.goto("/app/checkin");
    for (let i = 0; i < 10; i++) await page.locator(`input[name="epds-${i}"]`).nth(1).check(); // item 10 > 0
    await page.getByRole("button", { name: en.checkin.submit }).click();
    await expect(page.getByRole("region", { name: en.safety.crisisTitle })).toBeVisible();
    await expect(page.getByText(en.urgent.action)).toBeVisible();

    await page.goto("/app/insights");
    await expect(page.getByRole("region", { name: en.safety.crisisTitle })).toBeVisible();
    await expect(page.getByText(en.urgent.action)).toBeVisible();
  });

  // A second save on the same day replaced the first with a blank form. Her saved answers now reopen in the form,
  // so heavy flow in the morning and dizziness later still add up to RF1.
  test("the log form reopens today's entry, so a later symptom adds to it", async ({ page }) => {
    await signIn(page, { persona: "noura" });
    await page.goto("/app/log");
    const form = page.getByRole("form", { name: /Log today/ });
    await form.getByRole("group", { name: en.log.flow }).getByRole("button", { name: en.flows.heavy }).click();
    await form.getByRole("button", { name: en.log.saveToday }).click();
    await expect(page.getByText(en.log.saved).first()).toBeVisible(); // the toast and its live-region copy

    await page.reload();
    await expect(form.getByText(en.log.editing)).toBeVisible();
    await expect(form.getByRole("group", { name: en.log.flow }).getByRole("button", { name: en.flows.heavy })).toHaveAttribute("aria-pressed", "true");
    await form.getByRole("group", { name: en.log.symptomsTitle }).getByRole("button", { name: en.symptoms.dizziness }).click();
    await form.getByRole("button", { name: en.log.saveToday }).click();
    await expect(page.getByText(en.urgent.action).first()).toBeVisible(); // heavy flow + dizziness on one day = RF1
  });
});
