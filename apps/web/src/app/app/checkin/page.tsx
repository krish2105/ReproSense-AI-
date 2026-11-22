import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CheckinForm } from "@/components/checkin/CheckinForm";
import { requireRole } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("checkin");
  return { title: t("metaTitle") };
}

// EPDS check-in (HANDOFF §5 "EPDS check-in"): POST /v1/questionnaires/epds; crisis → support only, no score.
export default async function CheckinPage() {
  await requireRole("patient");
  const t = await getTranslations("checkin");
  return (
    <div className="app-col">
      <h1 style={{ fontSize: 22, textAlign: "center" }}>{t("title")}</h1>
      <p className="s dim" style={{ textAlign: "center" }}>
        {t("intro")}
      </p>
      <CheckinForm />
    </div>
  );
}
