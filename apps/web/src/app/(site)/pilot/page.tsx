import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PilotProposal } from "@/components/pilot/PilotProposal";
import { PilotValue } from "@/components/pilot/PilotValue";
import { ButtonLink } from "@/components/ui/Button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pilot");
  return { title: t("metaTitle"), description: t("intro") };
}

// Pilot value for a clinic or an insurer (build week Y3). Public, like /pricing: a buyer sets the inputs and sees the
// arithmetic. No measured outcome and no clinical claim; the defaults cite Abu Dhabi evidence or say "assumption".
// Below it, the pilot proposal (#proposal, docs/29): scope, KPIs, data protection, the 90 days, and its one-page PDF.
export default async function PilotPage() {
  const t = await getTranslations("pilot");
  const p = await getTranslations("pilotProposal");
  return (
    <>
      <h1 className="page-title">{t("title")}</h1>
      <p className="page-intro">{t("intro")}</p>
      <p style={{ marginTop: 14 }}>
        <a className="btn btn-o btn-sm" href="#proposal">
          {p("jump")}
        </a>
      </p>
      <div style={{ marginTop: 18 }}>
        <PilotValue />
      </div>
      <PilotProposal />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 28 }}>
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
