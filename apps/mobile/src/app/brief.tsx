import { router } from "expo-router";
import { useTranslations } from "use-intl";
import type { PrevisitBrief } from "@/api/types";
import { BriefSection } from "@/components/care/BriefSection";
import { Button } from "@/components/ui/Button";
import { BackBar } from "@/components/ui/Row";
import { Screen } from "@/components/ui/Screen";
import { ErrorBox, Loading } from "@/components/ui/States";
import { useApi } from "@/hooks/useApi";
import { useI18n } from "@/i18n/i18n";

/** "Before your visit" (build week K3): what changed since her last visit, to read or show the doctor. */
export default function Brief() {
  const { locale } = useI18n();
  const home = useTranslations("home");
  const { data, error, loading, reload } = useApi<PrevisitBrief>(`/brief?lang=${locale}`);
  return (
    <Screen tabs={false} refreshing={loading} onRefresh={() => void reload()}>
      <BackBar />
      {data ? <BriefSection brief={data} audience="patient" /> : error ? <ErrorBox error={error} onRetry={() => void reload()} /> : <Loading />}
      {data && <Button label={home("reportButton")} kind="secondary" onPress={() => router.push("/report")} />}
    </Screen>
  );
}
