import { useTranslations } from "next-intl";

/** "Demo data — fictional", visible at every width on every screen (CLAUDE.md rule 4). */
export function DemoBadge() {
  const t = useTranslations("chrome");
  return <span className="fict fict-pill">{t("badge")}</span>;
}
