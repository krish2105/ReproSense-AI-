import type { Page } from "@playwright/test";
import { ar, en, expect, expectAccessible, signIn, test, useLanguage } from "./fixtures";

// Voice logging (build week K2). Real speech recognition needs a microphone and an online service, so the browser's
// SpeechRecognition is replaced by a stand-in that "hears" a fixed sentence. Everything after it is real: the words
// go to POST /v1/logs/parse, the form fills, urgent words show 998 first, and nothing is saved until she saves.

async function fakeSpeech(page: Page, sentence: string) {
  await page.addInitScript((said: string) => {
    class FakeRecognition {
      lang = "";
      interimResults = false;
      continuous = false;
      maxAlternatives = 1;
      onresult: ((e: unknown) => void) | null = null;
      onerror: ((e: unknown) => void) | null = null;
      onend: (() => void) | null = null;
      start() {
        (window as unknown as { __speechLang: string }).__speechLang = this.lang;
        setTimeout(() => {
          const alt = Object.assign([{ transcript: said }], { isFinal: true });
          this.onresult?.({ resultIndex: 0, results: [alt] });
          this.onend?.();
        }, 50);
      }
      stop() {
        this.onend?.();
      }
    }
    Object.assign(window, { SpeechRecognition: FakeRecognition, webkitSpeechRecognition: FakeRecognition });
  }, sentence);
}

test("she speaks, the form fills, and she still saves it herself", async ({ page }) => {
  await fakeSpeech(page, "heavy flow today, cramps 7 out of 10 and I missed work");
  await signIn(page, { persona: "noura" });
  await page.goto("/app/log");
  await expect(page.getByText(en.log.voiceNote)).toBeVisible();
  await page.getByRole("button", { name: en.log.voiceStart }).click();
  await expect(page.locator("#note-t")).toHaveValue(/cramps 7 out of 10/);
  await expect(page.locator("#pain-range")).toHaveValue("7");
  await expect(page.locator("p.extract")).toContainText(en.flows.heavy);
  expect(await page.evaluate(() => (window as unknown as { __speechLang: string }).__speechLang)).toBe("en-US");
  await expectAccessible(page, "log after voice");
});

test("in Arabic it listens in Arabic", async ({ page }) => {
  await fakeSpeech(page, "عندي مغص وما رحت الدوام، الألم ٦ من ١٠");
  await useLanguage(page, "ar");
  await signIn(page, { persona: "noura" });
  await page.goto("/app/log");
  await page.getByRole("button", { name: ar.log.voiceStart }).click();
  await expect(page.locator("#pain-range")).toHaveValue("6");
  expect(await page.evaluate(() => (window as unknown as { __speechLang: string }).__speechLang)).toBe("ar-AE");
});

test("urgent words show 998 before anything is saved", async ({ page }) => {
  await fakeSpeech(page, "I'm soaking a pad every hour and I fainted in the bathroom");
  await signIn(page, { persona: "noura" });
  await page.goto("/app/log");
  await page.getByRole("button", { name: en.log.voiceStart }).click();
  const card = page.getByRole("region", { name: en.log.urgentFromWords });
  await expect(card).toBeVisible();
  await expect(card.getByRole("link", { name: en.urgent.call })).toHaveAttribute("href", "tel:998");
});

test("without speech recognition the button is hidden and typing still works", async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as Record<string, unknown>;
    delete w.SpeechRecognition;
    delete w.webkitSpeechRecognition;
  });
  await signIn(page, { persona: "noura" });
  await page.goto("/app/log");
  await expect(page.getByRole("button", { name: en.log.readNote })).toBeVisible();
  await expect(page.getByRole("button", { name: en.log.voiceStart })).toHaveCount(0);
});
