import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { BP_RAISED, BP_RANGE, BP_SEVERE, bpLevel, bpProblem, bpText } from "./bp";

const root = (p: string) => fileURLToPath(new URL(`../../../../${p}`, import.meta.url));

describe("blood-pressure marks", () => {
  it("match the thresholds in rules/clinical_rules.yaml (NICE NG133)", () => {
    const rules = readFileSync(root("rules/clinical_rules.yaml"), "utf8");
    expect(rules).toContain(`bp_systolic_today >= ${BP_SEVERE.systolic} or bp_diastolic_today >= ${BP_SEVERE.diastolic}`);
    expect(rules).toContain(`bp_systolic_today >= ${BP_RAISED.systolic} or bp_diastolic_today >= ${BP_RAISED.diastolic}`);
    expect(rules).toContain(`bp_latest_systolic >= ${BP_RAISED.systolic} or bp_latest_diastolic >= ${BP_RAISED.diastolic}`);
  });
  it("match the plausible range the API accepts", () => {
    const api = readFileSync(root("backend/app/services/blood_pressure.py"), "utf8");
    expect(api).toContain(`SYSTOLIC = (${BP_RANGE.systolic[0]}, ${BP_RANGE.systolic[1]})`);
    expect(api).toContain(`DIASTOLIC = (${BP_RANGE.diastolic[0]}, ${BP_RANGE.diastolic[1]})`);
  });
  it("marks readings at the boundaries", () => {
    expect(bpLevel({ systolic: 139, diastolic: 89 })).toBeNull();
    expect(bpLevel({ systolic: 140, diastolic: 70 })).toBe("raised");
    expect(bpLevel({ systolic: 120, diastolic: 90 })).toBe("raised");
    expect(bpLevel({ systolic: 159, diastolic: 109 })).toBe("raised");
    expect(bpLevel({ systolic: 160, diastolic: 80 })).toBe("severe");
    expect(bpLevel({ systolic: 130, diastolic: 110 })).toBe("severe");
    expect(bpText({ systolic: 165, diastolic: 100 })).toBe("165/100");
  });
  it("refuses typing slips before the API does", () => {
    expect(bpProblem(120, 80)).toBeNull();
    expect(bpProblem(69, 50)).toBe("range");
    expect(bpProblem(251, 90)).toBe("range");
    expect(bpProblem(120, 151)).toBe("range");
    expect(bpProblem(120.5, 80)).toBe("range");
    expect(bpProblem(90, 90)).toBe("order");
  });
});
