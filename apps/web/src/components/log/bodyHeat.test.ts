import { describe, expect, it } from "vitest";
import { siteHeat } from "./bodyHeat";

const day = (date: string, sites: string[]) => ({ date, sites });

describe("siteHeat (3D body map colour)", () => {
  it("counts painful days per site in the last 3 months only", () => {
    const h = siteHeat(
      [
        day("2026-08-21", ["lower back"]), // 93 days before: outside
        day("2026-08-22", ["lower back"]), // first day inside the window
        day("2026-10-01", ["lower abdomen", "lower back"]),
        day("2026-11-22", ["lower abdomen"]),
      ],
      "2026-11-22",
    );
    expect(h.counts).toEqual({ "lower abdomen": 2, "upper abdomen": 0, "left pelvis": 0, "right pelvis": 0, "lower back": 2 });
  });

  it("counts a date once even when it has two rows (seeded + her own entry)", () => {
    const h = siteHeat([day("2026-11-20", ["left pelvis"]), day("2026-11-20", ["left pelvis"])], "2026-11-22");
    expect(h.counts["left pelvis"]).toBe(1);
  });

  it("levels are 0..1, relative to the busiest site", () => {
    const h = siteHeat([day("2026-11-01", ["lower abdomen", "lower back"]), day("2026-11-02", ["lower abdomen"])], "2026-11-22");
    expect(h.level["lower abdomen"]).toBe(1);
    expect(h.level["lower back"]).toBe(0.5);
    expect(h.level["upper abdomen"]).toBe(0);
  });

  it("ignores unknown sites and future dates; no logs gives all zeros", () => {
    const h = siteHeat([day("2026-11-23", ["lower back"]), day("2026-11-01", ["knee"])], "2026-11-22");
    expect(Object.values(h.level)).toEqual([0, 0, 0, 0, 0]);
  });
});
