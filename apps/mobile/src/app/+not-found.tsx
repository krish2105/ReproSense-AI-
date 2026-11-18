import { router } from "expo-router";
import { useTranslations } from "use-intl";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { Empty } from "@/components/ui/States";

export default function NotFound() {
  const t = useTranslations("states");
  return (
    <Screen tabs={false}>
      <Empty
        title={t("notFoundTitle")}
        body={t("notFoundBody")}
        action={<Button label={t("notFoundAction")} onPress={() => router.replace("/demo")} />}
      />
    </Screen>
  );
}
