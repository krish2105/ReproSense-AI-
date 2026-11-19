"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition, type FormEvent } from "react";
import { useStaffProblem } from "@/components/staffSignin/useStaffProblem";
import { Button } from "@/components/ui/Button";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { enterAs } from "@/lib/enter";
import { isolate } from "@/lib/format";
import { addStaffPasskey } from "@/lib/passkey";

/** The clinician's side of an invite (A3): a display name, then she joins that clinic. Then (plan section 5) she adds a
 *  passkey for the staff door, or skips it, and opens the clinician view. A refused name (422) does not use up the
 *  invite, so she can correct it and try again. */
export function AcceptInvite({ token }: { token: string }) {
  const t = useTranslations("clinicInvite");
  const problem = useStaffProblem();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [joined, setJoined] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [adding, setAdding] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      try {
        const r = await apiClient<{ clinic: { name: string } }>(`/clinic-invites/${encodeURIComponent(token)}/accept`, { body: { display_name: name.trim() } });
        setJoined(r.clinic.name);
      } catch (err) {
        setError(err instanceof ApiError ? err.detail : String(err));
      }
    });
  };

  const addPasskey = async () => {
    setError(null);
    setAdding(true);
    try {
      await addStaffPasskey();
      setAdded(true);
    } catch (e) {
      setError(problem(e));
    }
    setAdding(false);
  };

  if (joined !== null) {
    return (
      <section className="box" aria-labelledby="ci-joined" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 id="ci-joined" style={{ fontSize: 18 }}>
          {t("joinedTitle", { clinic: isolate(joined) })}
        </h2>
        {added ? (
          <p className="s" role="status">
            {t("passkeyAdded")}
          </p>
        ) : (
          <p className="s dim">{t("passkeyBody")}</p>
        )}
        {error && (
          <p className="s" role="alert" style={{ color: "var(--urgent)" }}>
            {error}
          </p>
        )}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {added ? (
            <Button onClick={() => enterAs("/clinic")}>{t("open")}</Button>
          ) : (
            <>
              <Button pending={adding} onClick={addPasskey}>
                {t("addPasskey")}
              </Button>
              <Button variant="outline" disabled={adding} onClick={() => enterAs("/clinic")}>
                {t("skip")}
              </Button>
            </>
          )}
        </div>
      </section>
    );
  }

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
