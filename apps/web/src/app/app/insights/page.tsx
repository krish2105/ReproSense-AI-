import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { PatternCard } from "@/components/insights/PatternCard";
import { CrisisCard } from "@/components/safety/CrisisCard";
import { RedFlagCard } from "@/components/safety/RedFlagCard";
import { Box } from "@/components/ui/Box";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { isLocale } from "@/i18n/config";
import { apiServer } from "@/lib/api/server";
import type { InsightsResponse } from "@/lib/api/types";
import { requireRole } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("insights");
  return { title: t("metaTitle") };
}

// Patterns (HANDOFF §5 /app/insights; mockup tInsights, obsBlock, traceDialog). Red flags pinned first;
// the crisis path replaces the patterns with support (CLAUDE.md rule 5); other red flags stay, each needs its action.
export default async function InsightsPage() {
  await requireRole("patient");
  const raw = await getLocale();
  const locale = isLocale(raw) ? raw : "en";
  const t = await getTranslations("insights");
  const ins = await apiServer<InsightsResponse>("/insights", { query: { lang: locale } });
  const flags = ins.cards.filter((c) => c.kind === "red_flag");
  const rest = ins.cards.filter((c) => c.kind !== "red_flag");

  return (
    <div className="app-col">
      <h1 style={{ fontSize: 22, textAlign: "center" }}>{t("title")}</h1>
      <p className="s dim" style={{ textAlign: "center" }}>
        {t("intro")}
      </p>
      {ins.crisis ? (
        <>
          <CrisisCard />
          {flags.map((c) => (
            <RedFlagCard key={c.observation_id} card={c} locale={locale} />
          ))}
          <p className="xs faint" style={{ textAlign: "center" }}>
            {t("crisisIntro")}
          </p>
        </>
      ) : (
        <>
          {flags.map((c) => (
            <RedFlagCard key={c.observation_id} card={c} locale={locale} />
          ))}
          {rest.length === 0 && flags.length === 0 ? (
            <Box>
              <EmptyState
                title={t("noneTitle")}
                body={t("noneBody")}
                headingLevel={2}
                action={
                  <ButtonLink href="/app/log" variant="outline" size="sm">
                    {t("noneAction")}
                  </ButtonLink>
                }
              />
            </Box>
          ) : (
            rest.map((c) => (
              <PatternCard
                key={c.observation_id}
                card={c}
                trace={ins.trace}
                version={ins.rules_version}
                strength={ins.record_strength}
                cycles={ins.cycles_logged}
                days={ins.days_logged}
                locale={locale}
              />
            ))
          )}
        </>
      )}
    </div>
  );
}
