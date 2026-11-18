import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { AcceptInvite } from "@/components/clinicAdmin/AcceptInvite";
import { ErrorState } from "@/components/ui/States";
import { isLocale } from "@/i18n/config";
import { ApiError } from "@/lib/api/errors";
import { apiServer } from "@/lib/api/server";
import type { InvitePreview } from "@/lib/api/types";
import { formatDate, regionKey } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("clinicInvite");
  return { title: t("metaTitle"), robots: { index: false, follow: false }, referrer: "no-referrer" };
}

// A clinician opens a single-use invite from her clinic's admin (A3, API K4). No session needed. Only a pending
// invite shows the form; used, withdrawn or expired links say so, and an unknown link is 404.
export default async function ClinicInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const raw = await getLocale();
  const locale = isLocale(raw) ? raw : "en";
  const t = await getTranslations("clinicInvite");
  const tr = await getTranslations("regions");
  let invite: InvitePreview | null = null;
  try {
    invite = await apiServer<InvitePreview>(`/clinic-invites/${encodeURIComponent(token)}`);
  } catch (e) {
    if (!(e instanceof ApiError && e.status === 404)) throw e;
  }
  if (!invite || invite.status !== "pending") {
    const key = invite ? invite.status : "unknown";
    return (
      <div style={{ maxWidth: 640, marginInline: "auto" }}>
        <ErrorState headingLevel={1} title={t(`gone.${key}`)} body={t("goneBody")} />
      </div>
    );
  }
  return (
    <div style={{ maxWidth: 560, marginInline: "auto", display: "flex", flexDirection: "column", gap: 14 }}>
      <h1 className="page-title">{t("title", { clinic: invite.clinic.name })}</h1>
      <p className="page-intro">{t("intro", { region: tr.has(regionKey(invite.clinic.region)) ? tr(regionKey(invite.clinic.region)) : invite.clinic.region, date: formatDate(invite.expires_at.slice(0, 10), locale) })}</p>
      <AcceptInvite token={token} />
    </div>
  );
}
