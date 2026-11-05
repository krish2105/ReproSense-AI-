import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import ar from "../../messages/ar.json";
import en from "../../messages/en.json";
import { SOURCES } from "./sources";
import { ALL_SYMPTOMS, FLOWS, IMPACTS, MOODS, pbacScore, SITE_POINTS, slug } from "./vocab";

const root = (p: string) => fileURLToPath(new URL(`../../../../${p}`, import.meta.url));

describe("vocabulary matches the API", () => {
  const api = readFileSync(root("backend/app/api/patient.py"), "utf8");
  it("every symptom the form offers is accepted by the API", () => {
    const block = api.slice(api.indexOf("SYMPTOMS = {"), api.indexOf("}", api.indexOf("SYMPTOMS = {")));
    for (const s of ALL_SYMPTOMS) expect(block, s).toContain(`"${s}"`);
  });
  it("flows, impacts and sites match", () => {
    for (const f of FLOWS) expect(api).toContain(`"${f}"`);
    for (const i of IMPACTS) expect(api).toContain(`"${i}"`);
    for (const p of [...SITE_POINTS.front, ...SITE_POINTS.back]) expect(api).toContain(`"${p.site}"`);
    for (const m of MOODS) expect(api).toContain(`"${m.value}"`);
  });
  it("every value has an English and Arabic label", () => {
    for (const s of ALL_SYMPTOMS) {
      expect((en.symptoms as Record<string, string>)[slug(s)], s).toBeTruthy();
      expect((ar.symptoms as Record<string, string>)[slug(s)], s).toBeTruthy();
    }
    for (const f of FLOWS) expect((en.flows as Record<string, string>)[f]).toBeTruthy();
    for (const i of IMPACTS) expect((en.impacts as Record<string, string>)[slug(i)]).toBeTruthy();
    for (const m of MOODS) expect((ar.moods as Record<string, string>)[slug(m.value)]).toBeTruthy();
  });
});

describe("PBAC", () => {
  it("matches backend pbac_score weights", () => {
    expect(pbacScore({ pads: { light: 2, moderate: 1, soaked: 1 }, tampons: { soaked: 1 }, clots: { small: 3, large: 1 } })).toBe(2 + 5 + 20 + 10 + 3 + 5);
    expect(pbacScore(null)).toBe(0);
    expect(pbacScore({ pads: { soaked: -2 } })).toBe(0);
  });
});

describe("sources cited by the UI match knowledge_base/sources.yaml", () => {
  const yaml = readFileSync(root("knowledge_base/sources.yaml"), "utf8");
  for (const s of Object.values(SOURCES)) {
    it(s.id, () => {
      const at = yaml.indexOf(`- id: ${s.id}`);
      expect(at, `${s.id} missing`).toBeGreaterThanOrEqual(0);
      const block = yaml.slice(at, yaml.indexOf("\n- id:", at + 5) === -1 ? undefined : yaml.indexOf("\n- id:", at + 5));
      expect(block).toContain(`title: "${s.title}"`);
      expect(block).toContain(`url: "${s.url}"`);
    });
  }
});
