"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

/** Shows a CSS variable's value in the CURRENT theme (re-reads when the theme attribute changes). */
export function TokenValue({ name }: { name: string }) {
  const t = useTranslations("tokens");
  const [value, setValue] = useState("");
  useEffect(() => {
    const read = () => setValue(getComputedStyle(document.documentElement).getPropertyValue(name).trim());
    read();
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", read);
    return () => {
      obs.disconnect();
      mq.removeEventListener("change", read);
    };
  }, [name]);
  return <span className="faint ltr">{value ? t("liveValue", { value }) : " "}</span>;
}
