import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { useTranslations } from "use-intl";
import { ApiError } from "@/api/errors";
import type { EpdsResult } from "@/api/types";
import { useSession } from "@/auth/session";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CrisisCard } from "@/components/ui/Emergency";
import { BackBar } from "@/components/ui/Row";
import { Screen } from "@/components/ui/Screen";
import { Txt } from "@/components/ui/Txt";
import { useI18n } from "@/i18n/i18n";
import { EPDS_CITATION, EPDS_ITEMS, EPDS_URL } from "@/shared/epds";
import { useTheme } from "@/theme/theme";

/**
 * Mood check (EPDS, 10 items). The scores travel with each option (some items are reverse-ordered). Item 10 above 0
 * opens the crisis path in the API (RF4): the app then shows support only, never a score (CLAUDE.md rule 5).
 */
export default function Checkin() {
  const t = useTranslations("checkin");
  const { locale } = useI18n();
  const { c } = useTheme();
  const { call } = useSession();
  const [answers, setAnswers] = useState<(number | null)[]>(Array(10).fill(null));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [result, setResult] = useState<EpdsResult | null>(null);

  async function submit() {
    const missing = answers.findIndex((a) => a === null);
    if (missing >= 0) {
      setMsg(t("required", { n: missing + 1 }));
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      setResult(await call<EpdsResult>("/questionnaires/epds", { body: { answers } }));
    } catch (e) {
      setMsg(t("failed", { detail: e instanceof ApiError ? e.detail : String(e) }));
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <Screen tabs={false}>
        <BackBar />
        {result.crisis ? (
          <CrisisCard />
        ) : (
          <Card>
            <Txt variant="h2">{t("doneTitle")}</Txt>
            <Txt variant="body">{t("doneBody")}</Txt>
            {result.total !== null && <Txt variant="small">{t("total", { total: result.total })}</Txt>}
            <Txt variant="small" color="ink2">
              {t("talk")}
            </Txt>
          </Card>
        )}
      </Screen>
    );
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
      {locale === "ar" && (
        <Txt variant="xs" color="faintText">
          {t("arNote")}
        </Txt>
      )}
      <Txt variant="small" weight={600}>
        {t("instruction")}
      </Txt>
      {EPDS_ITEMS.map((item, qi) => (
        <Card key={item.text}>
          <Txt variant="label" color="accentText">
            {t("question", { n: qi + 1 })}
          </Txt>
          <Txt variant="body" weight={600}>
            {item.text}
          </Txt>
          <View style={{ gap: 8 }} accessibilityRole="radiogroup">
            {item.options.map((o) => {
              const on = answers[qi] === o.score;
              return (
                <Pressable
                  key={o.label}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  onPress={() => setAnswers((cur) => cur.map((v, i) => (i === qi ? o.score : v)))}
                  style={{
                    minHeight: 48,
                    justifyContent: "center",
                    paddingHorizontal: 14,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: on ? c.plum : c.rule2,
                    backgroundColor: on ? c.plum : c.sheet,
                  }}
                >
                  <Txt variant="small" weight={on ? 700 : 500} style={{ color: on ? c.plumInk : c.ink }}>
                    {o.label}
                  </Txt>
                </Pressable>
              );
            })}
          </View>
        </Card>
      ))}
      {msg && (
        <Card tone="warnSoft" accessibilityRole="alert">
          <Txt variant="small">{msg}</Txt>
        </Card>
      )}
      <Button label={t("submit")} busy={busy} onPress={() => void submit()} />
      <Pressable accessibilityRole="link" onPress={() => void WebBrowser.openBrowserAsync(EPDS_URL)}>
        <Txt variant="xs" color="faintText">
          {t("source")}: {EPDS_CITATION}
        </Txt>
      </Pressable>
    </Screen>
  );
}
