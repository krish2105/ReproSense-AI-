import { describe, expect, it } from "vitest";
import { chipKeys, hasBirth } from "./ask-chips";

const record = (life_stage: string, types: string[]) =>
  ({
    profile: { life_stage },
    timeline: { events: types.map((type, i) => ({ id: `e${i}`, type, date: "2026-01-01", details: {} })) },
  }) as unknown as Parameters<typeof hasBirth>[0];

describe("Ask the record shortcuts (issue #43 b)", () => {
  it("offers 'mood since the birth' only after a birth", () => {
    expect(chipKeys(false)).toEqual(["work", "cycles", "bleeding"]);
    expect(chipKeys(true)).toEqual(["work", "mood", "cycles", "bleeding"]);
  });

  it("sees a birth from a delivery event or the after-birth stage", () => {
    expect(hasBirth(record("periods", []))).toBe(false);
    expect(hasBirth(record("pregnancy", ["pregnancy_confirmed"]))).toBe(false);
    expect(hasBirth(record("periods", ["delivery"]))).toBe(true);
    expect(hasBirth(record("after_birth", []))).toBe(true);
  });
});
