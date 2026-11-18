import { describe, expect, it } from "vitest";
import ar from "../../../messages/ar.json" with { type: "json" };
import en from "../../../messages/en.json" with { type: "json" };
import { move, onStepPage, TOUR_STEPS } from "./steps";

describe("judge tour steps", () => {
  it("walks the demo path in order: people, her app, after the birth, clinician, network", () => {
    expect(TOUR_STEPS.map((s) => s.path)).toEqual([
      "/demo",
      "/app",
      "/app/log",
      "/app/insights",
      "/app/assistant",
      "/app/report",
      "/app",
      "/clinic",
      "/clinic/patients/fatima",
      "/admin",
    ]);
  });

  it("signs in as the right person for each area (patient, clinician and admin views stay separate)", () => {
    for (const s of TOUR_STEPS) {
      if (s.path.startsWith("/app")) expect(s.as).toEqual({ persona: s.key === "afterBirth" ? "fatima" : "noura" });
      if (s.path.startsWith("/clinic")) expect(s.as).toEqual({ role: "clinician" });
      if (s.path.startsWith("/admin")) expect(s.as).toEqual({ role: "admin" });
    }
  });

  it("has a title and body for every step in English and Arabic", () => {
    for (const m of [en, ar] as const) {
      const steps = m.tour.steps as Record<string, { title: string; body: string }>;
      for (const s of TOUR_STEPS) {
        expect(steps[s.key]?.title, s.key).toBeTruthy();
        expect(steps[s.key]?.body, s.key).toBeTruthy();
      }
    }
  });

  it("ends past either end", () => {
    expect(move(0, -1)).toBeNull();
    expect(move(0, 1)).toBe(1);
    expect(move(TOUR_STEPS.length - 1, 1)).toBeNull();
  });

  it("matches the page with or without a trailing slash", () => {
    expect(onStepPage("/app/", TOUR_STEPS[1]!)).toBe(true);
    expect(onStepPage("/app/insights", TOUR_STEPS[1]!)).toBe(false);
  });
});
