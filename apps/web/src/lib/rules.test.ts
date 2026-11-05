import { describe, expect, it } from "vitest";
import { toneOfRule, tonesOf } from "./rules";

describe("rule tones", () => {
  it("maps rule ids to tag tones, most urgent first", () => {
    expect(toneOfRule("RF1_heavy_bleeding_with_dizziness")).toBe("urgent");
    expect(toneOfRule("CARE_POSTPARTUM_GLUCOSE_TEST")).toBe("soon");
    expect(toneOfRule("OBS_IRREGULAR_CYCLES")).toBe("discuss");
    expect(tonesOf(["OBS_HEAVY_OR_LONG_PERIODS", "RF1_heavy_bleeding_with_dizziness", "CARE_X"])).toEqual(["urgent", "soon", "discuss"]);
    expect(tonesOf(null)).toEqual([]);
  });
});
