import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View, type ScrollViewInstance } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslations } from "use-intl";
import { ApiError } from "@/api/errors";
import type { AskResponse, SuggestedResponse } from "@/api/types";
import { useSession } from "@/auth/session";
import { Answer } from "@/components/Answer";
import { Button } from "@/components/ui/Button";
import { Card, Chip } from "@/components/ui/Card";
import { SafetyStrip } from "@/components/ui/Emergency";
import { TAB_BAR_SPACE, TopBar } from "@/components/ui/Screen";
import { Txt, useFontFamily } from "@/components/ui/Txt";
import { useI18n } from "@/i18n/i18n";
import { useTheme } from "@/theme/theme";

type Turn = { q: string; a: AskResponse | null; error: string | null };

export default function Assistant() {
  const t = useTranslations("assistant");
  const { c } = useTheme();
  const font = useFontFamily();
  const insets = useSafeAreaInsets();
  const { locale } = useI18n();
  const { call } = useSession();
  const params = useLocalSearchParams<{ q?: string }>();
  const [suggested, setSuggested] = useState<string[]>([]);
  const [aiOn, setAiOn] = useState(true);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const scroll = useRef<ScrollViewInstance>(null);

  // Checked each time the tab comes into focus, so turning AI on or off in Privacy applies at once.
  useFocusEffect(
    useCallback(() => {
      call<SuggestedResponse>(`/assistant/suggested?lang=${locale}`).then((s) => setSuggested(s.questions), () => setSuggested([]));
      call<{ ai_on: boolean }>("/assistant/status").then(
        (s) => setAiOn(s.ai_on),
        () => setAiOn(true),
      );
    }, [call, locale]),
  );

  // A question handed over from a pattern card fills the box (state adjusted during render, not in an effect).
  const [lastQ, setLastQ] = useState<string | undefined>(undefined);
  if (params.q && params.q !== lastQ) {
    setLastQ(params.q);
    setText(String(params.q));
  }

  async function ask(q: string) {
    const question = q.trim();
    if (!question || busy) return;
    setBusy(true);
    setText("");
    setTurns((ts) => [...ts, { q: question, a: null, error: null }]);
    try {
      const a = await call<AskResponse>("/assistant/ask", { body: { question, lang: locale } });
      setTurns((ts) => ts.map((x, i) => (i === ts.length - 1 ? { ...x, a } : x)));
    } catch (e) {
      const detail = e instanceof ApiError ? e.detail : String(e);
      setTurns((ts) => ts.map((x, i) => (i === ts.length - 1 ? { ...x, error: t("failed", { detail }) } : x)));
    } finally {
      setBusy(false);
      setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 100);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.paper }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        ref={scroll}
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 16, gap: 14 }}
        keyboardShouldPersistTaps="handled"
      >
        <TopBar />
        <View style={{ gap: 2 }}>
          <Txt variant="h1" accessibilityRole="header">
            {t("title")}
          </Txt>
          <Txt variant="small" color="ink2">
            {t("subtitle")}
          </Txt>
        </View>
        {!aiOn ? (
          <Card>
            <Txt variant="h2">{t("offTitle")}</Txt>
            <Txt variant="small" color="ink2">
              {t("offBody")}
            </Txt>
            <Button label={t("offAction")} kind="secondary" small onPress={() => router.push("/privacy")} />
          </Card>
        ) : (
          <>
            {turns.length === 0 && (
              <Txt variant="small" color="ink2">
                {t("intro")}
              </Txt>
            )}
            {turns.map((turn, i) => (
              <View key={i} style={{ gap: 8 }}>
                <View style={{ alignSelf: "flex-end", maxWidth: "88%", backgroundColor: c.plum, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10 }}>
                  <Txt variant="body" style={{ color: c.plumInk }} accessibilityLabel={`${t("you")}: ${turn.q}`}>
                    {turn.q}
                  </Txt>
                </View>
                {turn.a ? <Answer a={turn.a} /> : null}
                {!turn.a && !turn.error ? (
                  <Txt variant="small" color="ink2" accessibilityLiveRegion="polite">
                    {t("thinking")}
                  </Txt>
                ) : null}
                {turn.error ? (
                  <Card tone="urgentSoft" accessibilityRole="alert">
                    <Txt variant="small">{turn.error}</Txt>
                  </Card>
                ) : null}
              </View>
            ))}
            {suggested.length > 0 && (
              <View style={{ gap: 8 }}>
                <Txt variant="label" color="ink2">
                  {t("suggested")}
                </Txt>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {suggested.map((s) => (
                    <Chip key={s} label={s} selected={false} onPress={() => void ask(s)} />
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
      {aiOn && (
        <View style={{ paddingHorizontal: 16, paddingBottom: insets.bottom + TAB_BAR_SPACE - 30, paddingTop: 8, gap: 8, backgroundColor: c.paper }}>
          <SafetyStrip />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={t("placeholder")}
              placeholderTextColor={c.faintText}
              accessibilityLabel={t("inputLabel")}
              returnKeyType="send"
              onSubmitEditing={() => void ask(text)}
              editable={!busy}
              style={{
                flex: 1,
                minHeight: 50,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: c.rule2,
                backgroundColor: c.sheet,
                paddingHorizontal: 18,
                color: c.ink,
                fontFamily: font(400),
                fontSize: 16,
                textAlign: locale === "ar" ? "right" : "left",
              }}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("send")}
              disabled={busy || !text.trim()}
              onPress={() => void ask(text)}
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: c.plum,
                alignItems: "center",
                justifyContent: "center",
                opacity: busy || !text.trim() ? 0.5 : 1,
              }}
            >
              <Txt variant="h2" style={{ color: c.plumInk }}>
                {locale === "ar" ? "←" : "→"}
              </Txt>
            </Pressable>
          </View>
          <Txt variant="xs" color="faintText" align="center">
            {t("disclaimer")}
          </Txt>
        </View>
      )}
      <View pointerEvents="none" style={{ position: "absolute", top: 0, start: 0, end: 0, height: insets.top, backgroundColor: c.paper }} />
    </KeyboardAvoidingView>
  );
}
