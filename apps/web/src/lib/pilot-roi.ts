/**
 * Pilot scenario arithmetic (rewritten 22 Nov 2026). One subtraction on numbers the clinic supplies: the women
 * eligible for the after-birth glucose follow-up, the share completed today, and a target the clinic sets.
 *
 * What this deliberately does not do (docs/CLAIMS_REGISTER.md, "Withdrawn impact claims"): it does not multiply a
 * prevalence, a historical attendance rate and an abnormal-result rate from different populations and time windows,
 * and it prints no money value. A completed follow-up is a test that was done, never a case found or prevented.
 */

export interface PilotInputs {
  eligible: number; // women eligible for the follow-up during the pilot (clinician-documented gestational diabetes)
  beforePct: number; // follow-up completed at this clinic today, % (the clinic's own figure)
  afterPct: number; // completion the clinic aims for in the pilot, % (an assumption, not a result)
}

/** `example` = a placeholder the clinic replaces with its own figure; `assumption` = a target the clinic sets. */
export type DefaultBasis = "example" | "assumption";

export const DEFAULTS: Record<keyof PilotInputs, { value: number; basis: DefaultBasis }> = {
  eligible: { value: 100, basis: "example" },
  beforePct: { value: 25, basis: "example" },
  afterPct: { value: 50, basis: "assumption" },
};

/**
 * A historical reference shown beside the inputs, never used as a default or in the arithmetic: one hospital, old data,
 * and a 4 to 6 week window that cannot be compared with a 12 week one.
 */
export const REFERENCE = {
  title:
    "265 of 1,043 women (25.4%) came back for the glucose test within 4 to 6 weeks: one Al Ain hospital, 2013 to 2014 data (IJERPH, 2022)",
  url: "https://doi.org/10.3390/ijerph192113946",
} as const;

export interface PilotResult {
  completedBefore: number; // follow-ups completed at today's rate
  completedAfter: number; // follow-ups completed at the target rate
  extraCompleted: number; // additional completed follow-ups (never negative)
}

const clamp = (n: number, lo: number, hi: number) => (Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : lo);

/** Inputs outside their sensible range are held at the edge: women ≥ 0 (whole), percentages 0–100. */
export function sanitise(i: PilotInputs): PilotInputs {
  return {
    eligible: Math.round(clamp(i.eligible, 0, 1_000_000)),
    beforePct: clamp(i.beforePct, 0, 100),
    afterPct: clamp(i.afterPct, 0, 100),
  };
}

export function pilotScenario(raw: PilotInputs): PilotResult {
  const i = sanitise(raw);
  const completedBefore = (i.eligible * i.beforePct) / 100;
  const completedAfter = (i.eligible * i.afterPct) / 100;
  return { completedBefore, completedAfter, extraCompleted: Math.max(0, completedAfter - completedBefore) };
}
