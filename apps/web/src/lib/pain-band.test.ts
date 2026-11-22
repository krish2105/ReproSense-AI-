import { describe, expect, it } from "vitest";
import { painBand } from "./pain-band";

describe("pain words", () => {
  it("uses the usual cut points: 0 none, 1-3 mild, 4-6 moderate, 7-10 severe", () => {
    expect([0, 1, 3, 4, 6, 7, 10].map(painBand)).toEqual(["none", "mild", "mild", "moderate", "moderate", "severe", "severe"]);
  });
  it("treats a missing or odd value as none", () => {
    expect(painBand(Number.NaN)).toBe("none");
    expect(painBand(-2)).toBe("none");
  });
});
