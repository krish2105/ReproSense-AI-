// One bead per day of each cycle, one loop per cycle (mockup init3D year spiral). Pure data, shared by the
// 3D scene, the flat SVG poster and the table, so all three always show the same numbers.
export type BeadKind = "bleed" | "late" | "day";
export interface Bead {
  cycle: number;
  day: number;
  angle: number; // radians, 0..2π across the cycle
  kind: BeadKind;
}
export interface SpiralCycle {
  start: string;
  length: number; // complete length, or days so far for the running cycle
  bleed: number;
  running: boolean;
}

export function spiralCycles(cycles: { start: string; bleed_days: number; length_days: number | null }[], refDate: string, max = 8): SpiralCycle[] {
  const ref = Date.parse(`${refDate}T12:00:00Z`);
  return cycles.slice(-max).map((c) => {
    const running = c.length_days === null;
    const sofar = Math.max(c.bleed_days, Math.round((ref - Date.parse(`${c.start}T12:00:00Z`)) / 86_400_000) + 1);
    return { start: c.start, length: running ? sofar : (c.length_days as number), bleed: c.bleed_days, running };
  });
}

export function beadsOf(cycles: SpiralCycle[]): Bead[] {
  const out: Bead[] = [];
  cycles.forEach((c, k) => {
    for (let d = 1; d <= c.length; d++) out.push({ cycle: k, day: d, angle: (d / c.length) * Math.PI * 2, kind: d <= c.bleed ? "bleed" : d > 35 ? "late" : "day" });
  });
  return out;
}
