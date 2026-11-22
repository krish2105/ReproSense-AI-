"use client";

import { useLocale, useTranslations } from "next-intl";
import { useId, useMemo, useState } from "react";
import { DEFAULTS, pilotValue, SOURCES, type PilotInputs } from "@/lib/pilot-roi";

const FIELDS: { key: keyof PilotInputs; step: number; min: number; max?: number; unit: "count" | "pct" | "aed" }[] = [
  { key: "women", step: 50, min: 0, unit: "count" },
  { key: "gdmPct", step: 0.1, min: 0, max: 100, unit: "pct" },
  { key: "beforePct", step: 0.1, min: 0, max: 100, unit: "pct" },
  { key: "afterPct", step: 1, min: 0, max: 100, unit: "pct" },
  { key: "abnormalPct", step: 0.1, min: 0, max: 100, unit: "pct" },
  { key: "missedCostAed", step: 50, min: 0, unit: "aed" },
];

/**
 * Pilot value for a clinic or an insurer (build week Y3), from the admin ROI calculator's idea: every input visible and
 * editable, every default either cited or marked "assumption", and the result shown as arithmetic, never as an outcome.
 */
export function PilotValue() {
  const t = useTranslations("pilot");
  const locale = useLocale() === "ar" ? "ar-AE-u-nu-latn" : "en-GB";
  const id = useId();
  const [raw, setRaw] = useState<Record<keyof PilotInputs, string>>(
    () => Object.fromEntries(Object.entries(DEFAULTS).map(([k, d]) => [k, String(d.value)])) as Record<keyof PilotInputs, string>,
  );
  const inputs = useMemo(
    () => Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, v.trim() === "" ? 0 : Number(v)])) as unknown as PilotInputs,
    [raw],
  );
  const r = pilotValue(inputs);
  const n0 = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const n1 = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });

  return (
    <div className="pilot" style={{ display: "grid", gap: 16, alignItems: "start", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))" }}>
      <section className="panel" aria-labelledby={`${id}-in`} style={{ display: "flex", flexDirection: "column", gap: 12, padding: 20 }}>
        <h2 id={`${id}-in`} style={{ fontSize: 18 }}>
          {t("inputsTitle")}
        </h2>
        {FIELDS.map(({ key, step, min, max, unit }) => {
          const d = DEFAULTS[key];
          const hint = `${id}-${key}-hint`;
          return (
            <div className="field" key={key}>
              <label htmlFor={`${id}-${key}`}>{t(`inputs.${key}`)}</label>
              <input
                id={`${id}-${key}`}
                className="num"
                type="number"
                inputMode="decimal"
                dir="ltr"
                min={min}
                max={max}
                step={step}
                value={raw[key]}
                aria-describedby={hint}
                onChange={(e) => setRaw((x) => ({ ...x, [key]: e.target.value }))}
              />
              <p id={hint} className="xs faint" style={{ margin: "4px 0 0" }}>
                {t(`units.${unit}`)} ·{" "}
                {d.ref ? (
                  <>
                    {t(`basis.${d.basis}`)}:{" "}
                    <a href={SOURCES[d.ref].url} {...(SOURCES[d.ref].url.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})} lang="en" dir="ltr">
                      {SOURCES[d.ref].title}
                    </a>
                  </>
                ) : (
                  t("basis.assumption")
                )}
              </p>
            </div>
          );
        })}
      </section>

      <section className="panel" aria-labelledby={`${id}-out`} style={{ display: "flex", flexDirection: "column", gap: 10, padding: 20 }}>
        <h2 id={`${id}-out`} style={{ fontSize: 18 }}>
          {t("resultTitle")}
        </h2>
        <dl aria-live="polite" style={{ display: "grid", gap: 10, margin: 0 }} data-testid="pilot-result">
          <Fig label={t("out.gdm")} value={n0.format(r.gdm)} />
          <Fig label={t("out.closedBefore")} value={n0.format(r.closedBefore)} />
          <Fig label={t("out.closedAfter")} value={n0.format(r.closedAfter)} />
          <Fig label={t("out.extraClosed")} value={n0.format(r.extraClosed)} strong testid="extra-closed" />
          <Fig label={t("out.foundEarly")} value={n0.format(r.foundEarly)} strong testid="found-early" />
          <Fig label={t("out.value")} value={t("aed", { n: n0.format(r.value) })} />
        </dl>
        <p className="s" style={{ margin: 0 }} data-testid="per-1000">
          {t("per1000", { closed: n1.format(r.per1000.extraClosed), found: n0.format(r.per1000.foundEarly), value: n0.format(r.per1000.value) })}
        </p>
        <p className="xs faint" style={{ margin: 0 }}>
          {t("assumptions")}
        </p>
      </section>
    </div>
  );
}

function Fig({ label, value, strong, testid }: { label: string; value: string; strong?: boolean; testid?: string }) {
  return (
    <div className="kv" style={{ alignItems: "baseline", borderTop: "1px solid var(--line)", paddingTop: 8 }}>
      <dt className="s">{label}</dt>
      <dd className={strong ? "s" : "s dim"} style={{ margin: 0, fontWeight: strong ? 700 : 500, whiteSpace: "nowrap" }} dir="ltr" data-testid={testid}>
        {value}
      </dd>
    </div>
  );
}
