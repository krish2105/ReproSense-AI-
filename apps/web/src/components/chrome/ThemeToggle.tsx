"use client";

import { useTranslations } from "next-intl";

const COOKIE = "rs_theme";

function currentTheme(): "light" | "dark" {
  const set = document.documentElement.dataset.theme;
  if (set === "light" || set === "dark") return set;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Light/dark switch. Both labels are rendered and CSS shows the right one (.th-to-*), so the server HTML never
 * guesses the system theme and nothing flashes. The choice is kept in a cookie the root layout reads.
 */
export function ThemeToggle() {
  const t = useTranslations("chrome.theme");
  return (
    <button
      type="button"
      className="tb"
      onClick={() => {
        const next = currentTheme() === "dark" ? "light" : "dark";
        document.documentElement.dataset.theme = next;
        document.cookie = `${COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      }}
    >
      <span className="th-to-dark">
        <span aria-hidden="true">{t("toDark")}</span>
        <span className="sr-only">{t("labelToDark")}</span>
      </span>
      <span className="th-to-light">
        <span aria-hidden="true">{t("toLight")}</span>
        <span className="sr-only">{t("labelToLight")}</span>
      </span>
    </button>
  );
}
