import type { PainSite } from "@/lib/api/types";

export const PAIN_SITES: readonly PainSite[] = ["lower abdomen", "upper abdomen", "left pelvis", "right pelvis", "lower back"];
const WINDOW_DAYS = 92; // about 3 months

/** Painful days per site in the 3 months up to `to` (her logs), and a 0..1 level relative to the busiest site.
 *  A date counts once per site, even when a seeded row and her own entry share it. */
export function siteHeat(days: ReadonlyArray<{ date: string; sites: readonly string[] }>, to: string) {
  const end = Date.parse(`${to}T00:00:00Z`);
  const from = new Date(end - WINDOW_DAYS * 86_400_000).toISOString().slice(0, 10);
  const seen = new Map<PainSite, Set<string>>(PAIN_SITES.map((s) => [s, new Set()]));
  for (const d of days) {
    if (d.date < from || d.date > to) continue;
    for (const s of d.sites) seen.get(s as PainSite)?.add(d.date);
  }
  const counts = Object.fromEntries(PAIN_SITES.map((s) => [s, seen.get(s)!.size])) as Record<PainSite, number>;
  const max = Math.max(1, ...Object.values(counts));
  const level = Object.fromEntries(PAIN_SITES.map((s) => [s, counts[s] / max])) as Record<PainSite, number>;
  return { counts, level };
}
