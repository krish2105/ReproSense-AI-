import { Modal, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslations } from "use-intl";
import type { Card as CardT, TraceStep } from "@/api/types";
import { useI18n } from "@/i18n/i18n";
import { useTheme } from "@/theme/theme";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Txt } from "./ui/Txt";

/** "How this was produced" (CLAUDE.md rule 3): the rule and its version, the numbers it used, and each pipeline step. */
export function TraceSheet({ card, trace, version, onClose }: { card: CardT | null; trace: TraceStep[]; version: string; onClose: () => void }) {
  const t = useTranslations("insights");
  const states = useTranslations("states");
  const { locale } = useI18n();
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  if (!card) return null;
  const values = Object.entries(card.values);
  const ms = new Intl.NumberFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-GB", { maximumFractionDigits: 1 });
  const agent = (id: string) => {
    const key = `agents.${id}`;
    return t.has(key) ? t(key) : id;
  };
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ScrollView style={{ backgroundColor: c.paper }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 14 }}>
        <Txt variant="h1" accessibilityRole="header">
          {t("traceTitle")}
        </Txt>
        <Txt variant="small" color="ink2">
          {t("traceIntro")}
        </Txt>
        <Txt variant="xs" color="ink2" style={{ fontVariant: ["tabular-nums"], writingDirection: "ltr" }}>
          {t("traceRule", { rule: card.observation_id, version })}
        </Txt>
        {values.length > 0 && (
          <Card>
            <Txt variant="label" color="ink2" accessibilityRole="header">
              {t("traceInputs")}
            </Txt>
            {values.map(([k, v]) => (
              <View key={k} style={{ flexDirection: "row", justifyContent: "space-between", gap: 12, direction: "ltr" }}>
                <Txt variant="xs" color="ink2" style={{ flexShrink: 1 }}>
                  {k}
                </Txt>
                <Txt variant="xs" weight={700} style={{ fontVariant: ["tabular-nums"] }}>
                  {String(v)}
                </Txt>
              </View>
            ))}
          </Card>
        )}
        <Card>
          <Txt variant="label" color="ink2" accessibilityRole="header">
            {t("traceSteps")}
          </Txt>
          {trace.map((s) => (
            <View key={s.agent} style={{ gap: 2 }}>
              <Txt variant="small" weight={700}>
                {agent(s.agent)}
              </Txt>
              <Txt variant="xs" color="ink2" style={{ writingDirection: "ltr" }}>
                {s.detail}
                {typeof s.ms === "number" ? ` · ${t("traceMs", { ms: ms.format(s.ms) })}` : ""}
              </Txt>
            </View>
          ))}
        </Card>
        <Button label={states("close")} kind="secondary" onPress={onClose} />
      </ScrollView>
    </Modal>
  );
}
