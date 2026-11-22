/**
 * Pilot value arithmetic (build week Y3). Pure functions so the numbers on /pilot are unit-tested. Nothing here is a
 * measured outcome: it multiplies inputs the viewer sets, and every default either cites its source or says it is an
 * assumption (see DEFAULTS).
 */

export interface PilotInputs {
  women: number; // women who gave birth during the pilot
  gdmPct: number; // share of them with gestational diabetes, %
  beforePct: number; // after-birth glucose follow-up completed today, %
  afterPct: number; // completion the clinic aims for with ReproSense, %
  abnormalPct: number; // share of after-birth glucose tests that show raised sugar (prediabetes or diabetes), %
  missedCostAed: number; // cost of one missed follow-up, AED (the viewer's own figure)
}

export type DefaultBasis = "source" | "assumption";

/** Each default with what it rests on. `ref` is a key into SOURCES, or null for an assumption. */
export const DEFAULTS: Record<keyof PilotInputs, { value: number; basis: DefaultBasis; ref: keyof typeof SOURCES | null }> = {
  women: { value: 1000, basis: "assumption", ref: null },
  gdmPct: { value: 21.3, basis: "source", ref: "gdm" },
  beforePct: { value: 25.4, basis: "source", ref: "followup" },
  afterPct: { value: 50, basis: "assumption", ref: null },
  abnormalPct: { value: 34.5, basis: "source", ref: "abnormal" },
  missedCostAed: { value: 500, basis: "assumption", ref: null },
};

export const SOURCES = {
  gdm: {
    title: "Gestational diabetes in the Mutaba'ah cohort, Al Ain: 21.3% of 2,546 pregnancies (Frontiers in Endocrinology, 2022)",
    url: "https://doi.org/10.3389/fendo.2022.1069477",
  },
  followup: {
    title: "After gestational diabetes, 265 of 1,043 women (25.4%) came back for the glucose test, Al Ain (IJERPH, 2022)",
    url: "https://doi.org/10.3390/ijerph192113946",
  },
  abnormal: {
    title: "Raised blood sugar within a year of birth after gestational diabetes: 34.5%, pooled from 18 studies (Endocrine, 2025)",
    url: "https://doi.org/10.1007/s12020-025-04271-2",
  },
} as const;

export interface PilotResult {
  gdm: number; // women with gestational diabetes in the pilot
  closedBefore: number; // follow-ups completed at today's rate
  closedAfter: number; // follow-ups completed at the target rate
  extraClosed: number; // follow-ups closed that would otherwise be missed (never negative)
  foundEarly: number; // of those extra tests, how many would show raised sugar at the pooled rate (an expectation, not a measurement)
  value: number; // extraClosed × cost of one missed follow-up, AED
  per1000: { extraClosed: number; value: number; foundEarly: number };
}

const clamp = (n: number, lo: number, hi: number) => (Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : lo);

/** Inputs outside their sensible range are held at the edge: women ≥ 0, percentages 0–100, money ≥ 0. */
export function sanitise(i: PilotInputs): PilotInputs {
  return {
    women: Math.round(clamp(i.women, 0, 1_000_000)),
    gdmPct: clamp(i.gdmPct, 0, 100),
    beforePct: clamp(i.beforePct, 0, 100),
    afterPct: clamp(i.afterPct, 0, 100),
    abnormalPct: clamp(i.abnormalPct, 0, 100),
    missedCostAed: clamp(i.missedCostAed, 0, 10_000_000),
  };
}

export function pilotValue(raw: PilotInputs): PilotResult {
  const i = sanitise(raw);
  const gdm = (i.women * i.gdmPct) / 100;
  const closedBefore = (gdm * i.beforePct) / 100;
  const closedAfter = (gdm * i.afterPct) / 100;
  const extraClosed = Math.max(0, closedAfter - closedBefore);
  const foundEarly = (extraClosed * i.abnormalPct) / 100;
  const value = extraClosed * i.missedCostAed;
  const scale = i.women > 0 ? 1000 / i.women : 0;
  return {
    gdm,
    closedBefore,
    closedAfter,
    extraClosed,
    foundEarly,
    value,
    per1000: { extraClosed: extraClosed * scale, value: value * scale, foundEarly: foundEarly * scale },
  };
}
