"use client";

import { useTranslations } from "next-intl";
import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { enterAs } from "@/lib/enter";

/** Accept a clinician invite: a demo clinician account in that clinic, then the clinic worklist. */
export function ClinicianJoin({ invite, clinicName }: { invite: string; clinicName: string }) {
  const t = useTranslations("joinClinician");
  const toast = useToast();
  const nameId = useId();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!/\p{L}/u.test(name)) return setError(t("required"));
    setError(null);
    setPending(true);
    try {
      await apiClient("/demo/clinician-join", { body: { invite, name: name.trim() } });
      enterAs("/clinic"); // a new identity: a full page load
    } catch (err) {
      setPending(false);
      toast(t("failed", { detail: err instanceof ApiError ? err.detail : String(err) }));
    }
  };
  return (
    <section className="panel" aria-labelledby="inv-title" style={{ padding: 24, maxWidth: 560, margin: "28px auto 0" }}>
      <h1 id="inv-title" className="page-title" style={{ fontSize: 26 }}>
        {t("title", { clinic: clinicName })}
      </h1>
      <p className="dim" style={{ marginTop: 8 }}>
        {t("body")}
      </p>
      <p className="notice" role="note" style={{ marginTop: 12 }}>
        {t("demoNote")}
      </p>
      <form method="post" onSubmit={submit} noValidate style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
        <div className="field">
          <label htmlFor={nameId}>{t("name")}</label>
          <input id={nameId} type="text" autoComplete="off" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        {error && (
          <p className="s" role="alert" style={{ color: "var(--urgent)" }}>
            {error}
          </p>
        )}
        <Button type="submit" pending={pending} className="self-start">
          {pending ? t("joining") : t("join")}
        </Button>
      </form>
    </section>
  );
}
