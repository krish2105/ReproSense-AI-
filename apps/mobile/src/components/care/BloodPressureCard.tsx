import { router } from "expo-router";
import { View } from "react-native";
import { useTranslations } from "use-intl";
import type { BpSummary } from "@/api/types";
import { SourceLinks } from "@/components/SourceLinks";
import { Button } from "@/components/ui/Button";
import { Card, Tag } from "@/components/ui/Card";
import { Txt } from "@/components/ui/Txt";
import { useI18n } from "@/i18n/i18n";
import { bpLevel, bpText } from "@/shared/bp";
import { formatDayMonth } from "@/shared/format";
import { SOURCES } from "@/shared/sources";

export const NG133 = { source_id: SOURCES.nice_ng133.id, title: SOURCES.nice_ng133.title, url: SOURCES.nice_ng133.url };

/**
 * Her latest blood-pressure reading on home (build week K6), in pregnancy and the 12 weeks after birth: the number and
 * a button to log the next one. Any urgent card for a reading is already at the top of home (red flags first).
 */
export function BloodPressureCard({ bp }: { bp: BpSummary }) {
  const t = useTranslations("bp");
  const h = useTranslations("home");
  const { locale } = useI18n();
  const r = bp.latest;
  const level = r ? bpLevel(r) : null;
  return (
    <Card>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <Txt variant="h2" accessibilityRole="header">
          {t("title")}
        </Txt>
        {level && <Tag kind={level === "severe" ? "urgent" : "soon"} label={t(level === "severe" ? "noteSevere" : "noteRaised")} />}
      </View>
      {r ? (
        <>
          <Txt variant="display" style={{ writingDirection: "ltr", fontVariant: ["tabular-nums"] }}>
            {bpText(r)} <Txt variant="small" color="ink2">{t("unit")}</Txt>
          </Txt>
          <Txt variant="xs" color="faintText">
            {t("homeLatest", {
              when: r.time ? t("at", { date: formatDayMonth(r.date, locale), time: r.time }) : formatDayMonth(r.date, locale),
            })}
          </Txt>
        </>
      ) : (
        <Txt variant="small">{t("homeNone")}</Txt>
      )}
      <Txt variant="small" color="ink2">
        {t("warn")}
      </Txt>
      <Button label={t("homeAction")} kind="secondary" small onPress={() => router.push("/bp")} />
      <SourceLinks sources={[NG133]} label={h("sources")} />
    </Card>
  );
}
