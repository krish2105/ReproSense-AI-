import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/ui/States";
import { Tag } from "@/components/ui/Tag";
import { apiServer } from "@/lib/api/server";
import type { ClinicPatientsResponse } from "@/lib/api/types";
import { displayName, regionKey } from "@/lib/format";
import { tonesOf } from "@/lib/rules";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("clinic");
  return { title: t("metaTitle") };
}

// Phase 0 stand-in for the clinic list (consented patients only, red flags first). Phase 5 builds the full view.
export default async function ClinicPage() {
  const t = await getTranslations();
  const { patients } = await apiServer<ClinicPatientsResponse>("/clinic/patients");
  return (
    <>
      <h1 className="page-title">{t("clinic.title")}</h1>
      <p className="page-intro">{t("clinic.intro")}</p>
      <div className="panel plist" style={{ marginTop: 22, maxWidth: 640 }}>
        {patients.length === 0 ? (
          <EmptyState title={t("clinic.emptyTitle")} body={t("clinic.emptyBody")} />
        ) : (
          <ul aria-label={t("clinic.listLabel")} style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {patients.map((p) => {
              const tone = tonesOf(p.rules)[0];
              return (
                <li key={p.id} className="prow" style={{ cursor: "default" }}>
                  <span className="ini" aria-hidden="true" style={{ width: 36, height: 36, fontSize: 15 }}>
                    {displayName(p.alias)[0]}
                  </span>
                  <span>
                    <b>
                      <bdi>{displayName(p.alias)}</bdi>
                    </b>
                    <br />
                    <span className="xs dim">
                      {t("demo.ageRegion", { age: p.age, region: t.has(`regions.${regionKey(p.region)}`) ? t(`regions.${regionKey(p.region)}`) : p.region })}
                      {" · "}
                      {t("clinic.redFlags", { count: p.red_flags })}
                      {" · "}
                      {t("clinic.openGaps", { count: p.open_gaps })}
                    </span>
                  </span>
                  {tone ? <Tag tone={tone}>{t(`tags.${tone}`)}</Tag> : <Tag tone="ok">{t("tags.ok")}</Tag>}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
