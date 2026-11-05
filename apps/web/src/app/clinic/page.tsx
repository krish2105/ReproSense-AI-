import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { PatientList } from "@/components/clinic/PatientList";
import { EmptyState } from "@/components/ui/States";
import { Tag } from "@/components/ui/Tag";
import { isLocale } from "@/i18n/config";
import { apiServer } from "@/lib/api/server";
import type { ClinicGapRow, ClinicPatientsResponse } from "@/lib/api/types";
import { displayName, formatDayMonth } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("clinic");
  return { title: t("metaTitle") };
}

// Clinician home (HANDOFF §5 /clinic; mockup renderClinic): consented patients, most urgent first,
// and the follow-ups due across the clinic.
export default async function ClinicPage() {
  const raw = await getLocale();
  const locale = isLocale(raw) ? raw : "en";
  const t = await getTranslations("clinic");
  const [{ patients }, gaps] = await Promise.all([apiServer<ClinicPatientsResponse>("/clinic/patients"), apiServer<ClinicGapRow[]>("/clinic/care-gaps")]);
  const open = gaps.filter((g) => g.status !== "closed");
  return (
    <>
      <h1 className="page-title">{t("title")}</h1>
      <p className="page-intro">{t("intro")}</p>
      <div className="clinic" style={{ marginTop: 22 }}>
        <div className="panel plist">
          <PatientList patients={patients} />
        </div>
        <div className="detail panel" style={{ background: "var(--sheet)" }}>
          <EmptyState title={t("detailEmptyTitle")} body={t("detailEmpty")} headingLevel={2} />
          <section aria-labelledby="clinic-gaps">
            <p className="label" id="clinic-gaps" style={{ marginBottom: 8 }}>
              {t("careGapsTitle")}
            </p>
            {open.length === 0 ? (
              <p className="s dim">{t("careGapsNone")}</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {open.map((g) => (
                  <li key={g.id} className="kv" style={{ flexWrap: "wrap" }}>
                    <Link href={`/clinic/patients/${g.profile_id}`}>
                      <bdi>{displayName(g.alias)}</bdi>: {t.has(`gapType.${g.type}`) ? t(`gapType.${g.type}`) : t("gapType.other")}
                    </Link>
                    <span className="xs dim">
                      <Tag tone={g.status === "in_progress" ? "info" : "soon"}>{t(`gapStatus.${g.status}`)}</Tag>{" "}
                      {g.due_date ? t("gapDue", { date: formatDayMonth(g.due_date, locale) }) : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
