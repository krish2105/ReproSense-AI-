/**
 * Words for the 0-10 pain scale (22 Nov). The usual numeric-rating cut points: 0 none, 1-3 mild, 4-6 moderate,
 * 7-10 severe. They describe the number she chose; they are not a clinical grading.
 */
export type PainBand = "none" | "mild" | "moderate" | "severe";

export function painBand(pain: number): PainBand {
  if (!Number.isFinite(pain) || pain <= 0) return "none";
  if (pain <= 3) return "mild";
  if (pain <= 6) return "moderate";
  return "severe";
}
