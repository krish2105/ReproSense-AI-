import type { Locale } from "@/i18n/config";

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

// The eight fictional personas' first names in Arabic script (AR-REVIEW). API aliases are Latin.
const AR_NAMES: Readonly<Record<string, string>> = {
  Amina: "أمينة",
  Fatima: "فاطمة",
  Hessa: "حصة",
  Layla: "ليلى",
  Mariam: "مريم",
  Noura: "نورة",
  Priya: "بريا",
  Sara: "سارة",
};

/** "Noura A. (fictional)" → "Noura"; on Arabic screens a persona's name is written in Arabic ("نورة"). */
export function firstName(alias: string, locale?: string): string {
  const name = displayName(alias).split(/\s+/)[0] ?? alias;
  return locale === "ar" ? (AR_NAMES[name] ?? name) : name;
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
