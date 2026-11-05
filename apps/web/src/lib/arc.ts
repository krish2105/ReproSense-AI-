// Geometry of the signature arc (docs/06), copied from arcSVG() in mockup/template.html (~line 777):
// a 240° arc from 210° to -30°, centre (W/2, 128), radius 100, in a W×200 viewBox.
export const ARC = { W: 280, H: 200, cy: 128, r: 100, start: 210, end: -30, stroke: 16 } as const;

export interface Segment {
  from: number; // in the arc's own units (days or weeks)
  to: number;
  key: string;
}

/** Angle in degrees for a position on a 0..max scale (clamped). */
export function angleAt(pos: number, max: number): number {
  const p = Math.min(Math.max(pos, 0), max);
  return ARC.start - (p / max) * (ARC.start - ARC.end);
}

export function pointAt(angleDeg: number, r: number = ARC.r): [number, number] {
  const cx = ARC.W / 2;
  const a = (angleDeg * Math.PI) / 180;
  return [cx + r * Math.cos(a), ARC.cy - r * Math.sin(a)];
}

/** SVG path for the arc between two positions; "" when the span is too short to draw. */
export function arcPath(from: number, to: number, max: number, r: number = ARC.r): string {
  const a1 = angleAt(from, max);
  const a2 = angleAt(to, max);
  if (a1 - a2 < 0.5) return "";
  const [x1, y1] = pointAt(a1, r);
  const [x2, y2] = pointAt(a2, r);
  const large = a1 - a2 > 180 ? 1 : 0;
  return `M${x1.toFixed(1)} ${y1.toFixed(1)} A${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

/** Marker position for "today" on the arc. */
export function markerAt(pos: number, max: number): [number, number] {
  const [x, y] = pointAt(angleAt(pos, max));
  return [Number(x.toFixed(1)), Number(y.toFixed(1))];
}

/**
 * Cycle phases from the API ({key, from, to} in cycle days, 1-based, inclusive) → drawable segments on 0..max.
 * Overlaps are clipped so each day belongs to one segment (the API can return period 1–9 and fertile 8–13),
 * and a half-day inset leaves the surface-colour gap between segments that mauve-charts requires.
 */
export function cycleSegments(phases: { key: string; from: number; to: number }[], max: number): Segment[] {
  const sorted = [...phases].sort((a, b) => a.from - b.from);
  const out: Segment[] = [];
  let cursor = 0; // last day already covered
  for (const p of sorted) {
    const from = Math.max(p.from - 1, cursor); // day N occupies (N-1, N]
    const to = Math.min(p.to, max);
    if (to - from <= 0) continue;
    out.push({ key: p.key, from: from + 0.5, to: to - 0.5 });
    cursor = to;
  }
  return out;
}

/** Pregnancy weeks 0–40 in trimester colours (mockup): 0–13, 13–27, 27–40. */
export function pregnancySegments(): Segment[] {
  return [
    { key: "t1", from: 0.5, to: 12.5 },
    { key: "t2", from: 13.5, to: 26.5 },
    { key: "t3", from: 27.5, to: 39.5 },
  ];
}

/** After birth, weeks 0–12: recovery 0–4, then the glucose-test window 4–12 (or the API's window). */
export function afterBirthSegments(window: { from: number; to: number } | undefined, max = 12): Segment[] {
  const w = window ?? { from: 4, to: 12 };
  return [
    { key: "recovery", from: 0.25, to: Math.max(w.from - 0.25, 0.5) },
    { key: "window", from: w.from + 0.25, to: Math.min(w.to, max) - 0.25 },
  ];
}

export function trimesterOf(week: number): 1 | 2 | 3 {
  return week < 14 ? 1 : week < 28 ? 2 : 3;
}
