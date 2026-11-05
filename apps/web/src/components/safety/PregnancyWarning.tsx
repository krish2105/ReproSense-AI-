import { useTranslations } from "next-intl";
import { SOURCES } from "@/lib/sources";
import { SourceLinks } from "./SourceLinks";

/** The pregnancy warning signs from red-flag rule RF5, always visible on the pregnancy home (never behind a tap). */
export function PregnancyWarning() {
  const t = useTranslations("safety");
  return (
    <section className="box" style={{ background: "var(--urgent-soft)", borderColor: "var(--urgent)" }} aria-labelledby="preg-warn">
      <h2 id="preg-warn" style={{ color: "var(--urgent)", fontSize: 14 }}>
        {t("pregTitle")}
      </h2>
      <p className="s" style={{ marginTop: 4 }}>
        {t("pregSigns")}
      </p>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 8 }}>
        <a className="btn btn-a btn-sm" href="tel:998">
          {t("call")}
        </a>
        <span className="xs faint">{t("pregRule")}</span>
      </div>
      <SourceLinks sources={[SOURCES.nhs_pregnancy_urgent, SOURCES.nice_ng201]} className="xs faint mt-1.5" />
    </section>
  );
}
