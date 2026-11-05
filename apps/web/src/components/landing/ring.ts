// The hero ring (mockup init3D "hero"): one bead per day of her current cycle, with phases from the API.
// Pure data shared by the 3D scene and the flat SVG poster, so both always show the same days.
import type { PhaseKey } from "@/lib/api/types";

export interface RingBead {
  day: number;
  angle: number; // radians, 0..2π across the cycle
  phase: PhaseKey;
  size: "today" | "period" | "day";
  future: boolean; // days after today are estimates
}

export const RING = {
  radius: 3.7,
  bead: { today: 0.28, period: 0.2, day: 0.13 },
  camera: { z: 12, fov: 40 },
  // Resting pose of the ring group (mockup: x -1.05, y 0.35; z 0.4 when still).
  pose: { x: -1.05, y: 0.35, z: 0.4 },
} as const;

/** The scene zooms out when the canvas is narrower than it is tall (zoom = min(1, width / height)), so the
 *  ring is sized by the canvas's shorter side. An SVG with viewBox "-1 -1 2 2" and
 *  preserveAspectRatio "xMidYMid meet" follows the same rule, so poster and scene line up at any size. */
export function fitScale(width: number, height: number): number {
  return height > 0 ? Math.min(1, width / height) : 1;
}

/** Beads for days 1..max(length, today). Overlapping API phases resolve like the arc: the earlier phase wins. */
export function ringBeads(status: { day: number; length: number; phases: { key: PhaseKey; from: number; to: number }[] }): RingBead[] {
  const total = Math.max(status.length, status.day, 1);
  const sorted = [...status.phases].sort((a, b) => a.from - b.from);
  const out: RingBead[] = [];
  for (let d = 1; d <= total; d++) {
    const phase = sorted.find((p) => d >= p.from && d <= p.to)?.key ?? "luteal";
    const today = d === status.day;
    out.push({ day: d, angle: ((d - 1) / total) * Math.PI * 2, phase, size: today ? "today" : phase === "period" ? "period" : "day", future: d > status.day });
  }
  return out;
}

/** Local position of a bead on the ring (the ring lies in the group's XY plane). */
export function ringPoint(angle: number, r: number = RING.radius): [number, number, number] {
  return [Math.cos(angle) * r, Math.sin(angle) * r, 0];
}

/**
 * Where a ring point lands on screen for the resting pose: three.js Euler order XYZ (rotate z, then y, then x),
 * then the perspective camera at z = 12. Units are half the canvas height, y up, centre 0. In the resting pose
 * the ring spans x −0.87…0.78 and y −0.63…0.41, beads included it stays inside ±1.
 */
export function project(p: [number, number, number], pose: { x: number; y: number; z: number } = RING.pose) {
  const [x0, y0, z0] = p;
  const x1 = x0 * Math.cos(pose.z) - y0 * Math.sin(pose.z);
  const y1 = x0 * Math.sin(pose.z) + y0 * Math.cos(pose.z);
  const z1 = z0;
  const x2 = x1 * Math.cos(pose.y) + z1 * Math.sin(pose.y);
  const z2 = -x1 * Math.sin(pose.y) + z1 * Math.cos(pose.y);
  const y3 = y1 * Math.cos(pose.x) - z2 * Math.sin(pose.x);
  const z3 = y1 * Math.sin(pose.x) + z2 * Math.cos(pose.x);
  const dist = RING.camera.z - z3;
  const k = 1 / (dist * Math.tan(((RING.camera.fov / 2) * Math.PI) / 180));
  return { x: x2 * k, y: y3 * k, depth: z3, scale: k };
}
