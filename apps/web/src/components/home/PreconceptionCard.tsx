"use client";

import { useTranslations } from "next-intl";
import { useId, useState, useTransition } from "react";
import { SourceLinks } from "@/components/safety/SourceLinks";
import { Tag } from "@/components/ui/Tag";
import { useToast } from "@/components/ui/Toast";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { Preconception, PreconceptionItemId } from "@/lib/api/types";

/**
 * Planning a pregnancy (build week Y1): five things she may want to look at before or while trying, each with its
 * sources. Information, not instructions: nothing is required, nothing is a diagnosis, and a tick is only her own note
 * (saved to her record, undone with one more tap). Two items say when her own entries point to them.
 */
export function PreconceptionCard({ initial }: { initial: Preconception }) {
  const t = useTranslations("preconception");
  const toast = useToast();
  const titleId = useId();
  const [c, setC] = useState(initial);
  const [busy, setBusy] = useState<PreconceptionItemId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();

  const toggle = (id: PreconceptionItemId, done: boolean) => {
    const before = c;
    // The tick shows at once (a checkbox that waits for the server feels ignored); the server's answer then replaces
    // it, and a failed save puts the box back as it was.
    setC({
      ...c,
      items: c.items.map((i) => (i.id === id ? { ...i, done } : i)),
      done: c.done + (done ? 1 : -1),
    });
    setBusy(id);
    setError(null);
    start(async () => {
      try {
        setC(await apiClient<Preconception>(`/preconception/${id}`, { body: { done } }));
        toast(done ? t("saved") : t("removed"));
      } catch (e) {
        setC(before);
        setError(t("saveFailed", { detail: e instanceof ApiError ? e.detail : String(e) }));
      } finally {
        setBusy(null);
      }
    });
  };

  return (
    <section className="box" aria-labelledby={titleId} data-testid="preconception-card">
      <p className="eyebrow-s">{t("eyebrow")}</p>
      <div className="kv" style={{ alignItems: "baseline", marginTop: 4 }}>
        <h2 id={titleId} style={{ fontSize: 17 }}>
          {t("title")}
        </h2>
        <span className="xs faint" aria-live="polite">
          {t("progress", { done: c.done, total: c.total })}
        </span>
      </div>
      <p className="xs" style={{ margin: "6px 0 10px" }}>
        {t("intro")}
      </p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        {c.items.map((item) => {
          const inputId = `${titleId}-${item.id}`;
          return (
            <li key={item.id} data-item={item.id} style={{ borderTop: "1px solid var(--line)", paddingTop: 10 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <input
                  id={inputId}
                  type="checkbox"
                  className="hit"
                  checked={item.done}
                  disabled={busy === item.id}
                  aria-busy={busy === item.id || undefined}
                  onChange={(e) => toggle(item.id, e.target.checked)}
                  style={{ marginTop: 3, width: 18, height: 18, accentColor: "var(--accent)" }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="kv" style={{ alignItems: "flex-start", gap: 8 }}>
                    <label htmlFor={inputId} className="s" style={{ fontWeight: 600 }}>
                      {t(`items.${item.id}.title`)}
                    </label>
                    {item.relevant && <Tag tone="soon">{t("relevant")}</Tag>}
                  </div>
                  <p className="xs" style={{ margin: "4px 0 0" }}>
                    {t(`items.${item.id}.body`)}
                  </p>
                  <SourceLinks sources={item.source_links} />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {error && (
        <p className="state err s" role="alert">
          {error}
        </p>
      )}
      <p className="xs faint" style={{ marginTop: 10 }}>
        {t("note")}
      </p>
    </section>
  );
}
