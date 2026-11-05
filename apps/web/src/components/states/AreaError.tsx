"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/States";

/** Body of every error.tsx inside an area layout (the header, badge and footer stay around it). */
export function AreaError({ reset }: { reset: () => void }) {
  const t = useTranslations("states");
  return (
    <div style={{ paddingBlock: 32 }}>
      <ErrorState title={t("errorTitle")} body={t("errorBody")} action={<Button variant="outline" size="sm" onClick={reset}>{t("retry")}</Button>} />
    </div>
  );
}
