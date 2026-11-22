import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

/** Logo mark (A2) + wordmark. The product name always reads ReproSense (22 Nov: no "My notes" swap anywhere). */
export function BrandMark() {
  const t = useTranslations("chrome");
  return (
    <Link className="brand" href="/" aria-label={t("brandHome")}>
      <Image src="/images/brand/logo-mark.png" alt="" width={28} height={28} priority />
      <span className="bn">{t("brand")}</span>
    </Link>
  );
}
