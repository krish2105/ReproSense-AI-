"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useId, useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";
import { TableScroll } from "@/components/ui/TableScroll";
import { Tag } from "@/components/ui/Tag";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { EventsResponse } from "@/lib/api/types";
import { DateField } from "@/components/ui/DateField";

type Filters = { role: string; action: string; from: string; to: string; clinic: string };
const EMPTY: Filters = { role: "", action: "", from: "", to: "", clinic: "" };
const PAGE_SIZE = 20;

/**
 * Who did what and when, from the hash-chained audit log: the DoH admin sees every clinic, a clinic admin only her
 * own (Postgres decides, in audit_event_rows()). Pseudonymous ids only; names never reach this table. Pages count down
 * from the newest entry at the first load, so this view's own audit entry never shifts a page. Loaded on demand (not on
 * the dashboard's 10-second refresh), so reading the log adds one audit entry per page, not one every 10 seconds.
 */
export function EventTimeline({ endpoint, scope, clinics = [] }: { endpoint: "/admin/events" | "/clinic-admin/events"; scope: "network" | "clinic"; clinics?: { id: string; name: string }[] }) {
  const t = useTranslations("loop");
  const locale = useLocale() === "ar" ? "ar" : "en";
  const id = useId();
  const [draft, setDraft] = useState<Filters>(EMPTY);
  // The audit log holds real timestamps (sign-ins happen now), so its filter uses the real date, not the demo ref_date.
  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  const [applied, setApplied] = useState<Filters>(EMPTY);
  const [page, setPage] = useState(1);
  const [snapshot, setSnapshot] = useState<number | null>(null);
  const [data, setData] = useState<EventsResponse | null>(null);
  const [result, setResult] = useState<{ key: string; error: string | null } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const key = `${endpoint}|${JSON.stringify(applied)}|${page}|${attempt}`;
  const loading = result?.key !== key; // the request for what is asked now has not answered yet
  const error = result?.key === key ? result.error : null;
  const when = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-GB", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "Asia/Dubai",
      }),
    [locale],
  );

  useEffect(() => {
    const ctrl = new AbortController();
    const q = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
    for (const [k, v] of Object.entries(applied)) if (v) q.set(k, v);
    if (snapshot !== null) q.set("snapshot", String(snapshot));
    apiClient<EventsResponse>(`${endpoint}?${q.toString()}`, { signal: ctrl.signal })
      .then((d) => {
        setData(d);
        if (snapshot === null) setSnapshot(d.snapshot);
        setResult({ key, error: null });
      })
      .catch((e: unknown) => {
        if (ctrl.signal.aborted) return;
        setResult({ key, error: e instanceof ApiError ? e.detail : String(e) });
      });
    return () => ctrl.abort();
    // `key` covers endpoint, filters, page and retries; snapshot is set from the first page and must not refetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const apply = (next: Filters) => {
    setSnapshot(null);
    setPage(1);
    setApplied(next);
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    apply(draft);
  };
  const clear = () => {
    setDraft(EMPTY);
    apply(EMPTY);
  };
  const label = (prefix: "roles" | "actions", v: string) => (t.has(`${prefix}.${v}`) ? t(`${prefix}.${v}`) : v);
  const clinicName = (c: string | null) => (c ? (clinics.find((x) => x.id === c)?.name ?? c) : t("noClinic"));
  const set = (k: keyof Filters) => (e: { target: { value: string } }) => setDraft((d) => ({ ...d, [k]: e.target.value }));
  const titleId = `${id}-title`;

  return (
    <section className="panel" aria-labelledby={titleId} data-testid="event-timeline" style={{ padding: 20, marginTop: 20 }}>
      <div className="kv" style={{ flexWrap: "wrap", alignItems: "baseline" }}>
        <h2 id={titleId} style={{ fontSize: 18 }}>
          {t("eventsTitle")}
        </h2>
        {data &&
          (data.chain.ok ? (
            <Tag tone="ok">{t("chainOk", { n: data.chain.entries })}</Tag>
          ) : (
            <Tag tone="urgent">{t("chainBad", { id: data.chain.first_bad_id ?? 0 })}</Tag>
          ))}
      </div>
      <p className="s dim" style={{ marginTop: 4 }}>
        {scope === "network" ? t("eventsIntroNetwork") : t("eventsIntroClinic")}
      </p>

      <form className="loop-filters" onSubmit={submit} aria-label={t("filtersLabel")}>
        <div className="field">
          <label htmlFor={`${id}-role`}>{t("filterRole")}</label>
          <select id={`${id}-role`} value={draft.role} onChange={set("role")}>
            <option value="">{t("allRoles")}</option>
            {(data?.filters.roles ?? []).map((r) => (
              <option key={r} value={r}>
                {label("roles", r)}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`${id}-action`}>{t("filterAction")}</label>
          <select id={`${id}-action`} value={draft.action} onChange={set("action")}>
            <option value="">{t("allActions")}</option>
            {(data?.filters.actions ?? []).map((a) => (
              <option key={a} value={a}>
                {label("actions", a)}
              </option>
            ))}
          </select>
        </div>
        {scope === "network" && clinics.length > 0 && (
          <div className="field">
            <label htmlFor={`${id}-clinic`}>{t("filterClinic")}</label>
            <select id={`${id}-clinic`} value={draft.clinic} onChange={set("clinic")}>
              <option value="">{t("allClinics")}</option>
              {clinics.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <DateField id={`${id}-from`} label={t("filterFrom")} value={draft.from} max={draft.to || today} today={today} onChange={(v) => setDraft((d) => ({ ...d, from: v }))} />
        <DateField id={`${id}-to`} label={t("filterTo")} value={draft.to} min={draft.from || undefined} max={today} today={today} onChange={(v) => setDraft((d) => ({ ...d, to: v }))} />
        <div className="loop-filter-actions">
          <Button type="submit" size="sm" pending={loading}>
            {t("apply")}
          </Button>
          <Button size="sm" variant="outline" disabled={loading} onClick={clear}>
            {t("clear")}
          </Button>
        </div>
      </form>

      <p className="xs faint" aria-live="polite" style={{ marginTop: 12, minHeight: "1em" }}>
        {data && !error ? t("pageOf", { page: data.page, pages: data.pages, total: data.total }) : ""}
      </p>
      <div>
        {error ? (
          <div className="state err" role="alert" style={{ marginTop: 6 }}>
            <p className="s">{t("loadFailed", { detail: error })}</p>
            <Button size="sm" variant="outline" onClick={() => setAttempt((a) => a + 1)}>
              {t("retry")}
            </Button>
          </div>
        ) : !data ? (
          <LoadingRegion>
            <Skeleton height={220} style={{ marginTop: 6 }} />
          </LoadingRegion>
        ) : data.events.length === 0 ? (
          <p className="s dim" style={{ marginTop: 6 }}>
            {t("empty")}
          </p>
        ) : (
          <>
            <TableScroll label={t("tableLabel")} style={{ marginTop: 6 }}>
              <table aria-busy={loading || undefined}>
                <thead>
                  <tr>
                    <th scope="col">{t("colTime")}</th>
                    <th scope="col">{t("colRole")}</th>
                    <th scope="col">{t("colActor")}</th>
                    <th scope="col">{t("colAction")}</th>
                    <th scope="col">{t("colRecord")}</th>
                    <th scope="col">{t("colTarget")}</th>
                    {scope === "network" && <th scope="col">{t("colClinic")}</th>}
                  </tr>
                </thead>
                <tbody>
                  {data.events.map((e) => (
                    <tr key={e.id} data-action={e.action}>
                      <td className="mono" style={{ whiteSpace: "nowrap" }}>
                        <time dateTime={e.at}>{when.format(new Date(e.at))}</time>
                      </td>
                      <td>{label("roles", e.actor_role)}</td>
                      <td className="mono" dir="ltr" style={{ whiteSpace: "nowrap" }}>
                        {e.actor ?? "—"}
                      </td>
                      <td>{label("actions", e.action)}</td>
                      <td className="mono" dir="ltr" style={{ whiteSpace: "nowrap" }}>
                        {e.record ?? "—"}
                      </td>
                      <td className="mono xs" dir="ltr">
                        {e.target ?? "—"}
                      </td>
                      {scope === "network" && <td>{clinicName(e.clinic_id)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
            <nav className="loop-pages" aria-label={t("pagesLabel")}>
              <Button size="sm" variant="outline" disabled={loading || page <= 1} onClick={() => setPage((p) => p - 1)}>
                {t("newer")}
              </Button>
              <Button size="sm" variant="outline" disabled={loading || page >= data.pages} onClick={() => setPage((p) => p + 1)}>
                {t("older")}
              </Button>
            </nav>
          </>
        )}
      </div>
    </section>
  );
}
