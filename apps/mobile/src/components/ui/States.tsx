import { ActivityIndicator, View } from "react-native";
import { useTranslations } from "use-intl";
import { ApiError } from "@/api/errors";
import { useTheme } from "@/theme/theme";
import { Button } from "./Button";
import { Card } from "./Card";
import { Txt } from "./Txt";

export function Loading() {
  const t = useTranslations("states");
  const { c } = useTheme();
  return (
    <View style={{ paddingVertical: 48, alignItems: "center", gap: 12 }} accessibilityRole="progressbar" accessibilityLabel={t("loading")}>
      <ActivityIndicator color={c.plum} />
      <Txt variant="small" color="ink2">
        {t("loading")}
      </Txt>
    </View>
  );
}

/** What happened and how to fix it, in the interface's voice (web-screen §6). */
export function ErrorBox({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const t = useTranslations("states");
  const detail = error instanceof ApiError ? error.detail : error instanceof Error ? error.message : String(error);
  return (
    <Card accessibilityRole="alert">
      <Txt variant="h2">{t("errorTitle")}</Txt>
      <Txt variant="small" color="ink2">
        {t("errorBody")}
      </Txt>
      <Txt variant="xs" color="faintText">
        {detail}
      </Txt>
      {onRetry && <Button label={t("retry")} kind="secondary" small onPress={onRetry} />}
    </Card>
  );
}

export function Empty({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <Card>
      <Txt variant="h2">{title}</Txt>
      <Txt variant="small" color="ink2">
        {body}
      </Txt>
      {action}
    </Card>
  );
}
