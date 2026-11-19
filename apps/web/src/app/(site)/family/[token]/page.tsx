import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Box } from "@/components/ui/Box";
import { ErrorState } from "@/components/ui/States";
import { Tag } from "@/components/ui/Tag";
import { isLocale } from "@/i18n/config";
import { ApiError } from "@/lib/api/errors";
import { apiServer } from "@/lib/api/server";
import type { FamilyView } from "@/lib/api/types";
import { firstName, formatDate, formatDayMonth, isolate } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("family.view");
  return { title: t("metaTitle"), robots: { index: false, follow: false }, referrer: "no-referrer" };
}

const TIPS = [0, 1, 2] as const;

// Family support view (build week Y4): what she chose to share with her husband, mother or someone she trusts. No
// sign-in: the link is the key. 404 = unknown or turned off, 410 = expired. Every visit is logged in her Privacy page.
export default async function FamilyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const raw = await getLocale();
  const locale = isLocale(raw) ? raw : "en";
  const t = await getTranslations("family");
  let v: FamilyView | null = null;
  let status = 0;
  try {
    v = await apiServer<FamilyView>(`/family/${encodeURIComponent(token)}`, { query: { lang: locale } });
  } catch (e) {
    status = e instanceof ApiError ? e.status : 500;
  }
  if (!v) {
    const expired = status === 410;
    return (
      <div style={{ maxWidth: 640, marginInline: "auto" }}>
        <ErrorState
          headingLevel={1}
          title={expired ? t("view.expiredTitle") : t("view.invalidTitle")}
          body={expired ? t("view.expiredBody") : t("view.invalidBody")}
        />
      </div>
    );
  }
  const name = v.first_name ? isolate(firstName(v.first_name, locale)) : t("view.her"); // Arabic script on Arabic pages
  // Pattern names in the third person, from the rule ids she agreed to share (never her own card text).
  const patterns = (v.details?.patterns ?? []).filter((id) => t.has(`patterns.${id}`));
  return (
    <div style={{ maxWidth: 640, marginInline: "auto", display: "flex", flexDirection: "column", gap: 14 }} data-testid="family-view">
      <h1 className="page-title">{t("view.title", { name })}</h1>
      <p className="page-intro">{t("view.intro", { name, relation: t(`relation.${v.relation}`) })}</p>

      <Box aria-labelledby="family-steps">
        <h2 id="family-steps" style={{ fontSize: 17 }}>
          {t("view.stepsTitle")}
        </h2>
        {v.steps.length === 0 ? (
          <p className="s dim" style={{ marginTop: 6 }}>
            {t("view.noSteps")}
          </p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 0", display: "flex", flexDirection: "column", gap: 10 }}>
            {v.steps.map((s) => (
              <li key={s.id} data-step={s.id} className="kv" style={{ borderTop: "1px solid var(--line)", paddingTop: 8, alignItems: "flex-start" }}>
                <span className="s">
                  <b>{t(`steps.${s.id}`)}</b>
                  {s.to && (
                    <>
                      <br />
                      <span className="xs faint">
                        {s.from
                          ? t("view.window", { from: formatDayMonth(s.from, locale), to: formatDayMonth(s.to, locale) })
                          : t("view.by", { date: formatDayMonth(s.to, locale) })}
                      </span>
                    </>
                  )}
                </span>
                <Tag tone={s.status === "due" ? "soon" : "info"}>{t(`view.status.${s.status}`)}</Tag>
              </li>
            ))}
          </ul>
        )}
        <p className="xs faint" style={{ marginTop: 10 }}>
          {t("view.stepsNote", { name })}
        </p>
      </Box>

      <Box aria-labelledby="family-help">
        <h2 id="family-help" style={{ fontSize: 17 }}>
          {t("view.helpTitle")}
        </h2>
        <ul className="plain" style={{ marginTop: 6 }}>
          {TIPS.map((i) => (
            <li key={i}>{t(`tips.${v.stage}.${i}`)}</li>
          ))}
        </ul>
      </Box>

      {v.details && (
        <Box aria-labelledby="family-details" data-testid="family-details">
          <h2 id="family-details" style={{ fontSize: 17 }}>
            {t("view.detailsTitle")}
          </h2>
          <ul className="plain" style={{ marginTop: 6 }}>
            {v.details.pregnancy_weeks ? <li>{t("view.pregnancyWeeks", { weeks: v.details.pregnancy_weeks })}</li> : null}
            {v.details.weeks_since_birth !== null ? <li>{t("view.weeksSinceBirth", { weeks: v.details.weeks_since_birth })}</li> : null}
            {patterns.length > 0 && (
              <li>
                {t("view.patterns")} {patterns.map((id) => t(`patterns.${id}`)).join(locale === "ar" ? "، " : "; ")}
              </li>
            )}
          </ul>
        </Box>
      )}

      <p className="s" style={{ fontWeight: 600 }}>
        {t("view.emergency")}
      </p>
      <p className="xs faint">
        {t("view.privacy", { name, date: formatDate(v.expires_at.slice(0, 10), locale) })}
      </p>
    </div>
  );
}
