"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { enterAs } from "@/lib/enter";
import { staffSignInWithPasskey } from "@/lib/passkey";
import { useStaffProblem } from "./useStaffProblem";

/** The staff door (plan section 5): clinicians and clinic admins sign in with a passkey only. On success their own
 *  area opens with a full page load (a new identity, see enterAs). */
export function StaffDoor() {
  const t = useTranslations("staffAuth.staff");
  const ts = useTranslations("staffAuth");
  const problem = useStaffProblem();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const go = async () => {
    setError(null);
    setBusy(true);
    try {
      const r = await staffSignInWithPasskey();
      setDone(true);
      enterAs(r.area);
    } catch (e) {
      setError(problem(e));
      setBusy(false);
    }
  };

  return (
    <>
      <section aria-labelledby="staff-pk" className="signin-part">
        <h2 id="staff-pk" className="signin-h">
          {t("passkeyTitle")}
        </h2>
        <p className="s dim">{t("passkeyBody")}</p>
        <details className="si-what">
          <summary>{ts("passkeyWhat")}</summary>
          <p className="s dim">{ts("passkeyWhatBody")}</p>
        </details>
        <Button onClick={go} pending={busy || done} className="self-start">
          {busy && !done ? t("pending") : t("passkeyButton")}
        </Button>
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
      </section>
      <section aria-labelledby="staff-none" className="box" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <h2 id="staff-none" className="signin-h">
          {t("noPasskeyTitle")}
        </h2>
        <p className="s dim">{t("noPasskeyBody")}</p>
      </section>
      <section aria-labelledby="staff-doh" className="box" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h2 id="staff-doh" className="signin-h">
          {t("dohTitle")}
        </h2>
        <p className="s dim">{t("dohBody")}</p>
        <ButtonLink href="/doh/signin" variant="outline" size="sm" className="self-start">
          {t("dohLink")}
        </ButtonLink>
      </section>
    </>
  );
}
