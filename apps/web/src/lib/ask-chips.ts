import type { ClinicRecord } from "@/lib/api/types";

// Suggested "Ask the record" questions, sent in English: the record copilot matches English keywords in her entries.
export const CHIPS = {
  work: "pain that stopped work or study",
  mood: "mood since the birth",
  cycles: "cycle lengths",
  bleeding: "heavy bleeding",
} as const;
export type ChipKey = keyof typeof CHIPS;

/** A birth is on record: a delivery event in her timeline, or the after-birth stage. */
export const hasBirth = (r: Pick<ClinicRecord, "profile" | "timeline">) =>
  r.profile.life_stage === "after_birth" || r.timeline.events.some((e) => e.type === "delivery");

/** "Mood since the birth" only makes sense after a birth (issue #43 b). */
export const chipKeys = (birth: boolean): ChipKey[] =>
  (Object.keys(CHIPS) as ChipKey[]).filter((k) => k !== "mood" || birth);
