"use client";

import { useTranslations } from "next-intl";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";

/**
 * The clinic's patient invite (SaaS scorecard: clinic onboarding). The QR opens /join?clinic=<id>: she starts her own
 * record, and sharing it with this clinic is a separate, unticked choice. The QR is drawn after mount, when the
 * page's own origin is known, so server and browser render the same HTML.
 */
export function PatientInvite({ clinicId }: { clinicId: string }) {
  const t = useTranslations("clinic");
  const toast = useToast();
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const path = `/join?clinic=${encodeURIComponent(clinicId)}`;
  const link = origin ? `${origin}${path}` : path;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast(t("inviteCopied"));
    } catch {
      toast(link);
    }
  };
  return (
    <section aria-labelledby="invite-title" className="invite">
      <p className="label" id="invite-title" style={{ marginBottom: 4 }}>
        {t("inviteTitle")}
      </p>
      <p className="s dim">{t("inviteBody")}</p>
      <div className="invite-row">
        <div className="invite-qr">{origin && <QRCodeSVG value={link} size={120} marginSize={2} bgColor="#FFFFFF" fgColor="#2E2233" role="img" aria-label={t("inviteQrLabel")} />}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
          <span className="xs faint ltr" dir="ltr" style={{ overflowWrap: "anywhere" }}>
            {link}
          </span>
          <button type="button" className="btn btn-o btn-sm" onClick={copy} style={{ alignSelf: "flex-start" }}>
            {t("inviteCopy")}
          </button>
          <a className="link s" href={path}>
            {t("inviteOpen")}
          </a>
        </div>
      </div>
    </section>
  );
}
