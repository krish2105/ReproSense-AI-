"use client";

import { useTranslations } from "next-intl";
import { QRCodeSVG } from "qrcode.react";
import { useId, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";

interface Invite {
  path: string;
  clinic_id: string;
  clinic_name: string;
  expires_at: string;
}

/**
 * Invite a clinician to one clinic (SaaS scorecard: clinic onboarding). The signed link expires in 7 days; whoever
 * joins with it sees only the patients who chose to share with that clinic (each clinic is its own tenant).
 */
export function ClinicianInvite({ clinics }: { clinics: { id: string; name: string }[] }) {
  const t = useTranslations("admin");
  const toast = useToast();
  const selectId = useId();
  const [clinic, setClinic] = useState(clinics[0]?.id ?? "");
  const [invite, setInvite] = useState<Invite | null>(null);
  const [pending, start] = useTransition();
  const link = invite ? `${window.location.origin}${invite.path}` : "";
  const create = () =>
    start(async () => {
      try {
        setInvite(await apiClient<Invite>("/admin/invites", { body: { clinic_id: clinic } }));
        toast(t("inviteCreated"));
      } catch (e) {
        toast(t("inviteFailed", { detail: e instanceof ApiError ? e.detail : String(e) }));
      }
    });
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast(t("inviteCopied"));
    } catch {
      toast(link);
    }
  };
  return (
    <section className="panel" aria-labelledby="clin-invite-title" style={{ padding: 20, marginTop: 20 }}>
      <h2 id="clin-invite-title" style={{ fontSize: 18 }}>
        {t("inviteTitle")}
      </h2>
      <p className="s dim" style={{ marginTop: 4 }}>
        {t("inviteBody")}
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end", marginTop: 12 }}>
        <div className="field" style={{ minWidth: 240 }}>
          <label htmlFor={selectId}>{t("inviteClinic")}</label>
          <select
            id={selectId}
            value={clinic}
            onChange={(e) => {
              setClinic(e.target.value);
              setInvite(null);
            }}
          >
            {clinics.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <Button size="sm" onClick={create} pending={pending}>
          {t("inviteCreate")}
        </Button>
      </div>
      {invite && (
        <div className="invite-row" style={{ marginTop: 14 }}>
          <div className="invite-qr">
            <QRCodeSVG value={link} size={120} marginSize={2} bgColor="#FFFFFF" fgColor="#2E2233" role="img" aria-label={t("inviteQrLabel")} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
            <span className="xs faint ltr" dir="ltr" style={{ overflowWrap: "anywhere" }}>
              {link}
            </span>
            <span className="xs dim">{t("inviteExpires", { date: new Date(invite.expires_at).toLocaleDateString(document.documentElement.lang || "en", { day: "numeric", month: "short" }) })}</span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" className="btn btn-o btn-sm" onClick={copy}>
                {t("inviteCopy")}
              </button>
              <a className="link s" href={invite.path} style={{ alignSelf: "center" }}>
                {t("inviteOpen")}
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
