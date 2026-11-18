import type { BeadKind } from "@/components/landing/spiral";

export interface YearBead {
  date: string;
  cycle: number; // which loop of the spiral
  angle: number; // radians, 0..2π across that cycle
  kind: BeadKind; // bleed | late (past day 35) | day
  ring: boolean; // pain 7 or more
}
export interface YearDiamond {
  date: string;
  type: string;
  cycle: number;
  angle: number;
}

type Input = {
  to: string;
  cycles: ReadonlyArray<{ start: string; bleed_days: number; length_days: number | null }>;
  days: ReadonlyArray<{ date: string; flow: string; pain: number }>;
  events: ReadonlyArray<{ date: string; type: string }>;
};

const DAY = 86_400_000;
const at = (iso: string) => Date.parse(`${iso}T12:00:00Z`);

/** Her own logs as spiral beads (A4): one bead per logged date on the loop of the cycle it belongs to, placed by its
 *  day in that cycle (the running cycle by days so far), coloured like the landing spiral, ringed for pain ≥ 7.
 *  Events become diamonds. Dates before her first logged cycle have no loop and are left out (the 2D chart shows them). */
export function yearBeads(tl: Input): { beads: YearBead[]; diamonds: YearDiamond[]; loops: number } {
  const cycles = tl.cycles.map((c) => {
    const start = at(c.start);
    const length = c.length_days ?? Math.max(c.bleed_days, Math.round((at(tl.to) - start) / DAY) + 1);
    return { start, length };
  });
  if (!cycles.length) return { beads: [], diamonds: [], loops: 0 };

  const place = (iso: string) => {
    const t = at(iso);
    let k = -1;
    for (let i = 0; i < cycles.length; i++) if (cycles[i]!.start <= t) k = i;
    if (k < 0) return null;
    const c = cycles[k]!;
    const day = Math.round((t - c.start) / DAY) + 1;
    return { cycle: k, day, angle: (Math.min(day, c.length) / c.length) * 2 * Math.PI };
  };

  const byDate = new Map<string, { flow: string; pain: number }>();
  for (const d of tl.days) byDate.set(d.date, d); // later rows (her own entries) win
  const beads: YearBead[] = [];
  for (const [date, d] of [...byDate].sort(([a], [b]) => a.localeCompare(b))) {
    const p = place(date);
    if (!p) continue;
    beads.push({ date, cycle: p.cycle, angle: p.angle, kind: d.flow !== "none" ? "bleed" : p.day > 35 ? "late" : "day", ring: d.pain >= 7 });
  }
  const diamonds: YearDiamond[] = [];
  for (const e of tl.events) {
    const p = place(e.date);
    if (p) diamonds.push({ date: e.date, type: e.type, cycle: p.cycle, angle: p.angle });
  }
  return { beads, diamonds, loops: cycles.length };
}
