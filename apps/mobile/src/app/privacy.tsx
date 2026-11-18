import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useEffect, useState } from "react";
import { Alert, View } from "react-native";
import { useTranslations } from "use-intl";
import { ApiError } from "@/api/errors";
import type { PrivacyResponse } from "@/api/types";
import { lockEnabled, setLockEnabled } from "@/auth/lock";
import { useSession } from "@/auth/session";
import { Button } from "@/components/ui/Button";
import { Bullets, Card, Section } from "@/components/ui/Card";
import { BackBar } from "@/components/ui/Row";
import { Screen } from "@/components/ui/Screen";
import { ErrorBox, Loading } from "@/components/ui/States";
import { Txt } from "@/components/ui/Txt";
import { useApi } from "@/hooks/useApi";
import { useI18n } from "@/i18n/i18n";
import { formatDate } from "@/shared/format";

const PURPOSES = ["assistant", "care_share", "research"] as const;
const detail = (e: unknown) => (e instanceof ApiError ? e.detail : e instanceof Error ? e.message : String(e));

function Note({ text }: { text: string }) {
  return (
    <Card tone="tint" accessibilityLiveRegion="polite">
      <Txt variant="small" weight={600}>
        {text}
      </Txt>
    </Card>
  );
}

export default function Privacy() {
  const t = useTranslations("privacy");
  const m = useTranslations("mobile");
  const { call } = useSession();
  const { locale } = useI18n();
  const time = new Intl.DateTimeFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dubai" });
  const { data, error, reload } = useApi<PrivacyResponse>("/privacy");
  // Each result shows next to the control she used, not at the top of a long screen.
  const [note, setNote] = useState<{ where: "consents" | "lock" | "data"; text: string } | null>(null);
  const setMsg = (where: "consents" | "lock" | "data", text: string) => setNote({ where, text });
  const [busy, setBusy] = useState<string | null>(null);
  const [lock, setLock] = useState(false);

  useEffect(() => {
    void lockEnabled().then(setLock);
  }, []);

  async function setConsent(purpose: (typeof PURPOSES)[number], granted: boolean) {
    setBusy(purpose);
    try {
      await call("/consents", { method: "PATCH", body: { purpose, granted } });
      setMsg("consents", t("saved"));
      await reload();
    } catch (e) {
      setMsg("consents", t("saveFailed", { detail: detail(e) }));
    } finally {
      setBusy(null);
    }
  }

  async function exportData() {
    setBusy("export");
    try {
      const json = await call<unknown>("/export");
      const file = new File(Paths.cache, "reprosense-my-data.json");
      if (file.exists) file.delete();
      file.create();
      await file.write(JSON.stringify(json, null, 2));
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType: "application/json", dialogTitle: t("exportJson") });
      setMsg("data", m("exportReady"));
    } catch (e) {
      setMsg("data", t("saveFailed", { detail: detail(e) }));
    } finally {
      setBusy(null);
    }
  }

  function confirmDelete() {
    Alert.alert(t("deleteTitle"), t("deleteConfirmBody"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("deleteConfirm"),
        style: "destructive",
        onPress: () => {
          void call("/me/data", { method: "DELETE" }).then(
            () => setMsg("data", t("deleted")),
            (e) => setMsg("data", t("deleteFailed", { detail: detail(e) })),
          );
        },
      },
    ]);
  }

  async function toggleLock() {
    const ok = await setLockEnabled(!lock);
    if (ok) {
      setLock(!lock);
      setMsg("lock", !lock ? m("lockIsOn") : m("lockIsOff"));
    } else {
      setMsg("lock", m("lockUnavailable"));
    }
  }

  return (
    <Screen tabs={false}>
      <BackBar />
      <Txt variant="h1" accessibilityRole="header">
        {t("title")}
      </Txt>
      <Txt variant="small" color="ink2">
        {t("intro")}
      </Txt>
      {error ? <ErrorBox error={error} onRetry={() => void reload()} /> : null}
      {!data && !error ? <Loading /> : null}
      {data && (
        <>
          <Section title={t("promisesTitle")}>
            <Card>
              <Bullets items={[0, 1, 2, 3].map((i) => t(`promises.${i}`))} />
            </Card>
          </Section>

          <Section title={t("consentsTitle")}>
            {PURPOSES.map((p) => {
              const row = data.consents.find((c) => c.purpose === p);
              const granted = !!row?.granted;
              return (
                <Card key={p}>
                  <Txt variant="body" weight={600}>
                    {t(`purpose.${p}`)}
                  </Txt>
                  {p === "care_share" && (
                    <Txt variant="xs" color="ink2">
                      {data.home_clinic ? t("clinic", { clinic: data.home_clinic.name }) : t("noClinic")}
                    </Txt>
                  )}
                  {p === "assistant" && (
                    <Txt variant="xs" color="ink2">
                      {t("aiHint")}
                    </Txt>
                  )}
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <Txt variant="small" weight={700} color={granted ? "okText" : "ink2"}>
                      {granted ? t("allowed") : t("notAllowed")}
                    </Txt>
                    <Button
                      label={granted ? t("stop") : t("allow")}
                      kind="secondary"
                      small
                      busy={busy === p}
                      disabled={p === "care_share" && !data.home_clinic && !granted}
                      onPress={() => void setConsent(p, !granted)}
                    />
                  </View>
                </Card>
              );
            })}
            {note?.where === "consents" && <Note text={note.text} />}
          </Section>

          <Section title={m("lockTitle")}>
            <Card>
              <Txt variant="small" color="ink2">
                {m("lockBody")}
              </Txt>
              <Button label={lock ? m("lockOff") : m("lockOn")} kind="secondary" small onPress={() => void toggleLock()} />
              {note?.where === "lock" && <Note text={note.text} />}
            </Card>
          </Section>

          <Section title={t("whoTitle")}>
            {data.audit.length === 0 ? (
              <Txt variant="small" color="ink2">
                {t("whoNone")}
              </Txt>
            ) : (
              <Card>
                {data.audit.slice(0, 20).map((a, i) => {
                  // A doctor opening her shared link shows as "share link": the opening log (web /app/privacy).
                  const who =
                    a.actor_id === "share-link"
                      ? t("roles.share_link")
                      : t.has(`roles.${a.actor_role}`)
                        ? t(`roles.${a.actor_role}`)
                        : t("roles.system");
                  const action = t.has(`actions.${a.action}`) ? t(`actions.${a.action}`) : t("actions.other");
                  return (
                    <View key={`${a.at}-${i}`} style={{ flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                      <Txt variant="small" color="ink2" style={{ flexShrink: 1 }}>
                        {t("whoRow", { who, action })}
                      </Txt>
                      <Txt variant="xs" color="faintText" style={{ fontVariant: ["tabular-nums"] }}>
                        {`${formatDate(a.at.slice(0, 10), locale)} · ${time.format(new Date(a.at))}`}
                      </Txt>
                    </View>
                  );
                })}
              </Card>
            )}
          </Section>

          <Section title={t("storedTitle")}>
            <Card>
              {Object.entries(data.stored).map(([k, n]) => (
                <View key={k} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Txt variant="small">{t.has(`stored.${k}`) ? t(`stored.${k}`) : k}</Txt>
                  <Txt variant="small" weight={700}>
                    {n}
                  </Txt>
                </View>
              ))}
            </Card>
          </Section>

          <Section title={t("exportTitle")}>
            <Button label={t("exportJson")} kind="secondary" busy={busy === "export"} onPress={() => void exportData()} />
            {note?.where === "data" && <Note text={note.text} />}
          </Section>

          <Section title={t("deleteTitle")}>
            <Card>
              <Txt variant="small" color="ink2">
                {t("deleteBody")}
              </Txt>
              <Button label={t("deleteButton")} kind="urgent" small onPress={confirmDelete} />
            </Card>
          </Section>
        </>
      )}
    </Screen>
  );
}
