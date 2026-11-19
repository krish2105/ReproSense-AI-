import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PilotValue } from "@/components/pilot/PilotValue";
import { ButtonLink } from "@/components/ui/Button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pilot");
  return { title: t("metaTitle"), description: t("intro") };
}

// Pilot value for a clinic or an insurer (build week Y3). Public, like /pricing: a buyer sets the inputs and sees the
// arithmetic. No measured outcome and no clinical claim; the defaults cite Abu Dhabi evidence or say "assumption".
export default async function PilotPage() {
  const t = await getTranslations("pilot");
  return (
    <>
      <h1 className="page-title">{t("title")}</h1>
      <p className="page-intro">{t("intro")}</p>
      <PilotValue />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
        <ButtonLink href="/pricing" variant="outline" size="sm">
          {t("toPricing")}
        </ButtonLink>
        <ButtonLink href="/demo" variant="outline" size="sm">
          {t("toDemo")}
        </ButtonLink>
      </div>
    </>
  );
}
