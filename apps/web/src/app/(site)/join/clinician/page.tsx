import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ClinicianJoin } from "@/components/join/ClinicianJoin";
import { ButtonLink } from "@/components/ui/Button";
import { apiServer } from "@/lib/api/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("joinClinician");
  return { title: t("metaTitle") };
}

// A clinician invite from the network admin (SaaS scorecard: clinic onboarding). The signed link names one clinic.
export default async function JoinClinicianPage({ searchParams }: { searchParams: Promise<{ invite?: string }> }) {
  const t = await getTranslations("joinClinician");
  const { invite } = await searchParams;
  let clinic: { id: string; name: string } | null = null;
  if (invite && invite.length >= 20 && invite.length <= 2000) {
    try {
      clinic = (await apiServer<{ clinic: { id: string; name: string } }>("/demo/invite", { query: { invite } })).clinic;
    } catch {
      clinic = null;
    }
  }
  if (!invite || !clinic) {
    return (
      <section className="panel" aria-labelledby="inv-bad" style={{ padding: 24, maxWidth: 560, margin: "28px auto 0" }}>
        <h1 id="inv-bad" className="page-title" style={{ fontSize: 26 }}>
          {t("invalidTitle")}
        </h1>
        <p className="dim" style={{ marginTop: 8 }}>
          {t("invalidBody")}
        </p>
        <div style={{ marginTop: 14 }}>
          <ButtonLink href="/demo" size="sm">
            {t("invalidAction")}
          </ButtonLink>
        </div>
      </section>
    );
  }
  const tc = await getTranslations("clinics");
  const name = tc.has(clinic.id) ? tc(clinic.id) : clinic.name;
  return <ClinicianJoin invite={invite} clinicName={name} />;
}
