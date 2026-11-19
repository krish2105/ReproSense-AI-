"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useStaffProblem } from "@/components/staffSignin/useStaffProblem";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { apiClient } from "@/lib/api/client";
import { apiError } from "@/lib/api/errors";
import type { StepUpOptions } from "@/lib/api/types";
import { endedPath, roleOfPath } from "@/lib/doors";
import { stepUpWithPasskey } from "@/lib/passkey";

type Ask = StepUpOptions;

/**
 * An export behind a step-up (plan section 5): the audit log and the clinic CSV ask for the passkey again (a fresh
 * check within 5 minutes). A one-tap demo session confirms in one tap instead, in demo mode only. The page first asks
 * the API whether a recent check still holds, then fetches and saves the file, so nothing is refused on the way.
 */
export function StepUpExport({ href, filename, label }: { href: string; filename: string; label: string }) {
  const t = useTranslations("staffAuth.stepUp");
  const problem = useStaffProblem();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [ask, setAsk] = useState<Ask | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** true when the file was saved; false when the API asks for a step-up first. */
  const download = async (): Promise<boolean> => {
    const res = await fetch(href, { credentials: "same-origin" });
    if (!res.ok) {
      const err = await apiError(res);
      if (err.stepUp) return false;
      const role = roleOfPath(window.location.pathname);
      if (err.ended && role) window.location.assign(endedPath(role, err.ended));
      throw err;
    }
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast(t("downloaded"));
    return true;
  };

  const start = async () => {
    setError(null);
    setBusy(true);
    try {
      const step = await apiClient<Ask>("/staff-auth/step-up/options", { method: "POST" });
      if (!step.fresh || !(await download())) setAsk(step.fresh ? await apiClient<Ask>("/staff-auth/step-up/options", { method: "POST" }) : step);
    } catch (e) {
      toast(t("failed", { detail: problem(e) }));
    }
    setBusy(false);
  };

  const confirm = async () => {
    if (!ask) return;
    setError(null);
    setBusy(true);
    try {
      if (ask.mode === "demo_confirm") await apiClient("/staff-auth/step-up/demo", { method: "POST" });
      else await stepUpWithPasskey(ask);
      if (await download()) setAsk(null);
      else setError(t("failed", { detail: "step-up" }));
    } catch (e) {
      setError(problem(e));
    }
    setBusy(false);
  };

  const demo = ask?.mode === "demo_confirm";
  return (
    <>
      <Button variant="outline" size="sm" className="self-start" pending={busy && !ask} onClick={start}>
        {label}
      </Button>
      <Dialog open={ask !== null} onClose={() => setAsk(null)} title={t("title")}>
        <p className="s">{demo ? t("demoBody") : t("passkeyBody", { minutes: ask?.valid_minutes ?? 0 })}</p>
        {error && (
          <p className="s" role="alert" style={{ color: "var(--urgent)" }}>
            {error}
          </p>
        )}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button pending={busy} onClick={confirm}>
            {demo ? t("demoButton") : t("passkeyButton")}
          </Button>
          <Button variant="outline" onClick={() => setAsk(null)} disabled={busy}>
            {t("cancel")}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
