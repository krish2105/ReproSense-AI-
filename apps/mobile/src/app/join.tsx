import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Image, Modal, Platform, View, type ScrollViewInstance } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslations } from "use-intl";
import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import type { PersonasResponse } from "@/api/types";
import { useSession } from "@/auth/session";
import { Button } from "@/components/ui/Button";
import { Bullets, Card, Chip, Tag } from "@/components/ui/Card";
import { Field, SwitchRow } from "@/components/ui/Field";
import { BackBar } from "@/components/ui/Row";
import { Screen } from "@/components/ui/Screen";
import { ErrorBox, Loading } from "@/components/ui/States";
import { Txt } from "@/components/ui/Txt";
import { useI18n } from "@/i18n/i18n";
import { clinicFromQr } from "@/join/qr";
import { formatDate } from "@/shared/format";
import { useTheme } from "@/theme/theme";

interface Clinic {
  id: string;
  name: string;
  region: string;
}

const REGIONS = [
  { value: "Abu Dhabi City", key: "abu_dhabi_city" },
  { value: "Al Ain", key: "al_ain" },
  { value: "Al Dhafra", key: "al_dhafra" },
] as const;
const STAGES = ["periods", "trying_to_conceive", "pregnancy", "after_birth", "perimenopause"] as const;
type Stage = (typeof STAGES)[number];
const ASKS_PERIOD: Stage[] = ["periods", "trying_to_conceive", "perimenopause"];

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const local = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y ?? 2026, (m ?? 1) - 1, d ?? 1);
};
const shift = (s: string, days: number) => {
  const d = local(s);
  d.setDate(d.getDate() + days);
  return d;
};

/** The clinic's patient QR code, read with the camera. Only a ReproSense join link is accepted. */
function Scanner({ onClinic, onClose }: { onClinic: (id: string) => void; onClose: () => void }) {
  const t = useTranslations("mobile");
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const [permission, request] = useCameraPermissions();
  const [bad, setBad] = useState(false);
  const done = useRef(false);
  const read = ({ data }: BarcodeScanningResult) => {
    if (done.current) return;
    const id = clinicFromQr(data);
    if (!id) return setBad(true);
    done.current = true;
    onClinic(id);
  };
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: c.paper, padding: 16, paddingBottom: insets.bottom + 16, gap: 14 }}>
        <Txt variant="h1" accessibilityRole="header">
          {t("scanTitle")}
        </Txt>
        {!permission ? null : permission.granted ? (
          <View style={{ flex: 1, borderRadius: 24, overflow: "hidden", backgroundColor: "#000000" }}>
            <CameraView style={{ flex: 1 }} facing="back" barcodeScannerSettings={{ barcodeTypes: ["qr"] }} onBarcodeScanned={read} />
          </View>
        ) : (
          <Card>
            <Txt variant="small">{t("scanNoCamera")}</Txt>
            {permission.canAskAgain && <Button label={t("scanAllow")} onPress={() => void request()} />}
          </Card>
        )}
        {bad && (
          <Card tone="warnSoft" accessibilityLiveRegion="polite">
            <Txt variant="small">{t("scanInvalid")}</Txt>
          </Card>
        )}
        <Button label={t("cancel")} kind="secondary" onPress={onClose} />
      </View>
    </Modal>
  );
}

/** The last period date: optional, within the last 120 days, chosen with the phone's own date picker. */
function PeriodDate({ value, refDate, onChange }: { value: string; refDate: string; onChange: (v: string) => void }) {
  const t = useTranslations("join");
  const m = useTranslations("mobile");
  const { locale } = useI18n();
  const { dark } = useTheme();
  const [open, setOpen] = useState(false);
  const pick = (e: DateTimePickerEvent, d?: Date) => {
    if (Platform.OS === "android") setOpen(false);
    if (e.type === "set" && d) onChange(iso(d));
  };
  return (
    <View style={{ gap: 8 }}>
      <Txt variant="label" color="ink2">
        {t("lastPeriod")}
      </Txt>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <Chip label={value ? formatDate(value, locale) : m("chooseDate")} selected={!!value} onPress={() => setOpen((o) => !o)} />
        {value ? <Chip label={m("clearDate")} selected={false} onPress={() => onChange("")} /> : null}
      </View>
      {open && (
        <DateTimePicker
          value={value ? local(value) : local(refDate)}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          minimumDate={shift(refDate, -120)}
          maximumDate={local(refDate)}
          onChange={pick}
          themeVariant={dark ? "dark" : "light"}
          locale={locale === "ar" ? "ar-AE" : "en-GB"}
          accessibilityLabel={t("lastPeriod")}
        />
      )}
      <Txt variant="xs" color="faintText">
        {t("lastPeriodHint")}
      </Txt>
    </View>
  );
}

/**
 * Join (web /join): three short steps, only what she types is stored, AI and sharing are separate unticked choices.
 * A clinic's patient QR (or the link reprosense://join?clinic=<id>) names the inviting clinic.
 */
export default function Join() {
  const t = useTranslations("join");
  const ts = useTranslations("stages");
  const tr = useTranslations("regions");
  const m = useTranslations("mobile");
  const { locale } = useI18n();
  const { signInWithToken } = useSession();
  const params = useLocalSearchParams<{ clinic?: string }>();
  const scroll = useRef<ScrollViewInstance>(null);
  const [clinics, setClinics] = useState<Clinic[] | null>(null);
  const [refDate, setRefDate] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [clinicId, setClinicId] = useState<string | null>(params.clinic ?? null);
  const [scanning, setScanning] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [region, setRegion] = useState("");
  const [stage, setStage] = useState<Stage | "">("");
  const [lastPeriod, setLastPeriod] = useState("");
  const [weeks, setWeeks] = useState("");
  const [gdm, setGdm] = useState<"yes" | "no" | "unsure" | "">("");
  const [share, setShare] = useState(false);
  const [ai, setAi] = useState(false); // AI features stay off unless she turns them on (DoH RAI 3.1.6.1)
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const fetchAll = () =>
    Promise.all([api<{ clinics: Clinic[] }>("/demo/clinics"), api<PersonasResponse>("/demo/personas")]).then(([c, p]) => {
      setClinics(c.clinics);
      setRefDate(p.ref_date);
    }, setLoadError);
  const load = () => {
    setLoadError(null);
    void fetchAll();
  };
  useEffect(() => {
    void fetchAll();
  }, []);

  // A new link (reprosense://join?clinic=…) while the screen is open names the clinic (adjusted during render).
  const [lastParam, setLastParam] = useState(params.clinic);
  if (params.clinic !== lastParam) {
    setLastParam(params.clinic);
    if (params.clinic) setClinicId(params.clinic);
  }

  const inviter = clinics?.find((c) => c.id === clinicId) ?? null;
  const unknownClinic = !!clinicId && !!clinics && !inviter;
  const ageN = Number(age);
  const weeksN = Number(weeks);
  const step2Ok = name.trim().length > 0 && /\p{L}/u.test(name) && Number.isInteger(ageN) && ageN >= 18 && ageN <= 60 && region !== "" && stage !== "";
  const step3Ok =
    stage === "pregnancy"
      ? Number.isInteger(weeksN) && weeksN >= 1 && weeksN <= 42
      : stage === "after_birth"
        ? weeks !== "" && Number.isInteger(weeksN) && weeksN >= 0 && weeksN <= 52 && gdm !== ""
        : true;

  const go = (next: 1 | 2 | 3) => {
    setError(null);
    setStep(next);
    scroll.current?.scrollTo({ y: 0, animated: false });
  };

  async function create() {
    if (!step3Ok) return setError(t("required"));
    setError(null);
    setPending(true);
    try {
      const res = await api<{ token: string }>("/demo/signup", {
        body: {
          name: name.trim(),
          age: ageN,
          region,
          life_stage: stage,
          last_period_start: ASKS_PERIOD.includes(stage as Stage) && lastPeriod ? lastPeriod : null,
          pregnancy_weeks: stage === "pregnancy" ? weeksN : null,
          weeks_since_birth: stage === "after_birth" ? weeksN : null,
          gdm: stage === "after_birth" && gdm === "yes",
          clinic_id: inviter?.id ?? null,
          share_with_clinic: Boolean(inviter) && share,
          use_ai: ai,
          lang: locale,
        },
      });
      await signInWithToken(res.token);
      router.replace("/home");
    } catch (e) {
      setPending(false);
      setError(t("failed", { detail: e instanceof ApiError ? e.detail : String(e) }));
    }
  }

  if (!clinics || !refDate) {
    return (
      <Screen tabs={false}>
        <BackBar />
        {loadError ? <ErrorBox error={loadError} onRetry={load} /> : <Loading />}
      </Screen>
    );
  }

  return (
    <Screen tabs={false} scrollRef={scroll}>
      <BackBar />
      <Txt variant="xs" color="faintText" accessibilityLiveRegion="polite">
        {t("step", { n: step })}
      </Txt>
      {inviter && <Tag kind="soon" label={t("invitedBy", { clinic: inviter.name })} />}
      {unknownClinic && (
        <Card tone="warnSoft">
          <Txt variant="small">{m("scanInvalid")}</Txt>
        </Card>
      )}

      {step === 1 && (
        <>
          <Image source={require("../../assets/images/onboarding-welcome.png")} style={{ width: 160, height: 160, alignSelf: "center" }} accessibilityIgnoresInvertColors />
          <Txt variant="h1" accessibilityRole="header">
            {t("h1")}
          </Txt>
          <Txt variant="body" color="ink2">
            {t("lede")}
          </Txt>
          <Bullets items={[t("promise1"), t("promise2"), t("promise3")]} />
          <Card tone="accentSoft" accessibilityRole="summary">
            <Txt variant="small">{t("demoNote")}</Txt>
          </Card>
          {inviter || unknownClinic ? (
            <Button label={m("noClinic")} kind="ghost" small onPress={() => setClinicId(null)} />
          ) : (
            <Button label={m("scanAction")} kind="secondary" onPress={() => setScanning(true)} />
          )}
          <Button label={t("continue")} onPress={() => go(2)} />
        </>
      )}

      {step === 2 && (
        <>
          <Txt variant="h1" accessibilityRole="header">
            {t("aboutTitle")}
          </Txt>
          <Field label={t("name")} value={name} onChangeText={setName} maxLength={40} autoComplete="nickname" />
          <Field label={t("age")} hint={t("ageHint")} value={age} onChangeText={(v) => setAge(v.replace(/[^0-9]/g, ""))} keyboardType="number-pad" maxLength={2} />
          <View style={{ gap: 8 }} accessibilityRole="radiogroup" accessibilityLabel={t("region")}>
            <Txt variant="label" color="ink2">
              {t("region")}
            </Txt>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {REGIONS.map((r) => (
                <Chip key={r.value} label={tr(r.key)} selected={region === r.value} onPress={() => setRegion(r.value)} />
              ))}
            </View>
          </View>
          <View style={{ gap: 8 }} accessibilityRole="radiogroup" accessibilityLabel={t("stage")}>
            <Txt variant="label" color="ink2">
              {t("stage")}
            </Txt>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {STAGES.map((s) => (
                <Chip key={s} label={ts(s)} selected={stage === s} onPress={() => setStage(s)} />
              ))}
            </View>
          </View>
          {error && (
            <Card tone="urgentSoft" accessibilityRole="alert">
              <Txt variant="small">{error}</Txt>
            </Card>
          )}
          <View style={{ gap: 10 }}>
            <Button label={t("continue")} onPress={() => (step2Ok ? go(3) : setError(t("required")))} />
            <Button label={t("back")} kind="secondary" onPress={() => go(1)} />
          </View>
        </>
      )}

      {step === 3 && (
        <>
          <Image source={require("../../assets/images/onboarding-stage.png")} style={{ width: 120, height: 120, alignSelf: "center" }} accessibilityIgnoresInvertColors />
          <Txt variant="h1" accessibilityRole="header">
            {t("detailsTitle")}
          </Txt>
          {ASKS_PERIOD.includes(stage as Stage) && <PeriodDate value={lastPeriod} refDate={refDate} onChange={setLastPeriod} />}
          {stage === "pregnancy" && (
            <Field label={t("weeksPregnant")} value={weeks} onChangeText={(v) => setWeeks(v.replace(/[^0-9]/g, ""))} keyboardType="number-pad" maxLength={2} />
          )}
          {stage === "after_birth" && (
            <>
              <Field label={t("weeksSinceBirth")} value={weeks} onChangeText={(v) => setWeeks(v.replace(/[^0-9]/g, ""))} keyboardType="number-pad" maxLength={2} />
              <View style={{ gap: 8 }} accessibilityRole="radiogroup" accessibilityLabel={t("gdm")}>
                <Txt variant="label" color="ink2">
                  {t("gdm")}
                </Txt>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {(["yes", "no", "unsure"] as const).map((v) => (
                    <Chip key={v} label={t(v === "yes" ? "gdmYes" : v === "no" ? "gdmNo" : "gdmUnsure")} selected={gdm === v} onPress={() => setGdm(v)} />
                  ))}
                </View>
                <Txt variant="xs" color="faintText">
                  {t("gdmHint")}
                </Txt>
              </View>
            </>
          )}
          {inviter && <SwitchRow label={t("share", { clinic: inviter.name })} value={share} onValueChange={setShare} />}
          <SwitchRow label={t("useAi")} value={ai} onValueChange={setAi} />
          {error && (
            <Card tone="urgentSoft" accessibilityRole="alert">
              <Txt variant="small">{error}</Txt>
            </Card>
          )}
          <View style={{ gap: 10 }}>
            <Button label={pending ? t("creating") : t("create")} busy={pending} onPress={() => void create()} />
            <Button label={t("back")} kind="secondary" disabled={pending} onPress={() => go(2)} />
          </View>
        </>
      )}

      {scanning && (
        <Scanner
          onClose={() => setScanning(false)}
          onClinic={(id) => {
            setClinicId(id);
            setScanning(false);
          }}
        />
      )}
    </Screen>
  );
}
