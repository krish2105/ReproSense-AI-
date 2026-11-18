import { router } from "expo-router";
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
  const { signOut } = useSession();
  return (
    <Screen>
      <Section title={more("title")}>
        <View style={{ gap: 10 }}>
          <Row label={home("logButton")} onPress={() => router.push("/log")} />
          <Row label={`${tabs("log")} · ${tabs("timeline")}`} onPress={() => router.push("/timeline")} />
          <Row label={more("documents")} onPress={() => router.push("/documents")} />
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
