"use client";

import { QRCodeSVG } from "qrcode.react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Tag } from "@/components/ui/Tag";
import { useToast } from "@/components/ui/Toast";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { ReportRow, ShareCreated, ShareRow } from "@/lib/api/types";
import { displayName, formatDate } from "@/lib/format";

// The share token is returned once (the API stores only its hash), so the link and QR of a share created
// in this browser session are kept in sessionStorage; older shares can still be stopped.
const TOKENS = "rs_share_tokens";
const readTokens = (): Record<string, string> => {
  try {
    return JSON.parse(sessionStorage.getItem(TOKENS) ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
};
const saveToken = (id: number, token: string) => {
  try {
    sessionStorage.setItem(TOKENS, JSON.stringify({ ...readTokens(), [id]: token }));
  } catch {
    /* ignore */
  }
};

type ShareState = "active" | "expired" | "revoked";
const stateOf = (s: ShareRow, now: number): ShareState => (s.revoked_at ? "revoked" : Date.parse(s.expires_at) < now ? "expired" : "active");

export function ReportActions({ report, shares, now }: { report: ReportRow; shares: ShareRow[]; now: number }) {
  const t = useTranslations();
  const locale = useLocale() === "ar" ? "ar" : "en";
  const router = useRouter();
  const toast = useToast();
  const [shareOpen, setShareOpen] = useState(false);
  const [visitOpen, setVisitOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [tokens, setTokens] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  useEffect(() => setTokens(readTokens()), []);

  const active = shares.find((s) => stateOf(s, now) === "active" && tokens[s.id]);
  const link = active && typeof window !== "undefined" ? `${window.location.origin}/shared/${tokens[active.id]}` : null;
  const day = (iso: string) => formatDate(iso.slice(0, 10), locale);

  const share = () =>
    start(async () => {
      try {
        const s = await apiClient<ShareCreated>("/shares", { body: { report_id: report.id, consent: true } });
        saveToken(s.id, s.token);
        setTokens(readTokens());
        toast(t("report.shared", { date: day(s.expires_at) }));
        setAgreed(false);
        router.refresh();
      } catch (e) {
        toast(t("report.shareFailed", { detail: e instanceof ApiError ? e.detail : String(e) }));
      }
    });

  const stop = (id: number) =>
    start(async () => {
      try {
        await apiClient(`/shares/${id}`, { method: "DELETE" });
        toast(t("report.stopped"));
        router.refresh();
      } catch (e) {
        toast(t("report.stopFailed", { detail: e instanceof ApiError ? e.detail : String(e) }));
      }
    });

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast(t("report.linkCopied"));
    } catch {
      /* clipboard blocked: the link stays visible to copy by hand */
    }
  };

  const closeShare = useCallback(() => setShareOpen(false), []);
  const closeVisit = useCallback(() => setVisitOpen(false), []);
  const p = report.payload;
  const lengths = p.cycles.filter((c) => c.length !== null).map((c) => c.length);
  const top = p.red_flags[0] ?? p.patterns[0];

  const consentForm = (
    <div className="field" style={{ gap: 10 }}>
      <p className="s">{t("report.shareBody")}</p>
      <label className="s" style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ width: 20, height: 20, marginTop: 2, accentColor: "var(--plum)" }} />
        <span>{t("report.consent")}</span>
      </label>
      <Button pending={pending} disabled={!agreed} onClick={share} style={{ alignSelf: "flex-start" }}>
        {t("report.confirm")}
      </Button>
    </div>
  );

  return (
    <>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }} role="group" aria-label={t("report.actions")}>
        <a className="btn btn-a btn-sm" href={`/api/v1/reports/${report.id}.pdf`} download={`reprosense-report-${report.id}.pdf`}>
          {t("report.download")}
        </a>
        <a className="btn btn-o btn-sm" href={`/api/v1/reports/${report.id}.pdf`} target="_blank" rel="noopener">
          {t("report.open")}
        </a>
        <Button size="sm" variant="outline" onClick={() => setShareOpen(true)}>
          {t("report.share")}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setVisitOpen(true)}>
          {t("report.visit")}
        </Button>
      </div>

      <section className="box" aria-labelledby="shares-title" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h2 id="shares-title" style={{ fontSize: 16 }}>
          {t("report.sharesTitle")}
        </h2>
        {shares.length === 0 ? (
          <p className="s dim">{t("report.sharesNone")}</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {shares.map((s) => {
              const st = stateOf(s, now);
              const clinic = t.has(`clinics.${s.clinic_id}`) ? t(`clinics.${s.clinic_id}`) : s.clinic_id;
              return (
                <li key={s.id} className="kv" style={{ flexWrap: "wrap", alignItems: "center" }}>
                  <span className="s">
                    <Tag tone={st === "active" ? "ok" : "info"} className="me-2">
                      {st === "active" ? t("report.stateActive") : st === "expired" ? t("report.expired", { date: day(s.expires_at) }) : t("report.revoked", { date: day(s.revoked_at!) })}
                    </Tag>
                    {st === "active" && t("report.active", { clinic, date: day(s.expires_at) })}
                  </span>
                  {st === "active" && (
                    <Button size="sm" variant="outline" disabled={pending} onClick={() => stop(s.id)}>
                      {t("report.stop")}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {link && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <code className="xs" dir="ltr" style={{ wordBreak: "break-all" }}>
              {link}
            </code>
            <button type="button" className="link xs" onClick={() => copy(link)}>
              {t("report.copyLink")}
            </button>
          </div>
        )}
      </section>

      <Dialog open={shareOpen} onClose={closeShare} title={t("report.shareTitle")}>
        {link && active ? (
          <>
            <p className="notice" role="status">
              {t("report.shared", { date: day(active.expires_at) })}
            </p>
            <Button variant="outline" size="sm" onClick={() => copy(link)} style={{ alignSelf: "flex-start" }}>
              {t("report.copyLink")}
            </Button>
          </>
        ) : (
          consentForm
        )}
      </Dialog>

      <Dialog open={visitOpen} onClose={closeVisit} title={t("report.visitTitle")}>
        <h3 style={{ fontSize: 18 }}>
          <bdi>{displayName(p.alias)}</bdi>, {p.age}
        </h3>
        <div className="sbar">
          <b aria-label={t("report.s")}>S</b>
          <span lang="en" dir="auto">
            {p.patterns.length || p.red_flags.length ? t("report.sLine", { titles: [...p.red_flags, ...p.patterns].map((c) => c.title).join("; ") }) : t("report.sNone")}
          </span>
          <b aria-label={t("report.b")}>B</b>
          <span>
            {t("report.bLine", { age: p.age, stage: t(`stages.${p.life_stage}`), logs: p.stats.logs })}
            {p.pregnancy_weeks > 0 ? ` ${t("report.bPreg", { weeks: p.pregnancy_weeks })}` : ""}
          </span>
          <b aria-label={t("report.a")}>A</b>
          <span>
            {lengths.length ? t("report.aLine", { lengths: lengths.join(" · ") }) : t("report.aNone")} {t("report.aPain", { severe: p.stats.severe_pain_days })}
          </span>
          <b aria-label={t("report.r")}>R</b>
          <span lang="en" dir="auto">
            {top?.what_to_consider[0] ?? t("report.rNone")}
          </span>
        </div>
        {link && active ? (
          <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 6 }}>
            <QRCodeSVG value={link} size={112} marginSize={2} bgColor="#FFFFFF" fgColor="#2E2233" role="img" aria-label={t("report.qrLabel")} style={{ borderRadius: 12, flex: "none" }} />
            <span className="s">{t("report.qrCaption", { date: day(active.expires_at) })}</span>
          </div>
        ) : (
          <>
            <p className="s dim">{t("report.needShare")}</p>
            {consentForm}
          </>
        )}
        <p className="xs faint">{t("report.visitNote")}</p>
        <Button onClick={closeVisit} style={{ alignSelf: "flex-start" }}>
          {t("report.exit")}
        </Button>
      </Dialog>
    </>
  );
}

/** Creates (or refreshes) the report payload; the page then shows the preview. */
export function PrepareReport({ label }: { label: string }) {
  const t = useTranslations("report");
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  return (
    <Button
      pending={pending}
      onClick={() =>
        start(async () => {
          try {
            await apiClient<ReportRow>("/reports", { method: "POST" });
            toast(t("prepared"));
            router.refresh();
          } catch (e) {
            toast(t("prepareFailed", { detail: e instanceof ApiError ? e.detail : String(e) }));
          }
        })
      }
    >
      {label}
    </Button>
  );
}
