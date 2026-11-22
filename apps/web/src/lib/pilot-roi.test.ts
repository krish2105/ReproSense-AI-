import { describe, expect, it } from "vitest";
import { DEFAULTS, pilotScenario, REFERENCE, sanitise, type PilotInputs } from "./pilot-roi";

const defaults = Object.fromEntries(Object.entries(DEFAULTS).map(([k, v]) => [k, v.value])) as unknown as PilotInputs;

describe("pilot scenario arithmetic", () => {
  it("works the example through by hand: 100 eligible women, 25% to 50%, 25 more completed follow-ups", () => {
    const r = pilotScenario(defaults);
    expect(r.completedBefore).toBe(25);
    expect(r.completedAfter).toBe(50);
    expect(r.extraCompleted).toBe(25);
  });

  it("returns completed follow-ups only: no cases found, no money, no per-1,000 projection", () => {
    // The old calculator chained a prevalence, a historical attendance rate and an abnormal-result rate from
    // different populations and time windows (docs/CLAIMS_REGISTER.md). None of those may come back.
    expect(Object.keys(pilotScenario(defaults)).sort()).toEqual(["completedAfter", "completedBefore", "extraCompleted"]);
    expect(Object.keys(DEFAULTS).sort()).toEqual(["afterPct", "beforePct", "eligible"]);
  });

  it("never claims negative follow-ups when the target is below today's rate", () => {
    expect(pilotScenario({ ...defaults, afterPct: 10 }).extraCompleted).toBe(0);
  });

  it("holds out-of-range inputs at the edge and survives empty fields", () => {
    expect(sanitise({ eligible: Number.NaN, beforePct: -5, afterPct: 140 })).toEqual({ eligible: 0, beforePct: 0, afterPct: 100 });
    expect(sanitise({ ...defaults, eligible: 19.6 }).eligible).toBe(20); // whole women
    expect(pilotScenario({ ...defaults, eligible: 0 })).toEqual({ completedBefore: 0, completedAfter: 0, extraCompleted: 0 });
  });

  it("no default is presented as a sourced fact, and the Al Ain figure is a reference with its limits", () => {
    for (const [key, d] of Object.entries(DEFAULTS)) expect(["example", "assumption"], key).toContain(d.basis);
    expect(DEFAULTS.afterPct.basis).toBe("assumption");
    expect(REFERENCE.url.startsWith("https://doi.org/")).toBe(true);
    expect(REFERENCE.title).toMatch(/one Al Ain hospital/);
    expect(REFERENCE.title).toMatch(/2013 to 2014/);
    expect(REFERENCE.title).toMatch(/4 to 6 weeks/);
  });
});
