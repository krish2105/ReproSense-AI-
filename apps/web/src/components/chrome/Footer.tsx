import { useTranslations } from "next-intl";

/** The disclosure line on every screen: not a diagnosis, 998, fictional data, AI use (CLAUDE.md rules 1, 4, 5, 10). */
export function Footer() {
  const t = useTranslations("chrome");
  return (
    <footer className="wrap">
      <p>{t("footer")}</p>
    </footer>
  );
}
