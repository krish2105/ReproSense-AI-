"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { SourceLinks } from "@/components/safety/SourceLinks";
import { Button } from "@/components/ui/Button";
import { DateField } from "@/components/ui/DateField";
import { Dialog } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import { Tag } from "@/components/ui/Tag";
import { useToast } from "@/components/ui/Toast";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { BabyItem, BabySchedule } from "@/lib/api/types";
import { formatDayMonth } from "@/lib/format";
import type { Locale } from "@/i18n/config";
import type { Tone } from "@/lib/rules";

const TONE: Record<BabyItem["status"], Tone> = { done: "ok", due: "soon", upcoming: "info", not_recorded: "info" };

/**
 * Her baby's first 12 months (build week D1): the hospital's newborn screening, the Abu Dhabi vaccinations and the
 * well-baby visits, each with its dates, a status that never says "missed" (the app cannot know what happened), its
 * DoH source a tap away, and "My baby had this" with a date. What is due now comes first, then the rest of the year in
 * a compact list grouped by age. Dates and sources only: no advice about the baby's health, no score, no red flag.
 */
export function BabyCard({ s, refDate }: { s: BabySchedule; refDate: string }) {
  const t = useTranslations("baby");
  const locale: Locale = useLocale() === "ar" ? "ar" : "en";
  const titleId = useId();
  const [recording, setRecording] = useState<BabyItem | null>(null);
  const next = s.items.filter((i) => s.next.includes(i.id));
  const rest = s.items.filter((i) => !s.next.includes(i.id));
  const groups = [...new Set(rest.map((i) => i.age_months))].map((m) => ({ months: m, items: rest.filter((i) => i.age_months === m) }));
  const when = (i: BabyItem) =>
    i.done_on
      ? t("doneOn", { date: formatDayMonth(i.done_on, locale) })
      : t("window", { from: formatDayMonth(i.due_from, locale), to: formatDayMonth(i.due_to, locale) });
  // Due, not recorded, or next to come (a clinic may give the 2-month vaccinations a few days before 2 months).
  const recordable = (i: BabyItem) => i.status !== "done" && (i.status !== "upcoming" || s.next.includes(i.id));

  return (
    <section className="box" aria-labelledby={titleId} data-testid="baby-card">
      <p className="label">
        {s.age_days < 14
          ? t("eyebrowDays", { days: s.age_days })
          : s.age_weeks < 13
            ? t("eyebrow", { weeks: s.age_weeks })
            : t("eyebrowMonths", { months: s.age_months })}
      </p>
      <div className="kv" style={{ alignItems: "baseline", marginTop: 4 }}>
        <h2 id={titleId} style={{ fontSize: 17 }}>
          {t("title")}
        </h2>
        <span className="xs faint">{t("progress", { done: s.done, total: s.total })}</span>
      </div>
      <p className="xs" style={{ margin: "6px 0 10px" }}>
        {t("intro")}
      </p>

      {next.length > 0 && (
        <div className="baby-next" data-testid="baby-next">
          <h3 className="label" style={{ marginBottom: 8 }}>
            {t("nextTitle")}
          </h3>
          <ul className="baby-list">
            {next.map((i) => (
              <li key={i.id} data-item={i.id} className="baby-next-item">
                <div className="kv" style={{ alignItems: "flex-start", gap: 8 }}>
                  <p className="s" style={{ margin: 0, fontWeight: 600 }}>
                    {i.label}
                  </p>
                  <Tag tone={TONE[i.status]}>{t(`status.${i.status}`)}</Tag>
                </div>
                <p className="xs faint" style={{ margin: "4px 0 0" }}>
                  {when(i)}
                </p>
                <Vaccines item={i} label={t("vaccines")} />
                {recordable(i) && (
                  <Button variant="outline" size="sm" onClick={() => setRecording(i)} style={{ marginTop: 8 }} aria-label={t("recordFor", { step: i.label })}>
                    {t("record")}
                  </Button>
                )}
                <SourceLinks sources={i.source_links} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {groups.length > 0 && (
        <>
          <h3 className="label" style={{ margin: "14px 0 0" }}>
            {t("restTitle")}
          </h3>
          {groups.map((g) => (
            <div key={g.months}>
              <p className="baby-age">{t("age", { months: g.months })}</p>
              <ul className="baby-list">
                {g.items.map((i) => (
                  <li key={i.id} data-item={i.id}>
                    <details className="baby-row">
                      <summary>
                        <Icon name="chevron" size={14} className="baby-chev" />
                        <span className="baby-row-text">
                          <span className="s" style={{ fontWeight: 600 }}>
                            {i.label}
                          </span>
                          <span className="xs faint">{when(i)}</span>
                        </span>
                        <Tag tone={TONE[i.status]}>{t(`status.${i.status}`)}</Tag>
                      </summary>
                      <div className="baby-row-body">
                        <Vaccines item={i} label={t("vaccines")} />
                        {recordable(i) && (
                          <Button variant="outline" size="sm" onClick={() => setRecording(i)} style={{ marginTop: 8 }} aria-label={t("recordFor", { step: i.label })}>
                            {t("record")}
                          </Button>
                        )}
                        {i.status === "done" && (
                          <Button variant="outline" size="sm" onClick={() => setRecording(i)} style={{ marginTop: 8 }} aria-label={t("changeDateFor", { step: i.label })}>
                            {t("changeDate")}
                          </Button>
                        )}
                        <SourceLinks sources={i.source_links} />
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </>
      )}

      {s.age_months >= 9 && (
        <p className="s" style={{ marginTop: 12 }}>
          {t("nextYear")}
        </p>
      )}
      <p className="xs faint" style={{ marginTop: 12 }}>
        {t("windowNote")}
      </p>
      <p className="xs faint" style={{ marginTop: 6 }}>
        {t("note")}
      </p>
      {recording && <RecordDialog item={recording} min={s.birth_date} max={refDate} onClose={() => setRecording(null)} />}
    </section>
  );
}

function Vaccines({ item, label }: { item: BabyItem; label: string }) {
  if (!item.vaccines.length) return null;
  return (
    <ul className="plain xs baby-vaccines" aria-label={label}>
      {item.vaccines.map((v, n) => (
        <li key={item.vaccine_codes[n] ?? v}>{v}</li>
      ))}
    </ul>
  );
}

function RecordDialog({ item, min, max, onClose }: { item: BabyItem; min: string; max: string; onClose: () => void }) {
  const t = useTranslations("baby");
  const router = useRouter();
  const toast = useToast();
  const inputId = useId();
  // The date she saved before; else the last day of its window when that has passed, otherwise today.
  const [day, setDay] = useState(item.done_on ?? (item.due_to < max ? item.due_to : max));
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const save = () =>
    start(async () => {
      setError(null);
      try {
        await apiClient(`/baby/${item.id}`, { body: { date: day } });
        toast(t("saved"));
        onClose();
        router.refresh();
      } catch (e) {
        setError(t("saveFailed", { detail: e instanceof ApiError ? e.detail : String(e) }));
      }
    });
  return (
    <Dialog open onClose={onClose} title={t("recordTitle")}>
      <p className="s">{item.label}</p>
      <div style={{ marginTop: 10 }}>
        <DateField id={inputId} label={t("dateLabel")} hint={t("dateHint")} value={day} onChange={setDay} min={min} max={max} today={max} />
      </div>
      {error && (
        <p className="state err s" role="alert">
          {error}
        </p>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <Button pending={pending} onClick={save} disabled={!day}>
          {t("save")}
        </Button>
        <Button variant="outline" onClick={onClose}>
          {t("cancel")}
        </Button>
      </div>
    </Dialog>
  );
}
