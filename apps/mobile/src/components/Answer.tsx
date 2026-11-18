import { useTranslations } from "use-intl";
import type { AskResponse } from "@/api/types";
import { parseAnswer } from "@/shared/answer";
import { useTheme } from "@/theme/theme";
import { SourceLinks } from "./SourceLinks";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { call998 } from "./ui/Emergency";
import { Txt } from "./ui/Txt";

/**
 * One answer (web Chat): the API's own words with [n] markers, sources as links. Urgent and crisis replies lead with
 * the action and a Call 998 button; the crisis reply is support only, never a pattern card (CLAUDE.md rule 5).
 */
export function Answer({ a }: { a: AskResponse }) {
  const t = useTranslations("assistant");
  const ts = useTranslations("safety");
  const { c } = useTheme();
  const urgent = Boolean(a.urgent) || a.crisis;
  const parts = parseAnswer(a.answer);
  return (
    <Card tone={urgent ? "urgentSoft" : "sheet"} style={urgent ? { borderColor: c.urgent } : undefined} accessibilityRole={urgent ? "alert" : undefined}>
      {parts.length === 0 ? (
        <Txt variant="body">{t("noSource")}</Txt>
      ) : (
        <Txt variant="body">
          {parts.map((p, i) =>
            p.kind === "text" ? (
              <Txt key={i} variant="body">
                {p.text}
              </Txt>
            ) : (
              <Txt key={i} variant="xs" weight={700} color="accentText">
                {` [${p.n}]`}
              </Txt>
            ),
          )}
        </Txt>
      )}
      {urgent && <Button label={ts("call")} kind="urgent" onPress={call998} accessibilityHint="Opens the phone app to call 998" />}
      {a.citations.length > 0 && (
        <SourceLinks
          label={t("sources")}
          sources={a.citations.map((x) => ({ source_id: `${x.n}-${x.source_id}`, title: `[${x.n}] ${x.title}`, url: x.url }))}
        />
      )}
      {!a.grounded && a.citations.length > 0 && (
        <Txt variant="xs" color="faintText">
          {t("notGrounded")}
        </Txt>
      )}
    </Card>
  );
}
