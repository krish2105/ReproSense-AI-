import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { PrepareReport, ReportActions } from "@/components/report/ReportActions";
import { ReportDoc } from "@/components/report/ReportDoc";
import { Box } from "@/components/ui/Box";
import { EmptyState } from "@/components/ui/States";
import { isLocale } from "@/i18n/config";
import { apiServer } from "@/lib/api/server";
import type { ReportRow, ShareRow } from "@/lib/api/types";
import { formatDate } from "@/lib/format";
import { requireRole } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("report");
  return { title: t("metaTitle") };
}

// Doctor report (HANDOFF §5 /app/report; mockup tReport, visitDialog): preview, PDF, consented share, visit mode.
export default async function ReportPage() {
  await requireRole("patient");
  const raw = await getLocale();
  const locale = isLocale(raw) ? raw : "en";
  const t = await getTranslations("report");
  const [report, shares] = await Promise.all([apiServer<ReportRow | null>("/reports/latest"), apiServer<ShareRow[]>("/shares")]);
  const now = Date.now(); // expiry is compared with the real clock (share links expire in real time)
  const forThis = report ? shares.filter((s) => s.report_id === report.id || !s.revoked_at) : shares;

  return (
    <div className="app-col">
      <h1 style={{ fontSize: 22, textAlign: "center" }}>{t("title")}</h1>
      <p className="s dim" style={{ textAlign: "center" }}>
        {t("intro")}
      </p>
      {report ? (
        <>
          <div className="kv" style={{ alignItems: "center", flexWrap: "wrap" }}>
            <span className="xs faint">{t("generated", { date: formatDate(report.payload.generated, locale) })}</span>
            <PrepareReport label={t("update")} />
          </div>
          <ReportDoc p={report.payload} locale={locale} />
          <ReportActions report={report} shares={forThis} now={now} />
        </>
      ) : (
        <Box>
          <EmptyState title={t("noneTitle")} body={t("noneBody")} headingLevel={2} action={<PrepareReport label={t("prepare")} />} />
        </Box>
      )}
    </div>
  );
}
