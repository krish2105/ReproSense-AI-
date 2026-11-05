import { describe, expect, it } from "vitest";
import { displayName, firstName, formatDate, formatDayMonth, formatNumber, isolate, parseIsoDate, regionKey } from "./format";

describe("format", () => {
  it("parses ISO dates without a timezone shift", () => {
    const d = parseIsoDate("2026-11-22");
    expect(d.getUTCFullYear()).toBe(2026);
    expect(d.getUTCMonth()).toBe(10);
    expect(d.getUTCDate()).toBe(22);
  });
  it("formats dates in English and Arabic with Western digits", () => {
    expect(formatDayMonth("2026-11-22", "en")).toBe("22 Nov");
    expect(formatDate("2026-11-22", "en")).toBe("22 Nov 2026");
    const ar = formatDate("2026-11-22", "ar");
    expect(ar).toMatch(/22/);
    expect(ar).toMatch(/2026/);
    expect(ar).not.toMatch(/[٠-٩]/); // no Arabic-Indic digits
    expect(formatNumber(1200, "ar")).not.toMatch(/[٠-٩]/);
  });
  it("names", () => {
    expect(displayName("Noura A. (fictional)")).toBe("Noura A.");
    expect(firstName("Noura A. (fictional)")).toBe("Noura");
    expect(regionKey("Abu Dhabi City")).toBe("abu_dhabi_city");
    expect(regionKey("Al Ain")).toBe("al_ain");
    expect(isolate("Noura A.")).toBe("\u2068Noura A.\u2069");
  });
});
