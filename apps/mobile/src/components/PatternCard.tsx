import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { useTranslations } from "use-intl";
import type { Card as CardT } from "@/api/types";
import { useI18n } from "@/i18n/i18n";
import { formatDayMonth } from "@/shared/format";
import { useTheme } from "@/theme/theme";
import { SourceLinks } from "./SourceLinks";
import { Button } from "./ui/Button";
import { Bullets, Card, Tag } from "./ui/Card";
import { UrgentCard } from "./ui/Emergency";
import { Txt } from "./ui/Txt";

/** One observation (rules decide; never a diagnosis): the pattern, the entries behind it, what next, the source. */
export function PatternCard({
  card,
  onDraft,
  onTrace,
  compact = false,
}: {
  card: CardT;
  onDraft?: (card: CardT) => void;
  onTrace?: (card: CardT) => void;
  compact?: boolean;
}) {
  const t = useTranslations("insights");
  const tags = useTranslations("tags");
  const home = useTranslations("home");
  const { locale } = useI18n();
  const { c } = useTheme();
  if (card.kind === "red_flag") return <UrgentCard card={card} />;
  const kind = card.urgency === "urgent" ? "urgent" : card.urgency === "soon" ? "soon" : "discuss";
  const total = card.why_total ?? card.why_we_noticed.length;
  return (
    <Card>
      <Tag kind={kind} label={tags(kind)} />
      <Txt variant="h2" accessibilityRole="header">
        {card.title}
      </Txt>
      <Txt variant="small" color="ink2">
        {card.summary}
      </Txt>
      {compact ? (
        <Txt variant="xs" color="faintText">
          {home("fromEntries", { count: total })}
        </Txt>
      ) : (
        <>
          <Txt variant="small" color="ink2">
            {card.explains}
          </Txt>
          <View style={{ gap: 6 }}>
            <Txt variant="label" color="ink2">
              {t("why")}
            </Txt>
            {card.why_we_noticed.map((e) => (
              <Pressable
                key={e.entry_id}
                accessibilityRole="button"
                accessibilityHint="Opens this day in the calendar"
                onPress={() => router.push({ pathname: "/timeline", params: { date: e.date } })}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  gap: 10,
                  padding: 10,
                  borderRadius: 14,
                  backgroundColor: c.tint,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Txt variant="small" color="ink2" style={{ flex: 1 }} accessibilityLabel={`${formatDayMonth(e.date, locale)}: ${e.text}`}>
                  {e.text}
                </Txt>
              </Pressable>
            ))}
          </View>
          {card.what_to_consider.length > 0 && (
            <View style={{ gap: 6 }}>
              <Txt variant="label" color="ink2">
                {t("consider")}
              </Txt>
              <Bullets items={card.what_to_consider} />
            </View>
          )}
          {card.questions_for_doctor.length > 0 && (
            <View style={{ gap: 6 }}>
              <Txt variant="label" color="ink2">
                {t("questions")}
              </Txt>
              <Bullets items={card.questions_for_doctor} />
            </View>
          )}
          <SourceLinks sources={card.sources} label={t("sources")} />
          <Txt variant="xs" color="faintText">
            {t("written", { by: card.written_by === "claude" ? "claude" : "template", verified: card.verified_sentences, dropped: card.dropped_sentences })}
          </Txt>
          <View style={{ gap: 8 }}>
            {onDraft && card.urgency !== "urgent" && <Button label={t("draft")} kind="secondary" small onPress={() => onDraft(card)} />}
            <Button
              label={t("ask")}
              kind="ghost"
              small
              onPress={() => router.push({ pathname: "/assistant", params: { q: card.questions_for_doctor[0] ?? card.title } })}
            />
            {onTrace && <Button label={t("how")} kind="ghost" small onPress={() => onTrace(card)} />}
          </View>
        </>
      )}
    </Card>
  );
}
