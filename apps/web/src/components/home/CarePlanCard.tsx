"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useId, useState, useTransition } from "react";
import { SourceLinks } from "@/components/safety/SourceLinks";
import { Tag } from "@/components/ui/Tag";
import { useToast } from "@/components/ui/Toast";
import type { Locale } from "@/i18n/config";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { CarePlan } from "@/lib/api/types";
import { formatDate } from "@/lib/format";

const TONE = { overdue: "urgent", due_soon: "soon", planned: "info" } as const;

/**
 * Her care plan after a diagnosis (22 Nov): the plan her doctor set (Salma: PCOS). Today's dose with a tick she can
 * undo, how many of the last 7 days she ticked, the next checks with their sources, the monthly check-in, and what to
 * watch for. The app never diagnoses or chooses a medicine: the card says the plan is her doctor's.
 */
export function CarePlanCard({ initial }: { initial: CarePlan }) {
  const t = useTranslations("carePlan");
  const locale = useLocale() as Locale;
  const toast = useToast();
  const titleId = useId();
  const [p, setP] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();
  const day = (iso: string) => formatDate(iso, locale);
  const condition = t.has(`conditions.${p.condition}`) ? t(`conditions.${p.condition}`) : p.condition;

  const toggle = (id: string, taken: boolean) => {
    const before = p;
    setP({ ...p, medicines: p.medicines.map((m) => (m.id === id ? { ...m, taken_today: taken } : m)) });
    setBusy(id);
    setError(null);
    start(async () => {
      try {
        setP(await apiClient<CarePlan>(`/care-plan/medicines/${id}?lang=${locale}`, { body: { taken } }));
        toast(taken ? t("saved") : t("removed"));
      } catch (e) {
        setP(before);
        setError(t("saveFailed", { detail: e instanceof ApiError ? e.detail : String(e) }));
      } finally {
        setBusy(null);
      }
    });
  };

  return (
    <section className="box" aria-labelledby={titleId} data-testid="care-plan-card">
      <p className="eyebrow-s">{t("eyebrow", { condition })}</p>
      <h2 id={titleId} style={{ fontSize: 17, marginTop: 4 }}>
        {t("title")}
      </h2>
      <p className="xs" style={{ margin: "6px 0 10px" }}>
        {t("intro", { by: p.recorded_by, date: day(p.since) })}
      </p>

      <h3 className="s" style={{ fontWeight: 700, margin: "8px 0 6px" }}>
        {t("medicinesTitle")}
      </h3>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        {p.medicines.map((m) => {
          const inputId = `${titleId}-${m.id}`;
          return (
            <li key={m.id} data-medicine={m.id} style={{ borderTop: "1px solid var(--line)", paddingTop: 10 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <input
                  id={inputId}
                  type="checkbox"
                  className="hit"
                  checked={m.taken_today}
                  disabled={busy === m.id}
                  aria-busy={busy === m.id || undefined}
                  onChange={(e) => toggle(m.id, e.target.checked)}
                  style={{ marginTop: 3, width: 18, height: 18, accentColor: "var(--accent)" }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <label htmlFor={inputId} className="s" style={{ fontWeight: 600 }}>
                    <span dir="ltr">
                      {m.name} {m.dose}
                    </span>{" "}
                    · {t("takenToday")}
                  </label>
                  <p className="xs" style={{ margin: "4px 0 0" }}>
                    {m.when}
                    {m.reminder ? ` · ${t("reminder", { time: m.reminder })}` : ""}
                  </p>
                  <p className="xs faint" style={{ margin: "2px 0 0" }} data-testid="taken-last-7">
                    {t("last7", { n: m.taken_last_7 })}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <h3 className="s" style={{ fontWeight: 700, margin: "14px 0 6px" }}>
        {t("checksTitle")}
      </h3>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        {p.checks.map((c) => (
          <li key={c.id} data-check={c.id} style={{ borderTop: "1px solid var(--line)", paddingTop: 8 }}>
            <div className="kv" style={{ alignItems: "baseline", gap: 8 }}>
              <span className="s" style={{ fontWeight: 600 }}>
                {t.has(`checks.${c.id}`) ? t(`checks.${c.id}`) : c.id}
              </span>
              <Tag tone={TONE[c.status]}>{t(`status.${c.status}`, { date: day(c.due) })}</Tag>
            </div>
            {c.source_links.length > 0 && <SourceLinks sources={c.source_links} />}
          </li>
        ))}
      </ul>

      {p.checkin && (
        <div style={{ marginTop: 12 }} data-testid="care-plan-checkin">
          <p className="s" style={{ margin: 0 }}>
            {p.checkin.due ? t("checkinDue") : t("checkinNext", { date: day(p.checkin.next) })}
          </p>
          <Link className="link s" href="/app/log">
            {t("checkinAction")}
          </Link>
        </div>
      )}

      <h3 className="s" style={{ fontWeight: 700, margin: "14px 0 6px" }}>
        {t("watchTitle")}
      </h3>
      <ul className="tier-list" style={{ marginTop: 0 }}>
        {p.watch.map((w) => (
          <li key={w.id}>
            {t(`watch.${w.id}`)}
            {w.source_links.length > 0 && <SourceLinks sources={w.source_links} />}
          </li>
        ))}
      </ul>

      {error && (
        <p className="state err s" role="alert">
          {error}
        </p>
      )}
      <p className="xs faint" style={{ marginTop: 10 }}>
        {t("note")}
      </p>
    </section>
  );
}
