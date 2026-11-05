"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Tag } from "@/components/ui/Tag";
import { useToast } from "@/components/ui/Toast";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { ClinicGap, RecordAnswer, ReminderDraft } from "@/lib/api/types";
import { formatDate, formatDayMonth } from "@/lib/format";

const detailOf = (e: unknown) => (e instanceof ApiError ? e.detail : String(e));

export function ReviewButton({ pid, reviewedAt }: { pid: string; reviewedAt: string | null }) {
  const t = useTranslations("clinic");
  const locale = useLocale() === "ar" ? "ar" : "en";
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  if (reviewedAt) return <Tag tone="ok">{t("reviewedOn", { date: formatDate(reviewedAt.slice(0, 10), locale) })}</Tag>;
  return (
    <Button
      variant="outline"
      size="sm"
      pending={pending}
      onClick={() =>
        start(async () => {
          try {
            await apiClient(`/clinic/patients/${pid}/review`, { method: "POST" });
            toast(t("reviewedToast"));
            router.refresh();
          } catch (e) {
            toast(t("reviewFailed", { detail: detailOf(e) }));
          }
        })
      }
    >
      {t("markReviewed")}
    </Button>
  );
}

/** Follow-ups: book, close or reopen (PATCH), and a reminder that is only ever a draft. */
export function CareGaps({ gaps }: { gaps: ClinicGap[] }) {
  const t = useTranslations("clinic");
  const locale = useLocale() === "ar" ? "ar" : "en";
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [draft, setDraft] = useState<ReminderDraft | null>(null);
  const close = useCallback(() => setDraft(null), []);

  const setStatus = (id: number, status: ClinicGap["status"]) =>
    start(async () => {
      try {
        await apiClient(`/clinic/care-gaps/${id}`, { method: "PATCH", body: { status } });
        toast(t("gapUpdated", { status: t(`gapStatus.${status}`) }));
        router.refresh();
      } catch (e) {
        toast(t("gapFailed", { detail: detailOf(e) }));
      }
    });
  const remind = (id: number) =>
    start(async () => {
      try {
        setDraft(await apiClient<ReminderDraft>(`/clinic/care-gaps/${id}/reminder`, { method: "POST" }));
      } catch (e) {
        toast(t("reminderFailed", { detail: detailOf(e) }));
      }
    });
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast(t("copied"));
    } catch {
      /* visible text can still be copied by hand */
    }
  };

  return (
    <section aria-labelledby="gaps-title" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <p className="label" id="gaps-title">
        {t("gapsTitle")}
      </p>
      {gaps.map((g) => (
        <div key={g.id} className="box" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="kv" style={{ flexWrap: "wrap" }}>
            <b className="s">{t.has(`gapType.${g.type}`) ? t(`gapType.${g.type}`) : t("gapType.other")}</b>
            <Tag tone={g.status === "closed" ? "ok" : g.status === "in_progress" ? "info" : "soon"}>{t(`gapStatus.${g.status}`)}</Tag>
          </div>
          {g.due_date && <p className="xs dim">{t("gapDue", { date: formatDayMonth(g.due_date, locale) })}</p>}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {g.status === "open" && (
              <Button size="sm" variant="outline" disabled={pending} onClick={() => setStatus(g.id, "in_progress")}>
                {t("gapBook")}
              </Button>
            )}
            {g.status !== "closed" ? (
              <Button size="sm" pending={pending} onClick={() => setStatus(g.id, "closed")}>
                {t("gapDone")}
              </Button>
            ) : (
              <Button size="sm" variant="outline" disabled={pending} onClick={() => setStatus(g.id, "open")}>
                {t("gapReopen")}
              </Button>
            )}
            {g.status !== "closed" && (
              <Button size="sm" variant="outline" disabled={pending} onClick={() => remind(g.id)}>
                {t("reminder")}
              </Button>
            )}
          </div>
        </div>
      ))}
      <Dialog open={!!draft} onClose={close} title={t("reminderTitle")}>
        {draft && (
          <>
            <div className="doc">
              <p lang="en" dir="ltr">
                {draft.en}
              </p>
              <p lang="ar" dir="rtl">
                {draft.ar}
              </p>
            </div>
            <p className="xs faint">{t("reminderNote")}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Button size="sm" variant="outline" onClick={() => copy(draft.en)}>
                {t("copyEn")}
              </Button>
              <Button size="sm" variant="outline" onClick={() => copy(draft.ar)}>
                {t("copyAr")}
              </Button>
            </div>
          </>
        )}
      </Dialog>
    </section>
  );
}

// Suggested questions are sent in English: the record copilot matches English keywords in her entries.
const CHIPS = { work: "pain that stopped work or study", mood: "mood since the birth", cycles: "cycle lengths", bleeding: "heavy bleeding" } as const;

/** Ask the record: answers only from her entries, each with its date. */
export function AskRecord({ pid }: { pid: string }) {
  const t = useTranslations("clinic");
  const locale = useLocale() === "ar" ? "ar" : "en";
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState<RecordAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const ask = (question: string) =>
    start(async () => {
      setError(null);
      try {
        setAnswer(await apiClient<RecordAnswer>(`/clinic/patients/${pid}/ask`, { body: { question } }));
      } catch (e) {
        setError(detailOf(e));
      }
    });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (q.trim()) ask(q.trim());
  };
  return (
    <section className="ask" aria-labelledby="ask-title">
      <p className="label" id="ask-title">
        {t("askTitle")}
      </p>
      <p className="xs faint">{t("askHint")}</p>
      <div className="sugg">
        {(Object.keys(CHIPS) as (keyof typeof CHIPS)[]).map((k) => (
          <button key={k} type="button" disabled={pending} onClick={() => ask(CHIPS[k])}>
            {t(`askChips.${k}`)}
          </button>
        ))}
      </div>
      <form method="post" className="askbar" onSubmit={submit}>
        <label htmlFor="ask-record" className="sr-only">
          {t("askLabel")}
        </label>
        <input id="ask-record" type="text" dir="auto" maxLength={300} value={q} placeholder={t("askPlaceholder")} onChange={(e) => setQ(e.target.value)} />
        <button type="submit" aria-label={t("askSend")} disabled={pending || !q.trim()}>
          <span aria-hidden="true" style={{ fontWeight: 700, fontSize: 13 }}>
            {t("askSend")}
          </span>
        </button>
      </form>
      <div aria-live="polite">
        {error && <p className="s" role="alert">{t("askFailed", { detail: error })}</p>}
        {answer && (
          <div className="msg ai" style={{ maxWidth: "100%" }}>
            <p lang="en" dir="auto">
              {answer.answer}
            </p>
            {answer.evidence.length > 0 && (
              <ul className="chips" style={{ listStyle: "none", padding: 0, margin: "8px 0 0" }}>
                {answer.evidence.map((e, i) => (
                  <li key={`${e.entry_id ?? e.date}-${i}`} className="ev" lang="en" dir="auto" title={formatDate(e.date, locale)}>
                    {e.text}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/** The visit note: the API's rule-based draft, edited and saved by the clinician. */
export function VisitNote({ pid, initial }: { pid: string; initial: string }) {
  const t = useTranslations("clinic");
  const toast = useToast();
  const [text, setText] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <div className="field">
      <label htmlFor="visit-note">{t("noteTitle")}</label>
      <textarea id="visit-note" rows={10} lang="en" dir="auto" value={text} maxLength={6000} onChange={(e) => setText(e.target.value)} style={{ fontSize: 13.5 }} />
      <Button
        size="sm"
        pending={pending}
        style={{ alignSelf: "flex-start" }}
        onClick={() =>
          start(async () => {
            try {
              await apiClient(`/clinic/patients/${pid}/visit-note`, { method: "PUT", body: { text } });
              toast(t("noteSaved"));
            } catch (e) {
              toast(t("noteFailed", { detail: detailOf(e) }));
            }
          })
        }
      >
        {t("noteSave")}
      </Button>
    </div>
  );
}
