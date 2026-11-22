"use client";

import { useLocale, useTranslations } from "next-intl";
import { useId, useMemo, useState } from "react";
import { DEFAULTS, pilotScenario, REFERENCE, type PilotInputs } from "@/lib/pilot-roi";

const FIELDS: { key: keyof PilotInputs; step: number; min: number; max?: number; unit: "count" | "pct" }[] = [
  { key: "eligible", step: 10, min: 0, unit: "count" },
  { key: "beforePct", step: 1, min: 0, max: 100, unit: "pct" },
  { key: "afterPct", step: 1, min: 0, max: 100, unit: "pct" },
];

/**
 * A pilot scenario for a clinic (rewritten 22 Nov 2026): the women eligible for the after-birth glucose follow-up, the
 * share completed today and a target the clinic sets give the additional completed follow-ups. One subtraction on the
 * clinic's own numbers. It shows no cases found, no diagnoses and no money: those would chain rates from different
 * populations and time windows (docs/CLAIMS_REGISTER.md). The Al Ain figure is shown as a historical reference only.
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
  const r = pilotScenario(inputs);
  const n0 = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });

  return (
    <div className="pilot" style={{ display: "grid", gap: 16, alignItems: "start", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))" }}>
      <section className="panel" aria-labelledby={`${id}-in`} style={{ display: "flex", flexDirection: "column", gap: 12, padding: 20 }}>
        <h2 id={`${id}-in`} style={{ fontSize: 18 }}>
          {t("inputsTitle")}
        </h2>
        {FIELDS.map(({ key, step, min, max, unit }) => {
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
                {t(`units.${unit}`)} · {t(`basis.${DEFAULTS[key].basis}`)}
              </p>
            </div>
          );
        })}
        <p className="xs faint" style={{ margin: 0 }} data-testid="pilot-reference">
          {t("reference")}{" "}
          <a href={REFERENCE.url} target="_blank" rel="noopener noreferrer" lang="en" dir="ltr">
            {REFERENCE.title}
          </a>
        </p>
      </section>

      <section className="panel" aria-labelledby={`${id}-out`} style={{ display: "flex", flexDirection: "column", gap: 10, padding: 20 }}>
        <h2 id={`${id}-out`} style={{ fontSize: 18 }}>
          {t("resultTitle")}
        </h2>
        <dl aria-live="polite" style={{ display: "grid", gap: 10, margin: 0 }} data-testid="pilot-result">
          <Fig label={t("out.completedBefore")} value={n0.format(r.completedBefore)} />
          <Fig label={t("out.completedAfter")} value={n0.format(r.completedAfter)} />
          <Fig label={t("out.extraCompleted")} value={n0.format(r.extraCompleted)} strong testid="extra-completed" />
        </dl>
        <p className="s" style={{ margin: 0 }}>
          {t("notOutcome")}
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
