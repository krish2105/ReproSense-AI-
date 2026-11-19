import { ar, en, expect, expectAccessible, expectNoSideScroll, resetDemo, signIn, test, useLanguage } from "./fixtures";

// Section 7 · the assistant's record lane and next-step lane. A question about her own data is answered from her
// entries, counted by code ("From your entries"), with dated chips that open the day in her calendar. "What should I
// do next?" lists her patterns with care-navigator drafts she approves or discards; nothing is sent.
// Noura's seeded record: her last 6 complete cycles were 46, 45, 55, 42, 46 and 56 days; the 56-day one began 9 Sep.
test.describe.configure({ mode: "serial" });
test.beforeAll(resetDemo);
test.afterAll(resetDemo);

const answer = (page: import("@playwright/test").Page) => page.locator(".msg.ai").last();

test("a record question is answered from her entries, with chips that open the day", async ({ page }) => {
  await signIn(page, { persona: "noura" });
  await page.goto("/app/assistant");
  await page.getByRole("button", { name: "How long were my last cycles?" }).click();
  await expect(answer(page).getByText(en.assistant.fromEntries, { exact: true })).toBeVisible();
  await expect(answer(page)).toContainText("Your last 6 complete cycles were 46, 45, 55, 42, 46 and 56 days long.");
  await expect(answer(page).getByText(en.assistant.recordCode)).toBeVisible();
  const chip = answer(page)
    .getByRole("list", { name: en.assistant.entriesLabel })
    .first()
    .getByRole("link", { name: "9 Sep · cycle of 56 days" });
  await expect(chip).toHaveAttribute("href", "/app/log?date=2026-09-09");
  await expectAccessible(page, "assistant: an answer from her entries");
  await expectNoSideScroll(page, "assistant: an answer from her entries");
  await chip.click();
  await expect(page).toHaveURL(/\/app\/log\?date=2026-09-09$/);
});

test("the same question in Arabic gets the same numbers", async ({ page }) => {
  await signIn(page, { persona: "noura" });
  await useLanguage(page, "ar");
  await page.goto("/app/assistant");
  await page.getByRole("button", { name: "كم كان طول دوراتي الأخيرة؟" }).click();
  await expect(answer(page).getByText(ar.assistant.fromEntries, { exact: true })).toBeVisible();
  await expect(answer(page)).toContainText("46 و45 و55 و42 و46 و56 يوماً");
  await expect(answer(page).getByRole("link", { name: "9 سبتمبر · دورة طولها 56 يوماً" })).toHaveAttribute(
    "href",
    "/app/log?date=2026-09-09",
  );
  await expectAccessible(page, "assistant: an answer from her entries, in Arabic");
  await expectNoSideScroll(page, "assistant: an answer from her entries, in Arabic");
});

test("her next steps come as drafts she approves or discards; nothing is sent", async ({ page }) => {
  await resetDemo(); // a retry starts from open drafts too
  await signIn(page, { persona: "noura" });
  await page.goto("/app/assistant");
  await page.getByRole("textbox", { name: en.assistant.inputLabel }).fill("What should I do next?");
  await page.getByRole("button", { name: en.assistant.send }).click();
  await expect(answer(page).getByText(en.assistant.nextLabel)).toBeVisible();
  await expect(answer(page).getByText(en.assistant.nextDraftOnly)).toBeVisible();
  const steps = answer(page).getByRole("article");
  await expect(steps).toHaveCount(2); // her two patterns, each with its questions and a draft
  const first = steps.first();
  await expect(first.getByText(en.assistant.nextQuestions)).toBeVisible();
  await expect(first.getByText(en.assistant.nextDraft)).toBeVisible();
  await expectAccessible(page, "assistant: her next steps");

  await first.getByRole("button", { name: en.navigator.approve }).click();
  await expect(first.getByRole("status").filter({ hasText: en.navigator.approved })).toBeVisible();
  await expect(first.getByRole("button", { name: en.navigator.copy })).toBeVisible();
  await expect(first.getByRole("button", { name: en.navigator.approve })).toHaveCount(0);

  const second = steps.nth(1);
  await second.getByRole("button", { name: en.navigator.discard }).click();
  await expect(second.getByRole("status").filter({ hasText: en.navigator.discarded })).toBeVisible();
  await expect(second.getByText(en.assistant.nextDraft)).toHaveCount(0);
});
