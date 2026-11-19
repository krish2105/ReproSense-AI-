import type { FollowUpStep } from "@/lib/api/types";

/** A timestamp's calendar day in Abu Dhabi ("2026-11-21T22:30:00Z" → "2026-11-22"), for formatDayMonth/formatDate. */
export function dubaiDay(iso: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dubai", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** The message key for one line of a follow-up's story (both voices use the same keys under their own namespace). */
export function stepKey(s: FollowUpStep): string {
  if (s.step === "done" && s.evidence.reason === "rule_resolved") return "doneByRule";
  if (s.step === "shared" && s.evidence.before_opened) return "sharedBefore";
  return s.step;
}

/** Tag tone for a step: done and a result back are "ok", reminders and reopening are information, the rest neutral. */
export function stepTone(s: FollowUpStep): "ok" | "info" | "soon" {
  if (s.step === "done" || s.step === "result") return "ok";
  if (s.step === "booked") return "soon";
  return "info";
}
