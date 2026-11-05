import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/ui/States";
import { Tag } from "@/components/ui/Tag";
import type { ClinicPatientRow } from "@/lib/api/types";
import { displayName } from "@/lib/format";
import { tonesOf } from "@/lib/rules";

/** Consented patients, most urgent first (the API sorts: red flags, open patterns, newest report). */
export async function PatientList({ patients, selected }: { patients: ClinicPatientRow[]; selected?: string }) {
  const t = await getTranslations();
  if (!patients.length) return <EmptyState title={t("clinic.emptyTitle")} body={t("clinic.emptyBody")} />;
  return (
    <nav aria-label={t("clinic.listLabel")}>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {patients.map((p) => {
          const tone = tonesOf(p.rules)[0];
          return (
            <li key={p.id}>
              <Link className="prow" href={`/clinic/patients/${p.id}`} aria-current={p.id === selected ? "page" : undefined}>
                <span className="ini" aria-hidden="true" style={{ width: 34, height: 34, fontSize: 14 }}>
                  {displayName(p.alias)[0]}
                </span>
                <span>
                  <b className="s">
                    <bdi>{displayName(p.alias)}</bdi>
                  </b>
                  <br />
                  <span className="xs faint">{t("clinic.rowMeta", { age: p.age, open: p.open_obs + p.open_gaps, reviewed: p.reviewed_at ? "yes" : "no" })}</span>
                </span>
                {tone && <Tag tone={tone}>{t(`tags.${tone}`)}</Tag>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
