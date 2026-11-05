import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Box } from "@/components/ui/Box";
import { ButtonLink } from "@/components/ui/Button";
import { displayName, isolate, regionKey } from "@/lib/format";
import { getPersonas, requireRole } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("app");
  return { title: t("metaTitle") };
}

// Phase 0 stand-in: proves the session, the proxy and RLS end to end. Phase 2 replaces it with Home.
export default async function AppHome() {
  const me = await requireRole("patient");
  const t = await getTranslations();
  const { personas } = await getPersonas();
  const p = personas.find((x) => x.id === me.user_id);
  const name = isolate(p ? displayName(p.alias) : me.user_id);
  const region = p ? (t.has(`regions.${regionKey(p.region)}`) ? t(`regions.${regionKey(p.region)}`) : p.region) : "";
  return (
    <Box className="hello" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <h1 style={{ fontSize: 22 }}>{t("app.signedIn", { name })}</h1>
      {p && (
        <>
          <p className="s">{t("app.stage", { stage: t(`stages.${p.life_stage}`) })}</p>
          <p className="s dim">{t("app.ageRegion", { age: p.age, region })}</p>
        </>
      )}
      <ButtonLink variant="outline" size="sm" href="/demo" className="self-start">
        {t("chrome.switchPerson")}
      </ButtonLink>
    </Box>
  );
}
