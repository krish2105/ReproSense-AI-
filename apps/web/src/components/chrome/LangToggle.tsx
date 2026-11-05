"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocale } from "@/i18n/actions";

/** Shows the other language in its own script ("عربي" / "English"), like the mockup. */
export function LangToggle() {
  const locale = useLocale();
  const t = useTranslations("chrome.lang");
  const router = useRouter();
  const [pending, start] = useTransition();
  const next = locale === "ar" ? "en" : "ar";
  return (
    <button
      type="button"
      className="tb"
      lang={next}
      title={t("label")}
      aria-busy={pending || undefined}
      disabled={pending}
      onClick={() =>
        start(async () => {
          await setLocale(next);
          router.refresh();
        })
      }
    >
      {t("toggle")}
    </button>
  );
}
