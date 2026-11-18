import type { Page } from "@playwright/test";
import { ar, en, expect, expectAccessible, expectNoSideScroll, signIn, test, useLanguage } from "./fixtures";

// Build week K2: voice logging. The browser's speech recognition is faked here (no microphone in CI): it "hears"
// the given sentence. The text goes to the same reader as a typed note; nothing is saved until she presses save.
async function fakeSpeech(page: Page, said: string) {
  await page.addInitScript((text) => {
    class FakeRecognizer {
      lang = "";
      interimResults = false;
      onresult: ((e: unknown) => void) | null = null;
      onend: (() => void) | null = null;
      onerror: ((e?: unknown) => void) | null = null;
      start() {
        (window as unknown as { __speechLang: string }).__speechLang = this.lang;
        setTimeout(() => {
          this.onresult?.({ results: [[{ transcript: text }]] });
          this.onend?.();
        }, 50);
      }
      stop() {
        this.onend?.();
      }
    }
    const w = window as unknown as Record<string, unknown>;
    w.SpeechRecognition = FakeRecognizer;
    w.webkitSpeechRecognition = FakeRecognizer;
  }, said);
}

test.describe("voice logging", () => {
  test("she says her note and the form fills for her to check", async ({ page }) => {
    await signIn(page, { persona: "noura" });
    await fakeSpeech(page, "Heavy period with cramps and bloating, pain 6 out of 10");
    await page.goto("/app/log");
    await page.getByTestId("voice-log").click();
    const status = page.locator("p.extract");
    await expect(status).toContainText(en.symptoms.cramps);
    await expect(status).toContainText(en.symptoms.bloating);
    await expect(page.locator("#note-t")).toHaveValue(/cramps and bloating/);
    expect(await page.evaluate(() => (window as unknown as { __speechLang: string }).__speechLang)).toBe("en-US");
    await expect(page.getByText(en.log.saved)).toHaveCount(0); // nothing saved until she presses save
    await expectAccessible(page, "log with voice");
    await expectNoSideScroll(page, "log with voice");
  });

  test("a red flag in what she said shows 998 before she saves", async ({ page }) => {
    await signIn(page, { persona: "noura" });
    await fakeSpeech(page, "I am bleeding a lot and I feel dizzy");
    await page.goto("/app/log");
    await page.getByTestId("voice-log").click();
    await expect(page.locator(".form-card").getByText(/998/).first()).toBeVisible();
    await expect(page.getByText(en.log.saved)).toHaveCount(0);
  });

  test("Arabic speech is recognised as Arabic", async ({ page }) => {
    await signIn(page, { persona: "noura" });
    await useLanguage(page, "ar");
    await fakeSpeech(page, "عندي مغص وصداع اليوم");
    await page.goto("/app/log");
    await page.getByRole("button", { name: ar.log.voiceStart }).click();
    await expect(page.locator("p.extract")).toContainText(ar.symptoms.cramps);
    expect(await page.evaluate(() => (window as unknown as { __speechLang: string }).__speechLang)).toBe("ar-AE");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });

  test("without speech recognition the button is hidden and typing still works", async ({ page }) => {
    await signIn(page, { persona: "noura" });
    await page.addInitScript(() => {
      const w = window as unknown as Record<string, unknown>;
      delete w.SpeechRecognition;
      delete w.webkitSpeechRecognition;
    });
    await page.goto("/app/log");
    await expect(page.getByTestId("voice-log")).toHaveCount(0);
    await page.locator("#note-t").fill("cramps and a headache");
    await page.getByRole("button", { name: en.log.readNote }).click();
    await expect(page.locator("p.extract")).toContainText(en.symptoms.headache);
  });
});
