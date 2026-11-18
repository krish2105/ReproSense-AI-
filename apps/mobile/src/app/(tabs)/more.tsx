import { router } from "expo-router";
import { useState } from "react";
import { ApiError } from "@/api/errors";
import * as WebBrowser from "expo-web-browser";
import { View } from "react-native";
import { useTranslations } from "use-intl";
import { useSession } from "@/auth/session";
import { Button } from "@/components/ui/Button";
import { Card, Section } from "@/components/ui/Card";
import { Row } from "@/components/ui/Row";
import { SITE_URL } from "@/config";
import { Screen } from "@/components/ui/Screen";
import { Txt } from "@/components/ui/Txt";


export default function More() {
  const more = useTranslations("more");
  const tabs = useTranslations("tabs");
  const home = useTranslations("home");
  const chrome = useTranslations("chrome");
  const m = useTranslations("mobile");
  const demo = useTranslations("demo");
  const brief = useTranslations("brief");
  const bp = useTranslations("bp");
  const { signOut, signInAsClinician } = useSession();
  const [opening, setOpening] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  async function openClinic() {
    setOpening(true);
    setFailed(null);
    try {
      await signInAsClinician();
      router.push("/clinician");
    } catch (e) {
      setFailed(demo("failed", { detail: e instanceof ApiError ? e.detail : String(e) }));
    } finally {
      setOpening(false);
    }
  }
  return (
    <Screen>
      <Section title={more("title")}>
        <View style={{ gap: 10 }}>
          <Row label={home("logButton")} onPress={() => router.push("/log")} />
          <Row label={`${tabs("log")} · ${tabs("timeline")}`} onPress={() => router.push("/timeline")} />
          <Row label={more("documents")} onPress={() => router.push("/documents")} />
          <Row label={brief("title")} onPress={() => router.push("/brief")} />
          <Row label={bp("title")} onPress={() => router.push("/bp")} />
          <Row label={more("checkin")} onPress={() => router.push("/checkin")} />
          <Row label={more("privacy")} onPress={() => router.push("/privacy")} />
        </View>
      </Section>
      <Section title={m("about")}>
        <Card>
          <Txt variant="small" color="ink2">
            {chrome("footer")}
          </Txt>
        </Card>
        <View style={{ gap: 10 }}>
          <Row label={m("trust")} onPress={() => void WebBrowser.openBrowserAsync(`${SITE_URL}/trust`)} />
          <Row label={m("status")} onPress={() => void WebBrowser.openBrowserAsync(`${SITE_URL}/status`)} />
        </View>
      </Section>
      {failed && (
        <Card tone="urgentSoft" accessibilityRole="alert">
          <Txt variant="small">{failed}</Txt>
        </Card>
      )}
      <Button label={demo("openClinic")} kind="secondary" busy={opening} onPress={() => void openClinic()} />
      <Button
        label={chrome("switchPerson")}
        kind="secondary"
        onPress={() => {
          void signOut().then(() => router.replace("/demo"));
        }}
      />
    </Screen>
  );
}
