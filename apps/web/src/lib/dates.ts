// Calendar maths for DateField (docs/31 §C). Plain "YYYY-MM-DD" strings in, strings out; every Date is built at noon
// UTC (as lib/format.ts does), so no timezone can move a day. "Today" always comes from the caller (the API's ref_date),
// never from the device clock (web-screen skill §2).
import type { Locale } from "@/i18n/config";

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;
const intlLocale = (locale: Locale) => (locale === "ar" ? "ar-AE-u-nu-latn" : "en-GB");

export function isIsoDate(s: string | null | undefined): s is string {
  const m = typeof s === "string" ? ISO.exec(s) : null;
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!, 12));
  return d.getUTCFullYear() === +m[1]! && d.getUTCMonth() === +m[2]! - 1 && d.getUTCDate() === +m[3]!;
}

function at(iso: string): Date {
  const m = ISO.exec(iso);
  if (!m) throw new Error(`Not an ISO date: ${iso}`);
  return new Date(Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!, 12));
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(day: string, n: number): string {
  const d = at(day);
  d.setUTCDate(d.getUTCDate() + n);
  return iso(d);
}

/** Same day of the month n months away, clamped to that month's last day (31 Jan + 1 month = 28 or 29 Feb). */
export function addMonths(day: string, n: number): string {
  const d = at(day);
  const want = d.getUTCDate();
  const first = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1, 12));
  const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0, 12)).getUTCDate();
  first.setUTCDate(Math.min(want, last));
  return iso(first);
}

/** Whole days from a to b (b later = positive). */
export function daysBetween(a: string, b: string): number {
  return Math.round((at(b).getTime() - at(a).getTime()) / 86_400_000);
}

export function clampDay(day: string, min?: string, max?: string): string {
  if (min && day < min) return min;
  if (max && day > max) return max;
  return day;
}

export function inRange(day: string, min?: string, max?: string): boolean {
  return (!min || day >= min) && (!max || day <= max);
}

export function monthStart(day: string): string {
  return `${day.slice(0, 7)}-01`;
}

/** The weeks of a month, Monday first (the UAE working week), as rows of 7 days; days of other months are null. */
export function monthGrid(day: string): (string | null)[][] {
  const first = at(monthStart(day));
  const lead = (first.getUTCDay() + 6) % 7; // Monday = 0
  const days = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0, 12)).getUTCDate();
  const cells: (string | null)[] = [...Array(lead).fill(null)];
  for (let i = 0; i < days; i++) cells.push(addDays(iso(first), i));
  while (cells.length % 7) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** Monday to Sunday ("Mon"; narrow Arabic "ن" fits a phone-width column), from a known week (16 Nov 2026 is a Monday). */
export function weekdayNames(locale: Locale, style: "narrow" | "short" | "long" = "short"): string[] {
  const f = new Intl.DateTimeFormat(intlLocale(locale), { weekday: style, timeZone: "UTC" });
  return Array.from({ length: 7 }, (_, i) => f.format(at(addDays("2026-11-16", i))));
}

/** "November 2026" / "نوفمبر 2026" */
export function monthTitle(day: string, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { month: "long", year: "numeric", timeZone: "UTC" }).format(at(day));
}

/** "Mon 10 Nov" on the field; "Monday 10 November 2026" for a screen reader. */
export function formatPicked(day: string, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(at(day));
}

export function formatFull(day: string, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    at(day),
  );
}

/** 0 for Monday … 6 for Sunday. */
export function weekdayIndex(day: string): number {
  return (at(day).getUTCDay() + 6) % 7;
}
