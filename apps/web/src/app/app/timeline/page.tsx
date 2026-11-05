import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { BarsChart, CycleLengthChart, YearDots } from "@/components/charts/AnalyticsCharts";
import { Box } from "@/components/ui/Box";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { isLocale } from "@/i18n/config";
import { apiServer } from "@/lib/api/server";
import type { AnalyticsResponse, TimelineResponse } from "@/lib/api/types";
import { formatDayMonth, formatNumber } from "@/lib/format";
import { requireRole } from "@/lib/session";
import { slug } from "@/lib/vocab";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("analytics");
  return { title: t("metaTitle") };
}

const RANGES = [3, 6, 12] as const;

// Analytics (HANDOFF §5 /app/timeline; mockup tChart, lineChart, barChart, yearChart). Every number comes from the API.
export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ months?: string }> }) {
  await requireRole("patient");
  const raw = await getLocale();
  const locale = isLocale(raw) ? raw : "en";
  const t = await getTranslations();
  const q = Number((await searchParams).months);
  const months = (RANGES as readonly number[]).includes(q) ? (q as 3 | 6 | 12) : 6;
  const [a, tl] = await Promise.all([
    apiServer<AnalyticsResponse>("/analytics", { query: { months } }),
    apiServer<TimelineResponse>("/timeline", { query: { months } }),
  ]);
  const done = a.cycles.filter((c) => c.length !== null).map((c) => c.length as number);
  const summary = done.length
    ? t("analytics.summary", {
        count: done.length,
        months,
        avg: formatNumber(done.reduce((s, x) => s + x, 0) / done.length, locale),
        min: Math.min(...done),
        max: Math.max(...done),
      })
    : t("analytics.summaryNone", { months });
  const cp = a.change_point;
  const cpDate = cp ? a.cycles[cp.index]?.start : undefined;
  const topMax = Math.max(1, ...a.top_symptoms.map(([, n]) => n));
  const pbacMax = Math.max(120, Math.ceil(Math.max(0, ...a.cycles.map((c) => c.pbac)) / 40) * 40);

  return (
    <div className="app-col">
      <h1 style={{ fontSize: 22, textAlign: "center" }}>{t("analytics.title")}</h1>
      <nav className="pills" aria-label={t("analytics.rangeLabel")}>
        {RANGES.map((m) => (
          <Link key={m} href={`/app/timeline?months=${m}`} aria-current={m === months ? "page" : undefined}>
            {t("analytics.months", { n: m })}
          </Link>
        ))}
      </nav>
      <p className="s" style={{ textAlign: "center" }}>
        {summary}
      </p>

      {done.length === 0 ? (
        <Box>
          <EmptyState
            title={t("analytics.emptyTitle")}
            body={t("analytics.emptyBody")}
            action={
              <ButtonLink href="/app/log" variant="outline" size="sm">
                {t("analytics.emptyAction")}
              </ButtonLink>
            }
          />
        </Box>
      ) : (
        <CycleLengthChart cycles={a.cycles} locale={locale} />
      )}

      {cp && cpDate && (
        <Box>
          <p className="label">{t("analytics.changeTitle")}</p>
          <p className="s" style={{ marginTop: 4 }}>
            {t("analytics.changeBody", { before: formatNumber(cp.before, locale, 0), after: formatNumber(cp.after, locale, 0), date: formatDayMonth(cpDate, locale) })}
          </p>
        </Box>
      )}

      {a.cycles.length > 0 && (
        <>
          <BarsChart
            id="pain"
            title={t("analytics.painTitle")}
            caption={t("analytics.painCaption")}
            summary={t("analytics.severe", { n: a.cycles.filter((c) => c.max_pain >= 7).length })}
            bars={a.cycles.map((c) => ({ start: c.start, value: c.max_pain, label: t("analytics.painBar", { date: formatDayMonth(c.start, locale), pain: c.max_pain }) }))}
            max={10}
            threshold={{ value: 7, label: "7" }}
            locale={locale}
          />
          <BarsChart
            id="pbac"
            title={t("analytics.pbacTitle")}
            caption={t("analytics.pbacCaption")}
            summary={t("analytics.heavy", { n: a.cycles.filter((c) => c.pbac >= 100).length })}
            bars={a.cycles.map((c) => ({ start: c.start, value: c.pbac, label: t("analytics.pbacBar", { date: formatDayMonth(c.start, locale), pbac: c.pbac }) }))}
            max={pbacMax}
            threshold={{ value: 100, label: t("analytics.pbacThreshold") }}
            locale={locale}
          />
          <details className="box">
            <summary>{t("analytics.showTable")}</summary>
            <div className="tbl">
              <table>
                <thead>
                  <tr>
                    <th scope="col">{t("analytics.colStart")}</th>
                    <th scope="col">{t("analytics.colLength")}</th>
                    <th scope="col">{t("analytics.colBleed")}</th>
                    <th scope="col">{t("analytics.colPain")}</th>
                    <th scope="col">{t("analytics.colPbac")}</th>
                    <th scope="col">{t("analytics.colSymptoms")}</th>
                  </tr>
                </thead>
                <tbody>
                  {a.cycles.map((c) => (
                    <tr key={c.start}>
                      <td>{formatDayMonth(c.start, locale)}</td>
                      <td className="mono">{c.length ?? t("analytics.running")}</td>
                      <td className="mono">{c.bleed}</td>
                      <td className="mono">{c.max_pain}</td>
                      <td className={c.pbac >= 100 ? "mono hi" : "mono"}>{c.pbac}</td>
                      <td className="mono">{c.symptom_days}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}

      {a.top_symptoms.length > 0 && (
        <section className="box" aria-labelledby="sym-title">
          <h2 id="sym-title" style={{ fontSize: 17 }}>
            {t("analytics.symptomsTitle")}
          </h2>
          <ul style={{ listStyle: "none", padding: 0, margin: "10px 0 0", display: "flex", flexDirection: "column", gap: 8 }}>
            {a.top_symptoms.map(([name, n]) => (
              <li key={name} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: "4px 10px", alignItems: "center" }}>
                <span className="s">{t.has(`symptoms.${slug(name)}`) ? t(`symptoms.${slug(name)}`) : name}</span>
                <span className="xs dim">{t("analytics.symptomDays", { count: n })}</span>
                <span className="bar" style={{ gridColumn: "1 / -1" }} aria-hidden="true">
                  <i style={{ width: `${(n / topMax) * 100}%`, background: "var(--ph-l)" }} />
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <YearDots timeline={tl} months={months} locale={locale} />
    </div>
  );
}
