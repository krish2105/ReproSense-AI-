"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useProblemText } from "@/components/signin/SignInFlow";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Tag } from "@/components/ui/Tag";
import { useToast } from "@/components/ui/Toast";
import type { Locale } from "@/i18n/config";
import { apiClient } from "@/lib/api/client";
import type { AuthMe } from "@/lib/api/types";
import { formatDate } from "@/lib/format";
import { addPasskey } from "@/lib/passkey";

type Passkey = AuthMe["passkeys"][number];

/**
 * Sign in on other devices (K5): her passkeys, "Add a passkey", and an email linked for a 6-digit backup code.
 * Only for a record she started herself; the shared demo people open with one tap instead.
 */
export function SignInMethods({ me, locale }: { me: AuthMe; locale: Locale }) {
  const t = useTranslations("privacy.signin");
  const problemText = useProblemText();
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<Passkey | null>(null);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");

  if (!me.own_record) {
    return (
      <>
        <p className="s dim" style={{ margin: "4px 0 10px" }}>
          {t("demoPerson")}
        </p>
        <ButtonLink href="/join" variant="outline" size="sm">
          {t("startRecord")}
        </ButtonLink>
      </>
    );
  }

  const run = async (what: string, call: () => Promise<unknown>, done: string) => {
    setError(null);
    setBusy(what);
    try {
      await call();
      toast(done);
      router.refresh();
      setBusy(null);
      return true;
    } catch (e) {
      setError(problemText(e));
      setBusy(null);
      return false;
    }
  };

  const name = (p: Passkey) => (p.label ? t("passkeyOn", { device: p.label }) : t("passkey"));
  const lang = locale === "ar" ? "ar" : "en";

  const sendCode = async (e: FormEvent) => {
    e.preventDefault();
    if (await run("send", () => apiClient("/auth/email/link/start", { body: { email, lang } }), t("codeSent"))) setSent(true);
  };
  const link = async (e: FormEvent) => {
    e.preventDefault();
    if (await run("link", () => apiClient("/auth/email/link/verify", { body: { email, code } }), t("linked"))) {
      setSent(false);
      setEmail("");
      setCode("");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 4 }}>
      <p className="s dim">{t("body")}</p>

      <div>
        <h3 className="label">{t("passkeysLabel")}</h3>
        {me.passkeys.length === 0 ? (
          <p className="s dim" style={{ marginTop: 4 }}>
            {t("none")}
          </p>
        ) : (
          <ul className="signin-list">
            {me.passkeys.map((p) => (
              <li key={p.id} className="kv" style={{ flexWrap: "wrap", alignItems: "center" }}>
                <span>
                  <b className="s">{name(p)}</b>
                  <br />
                  <span className="xs dim">
                    {t("addedOn", { date: formatDate(p.created_at.slice(0, 10), locale) })}
                    {p.last_used_at ? ` · ${t("lastUsed", { date: formatDate(p.last_used_at.slice(0, 10), locale) })}` : ""}
                  </span>
                </span>
                <Button size="sm" variant="outline" aria-label={`${t("remove")}: ${name(p)}`} onClick={() => setRemoving(p)}>
                  {t("remove")}
                </Button>
              </li>
            ))}
          </ul>
        )}
        <Button
          size="sm"
          className="self-start"
          style={{ marginTop: 10 }}
          pending={busy === "add"}
          onClick={() => run("add", addPasskey, t("addedToast"))}
        >
          {t("add")}
        </Button>
      </div>

      <div>
        <h3 className="label">{t("emailTitle")}</h3>
        {me.email_linked ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
            <p className="s">
              <Tag tone="ok">{t("linkedTag")}</Tag> {t("emailLinked")}
            </p>
            <Button size="sm" variant="outline" className="self-start" pending={busy === "unlink"} onClick={() => run("unlink", () => apiClient("/auth/email", { method: "DELETE" }), t("unlinked"))}>
              {t("unlink")}
            </Button>
          </div>
        ) : !me.email_available ? (
          <p className="s dim" style={{ marginTop: 4 }}>
            {t("emailOff")}
          </p>
        ) : !sent ? (
          <form method="post" onSubmit={sendCode} className="signin-form" style={{ marginTop: 4 }}>
            <p className="s dim">{t("emailNone")}</p>
            <div className="field">
              <label htmlFor="link-email">{t("emailLabel")}</label>
              <input id="link-email" type="email" autoComplete="email" dir="ltr" maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <Button type="submit" size="sm" variant="outline" className="self-start" pending={busy === "send"} disabled={!email.includes("@")}>
              {t("sendCode")}
            </Button>
          </form>
        ) : (
          <form method="post" onSubmit={link} className="signin-form" style={{ marginTop: 4 }}>
            <p className="s" role="status">
              {t("codeSent")}
            </p>
            <div className="field">
              <label htmlFor="link-code">{t("codeLabel")}</label>
              <input
                id="link-code"
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
            <Button type="submit" size="sm" className="self-start" pending={busy === "link"} disabled={code.length !== 6}>
              {t("link")}
            </Button>
          </form>
        )}
      </div>

      {error && (
        <p className="s" role="alert" style={{ color: "var(--urgent)" }}>
          {error}
        </p>
      )}

      <Dialog open={removing !== null} onClose={() => setRemoving(null)} title={t("removeTitle")}>
        <p className="s">{t("removeBody")}</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button
            pending={busy === "remove"}
            style={{ background: "var(--urgent)", color: "#fff" }}
            onClick={async () => {
              const p = removing;
              if (!p) return;
              if (await run("remove", () => apiClient(`/auth/passkeys/${p.id}`, { method: "DELETE" }), t("removed"))) setRemoving(null);
            }}
          >
            {t("removeConfirm")}
          </Button>
          <Button variant="outline" onClick={() => setRemoving(null)}>
            {t("keep")}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
