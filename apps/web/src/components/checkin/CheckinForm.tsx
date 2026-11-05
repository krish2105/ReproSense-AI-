"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type FormEvent } from "react";
import { CrisisCard } from "@/components/safety/CrisisCard";
import { SourceLinks } from "@/components/safety/SourceLinks";
import { Button, ButtonLink } from "@/components/ui/Button";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { EpdsResult } from "@/lib/api/types";
import { EPDS_CITATION, EPDS_ITEMS, EPDS_URL } from "@/lib/epds";

/** EPDS check-in. Crisis (item 10 > 0) shows support only: no score, no pattern card (CLAUDE.md rule 5). */
export function CheckinForm() {
  const t = useTranslations("checkin");
  const locale = useLocale();
  const router = useRouter();
  const [answers, setAnswers] = useState<(number | null)[]>(Array(10).fill(null));
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EpdsResult | null>(null);
  const [pending, start] = useTransition();
  const top = useRef<HTMLDivElement>(null);

  // Answers are sent only by fetch. The form never submits natively (method="post", no submit button), so even
  // a click before hydration can't put health answers into a URL.
  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const missing = answers.findIndex((a) => a === null);
    if (missing >= 0) {
      setError(t("required", { n: missing + 1 }));
      document.getElementById(`q${missing}`)?.focus();
      return;
    }
    setError(null);
    start(async () => {
      try {
        const r = await apiClient<EpdsResult>("/questionnaires/epds", { body: { answers } });
        setResult(r);
        router.refresh();
        requestAnimationFrame(() => top.current?.focus());
      } catch (err) {
        setError(t("failed", { detail: err instanceof ApiError ? err.detail : String(err) }));
      }
    });
  };

  if (result)
    return (
      <div ref={top} tabIndex={-1} style={{ display: "flex", flexDirection: "column", gap: 12, outline: "none" }}>
        {result.crisis ? (
          <CrisisCard />
        ) : (
          <section className="box" aria-live="polite">
            <h2 style={{ fontSize: 18 }}>{t("doneTitle")}</h2>
            <p className="s" style={{ marginTop: 6 }}>
              {t("doneBody")}
            </p>
            {result.total !== null && <p className="s dim">{t("total", { total: result.total })}</p>}
            <p className="s" style={{ marginTop: 6 }}>
              {t("talk")}
            </p>
            {result.cards.map((c) => (
              <div key={c.observation_id} className="obs" style={{ marginTop: 10 }}>
                <h3 style={{ fontSize: 16 }} dir="auto">
                  {c.title}
                </h3>
                <p className="s dim" dir="auto">
                  {c.summary}
                </p>
                <SourceLinks sources={c.sources} />
              </div>
            ))}
          </section>
        )}
        <ButtonLink href="/app" variant="outline" size="sm" className="self-start">
          {t("back")}
        </ButtonLink>
      </div>
    );

  return (
    <form onSubmit={submit} method="post" className="box form-card" noValidate>
      <p className="s">{t("instruction")}</p>
      {locale === "ar" && <p className="notice xs">{t("arNote")}</p>}
      <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 16 }} lang="en" dir="ltr">
        {EPDS_ITEMS.map((item, i) => (
          <li key={i}>
            <fieldset id={`q${i}`} tabIndex={-1} style={{ border: 0, padding: 0, margin: 0 }}>
              <legend className="s" style={{ fontWeight: 700, marginBottom: 8 }}>
                <span className="xs faint" lang={locale} dir="auto" style={{ display: "block", fontWeight: 600 }}>
                  {t("question", { n: i + 1 })}
                </span>
                {item.text}
              </legend>
              <div className="seg" role="radiogroup" aria-label={item.text}>
                {item.options.map((o) => (
                  <label key={o.label} className="radio-pill">
                    <input
                      type="radio"
                      name={`epds-${i}`}
                      value={o.score}
                      checked={answers[i] === o.score}
                      onChange={() => setAnswers((a) => a.map((v, j) => (j === i ? o.score : v)))}
                    />
                    <span>{o.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </li>
        ))}
      </ol>
      {error && (
        <p className="state err s" role="alert">
          {error}
        </p>
      )}
      <Button type="button" size="wide" pending={pending} onClick={() => submit()}>
        {t("submit")}
      </Button>
      <p className="xs faint">
        {t("source")}:{" "}
        <a href={EPDS_URL} target="_blank" rel="noopener noreferrer" lang="en" dir="ltr">
          {EPDS_CITATION}
        </a>
      </p>
    </form>
  );
}
