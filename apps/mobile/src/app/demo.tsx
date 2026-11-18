import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, View } from "react-native";
import { useTranslations } from "use-intl";
import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import type { LoginResponse, PersonasResponse } from "@/api/types";
import { useSession } from "@/auth/session";
import { Button } from "@/components/ui/Button";
import { Card, Tag } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { ErrorBox, Loading } from "@/components/ui/States";
import { Txt } from "@/components/ui/Txt";
import { displayName, regionKey } from "@/shared/format";

/** Demo people: the eight fictional women. Picking one opens her app with a demo token. */
export default function Demo() {
  const t = useTranslations("demo");
  const tags = useTranslations("tags");
  const stages = useTranslations("stages");
  const regions = useTranslations("regions");
  const m = useTranslations("mobile");
  const join = useTranslations("join");
  const { signInAs } = useSession();
  const [data, setData] = useState<PersonasResponse | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [opening, setOpening] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetNote, setResetNote] = useState<string | null>(null);

  const load = () => {
    setError(null);
    api<PersonasResponse>("/demo/personas").then(setData, setError);
  };
  useEffect(() => {
    api<PersonasResponse>("/demo/personas").then(setData, setError);
  }, []);

  async function open(id: string) {
    setOpening(id);
    setFailed(null);
    try {
      await signInAs(id);
      router.replace("/home");
    } catch (e) {
      setFailed(t("failed", { detail: e instanceof ApiError ? e.detail : String(e) }));
    } finally {
      setOpening(null);
    }
  }

  // The reset needs the admin role (as on the web). The admin token is used once and never stored.
  async function reset() {
    setResetting(true);
    setResetNote(null);
    setFailed(null);
    try {
      const admin = await api<LoginResponse>("/demo/login", { body: { role: "admin" } });
      await api("/demo/reset", { method: "POST", token: admin.token });
      setResetNote(m("resetDone"));
      load();
    } catch (e) {
      setFailed(t("failed", { detail: e instanceof ApiError ? e.detail : String(e) }));
    } finally {
      setResetting(false);
    }
  }

  function askReset() {
    Alert.alert(m("resetAsk"), m("resetBody"), [
      { text: m("cancel"), style: "cancel" },
      { text: t("reset"), style: "destructive", onPress: () => void reset() },
    ]);
  }

  return (
    <Screen tabs={false}>
      <Txt variant="h1" accessibilityRole="header">
        {t("title")}
      </Txt>
      <Txt variant="body" color="ink2">
        {t("intro")}
      </Txt>
      <Txt variant="label" color="accentText">
        {m("pick")}
      </Txt>
      {failed && (
        <Card tone="urgentSoft" accessibilityRole="alert">
          <Txt variant="small">{failed}</Txt>
        </Card>
      )}
      {error ? <ErrorBox error={error} onRetry={load} /> : null}
      {!data && !error ? <Loading /> : null}
      {data?.personas.map((p) => {
        const name = displayName(p.alias);
        const kind = p.rules === null ? "ok" : p.rules.some((r) => r.startsWith("RF")) ? "urgent" : p.rules.some((r) => r.startsWith("CARE")) ? "soon" : "discuss";
        return (
          <Card key={p.id}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Txt variant="h2">{name}</Txt>
                <Txt variant="small" color="ink2">
                  {t("ageRegion", { age: p.age, region: regions(regionKey(p.region)) })}
                </Txt>
              </View>
              <Tag kind={kind} label={tags(kind)} />
            </View>
            <Txt variant="small" color="ink2">
              {p.story}
            </Txt>
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
              <Txt variant="xs" color="accentText">
                {stages(p.life_stage)}
              </Txt>
              {!p.shares_with_clinic && (
                <Txt variant="xs" color="faintText">
                  · {t("noShare")}
                </Txt>
              )}
            </View>
            <Button label={t("open", { name: name.split(" ")[0] ?? name })} busy={opening === p.id} disabled={!!opening} onPress={() => void open(p.id)} />
          </Card>
        );
      })}
      {data && (
        <Card>
          <Txt variant="h2" accessibilityRole="header">
            {join("tryTitle")}
          </Txt>
          <Txt variant="small" color="ink2">
            {join("tryBody")}
          </Txt>
          <Button label={join("tryAction")} kind="secondary" onPress={() => router.push("/join")} />
        </Card>
      )}
      {resetNote && (
        <Card tone="okSoft" accessibilityLiveRegion="polite">
          <Txt variant="small" weight={600}>
            {resetNote}
          </Txt>
        </Card>
      )}
      <Button label={t("reset")} kind="ghost" busy={resetting} disabled={!!opening} onPress={askReset} />
    </Screen>
  );
}
