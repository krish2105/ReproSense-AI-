import type { Locale } from "@/i18n/config";
import { formatDate } from "./format";

/** "19 Nov 2026 · 13:12" in Gulf time. Session times are formatted on the server and passed to client components as
 *  text, so a different time-zone or ICU build in the browser cannot cause a hydration mismatch (React #418). */
export function clockTime(iso: string, locale: Locale): string {
  const time = new Intl.DateTimeFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dubai" });
  return time.format(new Date(iso));
}

export function dateAndTime(iso: string, locale: Locale): string {
  return `${formatDate(iso.slice(0, 10), locale)} · ${clockTime(iso, locale)}`;
}

/** Each session's "last active" text, by session id. */
export function lastActive(sessions: { id: number; last_seen_at: string }[], locale: Locale): Record<number, string> {
  return Object.fromEntries(sessions.map((s) => [s.id, dateAndTime(s.last_seen_at, locale)]));
}
