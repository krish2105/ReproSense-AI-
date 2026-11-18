"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useState, useTransition } from "react";
import { Tag } from "@/components/ui/Tag";
import { useToast } from "@/components/ui/Toast";
import { isLocale } from "@/i18n/config";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { InviteCreated, InviteRow, InviteStatus } from "@/lib/api/types";
import { formatDate } from "@/lib/format";
import type { Tone } from "@/lib/rules";

const TONE: Record<InviteStatus, Tone> = { pending: "soon", accepted: "ok", expired: "info", revoked: "info" };

/** Single-use clinician invites (A3, API K4). The token comes back only when the invite is made, so its QR and link
 *  are shown once, here; the list below never shows a token. Withdrawing is allowed while an invite is pending. */
export function InvitePanel({ invites }: { invites: InviteRow[] }) {
  const t = useTranslations("clinicAdmin");
  const raw = useLocale();
  const locale = isLocale(raw) ? raw : "en";
  const router = useRouter();
  const toast = useToast();
  const [made, setMade] = useState<{ link: string; expires: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [, start] = useTransition();

  const fail = (e: unknown) => toast(t("failed", { detail: e instanceof ApiError ? e.detail : String(e) }));

  const create = () => {
    setBusy("new");
    start(async () => {
      try {
        const r = await apiClient<InviteCreated>("/clinic-admin/invites", { body: { expires_in_hours: 72 } });
        setMade({ link: `${window.location.origin}${r.join_path}`, expires: r.expires_at });
        router.refresh();
      } catch (e) {
        fail(e);
      } finally {
        setBusy(null);
      }
    });
  };

  const withdraw = (id: number) => {
    setBusy(String(id));
    start(async () => {
      try {
        await apiClient(`/clinic-admin/invites/${id}`, { method: "DELETE" });
        toast(t("withdrawn"));
        router.refresh();
      } catch (e) {
        fail(e);
      } finally {
        setBusy(null);
      }
    });
  };

  const copy = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      toast(t("copied"));
    } catch {
      toast(link);
    }
  };

  return (
    <section className="panel" aria-labelledby="ca-invite" style={{ padding: 20, background: "var(--sheet)", display: "flex", flexDirection: "column", gap: 10 }}>
      <h2 id="ca-invite" style={{ fontSize: 18 }}>
        {t("inviteTitle")}
      </h2>
      <p className="s dim">{t("inviteBody")}</p>
      <button type="button" className="btn btn-a btn-sm" style={{ alignSelf: "flex-start" }} disabled={busy === "new"} aria-busy={busy === "new" || undefined} onClick={create}>
        {t("inviteNew")}
      </button>

      {made && (
        <div className="invite-row" role="status" aria-label={t("madeLabel")}>
          <div className="invite-qr">
            <QRCodeSVG value={made.link} size={120} marginSize={2} bgColor="#FFFFFF" fgColor="#2E2233" role="img" aria-label={t("qrLabel")} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0, flex: 1 }}>
            <b className="s">{t("madeTitle")}</b>
            <span className="xs faint ltr" dir="ltr" style={{ overflowWrap: "anywhere" }} data-testid="invite-link">
              {made.link}
            </span>
            <span className="xs dim">{t("madeNote", { date: formatDate(made.expires.slice(0, 10), locale) })}</span>
            <button type="button" className="btn btn-o btn-sm" onClick={() => copy(made.link)} style={{ alignSelf: "flex-start" }}>
              {t("copy")}
            </button>
          </div>
        </div>
      )}

      <h3 className="label" style={{ marginTop: 8 }}>
        {t("listTitle")}
      </h3>
      {invites.length === 0 ? (
        <p className="s dim">{t("listEmpty")}</p>
      ) : (
        <ul className="ca-list" aria-label={t("listTitle")}>
          {invites.map((i) => (
            <li key={i.id}>
              <span style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <Tag tone={TONE[i.status]}>{t(`status.${i.status}`)}</Tag>
                <span className="s">
                  {i.accepted_by ? <bdi>{i.accepted_by.alias}</bdi> : t("made", { date: formatDate(i.created_at.slice(0, 10), locale) })}
                </span>
              </span>
              {i.status === "pending" && (
                <button type="button" className="link s" disabled={busy === String(i.id)} onClick={() => withdraw(i.id)}>
                  {t("withdraw")}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
