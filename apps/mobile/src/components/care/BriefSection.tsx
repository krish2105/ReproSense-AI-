import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { useTranslations } from "use-intl";
import type { BriefLine, PrevisitBrief } from "@/api/types";
import { SourceLinks } from "@/components/SourceLinks";
import { Button } from "@/components/ui/Button";
import { Card, Tag } from "@/components/ui/Card";
import { call998 } from "@/components/ui/Emergency";
import { Txt } from "@/components/ui/Txt";
import { useI18n } from "@/i18n/i18n";
import { formatDate } from "@/shared/format";
import { useTheme } from "@/theme/theme";

const GROUPS: { key: string; kinds: BriefLine["kind"][] }[] = [
  { key: "urgent", kinds: ["red_flag"] },
  { key: "patterns", kinds: ["pattern"] },
  { key: "cycle", kinds: ["cycle", "pain"] },
  { key: "labs", kinds: ["lab"] },
  { key: "care", kinds: ["care_step"] },
  { key: "questions", kinds: ["question"] },
];
const TONE: Record<string, "urgent" | "soon" | "discuss" | "ok"> = {
  urgent: "urgent",
  new: "discuss",
  ongoing: "discuss",
  resolved: "ok",
  done: "ok",
  booked: "soon",
  due: "soon",
  H: "discuss",
  L: "discuss",
};
const SHOWN_EVIDENCE = 4;

/**
 * The pre-visit brief (build week K3, GET /v1/brief): "what changed since the last visit", built from her entries by
 * the rules, as on the web. Every line shows the entries behind it; on her phone an entry opens that day's log. The
 * text is the API's, never rewritten here. `audience` picks her wording or the clinician's.
 */
export function BriefSection({ brief, audience }: { brief: PrevisitBrief; audience: "patient" | "clinician" }) {
  const t = useTranslations("brief");
  const u = useTranslations("urgent");
  const h = useTranslations("home");
  const { locale } = useI18n();
  const { c } = useTheme();
  const her = audience === "patient";
  const date = formatDate(brief.since, locale);
  const groups = GROUPS.map((g) => ({ ...g, lines: brief.lines.filter((l) => g.kinds.includes(l.kind)) })).filter((g) => g.lines.length > 0);
  const nothingNew = !brief.lines.some((l) => l.kind !== "question" && l.status !== "ongoing");
  return (
    <View style={{ gap: 12 }}>
      <View style={{ gap: 4 }}>
        <Txt variant="h2" accessibilityRole="header">
          {her ? t("title") : t("clinicTitle")}
        </Txt>
        <Txt variant="small" color="ink2">
          {her ? t(`since.${brief.since_basis}`, { date }) : t(`clinicSince.${brief.since_basis}`, { date })}
        </Txt>
      </View>
      {nothingNew && <Txt variant="small">{t("empty", { date })}</Txt>}
      {groups.map((g) => (
        <View key={g.key} style={{ gap: 8 }}>
          <Txt variant="label" color="ink2">
            {g.key === "questions" && !her ? t("groups.clinicQuestions") : t(`groups.${g.key}`)}
          </Txt>
          {g.lines.map((l) => {
            const shown = l.evidence.slice(0, SHOWN_EVIDENCE);
            const rest = l.evidence_total - shown.length;
            return (
              <Card key={l.id} tone={l.kind === "red_flag" ? "urgentSoft" : "sheet"} style={l.kind === "red_flag" ? { borderColor: c.urgent } : undefined}>
                {l.status && TONE[l.status] && <Tag kind={TONE[l.status]!} label={t(`status.${l.status}`)} />}
                <Txt variant="small">{l.text}</Txt>
                {l.kind === "red_flag" && her && <Button label={u("call")} kind="urgent" small onPress={call998} />}
                {l.kind !== "question" && shown.length > 0 && (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }} accessibilityLabel={t("entries")}>
                    {shown.map((e) => (
                      <Pressable
                        key={e.entry_id}
                        disabled={!her}
                        accessibilityRole={her ? "link" : "text"}
                        onPress={() => router.push(e.entry_id.startsWith("lab-") ? "/documents" : `/timeline?date=${e.date}`)}
                        style={{ backgroundColor: c.tint, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}
                      >
                        <Txt variant="xs">{e.text}</Txt>
                      </Pressable>
                    ))}
                    {rest > 0 && (
                      <Txt variant="xs" color="faintText" style={{ alignSelf: "center" }}>
                        {t("more", { n: rest })}
                      </Txt>
                    )}
                  </View>
                )}
                {l.kind !== "question" && <SourceLinks sources={l.sources} label={h("sources")} />}
              </Card>
            );
          })}
        </View>
      ))}
      <Txt variant="xs" color="faintText">
        {brief.written_by === "template" ? t(her ? "template" : "clinicTemplate") : t(her ? "model" : "clinicModel", { n: brief.dropped_sentences })}
      </Txt>
    </View>
  );
}
