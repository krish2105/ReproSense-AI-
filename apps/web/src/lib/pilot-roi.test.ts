import { describe, expect, it } from "vitest";
import { DEFAULTS, pilotValue, sanitise, SOURCES, type PilotInputs } from "./pilot-roi";

const defaults = Object.fromEntries(Object.entries(DEFAULTS).map(([k, v]) => [k, v.value])) as unknown as PilotInputs;

describe("pilot value arithmetic", () => {
  it("works the default case through by hand", () => {
    const r = pilotValue(defaults);
    // 1,000 women × 21.3% = 213 with gestational diabetes
    expect(r.gdm).toBeCloseTo(213, 6);
    // today 25.4% of 213 = 54.1; target 50% = 106.5; 52.4 more follow-ups closed
    expect(r.closedBefore).toBeCloseTo(54.102, 3);
    expect(r.closedAfter).toBeCloseTo(106.5, 6);
    expect(r.extraClosed).toBeCloseTo(52.398, 3);
    // 34.5% of those 52.4 extra tests show raised sugar: about 18 mothers found within the follow-up window
    expect(r.foundEarly).toBeCloseTo(18.077, 3);
    // × AED 500 = AED 26,199; subscription 1,990 × 12 = AED 23,880; net AED 2,319
    expect(r.value).toBeCloseTo(26199, 0);
    expect(r.subscription).toBe(23880);
    expect(r.net).toBeCloseTo(2319, 0);
  });

  it("scales to 1,000 women whatever the pilot size", () => {
    const small = pilotValue({ ...defaults, women: 250 });
    const big = pilotValue({ ...defaults, women: 4000 });
    expect(small.per1000.extraClosed).toBeCloseTo(big.per1000.extraClosed, 6);
    expect(small.per1000.value).toBeCloseTo(pilotValue(defaults).value, 6);
  });

  it("never claims negative follow-ups closed when the target is below today's rate", () => {
    const r = pilotValue({ ...defaults, afterPct: 10 });
    expect(r.extraClosed).toBe(0);
    expect(r.value).toBe(0);
    expect(r.foundEarly).toBe(0);
    expect(r.net).toBe(-r.subscription);
  });

  it("holds out-of-range inputs at the edge and survives empty fields", () => {
    const s = sanitise({ ...defaults, gdmPct: 140, beforePct: -5, women: Number.NaN, months: 0, missedCostAed: -1 });
    expect(s).toMatchObject({ gdmPct: 100, beforePct: 0, women: 0, months: 1, missedCostAed: 0 });
    const r = pilotValue({ ...defaults, women: 0 });
    expect(r.per1000).toEqual({ extraClosed: 0, value: 0, foundEarly: 0 }); // no division by zero
  });

  it("every default says what it rests on, and sourced ones link to the source", () => {
    for (const [key, d] of Object.entries(DEFAULTS)) {
      expect(["source", "assumption", "price"], key).toContain(d.basis);
      if (d.basis === "source") expect(d.ref && SOURCES[d.ref].url.startsWith("https://doi.org/"), key).toBeTruthy();
      if (d.basis === "assumption") expect(d.ref, key).toBeNull();
    }
  });
});
