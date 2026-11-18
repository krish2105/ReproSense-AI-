import { router } from "expo-router";
import { useState } from "react";
import { Alert, View } from "react-native";
import { useTranslations } from "use-intl";
import { ApiError } from "@/api/errors";
import type { Postnatal, PostnatalStep } from "@/api/types";
import { useSession } from "@/auth/session";
import { SourceLinks } from "@/components/SourceLinks";
import { Button } from "@/components/ui/Button";
import { Card, Tag } from "@/components/ui/Card";
import { Txt } from "@/components/ui/Txt";
import { useI18n } from "@/i18n/i18n";
import { formatDayMonth } from "@/shared/format";
import { useTheme } from "@/theme/theme";

const TONE = { done: "ok", due: "soon", upcoming: "discuss", not_recorded: "discuss" } as const;

/** The date "I had this" records: the end of the step's window, or today if the window is still open (as the web). */
export function recordDate(step: Pick<PostnatalStep, "from" | "to">, today: string): string {
  if (step.from > today) return today;
  return step.to < today ? step.to : today;
}

/**
 * Her first 6 weeks after a birth (build week K1, DoH Postnatal Care Program Standard), as on the web: each check with
 * its window, a status that never says "missed", its sources, and "I had this" for the checks her care team does.
 * Care steps only: no score, no red flag, no diagnosis. `clinician` shows the clinic wording and no buttons.
 */
export function PostnatalCard({ p, refDate, onChanged, clinician }: { p: Postnatal; refDate: string; onChanged?: (p: Postnatal) => void; clinician?: boolean }) {
  const t = useTranslations("postnatal");
  const h = useTranslations("home");
  const { locale } = useI18n();
  const { call } = useSession();
  const { c } = useTheme();
  const [saving, setSaving] = useState<string | null>(null);

  async function save(step: PostnatalStep, date: string) {
    setSaving(step.id);
    try {
      const next = await call<Postnatal>(`/postnatal/${step.id}`, { body: { date } });
      onChanged?.(next);
      Alert.alert(t("saved"));
    } catch (e) {
      Alert.alert(t("saveFailed", { detail: e instanceof ApiError ? e.detail : String(e) }));
    } finally {
      setSaving(null);
    }
  }

  function ask(step: PostnatalStep) {
    const date = recordDate(step, refDate);
    Alert.alert(t("recordTitle"), `${t(`steps.${step.id}`)}\n\n${t("dateLabel")}: ${formatDayMonth(date, locale)}`, [
      { text: t("cancel"), style: "cancel" },
      { text: t("save"), onPress: () => void save(step, date) },
    ]);
  }

  return (
    <Card accessibilityLabel={clinician ? t("clinic.title") : t("title")}>
      {!clinician && (
        <Txt variant="label" color="accentText">
          {t("eyebrow")}
        </Txt>
      )}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <Txt variant="h2" accessibilityRole="header" style={{ flex: 1 }}>
          {clinician ? t("clinic.title") : t("title")}
        </Txt>
        <Txt variant="xs" color="faintText">
          {t("progress", { done: p.done, total: p.total })}
        </Txt>
      </View>
      <Txt variant="small" color="ink2">
        {clinician ? t("clinic.intro", { done: p.done, total: p.total, weeks: p.weeks_since_birth }) : t("intro")}
      </Txt>
      {p.steps.map((s) => (
        <View key={s.id} style={{ borderTopWidth: 1, borderTopColor: c.rule, paddingTop: 10, gap: 6 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <Txt variant="small" weight={600} style={{ flex: 1 }}>
              {clinician ? t(`clinic.steps.${s.id}`) : t(`steps.${s.id}`)}
            </Txt>
            <Tag kind={TONE[s.status]} label={t(`status.${s.status}`)} />
          </View>
          <Txt variant="xs" color="faintText">
            {s.done_on
              ? t("doneOn", { date: formatDayMonth(s.done_on, locale) })
              : t("window", { from: formatDayMonth(s.from, locale), to: formatDayMonth(s.to, locale) })}
          </Txt>
          {!clinician && s.recordable && s.status !== "done" && s.status !== "upcoming" && (
            <Button label={t("record")} kind="secondary" small busy={saving === s.id} disabled={!!saving} onPress={() => ask(s)} />
          )}
          {!clinician && s.id === "mood" && s.status === "due" && (
            <Button label={t("moodAction")} kind="secondary" small onPress={() => router.push("/checkin")} />
          )}
          <SourceLinks sources={s.source_links} label={h("sources")} />
        </View>
      ))}
      {p.discharge_assumed && (
        <Txt variant="xs" color="faintText">
          {t("assumed", { date: formatDayMonth(p.discharge_date, locale) })}
        </Txt>
      )}
      {!clinician && (
        <Txt variant="xs" color="faintText">
          {t("note")}
        </Txt>
      )}
    </Card>
  );
}
