import { describe, expect, it } from "vitest";
import { answerText, cardText, pickVoice, reportText } from "./readAloud";

const src = (title: string) => ({ source_id: title, title, url: "https://example.org" });

describe("read-aloud text (A5): only what is on screen", () => {
  it("reads a pattern card's title, summary, explanation and sources, never the folded sections", () => {
    const card = {
        title: "Your cycle lengths have been irregular",
        summary: "We noticed your cycle lengths were irregular. This is not a diagnosis.",
        explains: "",
        what_to_consider: ["HIDDEN consider"],
        questions_for_doctor: ["HIDDEN question"],
        sources: [src("NICE NG88"), src("ESHRE PCOS guideline")],
    };
    const text = cardText(card, "Sources");
    expect(text).toBe(
      "Your cycle lengths have been irregular. We noticed your cycle lengths were irregular. This is not a diagnosis. Sources: NICE NG88; ESHRE PCOS guideline.",
    );
    expect(text).not.toContain("HIDDEN");
  });

  it("reads an answer without the [n] markers, then its sources", () => {
    expect(answerText({ answer: "A heavy period soaks a pad every hour [1]. See a doctor [2].", citations: [{ n: 1, title: "NHS heavy periods" }, { n: 2, title: "NICE NG88" }] }, "Sources")).toBe(
      "A heavy period soaks a pad every hour. See a doctor. Sources: NHS heavy periods; NICE NG88.",
    );
  });

  it("an answer with no sources is read as it is", () => {
    expect(answerText({ answer: "Call 998 now.", citations: [] }, "Sources")).toBe("Call 998 now.");
  });

  it("reads the report summary: its lines, red flags first, then patterns", () => {
    expect(reportText({ lines: ["Doctor summary", "120 logs, 30 period days"], redFlags: ["Very heavy bleeding"], patterns: ["Irregular cycles"] }, { redFlags: "Urgent", patterns: "Patterns" })).toBe(
      "Doctor summary. 120 logs, 30 period days. Urgent: Very heavy bleeding. Patterns: Irregular cycles.",
    );
  });

  it("picks a voice for the app's language, or none", () => {
    const voices = [
      { lang: "en-US", name: "A", default: true },
      { lang: "ar-SA", name: "B", default: false },
    ];
    expect(pickVoice(voices, "ar")?.name).toBe("B");
    expect(pickVoice(voices, "en")?.name).toBe("A");
    expect(pickVoice([{ lang: "en-GB", name: "C", default: true }], "ar")).toBeUndefined();
  });
});
