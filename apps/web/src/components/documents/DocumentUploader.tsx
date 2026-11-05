"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { ApiError, errorDetail } from "@/lib/api/errors";
import { apiClient } from "@/lib/api/client";
import type { DocumentUpload, ExtractedRow } from "@/lib/api/types";
import { formatDate } from "@/lib/format";
import { TableScroll } from "@/components/ui/TableScroll";

type Row = ExtractedRow & { keep: boolean };

/** Upload → read → she checks and edits every value → confirm (nothing is saved before she confirms). */
export function DocumentUploader({ demoFile }: { demoFile?: string }) {
  const t = useTranslations("documents");
  const locale = useLocale() === "ar" ? "ar" : "en";
  const router = useRouter();
  const toast = useToast();
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [doc, setDoc] = useState<DocumentUpload | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const upload = (file: File) =>
    start(async () => {
      setError(null);
      setDone(null);
      const form = new FormData();
      form.append("file", file);
      try {
        const res = await fetch("/api/v1/documents", { method: "POST", body: form, credentials: "same-origin" });
        if (!res.ok) throw new ApiError(res.status, await errorDetail(res));
        const d = (await res.json()) as DocumentUpload;
        setDoc(d);
        setRows(d.rows.map((r) => ({ ...r, keep: true })));
        router.refresh();
      } catch (e) {
        setError(t("uploadFailed", { detail: e instanceof ApiError ? e.detail : String(e) }));
      }
    });

  const useDemo = () =>
    start(async () => {
      const res = await fetch(demoFile!);
      const blob = await res.blob();
      upload(new File([blob], demoFile!.split("/").pop() ?? "demo.txt", { type: "text/plain" }));
    });

  const confirm = () =>
    start(async () => {
      if (!doc) return;
      try {
        const kept: ExtractedRow[] = rows.filter((r) => r.keep).map((r) => ({ code: r.code, test: r.test, value: r.value, unit: r.unit, ref_low: r.ref_low, ref_high: r.ref_high, flag: r.flag, date: r.date }));
        const res = await apiClient<{ saved: number; patterns: string[] }>(`/documents/${doc.id}/confirm`, { body: { rows: kept } });
        setDone(t("confirmed", { n: res.saved }));
        toast(t("confirmed", { n: res.saved }));
        setDoc(null);
        router.refresh();
      } catch (e) {
        setError(t("confirmFailed", { detail: e instanceof ApiError ? e.detail : String(e) }));
      }
    });

  const edit = (i: number, patch: Partial<Row>) => setRows((x) => x.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  return (
    <section className="box form-card" aria-labelledby={`${id}-t`}>
      <h2 id={`${id}-t`} className="sr-only">
        {t("choose")}
      </h2>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <label htmlFor={`${id}-f`} className="sr-only">
          {t("fileLabel")}
        </label>
        <input
          ref={input}
          id={`${id}-f`}
          type="file"
          accept=".pdf,.txt,application/pdf,text/plain"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = "";
          }}
        />
        <Button variant="outline" pending={pending} onClick={() => input.current?.click()}>
          {t("choose")}
        </Button>
        {demoFile && (
          <Button pending={pending} onClick={useDemo}>
            {t("demo")}
          </Button>
        )}
      </div>
      <div aria-live="polite">
        {pending && !doc && <p className="s dim">{t("reading")}…</p>}
        {error && (
          <p className="state err s" role="alert">
            {error}
          </p>
        )}
        {done && (
          <p className="notice s" role="status">
            {done}
          </p>
        )}
      </div>
      {doc && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <h3 style={{ fontSize: 16 }}>{t("tableTitle")}</h3>
          <p className="xs dim">{doc.message}</p>
          {doc.sample_date && <p className="xs">{t("sampleDate", { date: formatDate(doc.sample_date, locale) })}</p>}
          {doc.injection_lines_removed > 0 && <p className="xs notice">{t("injected", { n: doc.injection_lines_removed })}</p>}
          {rows.length === 0 ? (
            <p className="s">{t("noRows")}</p>
          ) : (
            <TableScroll label={t("tableTitle")}>
              <table>
                <thead>
                  <tr>
                    <th scope="col">{t("colKeep")}</th>
                    <th scope="col">{t("colTest")}</th>
                    <th scope="col">{t("colValue")}</th>
                    <th scope="col">{t("colUnit")}</th>
                    <th scope="col">{t("colRange")}</th>
                    <th scope="col">{t("colFlag")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={`${r.code}-${i}`}>
                      <td>
                        <input type="checkbox" checked={r.keep} aria-label={`${t("colKeep")}: ${r.test}`} onChange={(e) => edit(i, { keep: e.target.checked })} style={{ width: 18, height: 18, accentColor: "var(--plum)" }} />
                      </td>
                      <td lang="en" dir="auto">
                        {r.test}
                      </td>
                      <td>
                        <input
                          type="text"
                          inputMode="decimal"
                          dir="ltr"
                          aria-label={`${t("colValue")}: ${r.test}`}
                          value={String(r.value)}
                          onChange={(e) => edit(i, { value: e.target.value })}
                          style={{ width: 80, padding: "6px 8px", borderRadius: 10 }}
                        />
                      </td>
                      <td dir="ltr">{r.unit}</td>
                      <td className="mono" dir="ltr">
                        {r.ref_low ?? ""}
                        {r.ref_low !== null && r.ref_high !== null ? "–" : r.ref_high !== null ? "< " : ""}
                        {r.ref_high ?? ""}
                      </td>
                      <td className={r.flag ? "hi" : undefined}>{r.flag}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          )}
          {rows.length > 0 && (
            <Button pending={pending} onClick={confirm} style={{ alignSelf: "flex-start" }}>
              {t("confirm")}
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
