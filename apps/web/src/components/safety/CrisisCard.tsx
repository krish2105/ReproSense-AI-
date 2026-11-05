import { useTranslations } from "next-intl";
import { SOURCES } from "@/lib/sources";
import { SourceLinks } from "./SourceLinks";

/**
 * RF4 crisis path (EPDS item 10 > 0): support and a one-tap call, never a score or a pattern card.
 * Calm by design: no alarm bell image (QUESTIONS #32). Wording mirrors rules/clinical_rules.yaml RF4.
 */
export function CrisisCard() {
  const t = useTranslations("safety");
  return (
    <section className="obs urgent" aria-labelledby="crisis-title">
      <h2 id="crisis-title" style={{ fontSize: 18 }}>
        {t("crisisTitle")}
      </h2>
      <p className="s">{t("crisisBody")}</p>
      <a className="btn btn-a btn-sm" href="tel:998" style={{ alignSelf: "flex-start" }}>
        {t("call")}
      </a>
      <p className="xs faint">{t("crisisNote")}</p>
      <SourceLinks sources={[SOURCES.nice_cg192]} />
    </section>
  );
}
