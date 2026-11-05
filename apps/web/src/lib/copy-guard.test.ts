import { describe, expect, it } from "vitest";
import { isSafe, violations } from "./copy-guard";

describe("copy guard (port of backend/app/ai/guards.py)", () => {
  it("blocks diagnoses and fake probabilities", () => {
    expect(violations("You have PCOS.")).toContain("you have <condition>");
    expect(violations("There is a 73% chance of endometriosis")).toContain("% chance");
    expect(violations("probability of infertility")).toContain("probability of");
    expect(violations("This will cure it")).toContain("cure");
    expect(violations("you might be infertile")).toContain("you are infertile");
    expect(violations("لديك متلازمة تكيس المبايض")).toContain("لديك متلازمة");
    expect(violations("تم تشخيصك")).toContain("تم تشخيصك");
  });
  it("allows kind reporting phrases", () => {
    expect(isSafe("Tell your doctor how you have been feeling.")).toBe(true);
    expect(isSafe("You have logged 12 entries.")).toBe(true);
    expect(isSafe("You have missed two periods.")).toBe(true);
    expect(isSafe("Your cycles were longer than 35 days.")).toBe(true);
  });
});
