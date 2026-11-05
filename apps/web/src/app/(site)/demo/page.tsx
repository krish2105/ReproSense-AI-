import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/States";
import type { PersonasResponse } from "@/lib/api/types";
import { getPersonas } from "@/lib/session";
import { DemoRoster } from "./DemoRoster";
import { StaffActions } from "./StaffActions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("demo");
  return { title: t("metaTitle") };
}

const NEEDS = ["patient", "clinician", "admin"] as const;

export default async function DemoPage({ searchParams }: { searchParams: Promise<{ need?: string }> }) {
  const t = await getTranslations("demo");
  const ts = await getTranslations("states");
  const locale = await getLocale();
  const { need } = await searchParams;
  let data: PersonasResponse | null = null;
  try {
    data = await getPersonas();
  } catch {
    data = null; // API down: say what happened and how to fix it
  }
  const needKey = NEEDS.find((n) => n === need);

  return (
    <>
      <h1 className="page-title">{t("title")}</h1>
      <p className="page-intro">{t("intro")}</p>
      {needKey && (
        <p className="notice" role="status" style={{ marginTop: 18 }}>
          {t(`need.${needKey}`)}
        </p>
      )}
      {data ? (
        <DemoRoster personas={data.personas} storyLang={locale === "en" ? undefined : "en"} />
      ) : (
        <div style={{ marginTop: 24 }}>
          <ErrorState title={t("apiDownTitle")} body={t("apiDownBody")} action={<ButtonLink variant="outline" size="sm" href="/demo">{ts("retry")}</ButtonLink>} />
        </div>
      )}
      <section aria-labelledby="staff-title" style={{ marginTop: 36 }}>
        <h2 id="staff-title" style={{ fontSize: 22 }}>
          {t("staffTitle")}
        </h2>
        <p className="dim" style={{ marginTop: 6, maxWidth: "42em" }}>
          {t("staffIntro")}
        </p>
        <StaffActions disabled={!data} />
      </section>
    </>
  );
}
