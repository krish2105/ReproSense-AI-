import { router } from "expo-router";
import { useState } from "react";
import { useTranslations } from "use-intl";
import type { Card as CardT, InsightsResponse } from "@/api/types";
import { NavigatorSheet, type DraftTarget } from "@/components/NavigatorSheet";
import { PatternCard } from "@/components/PatternCard";
import { TraceSheet } from "@/components/TraceSheet";
import { Button } from "@/components/ui/Button";
import { CrisisCard, UrgentCard } from "@/components/ui/Emergency";
import { Screen } from "@/components/ui/Screen";
import { Empty, ErrorBox, Loading } from "@/components/ui/States";
import { Txt } from "@/components/ui/Txt";
import { useApi } from "@/hooks/useApi";
import { useI18n } from "@/i18n/i18n";

// Patterns (web /app/insights): red flags pinned first; the crisis path replaces everything with support (rule 5).
export default function Patterns() {
  const t = useTranslations("insights");
  const home = useTranslations("home");
  const { locale } = useI18n();
  const { data, error, loading, reload } = useApi<InsightsResponse>(`/insights?lang=${locale}`);
  const [target, setTarget] = useState<DraftTarget | null>(null);
  const [traced, setTraced] = useState<CardT | null>(null);
  const flags = data?.cards.filter((c) => c.kind === "red_flag") ?? [];
  const rest = data?.cards.filter((c) => c.kind !== "red_flag") ?? [];

  return (
    <Screen refreshing={loading && !!data} onRefresh={() => void reload()}>
      <Txt variant="h1" accessibilityRole="header">
        {t("title")}
      </Txt>
      <Txt variant="small" color="ink2">
        {t("intro")}
      </Txt>
      {error ? <ErrorBox error={error} onRetry={() => void reload()} /> : null}
      {!data && !error ? <Loading /> : null}
      {data?.crisis && (
        <>
          <CrisisCard />
          <Txt variant="small" color="ink2">
            {t("crisisIntro")}
          </Txt>
        </>
      )}
      {data && !data.crisis && (
        <>
          {flags.map((card) => (
            <UrgentCard key={card.observation_id} card={card} />
          ))}
          <Txt variant="xs" color="faintText">
            {t("strength", { strength: home(`strength.${data.record_strength}`) })} ·{" "}
            {t("strengthDetail", { cycles: data.cycles_logged, entries: data.entries_count })}
          </Txt>
          {rest.length === 0 && flags.length === 0 ? (
            <Empty
              title={t("noneTitle")}
              body={t("noneBody")}
              action={<Button label={t("noneAction")} small onPress={() => router.push("/log")} />}
            />
          ) : (
            rest.map((card) => (
              <PatternCard
                key={card.observation_id}
                card={card}
                onDraft={(c) => setTarget({ ruleId: c.observation_id, title: c.title, sources: c.sources })}
                onTrace={setTraced}
              />
            ))
          )}
        </>
      )}
      <NavigatorSheet target={target} onClose={() => setTarget(null)} />
      <TraceSheet card={traced} trace={data?.trace ?? []} version={data?.rules_version ?? ""} onClose={() => setTraced(null)} />
    </Screen>
  );
}
