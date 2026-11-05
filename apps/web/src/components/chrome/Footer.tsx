import Link from "next/link";
import { useTranslations } from "next-intl";

/** The disclosure line on every screen: not a diagnosis, 998, fictional data, AI use (CLAUDE.md rules 1, 4, 5, 10),
 * plus the public pages a buyer or judge looks for (trust centre, pricing). */
export function Footer() {
  const t = useTranslations("chrome");
  return (
    <footer className="wrap">
      <p>{t("footer")}</p>
      <nav aria-label={t("footerLinks")} className="foot-links">
        <Link href="/trust">{t("footerTrust")}</Link>
        <Link href="/pricing">{t("footerPricing")}</Link>
      </nav>
    </footer>
  );
}
