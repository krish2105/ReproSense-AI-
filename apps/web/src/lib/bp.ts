// Blood-pressure readings (build week K6). Display only: the urgent warning and the recheck card come from the rules
// engine (rules/clinical_rules.yaml, RF7_HIGH_BLOOD_PRESSURE and OBS_RAISED_BLOOD_PRESSURE). These marks repeat the
// same NICE NG133 numbers so a table can say which readings were 140/90 or 160/110 or higher; bp.test.ts checks that
// they still match the rules file.
import type { BpReading } from "./api/types";

export const BP_RANGE = { systolic: [70, 250], diastolic: [40, 150] } as const; // backend/app/services/blood_pressure.py
export const BP_RAISED = { systolic: 140, diastolic: 90 } as const;
export const BP_SEVERE = { systolic: 160, diastolic: 110 } as const;

export type BpLevel = "severe" | "raised" | null;

export function bpLevel(r: Pick<BpReading, "systolic" | "diastolic">): BpLevel {
  if (r.systolic >= BP_SEVERE.systolic || r.diastolic >= BP_SEVERE.diastolic) return "severe";
  if (r.systolic >= BP_RAISED.systolic || r.diastolic >= BP_RAISED.diastolic) return "raised";
  return null;
}

/** "118/76": always left to right, Western digits (format.ts rule). */
export function bpText(r: Pick<BpReading, "systolic" | "diastolic">): string {
  return `${r.systolic}/${r.diastolic}`;
}

/** Why a typed pair cannot be saved, before asking the API (which checks the same). */
export function bpProblem(sys: number, dia: number): "range" | "order" | null {
  const [s0, s1] = BP_RANGE.systolic;
  const [d0, d1] = BP_RANGE.diastolic;
  if (!Number.isInteger(sys) || !Number.isInteger(dia) || sys < s0 || sys > s1 || dia < d0 || dia > d1) return "range";
  if (sys <= dia) return "order";
  return null;
}
