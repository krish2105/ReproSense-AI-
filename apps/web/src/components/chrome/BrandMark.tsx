import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

/** Logo mark (A2) + wordmark. In discreet mode the wordmark reads "My notes" (CSS: :root[data-discreet]). */
export function BrandMark() {
  const t = useTranslations("chrome");
  return (
    <Link className="brand" href="/demo" aria-label={t("brandHome")}>
      <Image src="/images/brand/logo-mark.png" alt="" width={28} height={28} priority />
      <span className="bn">{t("brand")}</span>
      <span className="bd">{t("brandDiscreet")}</span>
    </Link>
  );
}
