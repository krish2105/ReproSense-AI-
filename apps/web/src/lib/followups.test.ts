import { describe, expect, it } from "vitest";
import type { FollowUpStep } from "@/lib/api/types";
import { dubaiDay, stepKey, stepTone } from "./followups";

const step = (over: Partial<FollowUpStep>): FollowUpStep => ({
  step: "booked",
  at: "2026-11-21T08:00:00+00:00",
  actor_role: "clinician",
  actor_id: "clin-01",
  days: 3,
  evidence: {},
  ...over,
});

describe("follow-up story helpers", () => {
  it("reads a timestamp as an Abu Dhabi day", () => {
    expect(dubaiDay("2026-11-21T21:30:00+00:00")).toBe("2026-11-22"); // 01:30 the next morning in Abu Dhabi
    expect(dubaiDay("2026-11-21T08:00:00+04:00")).toBe("2026-11-21");
    expect(dubaiDay("2026-11-21")).toBe("2026-11-21");
  });
  it("names the variant lines", () => {
    expect(stepKey(step({ step: "done", actor_role: "system", evidence: { reason: "rule_resolved" } }))).toBe("doneByRule");
    expect(stepKey(step({ step: "done" }))).toBe("done");
    expect(stepKey(step({ step: "shared", actor_role: "patient", evidence: { before_opened: true } }))).toBe("sharedBefore");
    expect(stepKey(step({ step: "shared", evidence: { before_opened: false } }))).toBe("shared");
    expect(stepKey(step({ step: "reminder_approved" }))).toBe("reminder_approved");
  });
  it("gives every step a tone that travels with words", () => {
    expect(stepTone(step({ step: "result" }))).toBe("ok");
    expect(stepTone(step({ step: "booked" }))).toBe("soon");
    expect(stepTone(step({ step: "reminder" }))).toBe("info");
  });
});
