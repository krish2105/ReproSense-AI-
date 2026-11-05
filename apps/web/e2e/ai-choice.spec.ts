import { en, expect, expectAccessible, resetDemo, signIn, test } from "./fixtures";

// Her "AI features" switch in Privacy is real (DoH Responsible AI Standard 3.1.6.1: patients may opt out of AI).
// Off: the assistant closes and no chat box is offered; on again: the assistant is back. Patterns never change.
test.describe.configure({ mode: "serial" });
test.afterAll(resetDemo);

const aiSwitch = (verb: string) => `${verb}: ${en.privacy.purpose.assistant}`;

test("turning AI off closes the assistant, and turning it on opens it again", async ({ page }) => {
  await signIn(page, { persona: "noura" });
  await page.goto("/app/privacy");
  await expect(page.getByText(en.privacy.aiHint)).toBeVisible();
  await page.getByRole("button", { name: aiSwitch(en.privacy.stop) }).click();
  await expect(page.getByText(en.privacy.saved).first()).toBeVisible();

  await page.goto("/app/assistant");
  await expect(page.getByRole("heading", { name: en.assistant.offTitle })).toBeVisible();
  await expect(page.getByRole("textbox")).toHaveCount(0); // nothing to type into, nothing to send
  await expectAccessible(page, "assistant with AI off");

  await page.getByRole("link", { name: en.assistant.offAction }).click();
  await expect(page).toHaveURL(/\/app\/privacy$/);
  await page.getByRole("button", { name: aiSwitch(en.privacy.allow) }).click();
  await expect(page.getByText(en.privacy.saved).first()).toBeVisible();

  await page.goto("/app/assistant");
  await expect(page.getByRole("heading", { name: en.assistant.offTitle })).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: en.assistant.inputLabel })).toBeVisible();
});
