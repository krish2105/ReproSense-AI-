"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { NavigatorDialog } from "@/components/home/NavigatorCard";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import type { Card, TraceStep } from "@/lib/api/types";

/** "How this was produced": the pipeline steps for her record plus the numbers this card's rule used. */
export function TraceButton({ card, trace, version }: { card: Card; trace: TraceStep[]; version: string }) {
  const t = useTranslations("insights");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const values = Object.entries(card.values);
  return (
    <>
      <button type="button" className="link xs" onClick={() => setOpen(true)}>
        {t("how")}
      </button>
      <Dialog open={open} onClose={close} title={t("traceTitle")}>
        <p className="s dim">{t("traceIntro")}</p>
        <p className="xs">
          <code dir="ltr">{t("traceRule", { rule: card.observation_id, version })}</code>
        </p>
        {values.length > 0 && (
          <>
            <h3 style={{ fontSize: 15 }}>{t("traceInputs")}</h3>
            <dl className="code" dir="ltr" style={{ margin: 0, display: "grid", gridTemplateColumns: "auto 1fr", gap: "2px 12px" }}>
              {values.map(([k, v]) => (
                <div key={k} style={{ display: "contents" }}>
                  <dt>{k}</dt>
                  <dd style={{ margin: 0 }}>{String(v)}</dd>
                </div>
              ))}
            </dl>
          </>
        )}
        <h3 style={{ fontSize: 15 }}>{t("traceSteps")}</h3>
        <ol className="plain" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {trace.map((s) => (
            <li key={s.agent}>
              <b className="s">{t.has(`agents.${s.agent}`) ? t(`agents.${s.agent}`) : s.agent}</b>
              <br />
              <span className="xs dim" lang="en" dir="ltr">
                {s.detail}
              </span>
              {typeof s.ms === "number" && <span className="xs faint"> · {t("traceMs", { ms: new Intl.NumberFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-GB", { maximumFractionDigits: 1 }).format(s.ms) })}</span>}
            </li>
          ))}
        </ol>
      </Dialog>
    </>
  );
}

/** Pattern cards can draft an appointment request too (same navigator: draft only, nothing is sent). */
export function DraftButton({ card }: { card: Card }) {
  const t = useTranslations("insights");
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        {t("draft")}
      </Button>
      <NavigatorDialog open={open} onClose={close} card={card} />
    </>
  );
}
