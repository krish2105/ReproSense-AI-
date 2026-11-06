// Copied from apps/web/src/lib/format.ts by apps/mobile/scripts/sync-shared.mjs. Edit the web file, then run npm run sync.
import type { Locale } from "../i18n/locale";

// Western digits in Arabic too (clinical-copy-guard: numbers stay in Western digits unless the team decides otherwise).
const intlLocale = (locale: Locale) => (locale === "ar" ? "ar-AE-u-nu-latn" : "en-GB");

/** "YYYY-MM-DD" → a Date at noon UTC, so no timezone can shift it to the previous or next day. */
export function parseIsoDate(iso: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) throw new Error(`Not an ISO date: ${iso}`);
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12));
}

/** "22 Nov" */
export function formatDayMonth(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { day: "numeric", month: "short", timeZone: "UTC" }).format(parseIsoDate(iso));
}

/** "22 Nov 2026" */
export function formatDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
    parseIsoDate(iso),
  );
}

export function formatNumber(n: number, locale: Locale, maximumFractionDigits = 1): string {
  return new Intl.NumberFormat(intlLocale(locale), { maximumFractionDigits }).format(n);
}

/** "Noura A. (fictional)" → "Noura A." */
export function displayName(alias: string): string {
  return alias.replace(/\s*\(fictional\)\s*$/i, "").trim();
}

/** "Noura A. (fictional)" → "Noura" */
export function firstName(alias: string): string {
  return displayName(alias).split(/\s+/)[0] ?? alias;
}

/** "Abu Dhabi City" → "abu_dhabi_city" (message key under regions.*). */
export function regionKey(region: string): string {
  return region.toLowerCase().replace(/[^a-z]+/g, "_").replace(/^_|_$/g, "");
}

/** Wraps an interpolated value (a name, an API string) in Unicode isolates so its direction can't disturb the
 *  surrounding sentence, e.g. "Noura A." inside an Arabic sentence. Use <bdi> in JSX when the value stands alone. */
export function isolate(value: string | number): string {
  return `\u2068${value}\u2069`;
}
