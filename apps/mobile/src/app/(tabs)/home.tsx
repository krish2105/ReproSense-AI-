import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useTranslations } from "use-intl";
import { ApiError } from "@/api/errors";
import type { Card as CardT, DayPill, HomeResponse, LifeStage, Mood } from "@/api/types";
import { useSession } from "@/auth/session";
import { StatusArc } from "@/components/CycleArc";
import { NavigatorSheet, type DraftTarget } from "@/components/NavigatorSheet";
import { PatternCard } from "@/components/PatternCard";
import { Button } from "@/components/ui/Button";
import { Card, Chip, Section } from "@/components/ui/Card";
import { CrisisCard, PregnancyWarning, UrgentCard } from "@/components/ui/Emergency";
import { Screen } from "@/components/ui/Screen";
import { Empty, ErrorBox, Loading } from "@/components/ui/States";
import { Txt } from "@/components/ui/Txt";
import { useApi } from "@/hooks/useApi";
import { useI18n } from "@/i18n/i18n";
import { firstName, formatDate, formatDayMonth, parseIsoDate } from "@/shared/format";
import { MOODS, slug } from "@/shared/vocab";
import { useTheme } from "@/theme/theme";

function WeekStrip({ pills }: { pills: DayPill[] }) {
  const t = useTranslations("home");
  const { c } = useTheme();
  const { locale } = useI18n();
  const weekday = (iso: string) =>
    new Intl.DateTimeFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-GB", { weekday: "short", timeZone: "UTC" }).format(parseIsoDate(iso));
  return (
    <View style={{ flexDirection: "row", gap: 6 }} accessibilityLabel={t("weekLabel")}>
      {pills.map((p) => {
        const date = formatDayMonth(p.date, locale);
        const label = p.today ? t("pillToday", { date }) : !p.past ? t("pillFuture", { date }) : p.logged ? t("pillLogged", { date }) : t("pillNotLogged", { date });
        return (
          <View
            key={p.date}
            accessible
            accessibilityLabel={label}
            style={{
              flex: 1,
              alignItems: "center",
              paddingVertical: 8,
              borderRadius: 18,
              backgroundColor: p.today ? c.plum : c.sheet,
              borderWidth: 1,
              borderColor: p.today ? c.plum : c.rule,
              opacity: p.past || p.today ? 1 : 0.55,
              gap: 2,
            }}
          >
            <Txt variant="xs" style={{ color: p.today ? c.plumInk : c.ink2, fontSize: 11 }}>
              {weekday(p.date)}
            </Txt>
            <Txt variant="small" weight={700} style={{ color: p.today ? c.plumInk : c.ink }}>
              {p.day}
            </Txt>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: p.flow ? c.phM : p.logged ? c.ok : "transparent" }} />
          </View>
        );
      })}
    </View>
  );
}

function MoodRow({ current, onSaved }: { current: Mood | null; onSaved: (m: Mood) => void }) {
  const t = useTranslations("home");
  const moods = useTranslations("moods");
  const { c } = useTheme();
  const { call } = useSession();
  const [msg, setMsg] = useState<string | null>(null);
  async function save(m: Mood) {
    try {
      await call("/mood", { body: { mood: m } });
      onSaved(m);
      setMsg(t("moodSaved", { mood: moods(slug(m)) }));
    } catch (e) {
      setMsg(t("moodFailed", { detail: e instanceof ApiError ? e.detail : String(e) }));
    }
  }
  return (
    <Section title={t("moodTitle")}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }} accessibilityLabel={t("moodLabel")}>
        {MOODS.map((m) => {
          const on = current === m.value;
          return (
            <Pressable
              key={m.value}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={moods(slug(m.value))}
              onPress={() => void save(m.value)}
              style={{
                minHeight: 64,
                minWidth: 64,
                flexGrow: 1,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 18,
                backgroundColor: on ? c.plum : c.sheet,
                borderWidth: 1,
                borderColor: on ? c.plum : c.rule,
                gap: 2,
              }}
            >
              <Txt variant="h2">{m.emoji}</Txt>
              <Txt variant="xs" weight={600} style={{ color: on ? c.plumInk : c.ink2 }}>
                {moods(slug(m.value))}
              </Txt>
            </Pressable>
          );
        })}
      </View>
      {msg && (
        <Txt variant="xs" color="ink2" accessibilityLiveRegion="polite">
          {msg}
        </Txt>
      )}
    </Section>
  );
}

// The stage switch opens the fictional woman who represents that stage (as on the web, HANDOFF §5 login model).
const STAGES: readonly { stage: LifeStage; persona: string; name: string }[] = [
  { stage: "periods", persona: "noura", name: "Noura" },
  { stage: "trying_to_conceive", persona: "mariam", name: "Mariam" },
  { stage: "pregnancy", persona: "hessa", name: "Hessa" },
  { stage: "after_birth", persona: "fatima", name: "Fatima" },
  { stage: "perimenopause", persona: "layla", name: "Layla" },
];

function StageSwitch({ current }: { current: LifeStage }) {
  const t = useTranslations();
  const { signInAs } = useSession();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  async function open(s: (typeof STAGES)[number]) {
    if (busy || s.stage === current) return;
    setBusy(true);
    try {
      await signInAs(s.persona);
      setMsg(t("home.stageSwitched", { name: s.name }));
    } catch (e) {
      setMsg(t("home.stageFailed", { detail: e instanceof ApiError ? e.detail : String(e) }));
    } finally {
      setBusy(false);
    }
  }
  return (
    <View style={{ gap: 6 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
        accessibilityLabel={t("home.stagesLabel")}
      >
        {STAGES.map((s) => (
          <Chip key={s.stage} label={t(`stages.${s.stage}`)} selected={s.stage === current} onPress={() => void open(s)} />
        ))}
      </ScrollView>
      {msg && (
        <Txt variant="xs" color="ink2" accessibilityLiveRegion="polite">
          {msg}
        </Txt>
      )}
    </View>
  );
}

/** The care navigator for the pattern that is due now (web NavigatorCard): it only drafts, she approves. */
function NavigatorHomeCard({ card, dueDate, approved, onOpen }: { card: CardT; dueDate?: string | null; approved: boolean; onOpen: () => void }) {
  const t = useTranslations();
  const { locale } = useI18n();
  const { c } = useTheme();
  return (
    <Card tone="plum" style={{ borderColor: c.plum }}>
      <Txt variant="label" style={{ color: c.plumInk, opacity: 0.85 }}>
        {t("navigator.eyebrow")}
      </Txt>
      <Txt variant="h2" style={{ color: c.plumInk }}>
        {card.title}
      </Txt>
      {dueDate && (
        <Txt variant="xs" style={{ color: c.plumInk, opacity: 0.9 }}>
          {t("home.dueBy", { date: formatDayMonth(dueDate, locale) })}
        </Txt>
      )}
      <Txt variant="small" style={{ color: c.plumInk, opacity: 0.9 }}>
        {approved ? t("navigator.approvedState") : t("navigator.note")}
      </Txt>
      <Button label={approved ? t("navigator.viewApproved") : t("navigator.review")} kind="secondary" small onPress={onOpen} />
    </Card>
  );
}

export default function Home() {
  const t = useTranslations("home");
  const checkin = useTranslations("checkin");
  const { locale } = useI18n();
  const { data, error, loading, reload, setData } = useApi<HomeResponse>(`/me/home?lang=${locale}`);
  const [target, setTarget] = useState<DraftTarget | null>(null);

  if (!data) {
    return <Screen>{error ? <ErrorBox error={error} onRetry={() => void reload()} /> : <Loading />}</Screen>;
  }
  const name = firstName(data.profile.alias);
  const strength = t(`strength.${data.record_strength}`);
  const mode = data.status.mode;
  const soon = data.observations.find((o) => o.urgency === "soon");
  const gap = soon ? data.care_gaps.find((g) => g.type === soon.creates_care_gap) : undefined;
  const latestDraft = soon ? data.navigator_drafts.find((d) => d.rule_id === soon.observation_id && d.status !== "discarded") : undefined;
  const peri = data.observations.find((o) => o.observation_id === "OBS_PERIMENOPAUSE_SYMPTOMS");
  const vasomotor = peri ? Number(peri.values.vasomotor_days_90 ?? NaN) : NaN;
  return (
    <Screen refreshing={loading} onRefresh={() => void reload()}>
      {data.crisis && <CrisisCard />}
      {data.red_flags.length > 0 && (
        <Section title={t("urgentTitle")}>
          {data.red_flags.map((card) => (
            <UrgentCard key={card.observation_id} card={card} />
          ))}
        </Section>
      )}

      <View style={{ gap: 2 }}>
        <Txt variant="small" color="ink2">
          {t("hello", { name })}
        </Txt>
        <Txt variant="h1" accessibilityRole="header">
          {t("sub", { date: formatDate(data.ref_date, locale) })}
        </Txt>
      </View>
      {/* The stage switch opens a fictional demo person; on a record she started herself it would leave her own. */}
      {!data.profile.id.startsWith("guest-") && <StageSwitch current={data.profile.life_stage} />}

      {mode === "cycle" && <WeekStrip pills={data.day_pills} />}
      <StatusArc status={data.status} peri={data.profile.life_stage === "perimenopause"} />
      {mode === "pregnancy" && <PregnancyWarning />}
      <View style={{ gap: 10 }}>
        <Button label={t("logButton")} onPress={() => router.push("/log")} />
        <Button label={t("reportButton")} kind="secondary" onPress={() => router.push("/report")} />
      </View>

      {(mode === "after_birth" || mode === "pregnancy") && !data.crisis && (
        <Card>
          <Txt variant="label" color="accentText">
            {checkin("cardTitle")}
          </Txt>
          <Txt variant="small" color="ink2">
            {checkin("cardBody")}
          </Txt>
          <Button label={checkin("cardAction")} kind="secondary" small onPress={() => router.push("/checkin")} />
        </Card>
      )}

      {soon && (
        <NavigatorHomeCard
          key={`${data.profile.id}-${soon.observation_id}`}
          card={soon}
          dueDate={gap?.due_date}
          approved={latestDraft?.status === "approved"}
          onOpen={() => setTarget({ ruleId: soon.observation_id, title: soon.title, sources: soon.sources })}
        />
      )}

      {!data.crisis && data.recommendations.length > 0 && (
        <Section title={t("recsTitle")}>
          {data.recommendations.map((r) => (
            <Card key={`${r.rule}-${r.kind}`}>
              <Txt variant="label" color="accentText">
                {r.kind === "next_step" ? t("nextStep") : t("askDoctor")}
              </Txt>
              <Txt variant="body">{r.text}</Txt>
            </Card>
          ))}
        </Section>
      )}

      {!data.crisis && <MoodRow current={data.today_mood} onSaved={(m) => setData({ ...data, today_mood: m })} />}

      {Number.isFinite(vasomotor) && (
        <Card>
          <Txt variant="label" color="ink2">
            {t("periTitle")}
          </Txt>
          <Txt variant="display" style={{ fontVariant: ["tabular-nums"] }}>
            {t("periDays", { count: vasomotor })}
          </Txt>
        </Card>
      )}

      {!data.crisis && (
        <Section
          title={t("patternsTitle")}
          action={
            data.observations.length > 0 ? (
              <Button label={t("seeAll")} kind="ghost" small onPress={() => router.push("/patterns")} />
            ) : undefined
          }
        >
          {data.observations.length === 0 ? (
            <Empty title={t("noneTitle")} body={t("noneBody")} />
          ) : (
            data.observations.slice(0, 2).map((card) => <PatternCard key={card.observation_id} card={card} compact />)
          )}
        </Section>
      )}

      <Txt variant="xs" color="faintText" align="center">
        {t("record", { count: data.log_count, strength })}
      </Txt>
      <NavigatorSheet target={target} onClose={() => setTarget(null)} onChanged={() => void reload()} />
    </Screen>
  );
}
