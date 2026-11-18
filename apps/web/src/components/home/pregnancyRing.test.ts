import { describe, expect, it } from "vitest";
import { AFTER_WEEKS, pregnancyRing, PREGNANCY_WEEKS } from "./pregnancyRing";

const link = (id: string) => ({ source_id: id, title: id, url: `https://example.org/${id}` });
const step = (id: string, from: string, to: string, status: "done" | "due" | "upcoming" | "not_recorded") => ({
  id,
  from,
  to,
  status,
  done_on: null,
  recordable: true,
  sources: ["doh_postnatal_standard_2025"],
  source_links: [link("doh_postnatal_standard_2025")],
});

describe("pregnancyRing (A7): 40 weeks of pregnancy and the 12 after", () => {
  it("has one segment per week, pregnancy then after the birth", () => {
    expect(PREGNANCY_WEEKS + AFTER_WEEKS).toBe(52);
    const r = pregnancyRing({ mode: "pregnancy", week: 24, of: 40, trimester: 2, windows: [], estimate: false }, null);
    expect(r.segments.map((s) => s.kind).filter((k) => k === "t1")).toHaveLength(13);
    expect(r.segments.map((s) => s.kind).filter((k) => k === "t2")).toHaveLength(14);
    expect(r.segments.map((s) => s.kind).filter((k) => k === "t3")).toHaveLength(13);
    expect(r.segments.map((s) => s.kind).filter((k) => k === "after")).toHaveLength(12);
  });

  it("Hessa, week 24: now sits at week 24, the glucose window 24–28 cites ADA and NICE NG3", () => {
    const r = pregnancyRing({ mode: "pregnancy", week: 24, of: 40, trimester: 2, windows: [{ label: "Glucose test window", from: 24, to: 28 }], estimate: false }, null);
    expect(r.now).toBe(24);
    expect(r.milestones).toEqual([
      { key: "glucose_screen", from: 24, to: 28, status: null, sources: [expect.objectContaining({ id: "ada_standards_pregnancy" }), expect.objectContaining({ id: "nice_ng3" })] },
    ]);
  });

  it("Fatima, 9 weeks after birth: now is ring week 49 and her postnatal steps sit after week 40 with their status", () => {
    const r = pregnancyRing(
      { mode: "after_birth", week: 9, of: 12, windows: [{ label: "Glucose test window", from: 4, to: 12 }], estimate: false },
      {
        birth_date: "2026-09-20",
        steps: [step("visit_2w", "2026-09-29", "2026-10-06", "not_recorded"), step("glucose_test", "2026-10-18", "2026-12-13", "due")],
      },
    );
    expect(r.now).toBe(49);
    expect(r.milestones.map((m) => [m.key, m.from, m.to, m.status])).toEqual([
      ["visit_2w", 42, 43, "not_recorded"], // days 9–16 after the birth → weeks 2–3 → ring 42–43
      ["glucose_test", 44, 52, "due"], // weeks 4–12
    ]);
    expect(r.milestones[0]!.sources[0]).toEqual({ id: "doh_postnatal_standard_2025", title: "doh_postnatal_standard_2025", url: "https://example.org/doh_postnatal_standard_2025" });
  });

  it("keeps now on the ring past either end", () => {
    expect(pregnancyRing({ mode: "pregnancy", week: 42, of: 40, trimester: 3, windows: [], estimate: false }, null).now).toBe(40);
    expect(pregnancyRing({ mode: "after_birth", week: 15, of: 12, windows: [], estimate: false }, null).now).toBe(52);
  });
});
