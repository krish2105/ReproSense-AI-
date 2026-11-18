import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, View } from "react-native";
import { useTranslations } from "use-intl";
import { ApiError } from "@/api/errors";
import type { ClinicGap, ClinicRecord } from "@/api/types";
import { useSession } from "@/auth/session";
import { BriefSection } from "@/components/care/BriefSection";
import { PostnatalCard } from "@/components/care/PostnatalCard";
import { ClinicianBar } from "@/components/ClinicianBar";
import { SourceLinks } from "@/components/SourceLinks";
import { Bullets, Card, Section, Tag } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BackBar } from "@/components/ui/Row";
import { Screen } from "@/components/ui/Screen";
import { ErrorBox, Loading } from "@/components/ui/States";
import { Txt } from "@/components/ui/Txt";
import { useI18n } from "@/i18n/i18n";
import { bpLevel, bpText } from "@/shared/bp";
import { formatDate, formatDayMonth, shownName } from "@/shared/format";
import { useTheme } from "@/theme/theme";

const NEXT: Record<ClinicGap["status"], ClinicGap["status"]> = { open: "in_progress", in_progress: "closed", closed: "open" };

/**
 * One patient's 30-second summary for the clinician (GET /v1/clinic/patients/{id}): SBAR handover, red flags first,
 * the patterns in clinician wording with their evidence, follow-ups (mark booked or done), the after-birth pathway,
 * her blood-pressure readings and the pre-visit brief. The same record she sees, never a diagnosis.
 */
export default function ClinicianRecord() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTranslations("clinic");
  const h = useTranslations("home");
  const bp = useTranslations("bp");
  const stages = useTranslations("stages");
  const { locale } = useI18n();
  const { c } = useTheme();
  const { clinicianCall } = useSession();
  const [data, setData] = useState<ClinicRecord | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [busyGap, setBusyGap] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await clinicianCall<ClinicRecord>(`/clinic/patients/${encodeURIComponent(id ?? "")}`));
    } catch (e) {
      setError(e);
    }
  }, [clinicianCall, id]);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function moveGap(g: ClinicGap) {
    const status = NEXT[g.status];
    setBusyGap(g.id);
    try {
      await clinicianCall(`/clinic/care-gaps/${g.id}`, { method: "PATCH", body: { status } });
      Alert.alert(t("gapUpdated", { status: t(`gapStatus.${status}`) }));
      await load();
    } catch (e) {
      Alert.alert(t("gapFailed", { detail: e instanceof ApiError ? e.detail : String(e) }));
    } finally {
      setBusyGap(null);
    }
  }

  if (!data) {
    return (
      <Screen tabs={false}>
        <ClinicianBar />
        <BackBar />
        {error ? <ErrorBox error={error} onRetry={() => void load()} /> : <Loading />}
      </Screen>
    );
  }
  const flags = data.cards.filter((k) => k.kind === "red_flag");
  const patterns = data.cards.filter((k) => k.kind !== "red_flag");
  return (
    <Screen tabs={false}>
      <ClinicianBar />
      <BackBar />
      <View style={{ gap: 4 }}>
        <Txt variant="label" color="accentText">
          {t("preVisit")}
        </Txt>
        <Txt variant="h1" accessibilityRole="header">
          {shownName(data.profile.alias, locale)}
        </Txt>
        <Txt variant="small" color="ink2">
          {data.profile.age} · {stages(data.profile.life_stage)} · {t("sharedNote", { count: data.days_logged })}
        </Txt>
      </View>

      {data.crisis && (
        <Card tone="urgentSoft" style={{ borderColor: c.urgent }} accessibilityRole="alert">
          <Txt variant="h2" style={{ color: c.urgent }}>
            {t("crisisTitle")}
          </Txt>
          <Txt variant="small">{t("crisisBody")}</Txt>
        </Card>
      )}
      {flags.length > 0 && (
        <Section title={t("redFlagsTitle")}>
          {flags.map((k) => (
            <Card key={k.observation_id} tone="urgentSoft" style={{ borderColor: c.urgent }}>
              <Txt variant="h2" style={{ color: c.urgent }}>
                {k.clinician_title ?? k.title}
              </Txt>
              <Txt variant="small">{k.summary}</Txt>
              {k.entry_date && (
                <Txt variant="xs" color="ink2">
                  {h("loggedOn", { date: formatDayMonth(k.entry_date, locale) })}
                </Txt>
              )}
              <SourceLinks sources={k.sources} label={h("sources")} />
            </Card>
          ))}
        </Section>
      )}

      <Section title={t("sbarTitle")}>
        <Card>
          <Txt variant="label" color="ink2">
            {t("s")}
          </Txt>
          <Txt variant="small">{data.sbar.situation}</Txt>
          <Txt variant="label" color="ink2">
            {t("b")}
          </Txt>
          <Txt variant="small">{data.sbar.background}</Txt>
          <Txt variant="label" color="ink2">
            {t("a")}
          </Txt>
          <Bullets items={data.sbar.assessment} />
          <Txt variant="label" color="ink2">
            {t("r")}
          </Txt>
          <Bullets items={data.sbar.recommendation} />
        </Card>
      </Section>

      {data.care_gaps.length > 0 && (
        <Section title={t("gapsTitle")}>
          {data.care_gaps.map((g) => (
            <Card key={g.id}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <Txt variant="small" weight={700} style={{ flex: 1 }}>
                  {t.has(`gapType.${g.type}`) ? t(`gapType.${g.type}`) : t("gapType.other")}
                </Txt>
                <Tag kind={g.status === "closed" ? "ok" : "soon"} label={t(`gapStatus.${g.status}`)} />
              </View>
              {g.due_date && (
                <Txt variant="xs" color="ink2">
                  {t("gapDue", { date: formatDate(g.due_date, locale) })}
                </Txt>
              )}
              <Button
                label={g.status === "open" ? t("gapBook") : g.status === "in_progress" ? t("gapDone") : t("gapReopen")}
                kind={g.status === "closed" ? "ghost" : "secondary"}
                small
                busy={busyGap === g.id}
                disabled={busyGap !== null}
                onPress={() => void moveGap(g)}
              />
            </Card>
          ))}
        </Section>
      )}

      {data.postnatal && <PostnatalCard p={data.postnatal} refDate={data.previsit_brief.ref_date} clinician />}

      {data.bp_readings.length > 0 && (
        <Section title={bp("clinicTitle")}>
          <Txt variant="xs" color="ink2">
            {bp("clinicIntro", { count: data.bp_readings.length })}
          </Txt>
          {data.bp_readings.slice(0, 6).map((r) => {
            const level = bpLevel(r);
            return (
              <Card key={r.id} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ gap: 2 }}>
                  <Txt variant="body" weight={700} style={{ writingDirection: "ltr", fontVariant: ["tabular-nums"] }}>
                    {bp("reading", { reading: bpText(r) })}
                  </Txt>
                  <Txt variant="xs" color="faintText">
                    {r.time ? bp("at", { date: formatDayMonth(r.date, locale), time: r.time }) : formatDayMonth(r.date, locale)}
                  </Txt>
                </View>
                {level && <Tag kind={level === "severe" ? "urgent" : "soon"} label={bp(level === "severe" ? "noteSevere" : "noteRaised")} />}
              </Card>
            );
          })}
        </Section>
      )}

      {patterns.length > 0 && (
        <Section title={t("patternsTitle")}>
          {patterns.map((k) => (
            <Card key={k.observation_id}>
              <Txt variant="h2">{k.clinician_title ?? k.title}</Txt>
              <Txt variant="small" color="ink2">
                {k.summary}
              </Txt>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {k.why_we_noticed.slice(0, 4).map((e) => (
                  <View key={e.entry_id} style={{ backgroundColor: c.tint, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Txt variant="xs">{e.text}</Txt>
                  </View>
                ))}
              </View>
              <SourceLinks sources={k.sources} label={h("sources")} />
            </Card>
          ))}
        </Section>
      )}

      <Card>
        <BriefSection brief={data.previsit_brief} audience="clinician" />
      </Card>

      {data.her_questions.length > 0 && (
        <Section title={t("questionsTitle")}>
          <Card>
            <Bullets items={data.her_questions} />
          </Card>
        </Section>
      )}
    </Screen>
  );
}
