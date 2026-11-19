import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { DohSetup } from "@/components/staffSignin/DohSetup";
import { ButtonLink } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/States";
import { isLocale } from "@/i18n/config";
import { ApiError } from "@/lib/api/errors";
import { apiServer } from "@/lib/api/server";
import type { DohSetupPreview } from "@/lib/api/types";
import { formatDate, isolate } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("staffAuth.setup");
  return { title: t("metaTitle"), robots: { index: false, follow: false }, referrer: "no-referrer" };
}

// A DoH network admin's single-use setup link (the team's plan section 5). Only the operator's CLI makes one; there is
// no sign-up for DoH accounts. A used, expired or unknown link says so and points to the DoH door.
export default async function DohSetupPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const raw = await getLocale();
  const locale = isLocale(raw) ? raw : "en";
  const t = await getTranslations("staffAuth.setup");
  const ts = await getTranslations("staffAuth.staff");
  let link: DohSetupPreview | null = null;
  try {
    link = await apiServer<DohSetupPreview>(`/staff-auth/setup/${encodeURIComponent(token)}`);
  } catch (e) {
    if (!(e instanceof ApiError && e.status === 404)) throw e;
  }
  if (!link || link.status !== "pending") {
    return (
      <div style={{ maxWidth: 640, marginInline: "auto" }}>
        <ErrorState
          headingLevel={1}
          title={t(`gone.${link ? link.status : "unknown"}`)}
          body={t("goneBody")}
          action={
            <ButtonLink href="/doh/signin" variant="outline" size="sm">
              {ts("dohLink")}
            </ButtonLink>
          }
        />
      </div>
    );
  }
  return (
    <div className="join">
      <div className="panel join-card">
        <h1 className="page-title">{t("title")}</h1>
        <p className="dim">{t("lede", { name: isolate(link.alias), date: formatDate(link.expires_at.slice(0, 10), locale) })}</p>
        <DohSetup token={token} passkeyAdded={link.passkey_added} />
      </div>
    </div>
  );
}
