import { describe, expect, it } from "vitest";
import { addDays, addMonths, clampDay, daysBetween, formatFull, formatPicked, inRange, isIsoDate, monthGrid, monthTitle, weekdayNames } from "./dates";

describe("calendar maths (docs/31 §C)", () => {
  it("checks real dates only", () => {
    expect(isIsoDate("2026-11-10")).toBe(true);
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("2026-11-1")).toBe(false);
    expect(isIsoDate("10/11/yyyy")).toBe(false); // the half-typed value the old date box allowed
    expect(isIsoDate(undefined)).toBe(false);
  });

  it("moves by days across months and years", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2027-01-01", -1)).toBe("2026-12-31");
    expect(daysBetween("2026-11-10", "2026-11-22")).toBe(12);
    expect(daysBetween("2026-11-22", "2026-11-10")).toBe(-12);
  });

  it("moves by months and clamps to the month's last day", () => {
    expect(addMonths("2027-01-31", 1)).toBe("2027-02-28");
    expect(addMonths("2028-01-31", 1)).toBe("2028-02-29");
    expect(addMonths("2026-11-10", -1)).toBe("2026-10-10");
    expect(addMonths("2026-01-15", -1)).toBe("2025-12-15");
  });

  it("keeps a pick inside min and max", () => {
    expect(clampDay("2026-12-01", "2026-07-25", "2026-11-22")).toBe("2026-11-22");
    expect(clampDay("2026-01-01", "2026-07-25", "2026-11-22")).toBe("2026-07-25");
    expect(inRange("2026-11-23", undefined, "2026-11-22")).toBe(false);
    expect(inRange("2026-11-22", undefined, "2026-11-22")).toBe(true);
  });

  it("lays out a month Monday first", () => {
    const nov = monthGrid("2026-11-22"); // 1 Nov 2026 is a Sunday
    expect(nov[0]).toEqual([null, null, null, null, null, null, "2026-11-01"]);
    expect(nov.flat().filter(Boolean)).toHaveLength(30);
    expect(nov.every((w) => w.length === 7)).toBe(true);
    const feb = monthGrid("2027-02-10"); // 1 Feb 2027 is a Monday
    expect(feb[0]![0]).toBe("2027-02-01");
  });

  it("names days and months in English and Arabic with Western digits", () => {
    expect(weekdayNames("en")[0]).toBe("Mon");
    expect(weekdayNames("en", "long")[6]).toBe("Sunday");
    expect(monthTitle("2026-11-22", "en")).toBe("November 2026");
    expect(formatPicked("2026-11-10", "en")).toBe("Tue 10 Nov");
    expect(formatFull("2026-11-10", "en")).toBe("Tuesday, 10 November 2026");
    expect(monthTitle("2026-11-22", "ar")).toMatch(/2026/);
    expect(formatPicked("2026-11-10", "ar")).toMatch(/10/);
    expect(weekdayNames("ar", "narrow").every((n) => n.length <= 2)).toBe(true);
  });
});

describe("weekdayIndex", () => {
  it("counts from Monday", async () => {
    const { weekdayIndex } = await import("./dates");
    expect(weekdayIndex("2026-11-16")).toBe(0);
    expect(weekdayIndex("2026-11-22")).toBe(6);
  });
});
