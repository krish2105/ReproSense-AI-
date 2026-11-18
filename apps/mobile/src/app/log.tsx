import { useRef, useState } from "react";
import * as Haptics from "expo-haptics";
import { Pressable, TextInput, View, type ScrollViewInstance } from "react-native";
import { useTranslations } from "use-intl";
import { ApiError } from "@/api/errors";
import type { Flow, HomeResponse, Impact, LogBody, LogResult, PainSite, ParseResult, PbacItems } from "@/api/types";
import { useSession } from "@/auth/session";
import { Button } from "@/components/ui/Button";
import { Card, Chip, Section } from "@/components/ui/Card";
import { CrisisCard, UrgentCard } from "@/components/ui/Emergency";
import { BackBar } from "@/components/ui/Row";
import { Screen } from "@/components/ui/Screen";
import { ErrorBox, Loading } from "@/components/ui/States";
import { Txt, useFontFamily } from "@/components/ui/Txt";
import { useApi } from "@/hooks/useApi";
import { useI18n } from "@/i18n/i18n";
import { formatDayMonth } from "@/shared/format";
import { COMMON_SYMPTOMS, FLOWS, IMPACTS, MORE_SYMPTOMS, PBAC_WEIGHTS, pbacScore, slug } from "@/shared/vocab";
import { useTheme } from "@/theme/theme";

const SITES: PainSite[] = ["lower abdomen", "upper abdomen", "left pelvis", "right pelvis", "lower back"];
type Group = keyof typeof PBAC_WEIGHTS;

function Stepper({ label, value, onChange, a11yMore, a11yFewer }: { label: string; value: number; onChange: (n: number) => void; a11yMore: string; a11yFewer: string }) {
  const { c } = useTheme();
  const btn = (txt: string, a11y: string, next: number) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      onPress={() => onChange(Math.max(0, next))}
      style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.tint, borderWidth: 1, borderColor: c.rule2, alignItems: "center", justifyContent: "center" }}
    >
      <Txt variant="h2">{txt}</Txt>
    </Pressable>
  );
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <Txt variant="small" style={{ flex: 1 }}>
        {label}
      </Txt>
      {btn("−", a11yFewer, value - 1)}
      <Txt variant="body" weight={700} style={{ minWidth: 24, textAlign: "center" }} accessibilityLiveRegion="polite">
        {value}
      </Txt>
      {btn("+", a11yMore, value + 1)}
    </View>
  );
}

export default function Log() {
  const t = useTranslations("log");
  const flows = useTranslations("flows");
  const impacts = useTranslations("impacts");
  const sites = useTranslations("sites");
  const symptoms = useTranslations("symptoms");
  const { locale } = useI18n();
  const { c } = useTheme();
  const font = useFontFamily();
  const { call } = useSession();
  const home = useApi<HomeResponse>(`/me/home?lang=${locale}`);
  const [flow, setFlow] = useState<Flow>("none");
  const [pain, setPain] = useState(0);
  const [painSites, setPainSites] = useState<PainSite[]>([]);
  const [chosen, setChosen] = useState<string[]>([]);
  const [impact, setImpact] = useState<Impact>("none");
  const [sleep, setSleep] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [pbac, setPbac] = useState<PbacItems>({});
  const [showMore, setShowMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [result, setResult] = useState<LogResult | null>(null);
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
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const setCount = (g: Group, k: string, n: number) => setPbac((p) => ({ ...p, [g]: { ...(p[g] as Record<string, number> | undefined), [k]: n } }));

  async function readNote() {
    if (!note.trim()) return;
    try {
      const r = await call<ParseResult>("/logs/parse", { body: { text: note.trim() } });
      if (r.flow) setFlow(r.flow);
      if (r.impact) setImpact(r.impact);
      if (r.pain !== null) setPain(r.pain);
      if (r.symptoms.length) setChosen((cur) => Array.from(new Set([...cur, ...r.symptoms])));
      setMsg(r.matched.length ? t("parsed", { items: r.matched.join(", ") }) : t("parsedNone"));
    } catch (e) {
      setMsg(t("parseFailed", { detail: e instanceof ApiError ? e.detail : String(e) }));
    }
  }

  async function save() {
    setBusy(true);
    setMsg(null);
    const body: LogBody = {
      date,
      flow,
      pain,
      pain_sites: painSites,
      symptoms: chosen,
      impact,
      sleep_h: sleep,
      pbac_items: flow === "none" ? null : pbac,
      note: note.trim(),
    };
    try {
      const r = await call<LogResult>("/logs", { body });
      setResult(r);
      setMsg(t("saved"));
      // A short confirmation on the phone; a warning pattern when the save brought back urgent guidance.
      const urgent = r.crisis || r.red_flags.length > 0;
      void Haptics.notificationAsync(urgent ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (e) {
      setMsg(t("saveFailed", { detail: e instanceof ApiError ? e.detail : String(e) }));
    } finally {
      setBusy(false);
      // The outcome (and any red flag, 998 first) sits at the top: bring it into view at once, not after a scroll.
      scroll.current?.scrollTo({ y: 0, animated: true });
    }
  }

  return (
    <Screen tabs={false} scrollRef={scroll}>
      <BackBar />
      <Txt variant="h1" accessibilityRole="header">
        {t("formToday", { date: formatDayMonth(date, locale) })}
      </Txt>

      {result?.crisis && <CrisisCard />}
      {result && result.red_flags.length > 0 && (
        <Section title={t("urgentHeading")}>
          {result.red_flags.map((card) => (
            <UrgentCard key={card.observation_id} card={card} />
          ))}
        </Section>
      )}
      {msg && (
        <Card tone="tint" accessibilityLiveRegion="polite">
          <Txt variant="small" weight={600}>
            {msg}
          </Txt>
        </Card>
      )}

      <Section title={t("flow")}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {FLOWS.map((f) => (
            <Chip key={f} label={flows(f)} selected={flow === f} onPress={() => setFlow(f)} />
          ))}
        </View>
      </Section>

      {flow !== "none" && (
        <Card>
          <Txt variant="h2">{t("pbacTitle", { score: pbacScore(pbac) })}</Txt>
          <Txt variant="xs" color="ink2">
            {t("pbacHint")}
          </Txt>
          {(Object.keys(PBAC_WEIGHTS) as Group[]).flatMap((g) =>
            Object.keys(PBAC_WEIGHTS[g]).map((k) => {
              const item = t(`pbacItems.${g}_${k}`);
              const value = ((pbac[g] as Record<string, number> | undefined)?.[k]) ?? 0;
              return (
                <Stepper
                  key={`${g}-${k}`}
                  label={`${item} ${t("pbacWeight", { n: (PBAC_WEIGHTS[g] as Record<string, number>)[k] ?? 0 })}`}
                  value={value}
                  onChange={(n) => setCount(g, k, n)}
                  a11yMore={t("more", { item })}
                  a11yFewer={t("fewer", { item })}
                />
              );
            }),
          )}
        </Card>
      )}

      <Section title={t("pain", { pain })}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {Array.from({ length: 11 }, (_, n) => (
            <Chip key={n} label={String(n)} selected={pain === n} onPress={() => setPain(n)} style={{ minWidth: 44, alignItems: "center" }} />
          ))}
        </View>
      </Section>

      <Section title={t("bodyTitle")}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {SITES.map((s) => (
            <Chip key={s} label={sites(slug(s))} selected={painSites.includes(s)} onPress={() => setPainSites((cur) => toggle(cur, s))} />
          ))}
        </View>
      </Section>

      <Section title={t("symptomsTitle")}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {[...COMMON_SYMPTOMS, ...(showMore ? MORE_SYMPTOMS : [])].map((s) => (
            <Chip key={s} label={symptoms(slug(s))} selected={chosen.includes(s)} onPress={() => setChosen((cur) => toggle(cur, s))} />
          ))}
        </View>
        {!showMore && <Button label={t("moreSymptoms")} kind="ghost" small onPress={() => setShowMore(true)} />}
      </Section>

      <Section title={t("impactTitle")}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {IMPACTS.map((i) => (
            <Chip key={i} label={impacts(slug(i))} selected={impact === i} onPress={() => setImpact(i)} />
          ))}
        </View>
      </Section>

      <Card>
        <Stepper
          label={t("sleep")}
          value={sleep ?? 0}
          onChange={(n) => setSleep(Math.min(n, 16))}
          a11yMore={t("more", { item: t("sleep") })}
          a11yFewer={t("fewer", { item: t("sleep") })}
        />
      </Card>

      <Section title={t("noteLabel")}>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder={t("notePlaceholder")}
          placeholderTextColor={c.faintText}
          accessibilityLabel={t("noteLabel")}
          multiline
          maxLength={600}
          style={{
            minHeight: 88,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: c.rule2,
            backgroundColor: c.sheet,
            padding: 14,
            color: c.ink,
            fontFamily: font(400),
            fontSize: 16,
            textAlignVertical: "top",
            textAlign: locale === "ar" ? "right" : "left",
          }}
        />
        <Button label={t("readNote")} kind="secondary" small disabled={!note.trim()} onPress={() => void readNote()} />
        <Txt variant="xs" color="faintText">
          {t("noteSaved")}
        </Txt>
      </Section>

      <Button label={t("saveToday")} busy={busy} onPress={() => void save()} />
    </Screen>
  );
}
