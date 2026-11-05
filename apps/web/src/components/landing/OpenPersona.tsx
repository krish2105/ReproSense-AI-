"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition, type ReactNode } from "react";
import { useToast } from "@/components/ui/Toast";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { enterAs } from "@/lib/enter";

/** Signs in as a fictional woman and opens her app (landing CTAs and stage cards), or one screen of it. */
export function OpenPersona({ persona, className, children, to = "/app" }: { persona: string; className: string; children: ReactNode; to?: string }) {
  const t = useTranslations("landing");
  const toast = useToast();
  const [pending, start] = useTransition();
  const [leaving, setLeaving] = useState(false); // stays busy until the new page replaces this one
  return (
    <button
      type="button"
      className={className}
      aria-busy={pending || leaving || undefined}
      disabled={pending || leaving}
      onClick={() =>
        start(async () => {
          try {
            await apiClient("/demo/login", { body: { persona } });
            setLeaving(true);
            enterAs(to);
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
