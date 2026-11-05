"use client";

import { useLocale, useTranslations } from "next-intl";
import { useId, useState } from "react";

/** Clinician-time estimate from assumptions the viewer sets (nothing here is measured; the API says so). */
export function RoiCalculator({ reports, assumptions }: { reports: number; assumptions: string }) {
  const t = useTranslations("admin");
  const locale = useLocale() === "ar" ? "ar-AE-u-nu-latn" : "en-GB";
  const id = useId();
  const [minutes, setMinutes] = useState(5);
  const [cost, setCost] = useState("");
  const hours = Math.round((reports * minutes) / 60);
  const aed = cost.trim() && Number(cost) > 0 ? Math.round(hours * Number(cost)) : null;
  const nf = new Intl.NumberFormat(locale);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="field">
        <label htmlFor={`${id}-m`}>{t("roiMinutes", { m: minutes })}</label>
        <input id={`${id}-m`} type="range" min={0} max={15} step={1} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} />
      </div>
      <div className="field">
        <label htmlFor={`${id}-c`}>{t("roiCost")}</label>
        <input id={`${id}-c`} className="num" type="number" inputMode="numeric" min={0} value={cost} onChange={(e) => setCost(e.target.value)} />
      </div>
      <p className="s" aria-live="polite">
        {t("roiResult", { reports: nf.format(reports), m: minutes, hours: nf.format(hours) })}
        {aed !== null && <> {t("roiValue", { aed: nf.format(aed) })}</>}
      </p>
      <p className="xs faint" lang="en" dir="auto">
        {assumptions}
      </p>
    </div>
  );
}
