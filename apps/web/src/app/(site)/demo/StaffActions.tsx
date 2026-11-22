"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { enterAs } from "@/lib/enter";
import type { LoginResponse } from "@/lib/api/types";

type Action = "clinic" | "admin" | "clinicAdmin" | "reset";
const ROLE = { clinic: "clinician", admin: "admin", clinicAdmin: "clinic_admin", reset: "admin" } as const;
const AREA = { clinic: "/clinic", admin: "/admin", clinicAdmin: "/clinic-admin" } as const;

/** Clinician view, clinic network, and the demo reset (reset needs the admin role, so it signs in as admin first). */
export function StaffActions({ disabled }: { disabled?: boolean }) {
  const t = useTranslations("demo");
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<Action | null>(null);
  const [, start] = useTransition();
  // docs/31 §H, H3: with DEMO_RESET_KEY set on the API, the reset also needs the operator key. The field appears only
  // after the API asks for it, and the key is sent in the request body, never kept.
  const [needsKey, setNeedsKey] = useState(false);
  const [key, setKey] = useState("");

  const run = (action: Action) => {
    setBusy(action);
    start(async () => {
      try {
        await apiClient<LoginResponse>("/demo/login", { body: { role: ROLE[action] } });
        if (action === "reset") {
          await apiClient("/demo/reset", needsKey ? { body: { operator_key: key } } : { method: "POST" });
          setBusy(null);
          setNeedsKey(false);
          setKey("");
          toast(t("resetDone"));
          router.refresh();
          return;
        }
        enterAs(AREA[action]);
      } catch (e) {
        setBusy(null);
        if (action === "reset" && e instanceof ApiError && e.status === 403) {
          setNeedsKey(true);
          if (!needsKey) return; // first ask: show the field instead of an error
        }
        toast(t("failed", { detail: e instanceof ApiError ? e.detail : String(e) }));
      }
    });
  };

  return (
    <>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
        <Button variant="outline" pending={busy === "clinic"} disabled={disabled} onClick={() => run("clinic")}>
          {t("openClinic")}
        </Button>
        <Button variant="outline" pending={busy === "admin"} disabled={disabled} onClick={() => run("admin")}>
          {t("openAdmin")}
        </Button>
        <Button variant="outline" pending={busy === "clinicAdmin"} disabled={disabled} onClick={() => run("clinicAdmin")}>
          {t("openClinicAdmin")}
        </Button>
        <Button variant="outline" pending={busy === "reset"} disabled={disabled} onClick={() => run("reset")} data-destructive="reset">
          {t("reset")}
        </Button>
      </div>
      {needsKey && (
        <form
          className="field"
          style={{ marginTop: 12, maxWidth: 360 }}
          onSubmit={(e) => {
            e.preventDefault();
            if (key) run("reset");
          }}
        >
          <label htmlFor="reset-key">{t("resetKeyLabel")}</label>
          <input id="reset-key" type="password" autoComplete="off" value={key} onChange={(e) => setKey(e.target.value)} aria-describedby="reset-key-hint" />
          <span id="reset-key-hint" className="xs faint">
            {t("resetKeyHint")}
          </span>
          <Button type="submit" variant="outline" size="sm" className="self-start" pending={busy === "reset"} disabled={!key} data-destructive="reset">
            {t("resetWithKey")}
          </Button>
        </form>
      )}
    </>
  );
}
