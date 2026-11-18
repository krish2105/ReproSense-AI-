"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Box } from "@/components/ui/Box";
import { Button, ButtonLink } from "@/components/ui/Button";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { SignedIn } from "@/lib/api/types";
import { enterAs } from "@/lib/enter";
import { passkeyProblem, signInWithPasskey } from "@/lib/passkey";

/** One sentence for what went wrong: the API's own message, or what happened in the device prompt. */
export function useProblemText(): (e: unknown) => string {
  const t = useTranslations("signin");
  return (e) => {
    if (e instanceof ApiError) return t("problem.failed", { detail: e.detail });
    const p = passkeyProblem(e);
    return p === "failed" ? t("problem.failed", { detail: e instanceof Error ? e.message : String(e) }) : t(`problem.${p}`);
  };
}

/**
 * "Sign in to my record" (K5): a passkey first, an email code as backup. The code option appears only when the
 * server can send email. On success the record opens with a full page load (a new identity, see enterAs).
 */
export function SignInFlow({ emailAvailable }: { emailAvailable: boolean }) {
  const t = useTranslations("signin");
  const problemText = useProblemText();
  const [busy, setBusy] = useState<"passkey" | "send" | "verify" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");

  const opened = (r: SignedIn) => {
    setDone(true);
    enterAs(r.role === "patient" ? "/app" : "/demo");
  };

  const usePasskey = async () => {
    setError(null);
    setBusy("passkey");
    try {
      opened(await signInWithPasskey());
    } catch (e) {
      setError(problemText(e));
      setBusy(null);
    }
  };

  const sendCode = async (e?: FormEvent) => {
    e?.preventDefault();
    setError(null);
    setBusy("send");
    try {
      await apiClient("/auth/email/start", { body: { email, lang: document.documentElement.lang === "ar" ? "ar" : "en" } });
      setSent(true);
      setCode("");
    } catch (err) {
      setError(problemText(err));
    }
    setBusy(null);
  };

  const verify = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy("verify");
    try {
      opened(await apiClient<SignedIn>("/auth/email/verify", { body: { email, code } }));
    } catch (err) {
      setError(problemText(err));
      setBusy(null);
    }
  };

  return (
    <div className="join">
      <div className="panel join-card">
        <h1 className="page-title">{t("title")}</h1>
        <p className="dim">{t("lede")}</p>

        <section aria-labelledby="pk-title" className="signin-part">
          <h2 id="pk-title" className="signin-h">
            {t("passkeyTitle")}
          </h2>
          <p className="s dim">{t("passkeyBody")}</p>
          <Button onClick={usePasskey} pending={busy === "passkey" || done} className="self-start">
            {busy === "passkey" ? t("passkeyPending") : t("passkeyButton")}
          </Button>
        </section>

        {emailAvailable && (
          <section aria-labelledby="code-title" className="signin-part">
            <h2 id="code-title" className="signin-h">
              {t("emailTitle")}
            </h2>
            <p className="s dim">{t("emailBody")}</p>
            {!sent ? (
              <form method="post" onSubmit={sendCode} className="signin-form">
                <div className="field">
                  <label htmlFor="signin-email">{t("emailLabel")}</label>
                  <input id="signin-email" type="email" autoComplete="email" dir="ltr" maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <Button type="submit" variant="outline" pending={busy === "send"} disabled={!email.includes("@")} className="self-start">
                  {t("sendCode")}
                </Button>
              </form>
            ) : (
              <form method="post" onSubmit={verify} className="signin-form">
                <p className="s" role="status">
                  {t("sent")}
                </p>
                <div className="field">
                  <label htmlFor="signin-code">{t("codeLabel")}</label>
                  <input
                    id="signin-code"
                    type="text"
                    className="signin-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    dir="ltr"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    aria-describedby="signin-code-hint"
                    required
                  />
                  <span id="signin-code-hint" className="xs faint">
                    {t("codeHint")}
                  </span>
                </div>
                <div className="kv" style={{ justifyContent: "flex-start", gap: 10, flexWrap: "wrap" }}>
                  <Button type="submit" pending={busy === "verify" || done} disabled={code.length !== 6}>
                    {t("verify")}
                  </Button>
                  <Button variant="outline" onClick={() => sendCode()} disabled={busy !== null}>
                    {t("resend")}
                  </Button>
                  <Button variant="outline" onClick={() => setSent(false)} disabled={busy !== null}>
                    {t("otherAddress")}
                  </Button>
                </div>
              </form>
            )}
          </section>
        )}

        {error && (
          <p className="s" role="alert" style={{ color: "var(--urgent)" }}>
            {error}
          </p>
        )}
        {done && (
          <p className="s" role="status">
            {t("signedIn")}
          </p>
        )}

        <Box>
          <h2 className="signin-h">{t("noRecordTitle")}</h2>
          <p className="s dim" style={{ margin: "4px 0 10px" }}>
            {t("noRecordBody")}
          </p>
          <div className="kv" style={{ justifyContent: "flex-start", gap: 10, flexWrap: "wrap" }}>
            <ButtonLink href="/join" variant="outline" size="sm">
              {t("startRecord")}
            </ButtonLink>
            <ButtonLink href="/demo" variant="outline" size="sm">
              {t("openDemo")}
            </ButtonLink>
          </div>
        </Box>
        <p className="notice" role="note">
          {t("demoNote")}
        </p>
      </div>
    </div>
  );
}
