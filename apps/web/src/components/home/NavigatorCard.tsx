"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { SourceLinks } from "@/components/safety/SourceLinks";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";
import { Tag } from "@/components/ui/Tag";
import { useToast } from "@/components/ui/Toast";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { Card, NavigatorDecision, NavigatorDraft, NavigatorList } from "@/lib/api/types";
import { formatDayMonth } from "@/lib/format";

type Latest = { id: number; rule_id: string; status: NavigatorDraft["status"] } | undefined;

/**
 * Care navigator (CLAUDE.md rule 11): it only drafts. Approving changes the status to "approved" and nothing is sent;
 * she copies the message or shows it at the clinic herself.
 */
export function NavigatorCard({ card, dueDate, latest }: { card: Card; dueDate?: string | null; latest: Latest }) {
  const t = useTranslations();
  const locale = useLocale() === "ar" ? "ar" : "en";
  const [open, setOpen] = useState(false);
  const approved = latest?.status === "approved";
  const close = useCallback(() => setOpen(false), []);
  return (
    <section className="box nav-card" aria-labelledby="nav-title">
      <p className="eyebrow-s">{t("navigator.eyebrow")}</p>
      <h2 id="nav-title" style={{ fontSize: 16, marginTop: 4 }} dir="auto">
        {card.title}
      </h2>
      {dueDate && (
        <p className="xs" style={{ opacity: 0.9, marginTop: 4 }}>
          {t("home.dueBy", { date: formatDayMonth(dueDate, locale) })}
        </p>
      )}
      <p className="xs" style={{ opacity: 0.9, marginTop: 4 }}>
        {approved ? t("navigator.approvedState") : t("navigator.note")}
      </p>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} style={{ marginTop: 10 }}>
        {approved ? t("navigator.viewApproved") : t("navigator.review")}
      </Button>
      <NavigatorDialog open={open} onClose={close} card={card} />
    </section>
  );
}

export function NavigatorDialog({ open, onClose, card }: { open: boolean; onClose: () => void; card: Card }) {
  const t = useTranslations("navigator");
  const locale = useLocale() === "ar" ? "ar" : "en";
  const router = useRouter();
  const toast = useToast();
  const [draft, setDraft] = useState<NavigatorDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<"approved" | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setError(null);
    setDone(null);
    (async () => {
      try {
        const list = await apiClient<NavigatorList>("/navigator");
        let d = list.drafts.find((x) => x.rule_id === card.observation_id && x.status !== "discarded");
        if (!d) d = await apiClient<NavigatorDraft>("/navigator/drafts", { body: { rule_id: card.observation_id } });
        if (!cancelled) setDraft(d);
      } catch (e) {
        if (!cancelled) setError(e instanceof ApiError ? e.detail : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, card.observation_id]);

  const body = draft?.draft;
  const message = body ? (locale === "ar" ? body.message_ar : body.message_en) : "";
  const questions = body ? (locale === "ar" ? body.questions_ar : body.questions_en) : [];
  const bring = body ? (locale === "ar" ? body.bring_ar : body.bring_en) : [];

  const decide = (action: "approve" | "discard") =>
    start(async () => {
      if (!draft) return;
      try {
        const res = await apiClient<NavigatorDecision>(`/navigator/drafts/${draft.id}/${action}`, { method: "POST" });
        setDraft({ ...draft, status: res.status, approved_at: res.approved_at });
        router.refresh();
        if (action === "approve") setDone("approved");
        else {
          toast(t("discarded"));
          onClose();
        }
      } catch (e) {
        toast(t("failed", { detail: e instanceof ApiError ? e.detail : String(e) }));
      }
    });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      toast(t("copied"));
    } catch {
      toast(t("failed", { detail: "clipboard" }));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={t("dialogTitle")}>
      {error ? (
        <p className="state err" role="alert">
          {t("failed", { detail: error })}
        </p>
      ) : !draft || !body ? (
        <LoadingRegion>
          <p className="s dim">{t("drafting")}</p>
          <Skeleton height={140} radius={18} style={{ marginTop: 8 }} />
        </LoadingRegion>
      ) : (
        <>
          <span style={{ alignSelf: "flex-start" }}>
            <Tag tone={draft.status === "approved" ? "ok" : "soon"}>{t(`status.${draft.status}`)}</Tag>
          </span>
          <h3 dir="auto" style={{ fontSize: 17 }}>
            {card.title}
          </h3>
          <div className="doc">
            <h4>{t("to")}</h4>
            <p dir="auto">{body.to}</p>
            <h4>{t("subject")}</h4>
            <p dir="auto">{body.subject}</p>
            <h4>{t("message")}</h4>
            <p dir="auto">{message}</p>
            <h4>{t("questions")}</h4>
            <ul className="plain">
              {questions.map((q) => (
                <li key={q} dir="auto">
                  {q}
                </li>
              ))}
            </ul>
            <h4>{t("bring")}</h4>
            <ul className="plain">
              {bring.map((b) => (
                <li key={b} dir="auto">
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <p className="xs faint">{t("drafted")}</p>
          <SourceLinks sources={card.sources} />
          {done === "approved" && (
            <p className="notice" role="status">
              {t("approved")}
            </p>
          )}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {draft.status === "draft" ? (
              <>
                <Button pending={pending} onClick={() => decide("approve")}>
                  {t("approve")}
                </Button>
                <Button variant="outline" disabled={pending} onClick={() => decide("discard")}>
                  {t("discard")}
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={copy}>
                {t("copy")}
              </Button>
            )}
          </div>
        </>
      )}
    </Dialog>
  );
}
