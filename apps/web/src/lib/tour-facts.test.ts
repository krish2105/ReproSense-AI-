import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import ar from "../../messages/ar.json";
import en from "../../messages/en.json";

// The judge tour names Noura's age; it must match her synthetic record (the demo shows "24 · Al Ain").
const noura = JSON.parse(
  readFileSync(resolve(__dirname, "../../../../data/synthetic/output/personas/noura.json"), "utf8"),
) as { profile?: { age: number }; age?: number };
const age = noura.profile?.age ?? noura.age;

describe("judge tour facts", () => {
  it("gives Noura's real age in English and Arabic", () => {
    expect(en.tour.steps.people.body).toContain(`Noura (${age})`);
    expect(ar.tour.steps.people.body).toContain(`نورة (${age} عامًا)`);
  });
});
