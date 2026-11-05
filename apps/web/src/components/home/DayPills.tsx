import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/ui/Icon";
import type { DayPill } from "@/lib/api/types";
import type { Locale } from "@/i18n/config";
import { formatDate, parseIsoDate } from "@/lib/format";

/** Day pills (docs/06): past days ticked when logged, today plum with a dashed ring, future faded. Past days open the calendar. */
export async function DayPills({ pills, locale }: { pills: DayPill[]; locale: Locale }) {
  const t = await getTranslations("home");
  const wd = new Intl.DateTimeFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-GB", { weekday: "short", timeZone: "UTC" });
  return (
    <nav aria-label={t("weekLabel")}>
      <ol className="days">
        {pills.map((p) => {
          const weekday = wd.format(parseIsoDate(p.date));
          // The name starts with what the pill shows ("Thu 19 Nov 2026, logged"), so voice control can say "Thu" (WCAG 2.5.3).
          const date = `${weekday} ${formatDate(p.date, locale)}`;
          const label = p.today ? t("pillToday", { date }) : p.past ? (p.logged ? t("pillLogged", { date }) : t("pillNotLogged", { date })) : t("pillFuture", { date });
          const inner = (
            <>
              <span aria-hidden="true">{weekday}</span>{" "}
              <i aria-hidden="true">{p.today ? null : p.logged ? <Icon name="check" size={14} /> : <span className="ltr" style={{ fontSize: 11 }}>{p.day}</span>}</i>
            </>
          );
          return (
            <li key={p.date} style={{ flex: "none" }}>
              {p.past || p.today ? (
                <Link href={`/app/log?date=${p.date}`} className={`dp${p.today ? " now" : ""}`} aria-label={label} aria-current={p.today ? "date" : undefined}>
                  {inner}
                </Link>
              ) : (
                <span className="dp fut" aria-label={label} role="img">
                  {inner}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
