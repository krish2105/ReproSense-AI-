import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Crumbs } from "@/components/chrome/Crumbs";
import { PatientList } from "@/components/clinic/PatientList";
import { RecordDetail } from "@/components/clinic/RecordDetail";
import { EmptyState } from "@/components/ui/States";
import { isLocale } from "@/i18n/config";
import { ApiError } from "@/lib/api/errors";
import { apiServer } from "@/lib/api/server";
import type { ClinicPatientsResponse, ClinicRecord } from "@/lib/api/types";
import { displayName } from "@/lib/format";

// Her display name in the tab title ("Noura A. · Clinician"), from the consented list the page loads anyway
// (identical fetches in one render are deduplicated). A record without consent keeps the plain title.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const t = await getTranslations("clinic");
  const { id } = await params;
  const { patients } = await apiServer<ClinicPatientsResponse>("/clinic/patients").catch(() => ({ patients: [] as ClinicPatientsResponse["patients"] }));
  const alias = patients.find((p) => p.id === id)?.alias;
  return { title: alias ? `${displayName(alias)} · ${t("metaTitle")}` : t("metaTitle") };
}

// One consented record (HANDOFF §5 /clinic/patients/[id]). No consent → the API answers 404 and we say why.
export default async function PatientRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const raw = await getLocale();
  const locale = isLocale(raw) ? raw : "en";
  const t = await getTranslations("clinic");
  const list = apiServer<ClinicPatientsResponse>("/clinic/patients");
  let record: ClinicRecord | null = null;
  try {
    record = await apiServer<ClinicRecord>(`/clinic/patients/${encodeURIComponent(id)}`);
  } catch (e) {
    if (!(e instanceof ApiError && e.status === 404)) throw e;
  }
  const { patients } = await list;
  return (
    <>
      <Crumbs items={[{ href: "/clinic", label: t("back") }, { label: displayName(patients.find((p) => p.id === id)?.alias ?? id) }]} />
      <div className="clinic">
        <div className="panel plist clinic-side">
          <PatientList patients={patients} selected={id} />
        </div>
        {record ? (
          <RecordDetail r={record} locale={locale} />
        ) : (
          <div className="detail panel" style={{ background: "var(--sheet)" }}>
            <h1 className="sr-only">{displayName(id)}</h1>
            <EmptyState title={t("noShareTitle")} body={t("noShareBody")} headingLevel={2} />
          </div>
        )}
      </div>
    </>
  );
}
