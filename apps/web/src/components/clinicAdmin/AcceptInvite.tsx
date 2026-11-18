"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition, type FormEvent } from "react";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { enterAs } from "@/lib/enter";

/** The clinician's side of an invite (A3): a display name, then she joins that clinic and opens the clinician view.
 *  A refused name (422) does not use up the invite, so she can correct it and try again. */
export function AcceptInvite({ token }: { token: string }) {
  const t = useTranslations("clinicInvite");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      try {
        await apiClient(`/clinic-invites/${encodeURIComponent(token)}/accept`, { body: { display_name: name.trim() } });
        enterAs("/clinic");
      } catch (err) {
        setError(err instanceof ApiError ? err.detail : String(err));
      }
    });
  };

  return (
    <form className="box" onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }} aria-describedby="ci-note">
      <div className="field">
        <label htmlFor="ci-name">{t("nameLabel")}</label>
        <input id="ci-name" type="text" autoComplete="name" maxLength={40} required value={name} onChange={(e) => setName(e.target.value)} aria-invalid={error ? true : undefined} aria-describedby={error ? "ci-error" : "ci-hint"} />
        <span id="ci-hint" className="xs faint">
          {t("nameHint")}
        </span>
      </div>
      {error && (
        <p id="ci-error" className="s" role="alert" style={{ color: "var(--urgent)" }}>
          {t("failed", { detail: error })}
        </p>
      )}
      <button type="submit" className="btn btn-a" disabled={pending || !name.trim()} aria-busy={pending || undefined} style={{ alignSelf: "flex-start" }}>
        {t("accept")}
      </button>
      <p id="ci-note" className="xs faint">
        {t("note")}
      </p>
    </form>
  );
}
