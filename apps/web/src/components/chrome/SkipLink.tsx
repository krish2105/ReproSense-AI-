import { useTranslations } from "next-intl";

export function SkipLink() {
  const t = useTranslations("chrome");
  return (
    <a className="skip" href="#main">
      {t("skip")}
    </a>
  );
}
