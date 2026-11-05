import { describe, expect, it } from "vitest";
import { beadsOf, spiralCycles } from "./spiral";

describe("year spiral data", () => {
  const cycles = [
    { start: "2026-09-01", bleed_days: 5, length_days: 40 },
    { start: "2026-10-11", bleed_days: 6, length_days: null },
  ];
  it("uses days so far for the running cycle", () => {
    const s = spiralCycles(cycles, "2026-11-22");
    expect(s[0]).toEqual({ start: "2026-09-01", length: 40, bleed: 5, running: false });
    expect(s[1]!.length).toBe(43);
    expect(s[1]!.running).toBe(true);
  });
  it("one bead per day; bleeding first, then days past 35 marked late", () => {
    const b = beadsOf(spiralCycles(cycles, "2026-11-22"));
    expect(b).toHaveLength(40 + 43);
    expect(b.filter((x) => x.cycle === 0 && x.kind === "bleed")).toHaveLength(5);
    expect(b.filter((x) => x.cycle === 0 && x.kind === "late")).toHaveLength(5);
    expect(b[39]!.angle).toBeCloseTo(Math.PI * 2);
  });
});
