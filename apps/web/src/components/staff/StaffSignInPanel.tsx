"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Crumbs } from "@/components/chrome/Crumbs";
import { useStaffProblem } from "@/components/staffSignin/useStaffProblem";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Tag } from "@/components/ui/Tag";
import { useToast } from "@/components/ui/Toast";
import type { Locale } from "@/i18n/config";
import { apiClient } from "@/lib/api/client";
import type { SessionRow, SessionsList, StaffMe, StaffPasskey } from "@/lib/api/types";
import { enterAs } from "@/lib/enter";
import { formatDate, isolate } from "@/lib/format";
import { addStaffPasskey } from "@/lib/passkey";
import { forgetThisTab } from "@/lib/signout";

/** Each staff role's area, for the path back up (docs/31 §D). */
type Area = { href: string; nav: "clinic" | "clinicAdmin" | "admin" };
const CLINICIAN: Area = { href: "/clinic", nav: "clinic" };
const AREA: Record<string, Area> = {
  clinician: CLINICIAN,
  clinic_admin: { href: "/clinic-admin", nav: "clinicAdmin" },
  admin: { href: "/admin", nav: "admin" },
};

/**
 * Account & security (staff and DoH, plan section 5; docs/31 §D): how this session started and when it ends, the passkeys that open the
 * account (clinicians and clinic admins add theirs here), the devices it is signed in on, sign out and sign out
 * everywhere. Shared fictional demo accounts say so, and cannot sign every judge out.
 */
export function StaffSignInPanel({
  me,
  sessions,
  door,
  locale,
  times,
}: {
  me: StaffMe;
  sessions: SessionsList;
  door: string;
  locale: Locale;
  times: { endsAt: string; lastActive: Record<number, string> }; // formatted on the server (no hydration mismatch)
}) {
  const t = useTranslations("staffAuth.panel");
  const ts = useTranslations("staffAuth");
  const tc = useTranslations("chrome");
  const area = AREA[me.role] ?? CLINICIAN;
  const areaName = tc(`nav.${area.nav}`);
  const problem = useStaffProblem();
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<StaffPasskey | null>(null);
  const [everywhere, setEverywhere] = useState(false);

  const pkName = (p: StaffPasskey) => (p.label ? t("passkeyOn", { device: p.label }) : t("passkey"));
  const deviceName = (s: SessionRow) => (s.current ? t("thisDevice") : s.device ?? t("unknownDevice"));

  const run = async (what: string, call: () => Promise<unknown>, done?: string) => {
    setError(null);
    setBusy(what);
    try {
      await call();
      if (done) toast(done);
      router.refresh();
      setBusy(null);
      return true;
    } catch (e) {
      setError(problem(e));
      setBusy(null);
      return false;
    }
  };
  const signOutHere = async () => {
    setBusy("out");
    forgetThisTab();
    await fetch("/api/v1/sessions/sign-out", { method: "POST", credentials: "same-origin" }).catch(() => undefined);
    enterAs(`${door}?signed_out=1`);
  };
  const signOutEverywhere = async () => {
    setBusy("everywhere");
    try {
      await apiClient("/sessions/sign-out-everywhere", { method: "POST" });
      forgetThisTab();
      enterAs(`${door}?signed_out=1`);
    } catch (e) {
      setError(problem(e));
      setBusy(null);
      setEverywhere(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 720 }}>
      <Crumbs items={[{ href: area.href, label: areaName }, { label: t("title") }]} />
      <h1 className="page-title">{t("title")}</h1>
      <p className="page-intro">{t("intro")}</p>

      <section className="box" aria-labelledby="si-status" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <h2 id="si-status" style={{ fontSize: 16 }}>
          {t("signedInAs", { name: isolate(me.alias) })}
        </h2>
        {me.shared_demo_account && (
          <>
            <p className="s">{t("demoNothing")}</p>
            <p className="xs dim" role="note">
              {t("shared")}
            </p>
          </>
        )}
        <ButtonLink href={area.href} variant="outline" size="sm" className="self-start" style={{ marginTop: 4 }}>
          {t("back", { area: areaName })}
        </ButtonLink>
      </section>

      <nav className="box" aria-labelledby="si-can">
        <h2 id="si-can" style={{ fontSize: 16 }}>
          {t("canTitle")}
        </h2>
        <ul className="si-can">
          {me.can_add_passkey && (
            <li>
              <a href="#si-keys">{t("canPasskey")}</a>
            </li>
          )}
          <li>
            <a href="#si-devices">{t("canDevices")}</a>
          </li>
          {!sessions.shared_demo_account && (
            <li>
              <a href="#si-devices">{t("canEverywhere")}</a>
            </li>
          )}
        </ul>
      </nav>

      <section className="box" aria-labelledby="si-session">
        <h2 id="si-session" style={{ fontSize: 16 }}>
          {t("sessionTitle")}
        </h2>
        <p className="s" style={{ marginTop: 6 }}>
          <b>
            <bdi>{me.alias}</bdi>
          </b>
          {" · "}
          {t(`how.${me.session.how}`)}
        </p>
        <p className="s dim" style={{ marginTop: 4 }}>
          {t("rules", { minutes: me.session.idle_minutes, hours: me.session.max_hours, time: times.endsAt })}
        </p>
        <Button variant="outline" size="sm" className="self-start" style={{ marginTop: 10 }} pending={busy === "out"} onClick={signOutHere}>
          {t("signOut")}
        </Button>
      </section>

      <section className="box" aria-labelledby="si-keys">
        <h2 id="si-keys" style={{ fontSize: 16 }}>
          {t("passkeysTitle")}
        </h2>
        <details className="si-what">
          <summary>{ts("passkeyWhat")}</summary>
          <p className="s dim">{ts("passkeyWhatBody")}</p>
        </details>
        {me.role === "admin" && (
          <p className="s dim" style={{ marginTop: 6 }}>
            {t("dohPasskeys")} <Tag tone={me.authenticator_set ? "ok" : "info"}>{me.authenticator_set ? t("authenticatorSet") : t("authenticatorNone")}</Tag>
          </p>
        )}
        {me.passkeys.length === 0 ? (
          <p className="s dim" style={{ marginTop: 6 }}>
            {t("passkeysNone")}
          </p>
        ) : (
          <ul className="signin-list" aria-label={t("passkeysTitle")}>
            {me.passkeys.map((p) => (
              <li key={p.id} className="kv" style={{ flexWrap: "wrap", alignItems: "center" }}>
                <span>
                  <b className="s">{pkName(p)}</b>
                  <br />
                  <span className="xs dim">
                    {t("addedOn", { date: formatDate(p.created_at.slice(0, 10), locale) })}
                    {p.last_used_at ? ` · ${t("lastUsed", { date: formatDate(p.last_used_at.slice(0, 10), locale) })}` : ""}
                  </span>
                </span>
                {me.can_add_passkey && (
                  <Button size="sm" variant="outline" aria-label={t("removeLabel", { name: pkName(p) })} onClick={() => setRemoving(p)}>
                    {t("remove")}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
        {me.can_add_passkey && (
          <Button size="sm" className="self-start" style={{ marginTop: 10 }} pending={busy === "add"} onClick={() => run("add", addStaffPasskey, t("added"))}>
            {t("add")}
          </Button>
        )}
      </section>

      <section className="box" aria-labelledby="si-devices">
        <h2 id="si-devices" style={{ fontSize: 16 }}>
          {t("devicesTitle")}
        </h2>
        <ul className="signin-list" aria-label={t("devicesTitle")}>
          {sessions.sessions.map((s) => (
            <li key={s.id} className="kv" style={{ flexWrap: "wrap", alignItems: "center" }}>
              <span>
                <b className="s">{deviceName(s)}</b>
                <br />
                <span className="xs dim">
                  {t(`how.${s.how}`)} · {t("lastActive", { time: times.lastActive[s.id] ?? "" })}
                </span>
              </span>
              {!s.current && !sessions.shared_demo_account && (
                <Button
                  size="sm"
                  variant="outline"
                  aria-label={t("signOutDeviceLabel", { device: deviceName(s) })}
                  pending={busy === `s${s.id}`}
                  onClick={() => run(`s${s.id}`, () => apiClient(`/sessions/${s.id}`, { method: "DELETE" }), t("signedOutDevice"))}
                >
                  {t("signOutDevice")}
                </Button>
              )}
            </li>
          ))}
        </ul>
        {sessions.shared_demo_account ? (
          <p className="s dim" style={{ marginTop: 10 }}>
            {t("sharedEverywhere")}
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
            <p className="s dim">{t("everywhereBody")}</p>
            <Button size="sm" variant="outline" className="self-start" onClick={() => setEverywhere(true)}>
              {t("everywhere")}
            </Button>
          </div>
        )}
      </section>

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
              if (p && (await run("remove", () => apiClient(`/staff-auth/passkeys/${p.id}`, { method: "DELETE" }), t("removed")))) setRemoving(null);
            }}
          >
            {t("removeConfirm")}
          </Button>
          <Button variant="outline" onClick={() => setRemoving(null)}>
            {t("keep")}
          </Button>
        </div>
      </Dialog>

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
