"use client";

import { useTranslations } from "next-intl";
import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { apiClient } from "@/lib/api/client";
import type { StaffSignedIn } from "@/lib/api/types";
import { enterAs } from "@/lib/enter";
import { dohPasskeyStep } from "@/lib/passkey";
import { useStaffProblem } from "./useStaffProblem";

/** The DoH door (plan section 5): a passkey, then a 6-digit code from an authenticator app. Between the two the API
 *  holds only a 5-minute ticket; the session starts after the code. */
export function DohDoor() {
  const t = useTranslations("staffAuth.doh");
  const problem = useStaffProblem();
  const [ticket, setTicket] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const codeRef = useRef<HTMLInputElement>(null);

  const passkey = async () => {
    setError(null);
    setBusy(true);
    try {
      const r = await dohPasskeyStep();
      setTicket(r.ticket);
      setCode("");
      requestAnimationFrame(() => codeRef.current?.focus());
    } catch (e) {
      setError(problem(e));
    }
    setBusy(false);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!ticket) return;
    setError(null);
    setBusy(true);
    try {
      const r = await apiClient<StaffSignedIn>("/staff-auth/doh/code", { body: { ticket, code } });
      setDone(true);
      enterAs(r.area);
    } catch (err) {
      setError(problem(err));
      setBusy(false);
    }
  };

  const restart = () => {
    setTicket(null);
    setCode("");
    setError(null);
  };

  return (
    <>
      <section aria-labelledby="doh-1" className="signin-part">
        <h2 id="doh-1" className="signin-h">
          {t("step1")}
        </h2>
        {!ticket ? (
          <>
            <p className="s dim">{t("step1Body")}</p>
            <Button onClick={passkey} pending={busy} className="self-start">
              {t("passkeyButton")}
            </Button>
          </>
        ) : (
          <p className="s" role="status">
            {t("passkeyOk")}
          </p>
        )}
      </section>

      {ticket && (
        <section aria-labelledby="doh-2" className="signin-part">
          <h2 id="doh-2" className="signin-h">
            {t("step2")}
          </h2>
          <p className="s dim">{t("step2Body")}</p>
          <form method="post" onSubmit={submit} className="signin-form">
            <div className="field">
              <label htmlFor="doh-code">{t("codeLabel")}</label>
              <input
                ref={codeRef}
                id="doh-code"
                type="text"
                className="signin-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                dir="ltr"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                aria-describedby="doh-code-hint"
                required
              />
              <span id="doh-code-hint" className="xs faint">
                {t("codeHint")}
              </span>
            </div>
            <div className="kv" style={{ justifyContent: "flex-start", gap: 10, flexWrap: "wrap" }}>
              <Button type="submit" pending={busy || done} disabled={code.length !== 6}>
                {t("submit")}
              </Button>
              <Button variant="outline" onClick={restart} disabled={busy || done}>
                {t("restart")}
              </Button>
            </div>
          </form>
        </section>
      )}

      {error && (
        <p className="s" role="alert" style={{ color: "var(--urgent)" }}>
          {error}
        </p>
      )}
    </>
  );
}
