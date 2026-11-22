"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LOCALE_COOKIE } from "@/i18n/config";

/**
 * Shows the other language in its own script ("عربي" / "English"), like the mockup. The cookie is written in the
 * browser and the route re-renders on the server, so a page opened before a redeploy can still switch language
 * (a server action id from the old build would no longer exist).
 */
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
      onClick={() => {
        document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
        start(() => router.refresh());
      }}
    >
      {t("toggle")}
    </button>
  );
}
