import type { Page } from "@playwright/test";
import { ar, en, expect, signIn, test, useLanguage } from "./fixtures";

// A5 · Read-aloud with a stubbed speechSynthesis that records what would be spoken: pattern cards, the assistant's
// answers and the report summary; play, pause, resume, stop; hidden when the browser has no voice for the language.
async function stubSpeech(page: Page, voices: Array<{ lang: string; name: string }>) {
  await page.addInitScript((vs) => {
    const w = window as unknown as { __spoken: string[]; __state: string[] };
    w.__spoken = [];
    w.__state = [];
    class U {
      text: string;
      lang = "";
      voice: unknown = null;
      rate = 1;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    }
    let current: U | null = null;
    const synth = {
      speaking: false,
      pending: false,
      getVoices: () => vs.map((v, i) => ({ ...v, default: i === 0, localService: true, voiceURI: v.name })),
      speak(u: U) {
        current = u;
        this.speaking = true;
        w.__spoken.push(u.text);
      },
      pause: () => w.__state.push("pause"),
      resume: () => w.__state.push("resume"),
      cancel() {
        this.speaking = false;
        const u = current;
        current = null;
        u?.onerror?.();
      },
      addEventListener() {},
      removeEventListener() {},
    };
    Object.defineProperty(window, "speechSynthesis", { value: synth, configurable: true });
    Object.defineProperty(window, "SpeechSynthesisUtterance", { value: U, configurable: true });
  }, voices);
}
const spoken = (page: Page) => page.evaluate(() => (window as unknown as { __spoken: string[] }).__spoken);

test("a pattern card reads its visible text and sources; play, pause, resume, stop", async ({ page }) => {
  await stubSpeech(page, [{ lang: "en-GB", name: "Test English" }]);
  await signIn(page, { persona: "noura" });
  await page.goto("/app/insights");
  const card = page.getByRole("article").first();
  const title = (await card.getByRole("heading", { level: 2 }).textContent())!.trim();
  const controls = card.getByRole("group", { name: `Read aloud: ${title}` });

  await controls.getByRole("button", { name: en.chrome.read.play }).click();
  const [text] = await spoken(page);
  expect(text).toContain(title);
  expect(text).toContain(`${en.home.sources}:`);
  // The folded sections are never read.
  const consider = await card.locator("details li").allTextContents();
  for (const line of consider) expect(text).not.toContain(line.trim());

  await controls.getByRole("button", { name: en.chrome.read.pause }).click();
  await controls.getByRole("button", { name: en.chrome.read.resume }).click();
  await controls.getByRole("button", { name: en.chrome.read.stop }).click();
  await expect(controls.getByRole("button", { name: en.chrome.read.play })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __state: string[] }).__state)).toEqual(["pause", "resume"]);
});

test("the assistant's answer is read without citation markers", async ({ page }) => {
  await stubSpeech(page, [{ lang: "en-US", name: "Test English" }]);
  await signIn(page, { persona: "noura" });
  await page.goto("/app/assistant");
  await page.getByRole("button", { name: "What is PCOS?" }).click();
  const answer = page.locator(".msg.ai").last();
  await expect(answer.getByRole("list", { name: en.assistant.sources })).toBeVisible();
  await answer.getByRole("button", { name: en.chrome.read.play }).click();
  const [text] = await spoken(page);
  expect(text).toContain("PCOS");
  expect(text).not.toMatch(/\[\d+\]/);
  expect(text).toContain(`${en.assistant.sources}:`);
});

test("the report summary reads aloud; Arabic uses an Arabic voice", async ({ page }) => {
  await stubSpeech(page, [{ lang: "ar-SA", name: "Test Arabic" }]);
  await signIn(page, { persona: "noura" });
  await page.goto("/app/report");
  await useLanguage(page, "ar");
  await page.reload();
  const prepare = page.getByRole("button", { name: ar.report.prepare });
  if (await prepare.isVisible()) {
    await prepare.click();
    await expect(page.getByRole("article", { name: ar.report.docTitle })).toBeVisible();
  }
  await page.getByRole("group", { name: `${ar.chrome.read.play}: ${ar.report.docTitle}` }).getByRole("button", { name: ar.chrome.read.play }).click();
  const [text] = await spoken(page);
  expect(text).toContain(ar.report.docTitle);
});

test("no voice for the language: no read-aloud button", async ({ page }) => {
  await stubSpeech(page, [{ lang: "fr-FR", name: "Test French" }]);
  await signIn(page, { persona: "noura" });
  await page.goto("/app/insights");
  await expect(page.getByRole("article").first()).toBeVisible();
  await expect(page.getByRole("button", { name: en.chrome.read.play })).toHaveCount(0);
});
