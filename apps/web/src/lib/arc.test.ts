import { describe, expect, it } from "vitest";
import { afterBirthSegments, angleAt, arcPath, cycleSegments, markerAt, pointAt, trimesterOf } from "./arc";

describe("arc geometry (copied from the mockup's arcSVG)", () => {
  it("maps 0..max onto 210°..-30°", () => {
    expect(angleAt(0, 46)).toBe(210);
    expect(angleAt(46, 46)).toBe(-30);
    expect(angleAt(23, 46)).toBe(90);
    expect(angleAt(99, 46)).toBe(-30); // clamped
  });
  it("puts the top of the arc above the centre", () => {
    const [x, y] = pointAt(90);
    expect(x).toBeCloseTo(140);
    expect(y).toBeCloseTo(28);
  });
  it("draws nothing for spans under half a degree", () => {
    expect(arcPath(10, 10, 46)).toBe("");
    expect(arcPath(0, 46, 46)).toMatch(/^M\d/);
  });
  it("marks today on the arc", () => {
    const [x, y] = markerAt(0, 40);
    expect(x).toBeCloseTo(53.4, 1);
    expect(y).toBeCloseTo(178, 0);
  });
});

describe("cycle segments", () => {
  it("keeps Noura's four phases in order with gaps", () => {
    const s = cycleSegments(
      [
        { key: "period", from: 1, to: 4 },
        { key: "follicular", from: 5, to: 27 },
        { key: "fertile", from: 28, to: 33 },
        { key: "luteal", from: 34, to: 46 },
      ],
      46,
    );
    expect(s.map((x) => x.key)).toEqual(["period", "follicular", "fertile", "luteal"]);
    expect(s[0]).toEqual({ key: "period", from: 0.5, to: 3.5 });
    expect(s[3]!.to).toBe(45.5);
  });
  it("clips overlapping phases (Sara: period 1–9, fertile 8–13)", () => {
    const s = cycleSegments(
      [
        { key: "period", from: 1, to: 9 },
        { key: "fertile", from: 8, to: 13 },
        { key: "luteal", from: 14, to: 26 },
      ],
      26,
    );
    expect(s[1]).toEqual({ key: "fertile", from: 9.5, to: 12.5 });
    for (let i = 1; i < s.length; i++) expect(s[i]!.from).toBeGreaterThan(s[i - 1]!.to);
  });
  it("after birth uses the API window", () => {
    const s = afterBirthSegments({ from: 4, to: 12 });
    expect(s[1]).toEqual({ key: "window", from: 4.25, to: 11.75 });
  });
  it("trimesters", () => {
    expect([trimesterOf(10), trimesterOf(24), trimesterOf(30)]).toEqual([1, 2, 3]);
  });
});
