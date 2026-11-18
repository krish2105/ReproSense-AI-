import * as Haptics from "expo-haptics";
import { useRef, useState } from "react";
import { View, type ScrollViewInstance } from "react-native";
import { useTranslations } from "use-intl";
import { ApiError } from "@/api/errors";
import type { BpBody, BpReading, BpResult, Card as CardT, HomeResponse } from "@/api/types";
import { useSession } from "@/auth/session";
import { NG133 } from "@/components/care/BloodPressureCard";
import { SourceLinks } from "@/components/SourceLinks";
import { Button } from "@/components/ui/Button";
import { Card, Section, Tag } from "@/components/ui/Card";
import { CrisisCard, UrgentCard, call998 } from "@/components/ui/Emergency";
import { Field } from "@/components/ui/Field";
import { BackBar } from "@/components/ui/Row";
import { Screen } from "@/components/ui/Screen";
import { ErrorBox, Loading } from "@/components/ui/States";
import { Txt } from "@/components/ui/Txt";
import { useApi } from "@/hooks/useApi";
import { useI18n } from "@/i18n/i18n";
import { BP_RANGE, bpLevel, bpProblem, bpText } from "@/shared/bp";
import { formatDayMonth } from "@/shared/format";
import { SOURCES } from "@/shared/sources";

const RECHECK = "OBS_RAISED_BLOOD_PRESSURE";
const NG201 = { source_id: SOURCES.nice_ng201.id, title: SOURCES.nice_ng201.title, url: SOURCES.nice_ng201.url };

/**
 * Log a blood-pressure reading (build week K6, POST /v1/bp), in pregnancy and the 12 weeks after birth. The rules run on
 * save: an urgent card (RF7, NICE NG133) comes back in the same answer and shows first, with 998.
 */
export default function BloodPressure() {
  const t = useTranslations("bp");
  const h = useTranslations("home");
  const tags = useTranslations("tags");
  const u = useTranslations("urgent");
  const { locale } = useI18n();
  const { call } = useSession();
  const home = useApi<HomeResponse>(`/me/home?lang=${locale}`);
  const [sys, setSys] = useState("");
  const [dia, setDia] = useState("");
  const [time, setTime] = useState("");
  const [problem, setProblem] = useState<"range" | "order" | null>(null);
  const [tooHigh, setTooHigh] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [result, setResult] = useState<{ flags: CardT[]; crisis: boolean; recheck: BpReading | null } | null>(null);
  const scroll = useRef<ScrollViewInstance>(null);

  if (!home.data) {
    return (
      <Screen tabs={false}>
        <BackBar />
        {home.error ? <ErrorBox error={home.error} onRetry={() => void home.reload()} /> : <Loading />}
      </Screen>
    );
  }
  const date = home.data.ref_date;
  const bp = home.data.blood_pressure;

  async function save() {
    const s = Number(sys);
    const d = Number(dia);
    const why = sys.trim() && dia.trim() ? bpProblem(s, d) : "range";
    setProblem(why);
    setTooHigh(why === "range" && (s > BP_RANGE.systolic[1] || d > BP_RANGE.diastolic[1]));
    if (why) return;
    const body: BpBody = { date, systolic: s, diastolic: d, time: /^\d{2}:\d{2}$/.test(time) ? time : null };
    setBusy(true);
    setMsg(null);
    try {
      const r = await call<BpResult>(`/bp?lang=${locale}`, { body });
      const recheck = r.patterns.includes(RECHECK) && !r.red_flags.length ? r.reading : null;
      setResult(r.red_flags.length || r.crisis || recheck ? { flags: r.red_flags, crisis: r.crisis, recheck } : null);
      if (!r.red_flags.length) setMsg(t("saved", { reading: bpText(r.reading) }));
      const urgent = r.crisis || r.red_flags.length > 0;
      void Haptics.notificationAsync(urgent ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success).catch(() => {});
      setSys("");
      setDia("");
      setTime("");
      void home.reload();
    } catch (e) {
      setMsg(t("saveFailed", { detail: e instanceof ApiError ? e.detail : String(e) }));
    } finally {
      setBusy(false);
      scroll.current?.scrollTo({ y: 0, animated: true });
    }
  }

  return (
    <Screen tabs={false} scrollRef={scroll}>
      <BackBar />
      <Txt variant="h1" accessibilityRole="header">
        {t("title")}
      </Txt>

      {result?.crisis && <CrisisCard />}
      {result && result.flags.length > 0 && (
        <Section title={t("urgentHeading")}>
          {result.flags.map((card) => (
            <UrgentCard key={card.observation_id} card={card} />
          ))}
        </Section>
      )}
      {result?.recheck && (
        <Card>
          <Tag kind="soon" label={tags("soon")} />
          <Txt variant="h2">{t("recheckTitle")}</Txt>
          <Txt variant="small">{t("recheckBody", { reading: bpText(result.recheck) })}</Txt>
          <SourceLinks sources={[NG133, NG201]} label={h("sources")} />
        </Card>
      )}
      {msg && (
        <Card tone="tint" accessibilityLiveRegion="polite">
          <Txt variant="small" weight={600}>
            {msg}
          </Txt>
        </Card>
      )}

      {!bp.eligible ? (
        <Card>
          <Txt variant="small">{t("intro")}</Txt>
        </Card>
      ) : (
        <Card>
          <Txt variant="small" color="ink2">
            {t("intro")}
          </Txt>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Field label={t("systolic")} value={sys} onChangeText={setSys} keyboardType="number-pad" maxLength={3} />
            </View>
            <View style={{ flex: 1 }}>
              <Field label={t("diastolic")} value={dia} onChangeText={setDia} keyboardType="number-pad" maxLength={3} />
            </View>
          </View>
          <Txt variant="xs" color={problem ? "urgent" : "faintText"} accessibilityLiveRegion="polite">
            {problem === "order" ? t("orderError") : t("rangeHint")}
          </Txt>
          {tooHigh && (
            <View style={{ gap: 8 }}>
              <Txt variant="small" weight={600}>
                {t("rangeHigh")}
              </Txt>
              <Button label={u("call")} kind="urgent" small onPress={call998} />
            </View>
          )}
          <Field label={t("time")} hint="HH:MM" value={time} onChangeText={setTime} keyboardType="numbers-and-punctuation" maxLength={5} />
          <Button label={t("save", { date: formatDayMonth(date, locale) })} busy={busy} onPress={() => void save()} />
        </Card>
      )}

      <Card tone="urgentSoft" style={{ borderColor: "transparent" }}>
        <Txt variant="small" weight={600}>
          {t("warn")}
        </Txt>
        <Button label={u("call")} kind="urgent" small onPress={call998} />
      </Card>

      {bp.recent.length > 0 && (
        <Section title={t("tableTitle")}>
          {bp.recent.map((r) => {
            const level = bpLevel(r);
            return (
              <Card key={r.id} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ gap: 2 }}>
                  <Txt variant="body" weight={700} style={{ writingDirection: "ltr", fontVariant: ["tabular-nums"] }}>
                    {t("reading", { reading: bpText(r) })}
                  </Txt>
                  <Txt variant="xs" color="faintText">
                    {r.time ? t("at", { date: formatDayMonth(r.date, locale), time: r.time }) : formatDayMonth(r.date, locale)}
                  </Txt>
                </View>
                {level && <Tag kind={level === "severe" ? "urgent" : "soon"} label={t(level === "severe" ? "noteSevere" : "noteRaised")} />}
              </Card>
            );
          })}
        </Section>
      )}
      <SourceLinks sources={[NG133]} label={h("sources")} />
    </Screen>
  );
}
