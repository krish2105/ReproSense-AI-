import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { Modal, ScrollView, Switch, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslations } from "use-intl";
import { API_URL } from "@/api/client";
import { ApiError } from "@/api/errors";
import type { ReportPayload, ReportRow, ShareCreated, ShareRow } from "@/api/types";
import { useSession } from "@/auth/session";
import { Button } from "@/components/ui/Button";
import { Bullets, Card, Section, Tag } from "@/components/ui/Card";
import { SHARE_WEB_URL } from "@/config";
import { Screen } from "@/components/ui/Screen";
import { Empty, ErrorBox, Loading } from "@/components/ui/States";
import { Txt } from "@/components/ui/Txt";
import { useApi } from "@/hooks/useApi";
import { useI18n } from "@/i18n/i18n";
import { displayName, formatDate, regionKey } from "@/shared/format";
import { useTheme } from "@/theme/theme";

const detail = (e: unknown) => (e instanceof ApiError ? e.detail : e instanceof Error ? e.message : String(e));

type ShareState = "active" | "expired" | "revoked";
const stateOf = (s: ShareRow, now: number): ShareState => (s.revoked_at ? "revoked" : Date.parse(s.expires_at) < now ? "expired" : "active");

/** Visit mode (web ReportActions): the S-B-A-R summary for her doctor, and a QR code of the active share link. */
function VisitSheet({
  p,
  link,
  expires,
  consentForm,
  onClose,
}: {
  p: ReportPayload;
  link: string | null;
  expires: string | null;
  consentForm: React.ReactNode;
  onClose: () => void;
}) {
  const t = useTranslations("report");
  const stages = useTranslations("stages");
  const { locale } = useI18n();
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const lengths = p.cycles.filter((x) => x.length !== null).map((x) => x.length);
  const top = p.red_flags[0] ?? p.patterns[0];
  const titles = [...p.red_flags, ...p.patterns].map((x) => x.title).join("; ");
  // S-B-A-R (situation, background, assessment, recommendation): fixed letters, as on the web; the label names each.
  const line = (letter: "S" | "B" | "A" | "R", label: string, text: string) => (
    <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
      <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: c.plum, alignItems: "center", justifyContent: "center" }}>
        <Txt variant="small" weight={800} style={{ color: c.plumInk }} accessibilityLabel={label}>
          {letter}
        </Txt>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="xs" weight={700} color="ink2">
          {label}
        </Txt>
        <Txt variant="small">{text}</Txt>
      </View>
    </View>
  );
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ScrollView style={{ backgroundColor: c.paper }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 14 }}>
        <Txt variant="h1" accessibilityRole="header">
          {t("visitTitle")}
        </Txt>
        <Txt variant="h2">{`${displayName(p.alias)}, ${p.age}`}</Txt>
        <Card>
          {line("S", t("s"), titles ? t("sLine", { titles }) : t("sNone"))}
          {line("B", t("b"), `${t("bLine", { age: p.age, stage: stages(p.life_stage), logs: p.stats.logs })}${p.pregnancy_weeks > 0 ? ` ${t("bPreg", { weeks: p.pregnancy_weeks })}` : ""}`)}
          {line("A", t("a"), `${lengths.length ? t("aLine", { lengths: lengths.join(" · ") }) : t("aNone")} ${t("aPain", { severe: p.stats.severe_pain_days })}`)}
          {line("R", t("r"), top?.what_to_consider[0] ?? t("rNone"))}
        </Card>
        {link && expires ? (
          <Card style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <View accessible accessibilityRole="image" accessibilityLabel={t("qrLabel")} style={{ borderRadius: 12, overflow: "hidden" }}>
              <QRCode value={link} size={128} backgroundColor="#FFFFFF" color="#2E2233" quietZone={8} />
            </View>
            <Txt variant="small" style={{ flex: 1 }}>
              {t("qrCaption", { date: formatDate(expires.slice(0, 10), locale) })}
            </Txt>
          </Card>
        ) : (
          <>
            <Txt variant="small" color="ink2">
              {t("needShare")}
            </Txt>
            {consentForm}
          </>
        )}
        <Txt variant="xs" color="faintText">
          {t("visitNote")}
        </Txt>
        <Button label={t("exit")} onPress={onClose} />
      </ScrollView>
    </Modal>
  );
}

export default function Report() {
  const t = useTranslations("report");
  const m = useTranslations("mobile");
  const stages = useTranslations("stages");
  const regions = useTranslations("regions");
  const clinics = useTranslations("clinics");
  const { locale } = useI18n();
  const { c } = useTheme();
  const { call, token } = useSession();
  const latest = useApi<ReportRow | null>("/reports/latest");
  const shares = useApi<ShareRow[]>("/shares");
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState<"prepare" | "pdf" | "share" | null>(null);
  const [consent, setConsent] = useState(false);
  const [visit, setVisit] = useState(false);
  // Share tokens live only in memory for this session, as on the web (sessionStorage): the API keeps only a hash.
  const [tokens, setTokens] = useState<Record<number, string>>({});
  const [mountedAt] = useState(() => Date.now()); // share states are judged against the time the screen opened

  const report = latest.data;

  async function prepare() {
    setBusy("prepare");
    setNote(null);
    try {
      latest.setData(await call<ReportRow>("/reports", { method: "POST" }));
      setNote(t("prepared"));
    } catch (e) {
      setNote(t("prepareFailed", { detail: detail(e) }));
    } finally {
      setBusy(null);
    }
  }

  async function downloadPdf(id: number) {
    setBusy("pdf");
    setNote(null);
    try {
      const dir = new Directory(Paths.cache, "reports");
      dir.create({ idempotent: true, intermediates: true });
      const old = new File(dir, `${id}.pdf`);
      if (old.exists) old.delete();
      const task = File.createDownloadTask(`${API_URL}/v1/reports/${id}.pdf`, dir, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const file = await task.downloadAsync();
      if (!file) throw new Error("download paused");
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { mimeType: "application/pdf", dialogTitle: t("download"), UTI: "com.adobe.pdf" });
      }
      setNote(m("pdfReady"));
    } catch (e) {
      setNote(m("pdfFailed", { detail: detail(e) }));
    } finally {
      setBusy(null);
    }
  }

  async function share(reportId: number) {
    setBusy("share");
    setNote(null);
    try {
      const s = await call<ShareCreated>("/shares", { body: { report_id: reportId, consent: true } });
      setTokens((x) => ({ ...x, [s.id]: s.token }));
      setNote(t("shared", { date: formatDate(s.expires_at.slice(0, 10), locale) }));
      setConsent(false);
      void shares.reload();
    } catch (e) {
      setNote(t("shareFailed", { detail: detail(e) }));
    } finally {
      setBusy(null);
    }
  }

  async function stop(id: number) {
    try {
      await call(`/shares/${id}`, { method: "DELETE" });
      setNote(t("stopped"));
      void shares.reload();
    } catch (e) {
      setNote(t("stopFailed", { detail: detail(e) }));
    }
  }

  const p = report?.payload;
  const lengths = p?.cycles.filter((x) => x.length !== null).map((x) => x.length) ?? [];
  const now = mountedAt;
  const active = (shares.data ?? []).find((s) => stateOf(s, now) === "active" && tokens[s.id]);
  const link = active ? `${SHARE_WEB_URL}/shared/${tokens[active.id]}` : null;
  const consentForm = report ? (
    <Card>
      <Txt variant="small" color="ink2">
        {t("shareBody")}
      </Txt>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Switch
          value={consent}
          onValueChange={setConsent}
          accessibilityLabel={t("consent")}
          trackColor={{ true: c.plum, false: c.rule2 }}
          thumbColor="#FFFFFF"
        />
        <Txt variant="small" style={{ flex: 1 }}>
          {t("consent")}
        </Txt>
      </View>
      <Button label={t("confirm")} disabled={!consent} busy={busy === "share"} onPress={() => void share(report.id)} />
    </Card>
  ) : null;
  return (
    <Screen refreshing={latest.loading && !!report} onRefresh={() => void latest.reload()}>
      <Txt variant="h1" accessibilityRole="header">
        {t("title")}
      </Txt>
      <Txt variant="small" color="ink2">
        {t("intro")}
      </Txt>
      {note && (
        <Card tone="tint" accessibilityLiveRegion="polite">
          <Txt variant="small" weight={600}>
            {note}
          </Txt>
        </Card>
      )}
      {latest.error ? <ErrorBox error={latest.error} onRetry={() => void latest.reload()} /> : null}
      {latest.loading && report === null && !latest.error ? <Loading /> : null}
      {!latest.loading && !report && !latest.error ? (
        <Empty title={t("noneTitle")} body={t("noneBody")} action={<Button label={t("prepare")} busy={busy === "prepare"} onPress={() => void prepare()} />} />
      ) : null}

      {report && p && (
        <>
          <Card>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
              <Txt variant="h2" style={{ flex: 1 }}>
                {t("docTitle")}
              </Txt>
              <Txt variant="xs" color="accentText">
                {t("synthetic")}
              </Txt>
            </View>
            <Txt variant="xs" color="faintText">
              {t("generated", { date: formatDate(p.generated.slice(0, 10), locale) })}
            </Txt>
            <Txt variant="small">{t("identity", { name: displayName(p.alias), age: p.age, region: regions(regionKey(p.region)) })}</Txt>
            <Txt variant="small" color="ink2">
              {t("stage", { stage: stages(p.life_stage) })}
            </Txt>
            <Txt variant="label" color="ink2">
              {t("cycles")}
            </Txt>
            <Txt variant="body" weight={700}>
              {lengths.length ? lengths.join(" · ") : t("cyclesNone")}
            </Txt>
            <Txt variant="small" color="ink2">
              {t("stats", { logs: p.stats.logs, periodDays: p.stats.period_days, severe: p.stats.severe_pain_days })}
            </Txt>
            {p.stats.pbac_by_cycle.length > 0 && (
              <>
                <Txt variant="label" color="ink2">
                  {t("pbac")}
                </Txt>
                <Txt variant="body" weight={700}>
                  {p.stats.pbac_by_cycle.join(" · ")}
                </Txt>
              </>
            )}
            <Txt variant="label" color="ink2">
              {t("patterns")}
            </Txt>
            {p.patterns.length ? (
              <Bullets items={p.patterns.map((x) => `${x.title} · ${t("patternEntries", { count: x.why_total ?? x.why_we_noticed.length })}`)} />
            ) : (
              <Txt variant="small">{t("patternsNone")}</Txt>
            )}
            {p.red_flags.length > 0 && (
              <>
                <Txt variant="label" style={{ color: c.urgent }}>
                  {t("redFlags")}
                </Txt>
                <Bullets items={p.red_flags.map((x) => x.title)} />
              </>
            )}
            {p.labs.length > 0 && (
              <>
                <Txt variant="label" color="ink2">
                  {t("labs")}
                </Txt>
                {p.labs.map((l) => (
                  <View key={l.id} style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                    <Txt variant="small" style={{ flex: 1 }}>
                      {l.test}
                    </Txt>
                    <Txt variant="small" weight={700} style={{ color: l.flag ? c.urgent : c.ink }}>
                      {`${l.value} ${l.unit}${l.flag ? ` (${l.flag})` : ""}`}
                    </Txt>
                  </View>
                ))}
              </>
            )}
            {p.questions.length > 0 && (
              <>
                <Txt variant="label" color="ink2">
                  {t("questions")}
                </Txt>
                <Bullets items={p.questions} />
              </>
            )}
          </Card>
          <View style={{ gap: 10 }}>
            <Button label={t("download")} busy={busy === "pdf"} onPress={() => void downloadPdf(report.id)} />
            <Button label={t("visit")} kind="secondary" onPress={() => setVisit(true)} />
            <Button label={t("update")} kind="secondary" busy={busy === "prepare"} onPress={() => void prepare()} />
          </View>

          <Section title={t("shareTitle")}>{consentForm}</Section>

          <Section title={t("sharesTitle")}>
            {(shares.data ?? []).length === 0 ? (
              <Txt variant="small" color="ink2">
                {t("sharesNone")}
              </Txt>
            ) : (
              (shares.data ?? []).map((s) => {
                const st = stateOf(s, now);
                const day = (iso: string) => formatDate(iso.slice(0, 10), locale);
                const clinic = clinics.has(s.clinic_id) ? clinics(s.clinic_id) : s.clinic_id;
                return (
                  <Card key={s.id}>
                    <Tag
                      kind={st === "active" ? "ok" : "soon"}
                      label={st === "active" ? t("stateActive") : st === "expired" ? t("expired", { date: day(s.expires_at) }) : t("revoked", { date: day(s.revoked_at!) })}
                    />
                    {st === "active" && <Txt variant="small">{t("active", { clinic, date: day(s.expires_at) })}</Txt>}
                    {st === "active" && <Button label={t("stop")} kind="secondary" small onPress={() => void stop(s.id)} />}
                  </Card>
                );
              })
            )}
            {link && (
              <Card>
                <Txt variant="label" color="ink2">
                  {m("sharedLink")}
                </Txt>
                <Txt variant="xs" selectable style={{ writingDirection: "ltr" }}>
                  {link}
                </Txt>
                <Button
                  label={t("copyLink")}
                  kind="secondary"
                  small
                  onPress={() => {
                    void Clipboard.setStringAsync(link);
                    setNote(t("linkCopied"));
                  }}
                />
              </Card>
            )}
          </Section>
          {visit && (
            <VisitSheet p={p} link={link} expires={active?.expires_at ?? null} consentForm={consentForm} onClose={() => setVisit(false)} />
          )}
        </>
      )}
    </Screen>
  );
}
