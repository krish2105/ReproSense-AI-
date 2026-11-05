"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Tag } from "@/components/ui/Tag";
import { useToast } from "@/components/ui/Toast";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { FhirExport, PrivacyResponse } from "@/lib/api/types";

const detailOf = (e: unknown) => (e instanceof ApiError ? e.detail : String(e));

/** Her three choices (PATCH /v1/consents). Stopping care_share removes her from the clinic list at once. */
export function ConsentToggles({ consents }: { consents: PrivacyResponse["consents"] }) {
  const t = useTranslations();
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const purposes = ["care_share", "assistant", "research"] as const;
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 0", display: "flex", flexDirection: "column", gap: 10 }}>
      {purposes.map((p) => {
        const c = consents.find((x) => x.purpose === p);
        const on = Boolean(c?.granted && !c.revoked_at);
        const clinic = c?.clinic_id && t.has(`clinics.${c.clinic_id}`) ? t(`clinics.${c.clinic_id}`) : c?.clinic_name;
        return (
          <li key={p} className="kv" style={{ flexWrap: "wrap", alignItems: "center" }}>
            <span>
              <b className="s">{t(`privacy.purpose.${p}`)}</b>
              {p === "care_share" && clinic && (
                <>
                  <br />
                  <span className="xs dim">{t("privacy.clinic", { clinic })}</span>
                </>
              )}
              {p === "assistant" && (
                <>
                  <br />
                  <span className="xs dim">{t("privacy.aiHint")}</span>
                </>
              )}
            </span>
            <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Tag tone={on ? "ok" : "info"}>{on ? t("privacy.allowed") : t("privacy.notAllowed")}</Tag>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                aria-label={`${on ? t("privacy.stop") : t("privacy.allow")}: ${t(`privacy.purpose.${p}`)}`}
                onClick={() =>
                  start(async () => {
                    try {
                      await apiClient("/consents", { method: "PATCH", body: { purpose: p, granted: !on } });
                      toast(t("privacy.saved"));
                      router.refresh();
                    } catch (e) {
                      toast(t("privacy.saveFailed", { detail: detailOf(e) }));
                    }
                  })
                }
              >
                {on ? t("privacy.stop") : t("privacy.allow")}
              </Button>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** Validates the FHIR R4 export with the API and offers the download. */
export function FhirCheck() {
  const t = useTranslations("privacy");
  const [res, setRes] = useState<FhirExport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const n = res?.bundle.entry?.length ?? 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Button
          size="sm"
          variant="outline"
          pending={pending}
          onClick={() =>
            start(async () => {
              try {
                setError(null);
                setRes(await apiClient<FhirExport>("/fhir"));
              } catch (e) {
                setError(t("fhirFailed", { detail: detailOf(e) }));
              }
            })
          }
        >
          {t("fhirCheck")}
        </Button>
        {res && (
          <a
            className="btn btn-o btn-sm"
            download="reprosense-fhir-bundle.json"
            href={`data:application/fhir+json;charset=utf-8,${encodeURIComponent(JSON.stringify(res.bundle, null, 2))}`}
          >
            {t("fhirDownload")}
          </a>
        )}
      </div>
      <p className="s" aria-live="polite">
        {error ?? (res ? (res.validation_errors.length ? t("fhirErrors", { n, errors: res.validation_errors.length }) : t("fhirOk", { n })) : "")}
      </p>
    </div>
  );
}

const DISCREET = "rs_discreet";

/** Discreet mode: "My notes" instead of the app name, her name and initial hidden (docs/06 v4). */
export function DiscreetToggle({ initial }: { initial: boolean }) {
  const t = useTranslations("privacy");
  const toast = useToast();
  const [on, setOn] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <Button
      size="sm"
      variant="outline"
      pending={pending}
      aria-pressed={on}
      onClick={() => {
        const next = !on;
        setOn(next);
        document.documentElement.toggleAttribute("data-discreet", next);
        document.cookie = `${DISCREET}=${next ? "1" : ""}; path=/; max-age=${next ? 31536000 : 0}; samesite=lax`;
        start(async () => {
          try {
            await apiClient("/me", { method: "PATCH", body: { discreet: next } });
          } catch {
            /* the on-screen setting still applies; the profile flag catches up next time */
          }
          toast(next ? t("discreetSavedOn") : t("discreetSavedOff"));
        });
      }}
    >
      {on ? t("discreetOff") : t("discreetOn")}
    </Button>
  );
}

/** Deleting entries is destructive: it always asks first. */
export function DeleteData() {
  const t = useTranslations("privacy");
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} style={{ color: "var(--urgent)", borderColor: "var(--urgent)" }}>
        {t("deleteButton")}
      </Button>
      <Dialog open={open} onClose={close} title={t("deleteTitle")}>
        <p className="s">{t("deleteConfirmBody")}</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button
            pending={pending}
            style={{ background: "var(--urgent)", color: "#fff" }}
            onClick={() =>
              start(async () => {
                try {
                  await apiClient("/me/data", { method: "DELETE" });
                  toast(t("deleted"));
                  setOpen(false);
                  router.refresh();
                } catch (e) {
                  toast(t("deleteFailed", { detail: detailOf(e) }));
                }
              })
            }
          >
            {t("deleteConfirm")}
          </Button>
          <Button variant="outline" onClick={close}>
            {t("cancel")}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
