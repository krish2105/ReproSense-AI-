import type { AfterBirthStatus, PregnancyStatus, Source } from "@/lib/api/types";
import { SOURCES, type SourceRef } from "@/lib/sources";

export const PREGNANCY_WEEKS = 40;
/** The after-birth span the app already uses (AfterBirthArc, K1's glucose test at 4–12 weeks): the fourth trimester. */
export const AFTER_WEEKS = 12;

export type SegmentKind = "t1" | "t2" | "t3" | "after";
export interface RingMilestone {
  key: string; // "glucose_screen" or a postnatal step id
  from: number; // ring week, 1..52
  to: number;
  status: "done" | "due" | "upcoming" | "not_recorded" | null;
  sources: SourceRef[];
}

type Steps = { birth_date: string; steps: ReadonlyArray<{ id: string; from: string; to: string; status: RingMilestone["status"]; source_links: Source[] }> } | null;

const DAY = 86_400_000;
const weekAfter = (birth: string, iso: string) => Math.max(1, Math.ceil((Date.parse(iso) - Date.parse(birth)) / DAY / 7));
const clamp = (w: number) => Math.min(Math.max(w, 1), PREGNANCY_WEEKS + AFTER_WEEKS);

/** The 3D ring's data (A7): one segment per week (trimesters, then the 12 weeks after the birth), where she is now,
 *  and what is due when, each with its sources. Pregnancy: the 24–28 week glucose screen, citing the sources of rule
 *  CARE_PREGNANCY_GLUCOSE_SCREEN. After the birth: K1's postnatal steps with their own sources and status. */
export function pregnancyRing(status: PregnancyStatus | AfterBirthStatus, postnatal: Steps) {
  const segments = Array.from({ length: PREGNANCY_WEEKS + AFTER_WEEKS }, (_, i) => {
    const week = i + 1;
    const kind: SegmentKind = week > PREGNANCY_WEEKS ? "after" : week <= 13 ? "t1" : week <= 27 ? "t2" : "t3";
    return { week, kind };
  });
  const now = status.mode === "pregnancy" ? Math.min(status.week, PREGNANCY_WEEKS) : clamp(PREGNANCY_WEEKS + status.week);

  const milestones: RingMilestone[] = [];
  if (status.mode === "pregnancy") {
    for (const w of status.windows)
      milestones.push({ key: "glucose_screen", from: w.from, to: w.to, status: null, sources: [SOURCES.ada_standards_pregnancy, SOURCES.nice_ng3] });
  }
  for (const s of postnatal?.steps ?? []) {
    milestones.push({
      key: s.id,
      from: clamp(PREGNANCY_WEEKS + weekAfter(postnatal!.birth_date, s.from)),
      to: clamp(PREGNANCY_WEEKS + weekAfter(postnatal!.birth_date, s.to)),
      status: s.status,
      sources: s.source_links.map((l) => ({ id: l.source_id, title: l.title, url: l.url })),
    });
  }
  return { segments, now, milestones };
}
