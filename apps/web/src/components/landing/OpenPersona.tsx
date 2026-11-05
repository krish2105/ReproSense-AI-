"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition, type ReactNode } from "react";
import { useToast } from "@/components/ui/Toast";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";

/** Signs in as a fictional woman and opens her app (landing CTAs and stage cards), or one screen of it. */
export function OpenPersona({ persona, className, children, to = "/app" }: { persona: string; className: string; children: ReactNode; to?: string }) {
  const t = useTranslations("landing");
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className={className}
      aria-busy={pending || undefined}
      disabled={pending}
      onClick={() =>
        start(async () => {
          try {
            await apiClient("/demo/login", { body: { persona } });
            router.push(to);
          } catch (e) {
            toast(t("openFailed", { detail: e instanceof ApiError ? e.detail : String(e) }));
          }
        })
      }
    >
      {children}
    </button>
  );
}
