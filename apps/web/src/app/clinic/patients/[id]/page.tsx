import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { PatientList } from "@/components/clinic/PatientList";
import { RecordDetail } from "@/components/clinic/RecordDetail";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/States";
import { isLocale } from "@/i18n/config";
import { ApiError } from "@/lib/api/errors";
import { apiServer } from "@/lib/api/server";
import type { ClinicPatientsResponse, ClinicRecord } from "@/lib/api/types";
import { displayName } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const t = await getTranslations("clinic");
  const { id } = await params;
  return { title: `${t("metaTitle")} · ${id}` };
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
      <Link href="/clinic" className="link s clinic-back">
        <Icon name="chevron" size={16} className="-scale-x-100 rtl:scale-x-100" />
        {t("back")}
      </Link>
      <div className="clinic" style={{ marginTop: 12 }}>
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
