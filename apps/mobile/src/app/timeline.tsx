import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { useTranslations } from "use-intl";
import type { AnalyticsResponse, TimelineDay, TimelineResponse } from "@/api/types";
import { BarChart, CycleLengthChart, type Point } from "@/components/Charts";
import { Card, Chip, Section } from "@/components/ui/Card";
import { BackBar } from "@/components/ui/Row";
import { Screen } from "@/components/ui/Screen";
import { Empty, ErrorBox, Loading } from "@/components/ui/States";
import { Txt } from "@/components/ui/Txt";
import { useApi } from "@/hooks/useApi";
import { useI18n } from "@/i18n/i18n";
import { formatDate, formatDayMonth } from "@/shared/format";
import { slug } from "@/shared/vocab";
import { useTheme } from "@/theme/theme";

function DayCard({ day, highlight }: { day: TimelineDay; highlight: boolean }) {
  const t = useTranslations("log");
  const flows = useTranslations("flows");
  const symptoms = useTranslations("symptoms");
  const { locale } = useI18n();
  const { c } = useTheme();
  return (
    <Card style={highlight ? { borderColor: c.accent, borderWidth: 2 } : undefined}>
      <Txt variant="label" color="accentText">
        {t("dayTitle", { date: formatDate(day.date, locale) })}
      </Txt>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        <Txt variant="small">
          {t("tileFlow")}: {flows(day.flow)}
        </Txt>
        <Txt variant="small">{t("painValue", { pain: day.pain })}</Txt>
        {day.pbac > 0 && (
          <Txt variant="small">
            {t("tilePbac")}: {day.pbac}
          </Txt>
        )}
      </View>
      {day.symptoms.length > 0 && (
        <Txt variant="small" color="ink2">
          {t("tileSymptoms")}: {day.symptoms.map((s) => symptoms(slug(s))).join(", ")}
        </Txt>
      )}
    </Card>
  );
}

export default function Timeline() {
  const t = useTranslations("analytics");
  const m = useTranslations("mobile");
  const { locale } = useI18n();
  const params = useLocalSearchParams<{ date?: string }>();
  const [months, setMonths] = useState<3 | 6 | 12>(12);
  const analytics = useApi<AnalyticsResponse>(`/analytics?months=${months}`);
  const timeline = useApi<TimelineResponse>(`/timeline?months=${months}`);

  const a = analytics.data;
  const complete = a?.cycles.filter((x) => x.length !== null) ?? [];
  const lenPoints: Point[] = complete.map((x) => ({
    key: x.start,
    label: formatDayMonth(x.start, locale),
    value: x.length!,
    detail: t("lengthPoint", { date: formatDayMonth(x.start, locale), length: x.length! }),
  }));
  const painPoints: Point[] = (a?.cycles ?? []).map((x) => ({
    key: x.start,
    label: formatDayMonth(x.start, locale),
    value: x.max_pain,
    detail: t("painBar", { date: formatDayMonth(x.start, locale), pain: x.max_pain }),
  }));
  const pbacPoints: Point[] = (a?.cycles ?? []).map((x) => ({
    key: x.start,
    label: formatDayMonth(x.start, locale),
    value: x.pbac,
    detail: t("pbacBar", { date: formatDayMonth(x.start, locale), pbac: x.pbac }),
  }));
  const outside = complete.filter((x) => x.length! < 21 || x.length! > 35).length;
  const severe = (a?.cycles ?? []).filter((x) => x.max_pain >= 7).length;
  const heavy = (a?.cycles ?? []).filter((x) => x.pbac >= 100).length;

  const days = [...(timeline.data?.days ?? [])].sort((x, y) => (x.date < y.date ? 1 : -1));
  const focus = params.date ? days.find((d) => d.date === params.date) : undefined;
  const rest = days.filter((d) => d !== focus).slice(0, 30);

  return (
    <Screen tabs={false}>
      <BackBar />
      <Txt variant="h1" accessibilityRole="header">
        {t("title")}
      </Txt>
      <View style={{ flexDirection: "row", gap: 8 }} accessibilityLabel={t("rangeLabel")}>
        {([3, 6, 12] as const).map((n) => (
          <Chip key={n} label={t("months", { n })} selected={months === n} onPress={() => setMonths(n)} />
        ))}
      </View>
      {analytics.error ? <ErrorBox error={analytics.error} onRetry={() => void analytics.reload()} /> : null}
      {!a && !analytics.error ? <Loading /> : null}
      {a && complete.length === 0 && <Empty title={t("emptyTitle")} body={t("emptyBody")} />}
      {a && complete.length > 0 && (
        <>
          <Txt variant="small" color="ink2">
            {a.summary}
          </Txt>
          <CycleLengthChart
            points={lenPoints}
            band={a.band}
            title={t("lengthTitle")}
            caption={t("lengthCaption")}
            summary={t("outside", { n: outside })}
            unit={t("daysAxis")}
          />
          <BarChart points={painPoints} max={10} ticks={[0, 5, 10]} title={t("painTitle")} caption={t("painCaption")} summary={t("severe", { n: severe })} unit="/10" />
          <BarChart
            points={pbacPoints}
            max={150}
            ticks={[0, 50, 100, 150]}
            threshold={{ value: 100, label: t("pbacThreshold") }}
            title={t("pbacTitle")}
            caption={t("pbacCaption")}
            summary={t("heavy", { n: heavy })}
            unit=""
          />
          {a.change_point && complete[a.change_point.index] && (
            <Card tone="tint">
              <Txt variant="h2">{t("changeTitle")}</Txt>
              <Txt variant="small" color="ink2">
                {t("changeBody", {
                  before: a.change_point.before,
                  after: a.change_point.after,
                  date: formatDayMonth(complete[a.change_point.index]!.start, locale),
                })}
              </Txt>
            </Card>
          )}
        </>
      )}
      <Section title={m("dayTitle")}>
        {timeline.error ? <ErrorBox error={timeline.error} onRetry={() => void timeline.reload()} /> : null}
        {focus && <DayCard day={focus} highlight />}
        {rest.map((d) => (
          <DayCard key={d.id} day={d} highlight={false} />
        ))}
      </Section>
    </Screen>
  );
}
