"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useProblemText } from "@/components/signin/SignInFlow";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { apiClient } from "@/lib/api/client";
import type { SessionRow, SessionsList } from "@/lib/api/types";
import { enterAs } from "@/lib/enter";

/**
 * Her signed-in devices (plan section 5): where her own record is open, sign one device out, sign out everywhere,
 * and sign out of this device. Signing out revokes the session on the server, so a copied cookie stops working too.
 * A demo person is shared by every visitor, so she only signs this browser out.
 */
export function Devices({ sessions, ownRecord, lastActive }: { sessions: SessionsList; ownRecord: boolean; lastActive: Record<number, string> }) {
  const t = useTranslations("privacy.devices");
  const problemText = useProblemText();
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [everywhere, setEverywhere] = useState(false);
  const name = (s: SessionRow) => (s.current ? t("this") : s.device ?? t("unknown"));
  const after = ownRecord ? "/signin?signed_out=1" : "/demo";

  const signOutHere = async () => {
    setBusy("out");
    await fetch("/api/v1/sessions/sign-out", { method: "POST", credentials: "same-origin" }).catch(() => undefined);
    enterAs(after);
  };
  const signOutOne = async (s: SessionRow) => {
    setError(null);
    setBusy(`s${s.id}`);
    try {
      await apiClient(`/sessions/${s.id}`, { method: "DELETE" });
      toast(t("signedOut"));
      router.refresh();
    } catch (e) {
      setError(problemText(e));
    }
    setBusy(null);
  };
  const signOutEverywhere = async () => {
    setBusy("everywhere");
    try {
      await apiClient("/sessions/sign-out-everywhere", { method: "POST" });
      enterAs(after);
    } catch (e) {
      setError(problemText(e));
      setEverywhere(false);
      setBusy(null);
    }
  };

  if (!ownRecord) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
        <p className="s dim">{t("demoSignOut")}</p>
        <Button size="sm" variant="outline" className="self-start" pending={busy === "out"} onClick={signOutHere}>
          {t("signOutHere")}
        </Button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
      <h3 className="label">{t("title")}</h3>
      <ul className="signin-list" aria-label={t("title")} style={{ marginTop: 0 }}>
        {sessions.sessions.map((s) => (
          <li key={s.id} className="kv" style={{ flexWrap: "wrap", alignItems: "center" }}>
            <span>
              <b className="s">{name(s)}</b>
              <br />
              <span className="xs dim">
                {t(`how.${s.how}`)} · {t("lastActive", { time: lastActive[s.id] ?? "" })}
              </span>
            </span>
            {!s.current && (
              <Button size="sm" variant="outline" aria-label={t("signOutLabel", { device: name(s) })} pending={busy === `s${s.id}`} onClick={() => signOutOne(s)}>
                {t("signOut")}
              </Button>
            )}
          </li>
        ))}
      </ul>
      <p className="s dim">{t("everywhereBody")}</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Button size="sm" variant="outline" pending={busy === "out"} onClick={signOutHere}>
          {t("signOutHere")}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setEverywhere(true)}>
          {t("everywhere")}
        </Button>
      </div>
      {error && (
        <p className="s" role="alert" style={{ color: "var(--urgent)" }}>
          {error}
        </p>
      )}
      <Dialog open={everywhere} onClose={() => setEverywhere(false)} title={t("everywhere")}>
        <p className="s">{t("everywhereBody")}</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button pending={busy === "everywhere"} style={{ background: "var(--urgent)", color: "#fff" }} onClick={signOutEverywhere}>
            {t("everywhereConfirm")}
          </Button>
          <Button variant="outline" onClick={() => setEverywhere(false)}>
            {t("stay")}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
