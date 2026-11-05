import { describe, expect, it } from "vitest";
import { regionLayout, westToEast } from "./regions";

// Live /v1/admin/metrics regions on the demo date (API order).
const regions = [
  { region: "Abu Dhabi City", open: 51, in_progress: 36, closed: 57 },
  { region: "Al Ain", open: 20, in_progress: 18, closed: 28 },
  { region: "Al Dhafra", open: 15, in_progress: 7, closed: 16 },
];

describe("regions", () => {
  it("places the three regions west to east like the mockup", () => {
    expect(westToEast(regions).map((r) => r.region)).toEqual(["Al Dhafra", "Abu Dhabi City", "Al Ain"]);
    expect(regionLayout(regions).find((p) => p.r.region === "Al Dhafra")!.x).toBeLessThan(0);
  });

  it("gives a region the API adds later its own place in a back row instead of dropping it", () => {
    const layout = regionLayout([...regions, { region: "Western Islands", open: 1, in_progress: 0, closed: 2 }]);
    const extra = layout.find((p) => p.r.region === "Western Islands")!;
    expect(extra.z).toBeGreaterThan(4);
    expect(westToEast([...regions, extra.r]).at(-1)!.region).toBe("Western Islands");
  });
});
