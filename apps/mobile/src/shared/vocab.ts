// Copied from apps/web/src/lib/vocab.ts by apps/mobile/scripts/sync-shared.mjs. Edit the web file, then run npm run sync.
// Values the API accepts (backend/app/api/patient.py: FLOWS, SYMPTOMS, IMPACTS, SITES, MoodIn). The UI sends exactly these.
import type { Flow, Impact, Mood, PainSite, PbacItems } from "../api/types";

export const FLOWS: readonly Flow[] = ["none", "spotting", "light", "medium", "heavy"];
export const IMPACTS: readonly Impact[] = ["none", "reduced activity", "missed work or study", "stayed in bed"];
export const MOODS: ReadonlyArray<{ value: Mood; emoji: string }> = [
  { value: "calm", emoji: "😌" },
  { value: "tired", emoji: "😴" },
  { value: "in pain", emoji: "😣" },
  { value: "low", emoji: "😔" },
  { value: "energetic", emoji: "⚡" },
];

/** Shown first in the log form; the rest sit under "More symptoms". */
export const COMMON_SYMPTOMS = [
  "cramps",
  "bloating",
  "fatigue",
  "headache",
  "low mood",
  "back pain",
  "acne",
  "excess hair growth",
  "pain with bowel movements",
  "dizziness",
  "flooding",
  "hot flushes",
] as const;
export const MORE_SYMPTOMS = [
  "breast tenderness",
  "cravings",
  "scalp hair thinning",
  "pain passing urine",
  "fainting",
  "fever",
  "night sweats",
  "nausea",
  "anxiety",
  "insomnia",
  "sudden severe pain",
  "severe abdominal pain",
  "reduced baby movements",
  "severe headache",
  "vision changes",
  "bleeding",
] as const;
export const ALL_SYMPTOMS: readonly string[] = [...COMMON_SYMPTOMS, ...MORE_SYMPTOMS];

/** Body-map tap points, % of a 3:4 box (ASSET_INTEGRATION_REPORT.md §5). Left/right are HER sides. */
export const SITE_POINTS: Record<"front" | "back", ReadonlyArray<{ site: PainSite; x: number; y: number }>> = {
  front: [
    { site: "upper abdomen", x: 49.6, y: 42 },
    { site: "lower abdomen", x: 49.6, y: 64 },
    { site: "right pelvis", x: 36, y: 70 },
    { site: "left pelvis", x: 63.2, y: 70 },
  ],
  back: [{ site: "lower back", x: 52, y: 55 }],
};

/** "pain with bowel movements" → "pain_with_bowel_movements" (message keys). */
export function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

/** PBAC (Higham 1990), identical to backend pbac_score(): pads 1/5/20, tampons 1/5/10, clots 1/5. */
export const PBAC_WEIGHTS = {
  pads: { light: 1, moderate: 5, soaked: 20 },
  tampons: { light: 1, moderate: 5, soaked: 10 },
  clots: { small: 1, large: 5 },
} as const;

export function pbacScore(items: PbacItems | null | undefined): number {
  if (!items) return 0;
  let total = 0;
  for (const [group, weights] of Object.entries(PBAC_WEIGHTS)) {
    const counts = (items as Record<string, Record<string, number> | undefined>)[group] ?? {};
    for (const [k, w] of Object.entries(weights)) {
      const n = Math.max(0, Math.floor(counts[k] ?? 0));
      total += w * n;
    }
  }
  return total;
}
