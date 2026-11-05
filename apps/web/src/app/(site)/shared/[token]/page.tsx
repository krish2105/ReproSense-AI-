import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { ReportDoc } from "@/components/report/ReportDoc";
import { ErrorState } from "@/components/ui/States";
import { isLocale } from "@/i18n/config";
import { ApiError } from "@/lib/api/errors";
import { apiServer } from "@/lib/api/server";
import type { SharedView } from "@/lib/api/types";
import { formatDate } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("shared");
  return { title: t("metaTitle"), robots: { index: false, follow: false }, referrer: "no-referrer" };
}

// A clinician opens the link she shared (no login). 404 = unknown or revoked, 410 = expired (HANDOFF §5).
export default async function SharedPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const raw = await getLocale();
  const locale = isLocale(raw) ? raw : "en";
  const t = await getTranslations("shared");
  let view: SharedView | null = null;
  let status = 0;
  try {
    view = await apiServer<SharedView>(`/shared/${encodeURIComponent(token)}`);
  } catch (e) {
    status = e instanceof ApiError ? e.status : 500;
  }
  if (!view) {
    const expired = status === 410;
    return (
      <div style={{ maxWidth: 640, marginInline: "auto" }}>
        <ErrorState headingLevel={1} title={expired ? t("expiredTitle") : t("invalidTitle")} body={expired ? t("expiredBody") : t("invalidBody")} />
      </div>
    );
  }
  return (
    <div style={{ maxWidth: 720, marginInline: "auto", display: "flex", flexDirection: "column", gap: 14 }}>
      <h1 className="page-title">{t("title")}</h1>
      <p className="page-intro">{t("intro")}</p>
      <p className="s">{t("expires", { date: formatDate(view.expires_at.slice(0, 10), locale) })}</p>
      <ReportDoc p={view.payload} locale={locale} />
      <a className="btn btn-a btn-sm" style={{ alignSelf: "flex-start" }} href={`/api/v1/shared/${encodeURIComponent(token)}.pdf`} download="reprosense-shared-report.pdf">
        {t("download")}
      </a>
    </div>
  );
}
