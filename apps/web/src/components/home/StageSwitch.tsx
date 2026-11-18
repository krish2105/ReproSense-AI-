"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useToast } from "@/components/ui/Toast";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { LifeStage } from "@/lib/api/types";
import { firstName } from "@/lib/format";

// The stage switch opens the fictional woman who represents that stage (HANDOFF §5 login model).
const STAGES: ReadonlyArray<{ stage: LifeStage; persona: string; name: string }> = [
  { stage: "periods", persona: "noura", name: "Noura" },
  { stage: "trying_to_conceive", persona: "mariam", name: "Mariam" },
  { stage: "pregnancy", persona: "hessa", name: "Hessa" },
  { stage: "after_birth", persona: "fatima", name: "Fatima" },
  { stage: "perimenopause", persona: "layla", name: "Layla" },
];

export function StageSwitch({ current }: { current: LifeStage }) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  return (
    <div className="pills" role="group" aria-label={t("home.stagesLabel")} style={{ overflowX: "auto", scrollbarWidth: "none" }} aria-busy={pending || undefined}>
      {STAGES.map((s) => (
        <button
          key={s.stage}
          type="button"
          aria-pressed={s.stage === current}
          disabled={pending}
          style={{ flex: "none" }}
          onClick={() => {
            if (s.stage === current) return;
            start(async () => {
              try {
                await apiClient("/demo/login", { body: { persona: s.persona } });
                toast(t("home.stageSwitched", { name: firstName(s.name, locale) }));
                router.refresh();
              } catch (e) {
                toast(t("home.stageFailed", { detail: e instanceof ApiError ? e.detail : String(e) }));
              }
            });
          }}
        >
          {t(`stages.${s.stage}`)}
        </button>
      ))}
    </div>
  );
}
