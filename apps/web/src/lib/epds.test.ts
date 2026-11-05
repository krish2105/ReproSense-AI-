import { describe, expect, it } from "vitest";
import { EPDS_ITEMS } from "./epds";

describe("EPDS items", () => {
  it("has 10 items with four options each, scored 0–3 once", () => {
    expect(EPDS_ITEMS).toHaveLength(10);
    for (const item of EPDS_ITEMS) expect(item.options.map((o) => o.score).sort()).toEqual([0, 1, 2, 3]);
  });
  it("reverse-ordered items (3, 5–10) start with the highest score", () => {
    for (const i of [2, 4, 5, 6, 7, 8, 9]) expect(EPDS_ITEMS[i]!.options[0]!.score).toBe(3);
    for (const i of [0, 1, 3]) expect(EPDS_ITEMS[i]!.options[0]!.score).toBe(0);
  });
  it("item 10 asks about self-harm (the crisis path)", () => {
    expect(EPDS_ITEMS[9]!.text).toMatch(/harming myself/);
  });
});
