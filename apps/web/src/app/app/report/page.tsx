import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { BriefSection } from "@/components/brief/BriefSection";
import { PrepareReport, ReportActions } from "@/components/report/ReportActions";
import { ReportDoc } from "@/components/report/ReportDoc";
import { Box } from "@/components/ui/Box";
import { EmptyState } from "@/components/ui/States";
import { isLocale } from "@/i18n/config";
import { apiServer } from "@/lib/api/server";
import type { PrevisitBrief, ReportRow, ShareRow } from "@/lib/api/types";
import { formatDate } from "@/lib/format";
import { requireRole } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("report");
  return { title: t("metaTitle") };
}

// Doctor report (HANDOFF §5 /app/report; mockup tReport, visitDialog): the pre-visit brief (K3), preview, PDF,
// consented share, visit mode. The brief comes first, so she sees what changed before she shares.
export default async function ReportPage() {
  await requireRole("patient");
  const raw = await getLocale();
  const locale = isLocale(raw) ? raw : "en";
  const t = await getTranslations("report");
  const [report, shares, brief] = await Promise.all([
    apiServer<ReportRow | null>("/reports/latest"),
    apiServer<ShareRow[]>("/shares"),
    apiServer<PrevisitBrief>("/brief", { query: { lang: locale } }),
  ]);
  const now = Date.now(); // expiry is compared with the real clock (share links expire in real time)
  const forThis = report ? shares.filter((s) => s.report_id === report.id || !s.revoked_at) : shares;

  return (
    <div className="app-col report-page">
      <div className="report-head">
        <h1>{t("title")}</h1>
        <p className="s dim">{t("intro")}</p>
      </div>
      {report ? (
        // Phones and tablets: one column in reading order. From 1024px the actions and sharing sit in a sticky column
        // beside the brief and the preview, so the PDF and share buttons stay in reach while she reads.
        <div className="report-layout">
          <div className="report-main">
            <BriefSection brief={brief} locale={locale} audience="patient" />
            <div className="kv report-meta">
              <span className="xs faint">{t("generated", { date: formatDate(report.payload.generated, locale) })}</span>
              <PrepareReport label={t("update")} />
            </div>
            <ReportDoc p={report.payload} locale={locale} />
          </div>
          <div className="report-side">
            <ReportActions report={report} shares={forThis} now={now} />
          </div>
        </div>
      ) : (
        // No report yet (a new record): the brief and the prepare step sit side by side on wide screens.
        <div className="report-layout is-empty">
          <div className="report-main">
            <BriefSection brief={brief} locale={locale} audience="patient" />
          </div>
          <div className="report-side">
            <Box>
              <EmptyState title={t("noneTitle")} body={t("noneBody")} headingLevel={2} action={<PrepareReport label={t("prepare")} />} />
            </Box>
          </div>
        </div>
      )}
    </div>
  );
}
