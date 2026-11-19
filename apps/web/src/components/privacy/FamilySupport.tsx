"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { useToast } from "@/components/ui/Toast";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { FamilyLink, FamilyLinkCreated, FamilyRelation } from "@/lib/api/types";
import { formatDate } from "@/lib/format";

const RELATIONS: FamilyRelation[] = ["husband", "mother", "sister", "friend", "other"];

/**
 * Family support (build week Y4, Year of the Family 2026): she makes a read-only link for someone she trusts. It shows
 * her upcoming care steps and "how you can help" tips; health details only if she ticks them. Every view is logged in
 * "who saw my data" above, and she can turn a link off at any time. Nothing is sent: she copies the link herself.
 */
export function FamilySupport({ links }: { links: FamilyLink[] }) {
  const t = useTranslations("family.manage");
  const tr = useTranslations("family.relation");
  const locale = useLocale() === "ar" ? "ar" : "en";
  const router = useRouter();
  const toast = useToast();
  const id = useId();
  const [relation, setRelation] = useState<FamilyRelation>("husband");
  const [details, setDetails] = useState(false);
  const [consent, setConsent] = useState(false);
  const [made, setMade] = useState<FamilyLinkCreated | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const active = links.filter((l) => l.active); // the API decides (not revoked, not expired), so server and browser agree

  const create = () =>
    start(async () => {
      setError(null);
      try {
        const r = await apiClient<FamilyLinkCreated>("/family-links", { body: { relation, include_details: details, consent } });
        setMade(r);
        setConsent(false);
        toast(t("created"));
        router.refresh();
      } catch (e) {
        setError(t("failed", { detail: e instanceof ApiError ? e.detail : String(e) }));
      }
    });

  const revoke = (linkId: number) =>
    start(async () => {
      try {
        await apiClient(`/family-links/${linkId}`, { method: "DELETE" });
        if (made?.id === linkId) setMade(null);
        toast(t("revoked"));
        router.refresh();
      } catch (e) {
        toast(t("failed", { detail: e instanceof ApiError ? e.detail : String(e) }));
      }
    });

  const url = made ? `${window.location.origin}${made.path}` : "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 6 }} data-testid="family-support">
      <p className="s dim" style={{ margin: 0 }}>
        {t("intro")}
      </p>
      <div className="field">
        <label htmlFor={`${id}-rel`}>{t("relationLabel")}</label>
        <select id={`${id}-rel`} value={relation} onChange={(e) => setRelation(e.target.value as FamilyRelation)}>
          {RELATIONS.map((r) => (
            <option key={r} value={r}>
              {tr(r)}
            </option>
          ))}
        </select>
      </div>
      <label className="s" style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        <input type="checkbox" checked={details} onChange={(e) => setDetails(e.target.checked)} style={{ marginTop: 3 }} />
        <span>
          {t("detailsLabel")}
          <br />
          <span className="xs faint">{t("detailsHint")}</span>
        </span>
      </label>
      <label className="s" style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: 3 }} />
        <span>{t("consentLabel")}</span>
      </label>
      <Button size="sm" pending={pending} disabled={!consent} onClick={create} style={{ alignSelf: "flex-start" }}>
        {t("create")}
      </Button>
      {error && (
        <p className="state err s" role="alert">
          {error}
        </p>
      )}
      {made && (
        <div className="notice s" role="status" data-testid="family-link-made">
          <p style={{ margin: 0 }}>{t("madeIntro", { date: formatDate(made.expires_at.slice(0, 10), locale) })}</p>
          <p className="mono xs" dir="ltr" style={{ margin: "6px 0", wordBreak: "break-all" }}>
            {url}
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(url);
                  toast(t("copied"));
                } catch {
                  toast(t("copyFailed"));
                }
              }}
            >
              {t("copy")}
            </Button>
            <a className="btn btn-o btn-sm" href={made.path} target="_blank" rel="noopener noreferrer">
              {t("preview")}
            </a>
          </div>
        </div>
      )}
      {active.length > 0 && (
        <div>
          <h3 className="s" style={{ fontWeight: 700, margin: "4px 0 6px" }}>
            {t("activeTitle")}
          </h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {active.map((l) => (
              <li key={l.id} className="kv" style={{ flexWrap: "wrap", gap: 8 }} data-link={l.id}>
                <span className="s">
                  {tr(l.relation)} {l.include_details && <Tag tone="info">{t("withDetails")}</Tag>}
                  <br />
                  <span className="xs faint">
                    {t("until", { date: formatDate(l.expires_at.slice(0, 10), locale) })}
                    {" · "}
                    {l.last_viewed_at ? t("lastViewed", { date: formatDate(l.last_viewed_at.slice(0, 10), locale) }) : t("notViewed")}
                  </span>
                </span>
                <Button size="sm" variant="outline" pending={pending} onClick={() => revoke(l.id)}>
                  {t("revoke")}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
