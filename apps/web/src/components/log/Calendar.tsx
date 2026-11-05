import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/ui/Icon";
import type { TimelineDay } from "@/lib/api/types";
import type { Locale } from "@/i18n/config";
import { formatDate } from "@/lib/format";

const pad = (n: number) => String(n).padStart(2, "0");
const isoOf = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

/** Month grid (mockup calBox): bleeding days filled magenta, logged days dotted, today ringed; every past day links to its entry. */
export async function Calendar({
  month, // "YYYY-MM"
  today,
  first, // earliest month with data, "YYYY-MM"
  selected,
  byDate,
  locale,
}: {
  month: string;
  today: string;
  first: string;
  selected: string;
  byDate: Map<string, TimelineDay>;
  locale: Locale;
}) {
  const t = await getTranslations("log");
  const [y, m] = month.split("-").map(Number) as [number, number];
  const daysIn = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const offset = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7; // Monday first
  const prev = m === 1 ? `${y - 1}-12` : `${y}-${pad(m - 1)}`;
  const next = m === 12 ? `${y + 1}-01` : `${y}-${pad(m + 1)}`;
  const intl = locale === "ar" ? "ar-AE-u-nu-latn" : "en-GB";
  const title = new Intl.DateTimeFormat(intl, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 15)));
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(intl, { weekday: "narrow", timeZone: "UTC" }).format(new Date(Date.UTC(2026, 10, 16 + i, 12))),
  );

  return (
    <section className="box" aria-labelledby="cal-title">
      <div className="kv" style={{ alignItems: "center", marginBottom: 10 }}>
        {prev >= first ? (
          <Link className="icon-btn" href={`/app/log?month=${prev}`} aria-label={t("monthPrev")}>
            <Icon name="chevron" size={18} className="-scale-x-100 rtl:scale-x-100" />
          </Link>
        ) : (
          <span style={{ width: 36 }} />
        )}
        <h2 id="cal-title" style={{ fontSize: 17, textAlign: "center" }}>
          {title}
        </h2>
        {next <= today.slice(0, 7) ? (
          <Link className="icon-btn" href={`/app/log?month=${next}`} aria-label={t("monthNext")}>
            <Icon name="chevron" size={18} />
          </Link>
        ) : (
          <span style={{ width: 36 }} />
        )}
      </div>
      <div className="cal" role="grid" aria-labelledby="cal-title">
        <div role="row" style={{ display: "contents" }}>
          {weekdays.map((d, i) => (
            <span key={i} className="h" role="columnheader">
              {d}
            </span>
          ))}
        </div>
        <div role="row" style={{ display: "contents" }}>
          {Array.from({ length: offset }, (_, i) => (
            <span key={`b${i}`} role="gridcell" />
          ))}
          {Array.from({ length: daysIn }, (_, i) => {
            const day = i + 1;
            const iso = isoOf(y, m, day);
            if (iso > today)
              return (
                <span key={iso} className="o" role="gridcell">
                  {day}
                </span>
              );
            const entry = byDate.get(iso);
            const bleed = entry && entry.flow !== "none";
            const parts = [bleed ? t("cellPeriod") : null, entry ? t("cellLogged") : t("cellEmpty"), iso === today ? t("cellToday") : null].filter(Boolean);
            return (
              <span key={iso} role="gridcell" style={{ display: "contents" }}>
                <Link
                  href={`/app/log?date=${iso}&month=${month}`}
                  className={[bleed ? "bl" : "", entry ? "lg" : ""].join(" ").trim() || undefined}
                  aria-current={iso === today ? "date" : undefined}
                  data-selected={iso === selected ? "" : undefined}
                  aria-label={t("cellLabel", { date: formatDate(iso, locale), status: parts.join(", ") })}
                >
                  {day}
                </Link>
              </span>
            );
          })}
        </div>
      </div>
      <ul className="leg" style={{ listStyle: "none", padding: 0, margin: "10px 0 0", justifyContent: "center" }}>
        <li>
          <i style={{ background: "var(--ph-m)" }} aria-hidden="true" />
          {t("legendPeriod")}
        </li>
        <li>
          <i style={{ background: "var(--ink-2)", width: 5, height: 5 }} aria-hidden="true" />
          {t("legendLogged")}
        </li>
        <li>
          <i style={{ background: "transparent", boxShadow: "0 0 0 2px var(--plum) inset" }} aria-hidden="true" />
          {t("legendToday")}
        </li>
      </ul>
    </section>
  );
}
