import type { FeedDay, FeedKind } from "@/lib/api/types";

export const KINDS: FeedKind[] = ["breast", "expressed", "formula"];

/** One day's bar, bottom up: a segment per kind she logged that day, in feeds (kinds with no feed are left out). */
export function stack(day: FeedDay): { kind: FeedKind; from: number; to: number }[] {
  let at = 0;
  return KINDS.filter((k) => day[k] > 0).map((k) => ({ kind: k, from: at, to: (at += day[k]) }));
}

/** The y-axis top: the busiest day rounded up to a multiple of 4, never below 8, so a quiet week still reads as one. */
export const axisMax = (days: FeedDay[]) => Math.max(8, Math.ceil(Math.max(0, ...days.map((d) => d.total)) / 4) * 4);
