import { Linking, View } from "react-native";
import { useTranslations } from "use-intl";
import type { Card as CardT } from "@/api/types";
import { SOURCES } from "@/shared/sources";
import { useTheme } from "@/theme/theme";
import { SourceLinks } from "../SourceLinks";
import { Button } from "./Button";
import { Card } from "./Card";
import { Txt } from "./Txt";

/** Opens the phone's dialler on 998 (UAE ambulance). Never hidden behind another tap (clinical-copy-guard). */
export function call998() {
  void Linking.openURL("tel:998");
}

/** The strip that stays above the assistant's question box whatever the checks decide (QUESTIONS #50). */
export function SafetyStrip() {
  const t = useTranslations("assistant");
  const u = useTranslations("urgent");
  return (
    <Card tone="urgentSoft" style={{ borderColor: "transparent", gap: 8 }} accessibilityRole="summary">
      <Txt variant="small" weight={600} color="ink">
        {t("safetyLine")}
      </Txt>
      <Button label={u("call")} kind="urgent" small onPress={call998} accessibilityHint="Opens the phone app to call 998" />
    </Card>
  );
}

/** A red-flag card from the rules (RF1–RF6): the action first, then why, then the source. */
export function UrgentCard({ card }: { card: CardT }) {
  const u = useTranslations("urgent");
  const h = useTranslations("home");
  const { c } = useTheme();
  return (
    <Card tone="urgentSoft" style={{ borderColor: c.urgent }} accessibilityRole="alert">
      <Txt variant="h2" weight={800} style={{ color: c.urgent }}>
        {u("action")}
      </Txt>
      <Txt variant="small" weight={600}>
        {card.title}
      </Txt>
      <Txt variant="small" color="ink2">
        {card.summary}
      </Txt>
      <Button label={u("call")} kind="urgent" onPress={call998} />
      {card.sources.length > 0 && (
        <Txt variant="xs" color="faintText">
          {h("sources")}: {card.sources.map((s) => s.title).join(" · ")}
        </Txt>
      )}
    </Card>
  );
}

/** EPDS item 10 above 0 (rule RF4): support only, never a score or a pattern card (CLAUDE.md rule 5). */
export function CrisisCard() {
  const t = useTranslations("safety");
  const h = useTranslations("home");
  return (
    <Card tone="accentSoft" accessibilityRole="alert">
      <Txt variant="h2" weight={800}>
        {t("crisisTitle")}
      </Txt>
      <Txt variant="body">{t("crisisBody")}</Txt>
      <View>
        <Button label={t("call")} kind="urgent" onPress={call998} />
      </View>
      <Txt variant="xs" color="faintText">
        {t("crisisNote")}
      </Txt>
      <SourceLinks sources={[{ source_id: SOURCES.nice_cg192.id, title: SOURCES.nice_cg192.title, url: SOURCES.nice_cg192.url }]} label={h("sources")} />
    </Card>
  );
}

/** The pregnancy warning signs from red-flag rule RF5, always visible on the pregnancy home (never behind a tap). */
export function PregnancyWarning() {
  const t = useTranslations("safety");
  const h = useTranslations("home");
  const { c } = useTheme();
  const cite = [SOURCES.nhs_pregnancy_urgent, SOURCES.nice_ng201].map((s) => ({ source_id: s.id, title: s.title, url: s.url }));
  return (
    <Card tone="urgentSoft" style={{ borderColor: c.urgent }}>
      <Txt variant="small" weight={800} style={{ color: c.urgent }} accessibilityRole="header">
        {t("pregTitle")}
      </Txt>
      <Txt variant="small">{t("pregSigns")}</Txt>
      <Button label={t("call")} kind="urgent" small onPress={call998} accessibilityHint="Opens the phone app to call 998" />
      <Txt variant="xs" color="ink2">
        {t("pregRule")}
      </Txt>
      <SourceLinks sources={cite} label={h("sources")} />
    </Card>
  );
}
