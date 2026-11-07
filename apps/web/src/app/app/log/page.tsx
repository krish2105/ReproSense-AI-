import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Calendar } from "@/components/log/Calendar";
import { DayDetail } from "@/components/log/DayDetail";
import { LogForm } from "@/components/log/LogForm";
import { isLocale } from "@/i18n/config";
import { apiServer } from "@/lib/api/server";
import type { TimelineDay, TimelineResponse } from "@/lib/api/types";
import { formatDate } from "@/lib/format";
import { requireRole } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("log");
  return { title: t("metaTitle") };
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const MONTH = /^\d{4}-\d{2}$/;

// Calendar + log (HANDOFF §5 /app/log; mockup calBox, bodyMap, tLog). ?date= opens a day (Patterns' evidence chips link here).
export default async function LogPage({ searchParams }: { searchParams: Promise<{ date?: string; month?: string }> }) {
  await requireRole("patient");
  const raw = await getLocale();
  const locale = isLocale(raw) ? raw : "en";
  const t = await getTranslations("log");
  const { date: qDate, month: qMonth } = await searchParams;
  const tl = await apiServer<TimelineResponse>("/timeline", { query: { months: 12 } });
  const today = tl.to;
  const byDate = new Map<string, TimelineDay>();
  for (const d of tl.days) byDate.set(d.date, d); // later rows (her own app entries) win over seeded ones

  const inRange = (s: string | undefined): s is string => !!s && ISO.test(s) && s >= tl.from && s <= today;
  const formDate = inRange(qDate) ? qDate : today;
  // Her own saved entry for that day reopens in the form: a second save replaces the row, so a blank form lost data.
  const saved = tl.days.find((d) => d.date === formDate && d.source === "app");
  const lastLogged = tl.days.length ? tl.days[tl.days.length - 1]!.date : undefined;
  const selected = inRange(qDate) ? qDate : byDate.has(today) ? today : (lastLogged ?? today);
  const first = tl.from.slice(0, 7);
  const month = qMonth && MONTH.test(qMonth) && qMonth >= first && qMonth <= today.slice(0, 7) ? qMonth : selected.slice(0, 7);

  const yearCounts: Record<string, number> = {};
  for (const d of tl.days) for (const s of d.sites) yearCounts[s] = (yearCounts[s] ?? 0) + 1;

  return (
    <div className="app-col">
      <h1 style={{ fontSize: 22, textAlign: "center" }}>{t("title")}</h1>
      <Calendar month={month} today={today} first={first} selected={selected} byDate={byDate} locale={locale} />
      <DayDetail entry={byDate.get(selected)} dateLabel={formatDate(selected, locale)} />
      <LogForm key={formDate} date={formDate} saved={saved} isToday={formDate === today} dateLabel={formatDate(formDate, locale)} yearCounts={yearCounts} locale={locale} />
    </div>
  );
}
