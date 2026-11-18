import { describe, expect, it } from "vitest";
import { yearBeads } from "./yearBeads";

const day = (date: string, flow = "none", pain = 0, id = date) => ({ id, date, flow, pain });
const tl = {
  to: "2026-03-10",
  cycles: [
    { start: "2026-01-01", bleed_days: 5, length_days: 40 },
    { start: "2026-02-10", bleed_days: 4, length_days: null }, // running: 29 days so far on 10 Mar
  ],
  days: [
    day("2025-12-20"), // before her first cycle: no loop to sit on
    day("2026-01-01", "heavy", 8),
    day("2026-01-20"),
    day("2026-02-08"), // day 39 of a 40-day cycle
    day("2026-02-10", "medium", 3),
    day("2026-02-10", "light", 7, "app-row"), // her own entry for the same date wins
  ],
  events: [{ id: "e1", date: "2026-01-20", type: "lab" }],
};

describe("yearBeads (her year in 3D, A4)", () => {
  const { beads, diamonds, loops } = yearBeads(tl);

  it("puts one bead per logged date on its cycle's loop", () => {
    expect(beads.map((b) => b.date)).toEqual(["2026-01-01", "2026-01-20", "2026-02-08", "2026-02-10"]);
    expect(beads.map((b) => b.cycle)).toEqual([0, 0, 0, 1]);
    expect(loops).toBe(2);
  });

  it("places a bead by its day in the cycle: day 1 at the start of the loop, the running cycle by days so far", () => {
    expect(beads[0]!.angle).toBeCloseTo((1 / 40) * 2 * Math.PI);
    expect(beads[3]!.angle).toBeCloseTo((1 / 29) * 2 * Math.PI);
  });

  it("colours by phase: bleeding days, days past 35, other days", () => {
    expect(beads.map((b) => b.kind)).toEqual(["bleed", "day", "late", "bleed"]);
  });

  it("rings days with pain 7 or more, using the later row for a date", () => {
    expect(beads.map((b) => b.ring)).toEqual([true, false, false, true]);
  });

  it("marks events as diamonds on the same loop", () => {
    expect(diamonds).toEqual([{ date: "2026-01-20", type: "lab", cycle: 0, angle: (20 / 40) * 2 * Math.PI }]);
  });

  it("gives nothing without cycles", () => {
    expect(yearBeads({ ...tl, cycles: [] })).toEqual({ beads: [], diamonds: [], loops: 0 });
  });
});
