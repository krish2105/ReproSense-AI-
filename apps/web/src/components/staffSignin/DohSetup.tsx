"use client";

import { useTranslations } from "next-intl";
import { QRCodeSVG } from "qrcode.react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { apiClient } from "@/lib/api/client";
import type { DohAuthenticator, StaffSignedIn } from "@/lib/api/types";
import { enterAs } from "@/lib/enter";
import { addSetupPasskey } from "@/lib/passkey";
import { useStaffProblem } from "./useStaffProblem";

/** The DoH admin's single-use setup link (made only by the operator's CLI): a passkey, then an authenticator app by
 *  QR code, then its first code. The link's token stands in for a session until the code is right. */
export function DohSetup({ token, passkeyAdded }: { token: string; passkeyAdded: boolean }) {
  const t = useTranslations("staffAuth.setup");
  const problem = useStaffProblem();
  const base = `/staff-auth/setup/${encodeURIComponent(token)}`;
  const [hasPasskey, setHasPasskey] = useState(passkeyAdded);
  const [app, setApp] = useState<DohAuthenticator | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<"passkey" | "qr" | "code" | null>(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (what: "passkey" | "qr" | "code", call: () => Promise<void>) => {
    setError(null);
    setBusy(what);
    try {
      await call();
    } catch (e) {
      setError(problem(e));
    }
    setBusy(null);
  };
  const loadQr = () => apiClient<DohAuthenticator>(`${base}/authenticator`, { method: "POST" }).then(setApp);
  const passkey = () =>
    run("passkey", async () => {
      await addSetupPasskey(token);
      setHasPasskey(true);
      await loadQr();
    });
  const finish = (e: FormEvent) => {
    e.preventDefault();
    void run("code", async () => {
      const r = await apiClient<StaffSignedIn>(`${base}/code`, { body: { code } });
      setDone(true);
      enterAs(r.area);
    });
  };
  const key = app?.secret.replace(/(.{4})/g, "$1 ").trim();

  return (
    <>
      <section aria-labelledby="setup-1" className="signin-part">
        <h2 id="setup-1" className="signin-h">
          {t("step1")}
        </h2>
        {hasPasskey ? (
          <p className="s step-done" role="status">
            <Icon name="check" size={16} /> {t("passkeyDone")}
          </p>
        ) : (
          <>
            <p className="s dim">{t("step1Body")}</p>
            <Button onClick={passkey} pending={busy === "passkey"} className="self-start">
              {t("addPasskey")}
            </Button>
          </>
        )}
      </section>

      {hasPasskey && (
        <section aria-labelledby="setup-2" className="signin-part">
          <h2 id="setup-2" className="signin-h">
            {t("step2")}
          </h2>
          <p className="s dim">{t("step2Body")}</p>
          {app ? (
            <>
              <div className="totp-qr">
                <QRCodeSVG value={app.otpauth_uri} size={176} role="img" aria-label={t("qrLabel")} />
              </div>
              <p className="s">{t("manual")}</p>
              <p className="s mono totp-key" dir="ltr" data-testid="totp-secret" data-secret={app.secret}>
                {key}
              </p>
            </>
          ) : (
            <Button variant="outline" onClick={() => run("qr", loadQr)} pending={busy === "qr"} className="self-start">
              {t("showQr")}
            </Button>
          )}
        </section>
      )}

      {app && (
        <section aria-labelledby="setup-3" className="signin-part">
          <h2 id="setup-3" className="signin-h">
            {t("step3")}
          </h2>
          <p className="s dim">{t("step3Body")}</p>
          <form method="post" onSubmit={finish} className="signin-form">
            <div className="field">
              <label htmlFor="setup-code">{t("codeLabel")}</label>
              <input
                id="setup-code"
                type="text"
                className="signin-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                dir="ltr"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
              />
            </div>
            <Button type="submit" pending={busy === "code" || done} disabled={code.length !== 6} className="self-start">
              {t("finish")}
            </Button>
          </form>
        </section>
      )}

      {error && (
        <p className="s" role="alert" style={{ color: "var(--urgent)" }}>
          {error}
        </p>
      )}
      {done && (
        <p className="s" role="status">
          {t("done")}
        </p>
      )}
    </>
  );
}
