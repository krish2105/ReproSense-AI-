import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, View } from "react-native";
import { useTranslations } from "use-intl";
import type { ClinicPatientsResponse } from "@/api/types";
import { useSession } from "@/auth/session";
import { ClinicianBar } from "@/components/ClinicianBar";
import { Card, Tag } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { Empty, ErrorBox, Loading } from "@/components/ui/States";
import { Txt } from "@/components/ui/Txt";
import { useI18n } from "@/i18n/i18n";
import { shownName } from "@/shared/format";
import { useTheme } from "@/theme/theme";

/** The clinic's list: only women who shared a report, red flags first (GET /v1/clinic/patients). */
export default function ClinicianList() {
  const t = useTranslations("clinic");
  const stages = useTranslations("stages");
  const { locale } = useI18n();
  const { clinicianCall } = useSession();
  const { c } = useTheme();
  const [data, setData] = useState<ClinicPatientsResponse | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await clinicianCall<ClinicPatientsResponse>("/clinic/patients"));
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [clinicianCall]);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <Screen tabs={false} refreshing={loading && !!data} onRefresh={() => void load()}>
      <ClinicianBar />
      <Txt variant="small" color="ink2">
        {t("intro")}
      </Txt>
      {error ? <ErrorBox error={error} onRetry={() => void load()} /> : null}
      {!data && !error ? <Loading /> : null}
      {data && data.patients.length === 0 && <Empty title={t("emptyTitle")} body={t("emptyBody")} />}
      {data && data.patients.length > 0 && (
        <View style={{ gap: 10 }} accessibilityLabel={t("listLabel")}>
          {data.patients.map((p) => (
            <Pressable
              key={p.id}
              accessibilityRole="button"
              onPress={() => router.push(`/clinician/${p.id}`)}
              style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
            >
              <Card style={p.red_flags > 0 ? { borderColor: c.urgent } : undefined}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Txt variant="h2">{shownName(p.alias, locale)}</Txt>
                    <Txt variant="xs" color="ink2">
                      {t("rowMeta", { age: p.age, open: p.open_obs, reviewed: p.reviewed_at ? "yes" : "no" })} · {stages(p.life_stage)}
                    </Txt>
                  </View>
                  {p.red_flags > 0 && <Tag kind="urgent" label={t("redFlags", { count: p.red_flags })} />}
                </View>
                <Txt variant="xs" color={p.open_gaps > 0 ? "warnText" : "faintText"}>
                  {t("openGaps", { count: p.open_gaps })}
                </Txt>
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}
