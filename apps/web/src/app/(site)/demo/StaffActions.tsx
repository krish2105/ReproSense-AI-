"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { LoginResponse } from "@/lib/api/types";

type Action = "clinic" | "admin" | "reset";

/** Clinician view, clinic network, and the demo reset (reset needs the admin role, so it signs in as admin first). */
export function StaffActions({ disabled }: { disabled?: boolean }) {
  const t = useTranslations("demo");
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<Action | null>(null);
  const [, start] = useTransition();

  const run = (action: Action) => {
    setBusy(action);
    start(async () => {
      try {
        await apiClient<LoginResponse>("/demo/login", { body: { role: action === "clinic" ? "clinician" : "admin" } });
        if (action === "reset") {
          await apiClient("/demo/reset", { method: "POST" });
          setBusy(null);
          toast(t("resetDone"));
          router.refresh();
          return;
        }
        router.push(action === "clinic" ? "/clinic" : "/admin");
        router.refresh();
      } catch (e) {
        setBusy(null);
        toast(t("failed", { detail: e instanceof ApiError ? e.detail : String(e) }));
      }
    });
  };

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
      <Button variant="outline" pending={busy === "clinic"} disabled={disabled} onClick={() => run("clinic")}>
        {t("openClinic")}
      </Button>
      <Button variant="outline" pending={busy === "admin"} disabled={disabled} onClick={() => run("admin")}>
        {t("openAdmin")}
      </Button>
      <Button variant="outline" pending={busy === "reset"} disabled={disabled} onClick={() => run("reset")}>
        {t("reset")}
      </Button>
    </div>
  );
}
