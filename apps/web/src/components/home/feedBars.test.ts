import { describe, expect, it } from "vitest";
import { axisMax, stack } from "./feedBars";

const day = (breast: number, expressed: number, formula: number) => ({
  date: "2026-11-22",
  breast,
  expressed,
  formula,
  total: breast + expressed + formula,
});

describe("feeding chart", () => {
  it("stacks breast, then expressed, then formula, skipping kinds with no feed", () => {
    expect(stack(day(7, 1, 0))).toEqual([
      { kind: "breast", from: 0, to: 7 },
      { kind: "expressed", from: 7, to: 8 },
    ]);
    expect(stack(day(0, 0, 3))).toEqual([{ kind: "formula", from: 0, to: 3 }]);
    expect(stack(day(0, 0, 0))).toEqual([]);
  });

  it("rounds the axis up to a multiple of 4, at least 8", () => {
    expect(axisMax([day(0, 0, 0)])).toBe(8);
    expect(axisMax([day(8, 1, 0), day(4, 0, 0)])).toBe(12);
    expect(axisMax([day(12, 0, 0)])).toBe(12);
  });
});
