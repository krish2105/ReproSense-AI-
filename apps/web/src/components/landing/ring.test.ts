import { describe, expect, it } from "vitest";
import { fitScale, project, RING, ringBeads, ringPoint } from "./ring";

// Noura's live status on the demo date (GET /v1/me/home): day 19 of an estimated 46-day cycle.
const noura = {
  day: 19,
  length: 46,
  phases: [
    { key: "period" as const, from: 1, to: 4 },
    { key: "follicular" as const, from: 5, to: 27 },
    { key: "fertile" as const, from: 28, to: 33 },
    { key: "luteal" as const, from: 34, to: 46 },
  ],
};

describe("ringBeads", () => {
  it("draws one bead per day with the API phases, today and the estimated days ahead", () => {
    const b = ringBeads(noura);
    expect(b).toHaveLength(46);
    expect(b.filter((x) => x.phase === "period").map((x) => x.day)).toEqual([1, 2, 3, 4]);
    expect(b.filter((x) => x.phase === "fertile")).toHaveLength(6);
    expect(b.filter((x) => x.size === "today").map((x) => x.day)).toEqual([19]);
    expect(b.filter((x) => x.future)).toHaveLength(27);
    expect(b[0]!.angle).toBe(0);
  });

  it("lets the earlier phase win where the API overlaps them, like the arc", () => {
    const b = ringBeads({ day: 3, length: 28, phases: [{ key: "period", from: 1, to: 9 }, { key: "fertile", from: 8, to: 13 }] });
    expect(b[7]!.phase).toBe("period");
    expect(b[9]!.phase).toBe("fertile");
    expect(b[20]!.phase).toBe("luteal"); // no phase from the API: drawn as the late part of the cycle
  });

  it("extends the ring when today is past her usual length", () => {
    const b = ringBeads({ ...noura, day: 52 });
    expect(b).toHaveLength(52);
    expect(b.at(-1)!.size).toBe("today");
  });
});

describe("project", () => {
  it("puts the ring centre in the middle of the canvas", () => {
    const c = project([0, 0, 0]);
    expect(c.x).toBeCloseTo(0);
    expect(c.y).toBeCloseTo(0);
  });

  it("matches the camera: a point straight up at the canvas edge lands on y = 1", () => {
    const h = RING.camera.z * Math.tan((RING.camera.fov / 2) * (Math.PI / 180));
    const p = project([0, h, 0], { x: 0, y: 0, z: 0 });
    expect(p.y).toBeCloseTo(1);
  });

  it("tilts the ring away from the camera into a flat ellipse", () => {
    const pts = Array.from({ length: 64 }, (_, i) => project(ringPoint((i / 64) * Math.PI * 2)));
    const w = Math.max(...pts.map((p) => p.x)) - Math.min(...pts.map((p) => p.x));
    const h = Math.max(...pts.map((p) => p.y)) - Math.min(...pts.map((p) => p.y));
    expect(w).toBeGreaterThan(h * 1.4); // 1.66 × 1.04 half-heights for the resting pose
  });
});

describe("fitScale", () => {
  it("sizes the ring by the canvas's shorter side, like an SVG with a square viewBox and meet", () => {
    expect(fitScale(800, 600)).toBe(1);
    expect(fitScale(636, 760)).toBeCloseTo(0.837, 3);
    expect(fitScale(100, 0)).toBe(1);
  });

  it("keeps every bead of the resting pose inside the canvas", () => {
    const edge = Math.max(...Array.from({ length: 64 }, (_, i) => {
      const p = project(ringPoint((i / 64) * Math.PI * 2));
      return Math.abs(p.x) + RING.bead.today * p.scale;
    }));
    expect(edge).toBeLessThan(1);
  });
});
