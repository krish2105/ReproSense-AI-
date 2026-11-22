"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { SourceLinks } from "@/components/safety/SourceLinks";
import { Button, ButtonLink } from "@/components/ui/Button";
import { DateField } from "@/components/ui/DateField";
import { Dialog } from "@/components/ui/Dialog";
import { Tag } from "@/components/ui/Tag";
import { useToast } from "@/components/ui/Toast";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { Postnatal, PostnatalStep } from "@/lib/api/types";
import { formatDayMonth } from "@/lib/format";
import type { Tone } from "@/lib/rules";

const TONE: Record<PostnatalStep["status"], Tone> = { done: "ok", due: "soon", upcoming: "info", not_recorded: "info" };

/**
 * Her first 6 weeks after a birth (build week K1), following DoH Abu Dhabi's Postnatal Care Program Standard: each
 * check with its window, a status that never says "missed" (the app cannot know what happened), its sources, and
 * "I had this" for the checks her care team does. Care steps only: no score, no red flag, no diagnosis.
 */
export function PostnatalCard({ p, refDate }: { p: Postnatal; refDate: string }) {
  const t = useTranslations("postnatal");
  const locale = useLocale() === "ar" ? "ar" : "en";
  const titleId = useId();
  const [recording, setRecording] = useState<PostnatalStep | null>(null);
  return (
    <section className="box" aria-labelledby={titleId} data-testid="postnatal-card">
      <p className="eyebrow-s">{t("eyebrow")}</p>
      <div className="kv" style={{ alignItems: "baseline", marginTop: 4 }}>
        <h2 id={titleId} style={{ fontSize: 17 }}>
          {t("title")}
        </h2>
        <span className="xs faint">{t("progress", { done: p.done, total: p.total })}</span>
      </div>
      <p className="xs" style={{ margin: "6px 0 10px" }}>
        {t("intro")}
      </p>
      <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        {p.steps.map((s) => (
          <li key={s.id} data-step={s.id} style={{ borderTop: "1px solid var(--line)", paddingTop: 10 }}>
            <div className="kv" style={{ alignItems: "flex-start", gap: 8 }}>
              <p className="s" style={{ margin: 0, fontWeight: 600 }}>
                {t(`steps.${s.id}`)}
              </p>
              <Tag tone={TONE[s.status]}>{t(`status.${s.status}`)}</Tag>
            </div>
            <p className="xs faint" style={{ margin: "4px 0 0" }}>
              {s.done_on
                ? t("doneOn", { date: formatDayMonth(s.done_on, locale) })
                : t("window", { from: formatDayMonth(s.from, locale), to: formatDayMonth(s.to, locale) })}
            </p>
            {s.recordable && s.status !== "done" && s.status !== "upcoming" && (
              <Button variant="outline" size="sm" onClick={() => setRecording(s)} style={{ marginTop: 6 }}>
                {t("record")}
              </Button>
            )}
            {s.id === "mood" && s.status === "due" && (
              <ButtonLink href="/app/checkin" variant="outline" size="sm" style={{ marginTop: 6 }}>
                {t("moodAction")}
              </ButtonLink>
            )}
            <SourceLinks sources={s.source_links} />
          </li>
        ))}
      </ol>
      {p.discharge_assumed && (
        <p className="xs faint" style={{ marginTop: 10 }}>
          {t("assumed", { date: formatDayMonth(p.discharge_date, locale) })}
        </p>
      )}
      <p className="xs faint" style={{ marginTop: 6 }}>
        {t("note")}
      </p>
      {recording && (
        <RecordDialog step={recording} min={p.birth_date} max={refDate} onClose={() => setRecording(null)} />
      )}
    </section>
  );
}

function RecordDialog({ step, min, max, onClose }: { step: PostnatalStep; min: string; max: string; onClose: () => void }) {
  const t = useTranslations("postnatal");
  const router = useRouter();
  const toast = useToast();
  const inputId = useId();
  const [day, setDay] = useState(step.from <= max ? (step.to < max ? step.to : max) : max);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const save = () =>
    start(async () => {
      setError(null);
      try {
        await apiClient(`/postnatal/${step.id}`, { body: { date: day } });
        toast(t("saved"));
        onClose();
        router.refresh();
      } catch (e) {
        setError(t("saveFailed", { detail: e instanceof ApiError ? e.detail : String(e) }));
      }
    });
  return (
    <Dialog open onClose={onClose} title={t("recordTitle")}>
      <p className="s">{t(`steps.${step.id}`)}</p>
      <div style={{ marginTop: 10 }}>
        <DateField id={inputId} label={t("dateLabel")} value={day} onChange={setDay} min={min} max={max} today={max} />
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
