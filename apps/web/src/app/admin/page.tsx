import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { apiServer } from "@/lib/api/server";
import type { AdminMetrics } from "@/lib/api/types";
import { formatNumber } from "@/lib/format";
import { isLocale } from "@/i18n/config";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin");
  return { title: t("metaTitle") };
}

// Phase 0 stand-in: four real network figures from /v1/admin/metrics. Phase 5 builds the full dashboard.
export default async function AdminPage() {
  const t = await getTranslations("admin");
  const raw = await getLocale();
  const locale = isLocale(raw) ? raw : "en";
  const m = await apiServer<AdminMetrics>("/admin/metrics");
  const figs = [
    { label: t("cohort"), value: formatNumber(m.cohort.n, locale) },
    { label: t("shared"), value: formatNumber(m.kpis.reports_shared, locale) },
    { label: t("open"), value: formatNumber(m.kpis.care_gaps_open, locale) },
    { label: t("closeRate"), value: t("closeRateValue", { pct: formatNumber(m.kpis.close_rate_pct, locale) }) },
  ];
  return (
    <>
      <h1 className="page-title">{t("title")}</h1>
      <p className="page-intro">{t("intro")}</p>
      <dl className="figs" aria-label={t("kpiLabel")} style={{ marginTop: 22, marginBottom: 0 }}>
        {figs.map((f) => (
          <div key={f.label}>
            <dt className="label">{f.label}</dt>
            <dd className="big mono" style={{ margin: "6px 0 0" }}>
              <span className="ltr">{f.value}</span>
            </dd>
          </div>
        ))}
      </dl>
      <p className="s dim" style={{ marginTop: 14 }}>
        {t("liveGaps")}: <b className="mono">{formatNumber(m.live_demo_gaps.open, locale)}</b>
      </p>
    </>
  );
}
