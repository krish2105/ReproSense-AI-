"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, useTransition, type FormEvent } from "react";
import { CrisisCard } from "@/components/safety/CrisisCard";
import { RedFlagCard } from "@/components/safety/RedFlagCard";
import { SourceLinks } from "@/components/safety/SourceLinks";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { useToast } from "@/components/ui/Toast";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { BpBody, BpReading, BpResult, Card } from "@/lib/api/types";
import type { Locale } from "@/i18n/config";
import { BP_RANGE, bpLevel, bpProblem, bpText } from "@/lib/bp";
import { isolate } from "@/lib/format";
import { SOURCES } from "@/lib/sources";

const RECHECK = "OBS_RAISED_BLOOD_PRESSURE";

/**
 * Blood pressure on her log screen (build week K6), shown only in pregnancy and the 12 weeks after birth. Saves with
 * POST /v1/bp; an urgent card (RF7, NICE NG133) comes back in the same response and is shown first, before anything
 * else in this box, exactly as the day log does with its red flags.
 */
export function BloodPressureForm({
  date,
  isToday,
  dateLabel,
  readings,
  locale,
}: {
  date: string;
  isToday: boolean;
  dateLabel: string;
  readings: BpReading[];
  locale: Locale;
}) {
  const t = useTranslations();
  const router = useRouter();
  const toast = useToast();
  const id = useId();
  const [sys, setSys] = useState("");
  const [dia, setDia] = useState("");
  const [time, setTime] = useState("");
  const [problem, setProblem] = useState<"range" | "order" | null>(null);
  const [tooHigh, setTooHigh] = useState(false); // above the range: maybe a slip, maybe a real reading
  const [result, setResult] = useState<{ flags: Card[]; crisis: boolean; recheck: BpReading | null } | null>(null);
  const [saving, startSave] = useTransition();
  const resultRef = useRef<HTMLDivElement>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const s = Number(sys);
    const d = Number(dia);
    const why = sys.trim() && dia.trim() ? bpProblem(s, d) : "range";
    setProblem(why);
    setTooHigh(why === "range" && (s > BP_RANGE.systolic[1] || d > BP_RANGE.diastolic[1]));
    if (why) return;
    const body: BpBody = { date, systolic: s, diastolic: d, time: time || null };
    startSave(async () => {
      try {
        const r = await apiClient<BpResult>(`/bp?lang=${locale}`, { body });
        const recheck = r.patterns.includes(RECHECK) && !r.red_flags.length ? r.reading : null;
        if (r.red_flags.length || r.crisis || recheck) {
          setResult({ flags: r.red_flags, crisis: r.crisis, recheck });
          requestAnimationFrame(() => resultRef.current?.focus());
        } else {
          setResult(null);
        }
        if (!r.red_flags.length) toast(t("bp.saved", { reading: isolate(bpText(r.reading)) }));
        setSys("");
        setDia("");
        setTime("");
        router.refresh();
      } catch (err) {
        toast(t("bp.saveFailed", { detail: err instanceof ApiError ? err.detail : String(err) }));
      }
    });
  };

  return (
    <section className="box form-card" aria-labelledby={`${id}-title`} data-testid="bp-form">
      <h2 id={`${id}-title`} style={{ fontSize: 18 }}>
        {t("bp.title")}
      </h2>

      <div ref={resultRef} tabIndex={-1} aria-live="assertive" style={{ outline: "none" }}>
        {result && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(result.crisis || result.flags.length > 0) && <h3 className="sr-only">{t("bp.urgentHeading")}</h3>}
            {result.crisis && <CrisisCard />}
            {result.flags.map((c) => (
              <RedFlagCard key={c.observation_id} card={c} locale={locale} headingLevel={3} />
            ))}
            {result.recheck && (
              <div className="obs" data-testid="bp-recheck">
                <span>
                  <Tag tone="soon">{t("tags.soon")}</Tag>
                </span>
                <h3 style={{ fontSize: 16 }}>{t("bp.recheckTitle")}</h3>
                <p className="s">{t("bp.recheckBody", { reading: isolate(bpText(result.recheck)) })}</p>
                <SourceLinks sources={[SOURCES.nice_ng133, SOURCES.nice_ng201]} />
              </div>
            )}
          </div>
        )}
      </div>

      <p className="xs">{t("bp.intro")}</p>
      <form method="post" onSubmit={submit} noValidate style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div className="field">
            <label htmlFor={`${id}-sys`}>{t("bp.systolic")}</label>
            <input
              id={`${id}-sys`}
              className="num"
              type="number"
              inputMode="numeric"
              min={BP_RANGE.systolic[0]}
              max={BP_RANGE.systolic[1]}
              step={1}
              required
              value={sys}
              aria-invalid={problem ? true : undefined}
              aria-describedby={`${id}-hint`}
              onChange={(e) => setSys(e.target.value)}
            />
          </div>
          <span className="big" aria-hidden="true" style={{ paddingBottom: 8 }}>
            /
          </span>
          <div className="field">
            <label htmlFor={`${id}-dia`}>{t("bp.diastolic")}</label>
            <input
              id={`${id}-dia`}
              className="num"
              type="number"
              inputMode="numeric"
              min={BP_RANGE.diastolic[0]}
              max={BP_RANGE.diastolic[1]}
              step={1}
              required
              value={dia}
              aria-invalid={problem ? true : undefined}
              aria-describedby={`${id}-hint`}
              onChange={(e) => setDia(e.target.value)}
            />
          </div>
          <span className="s dim" style={{ paddingBottom: 12 }}>
            {t("bp.unit")}
          </span>
        </div>
        <p id={`${id}-hint`} className={problem ? "xs hi" : "xs faint"} role={problem ? "alert" : undefined}>
          {problem === "order" ? t("bp.orderError") : t("bp.rangeHint")}
        </p>
        {tooHigh && (
          <p className="s hi" role="alert">
            {t("bp.rangeHigh")}{" "}
            <a className="btn btn-a btn-sm" href="tel:998">
              {t("urgent.call")}
            </a>
          </p>
        )}
        <div className="field">
          <label htmlFor={`${id}-time`}>{t("bp.time")}</label>
          <input id={`${id}-time`} className="num" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <Button type="submit" size="wide" pending={saving}>
          {isToday ? t("bp.saveToday") : t("bp.save", { date: dateLabel })}
        </Button>
      </form>

      <div>
        <p className="label">{t("bp.dayTitle", { date: dateLabel })}</p>
        {readings.length === 0 ? (
          <p className="xs faint">{t("bp.dayNone")}</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: "6px 0 0", display: "flex", flexDirection: "column", gap: 6 }}>
            {readings.map((r) => {
              const level = bpLevel(r);
              return (
                <li key={r.id} className="kv" style={{ gap: 8 }}>
                  <span className="s">
                    <b dir="ltr" className="mono">
                      {bpText(r)}
                    </b>{" "}
                    {t("bp.unit")}
                    {r.time && (
                      <span className="xs faint" dir="ltr">
                        {" "}
                        · {r.time}
                      </span>
                    )}
                  </span>
                  {level && <Tag tone={level === "severe" ? "urgent" : "soon"}>{t(level === "severe" ? "bp.noteSevere" : "bp.noteRaised")}</Tag>}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <p className="xs">{t("bp.warn")}</p>
      <SourceLinks sources={[SOURCES.nice_ng133]} />
    </section>
  );
}
