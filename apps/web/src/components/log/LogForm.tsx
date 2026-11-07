"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type FormEvent } from "react";
import { CrisisCard } from "@/components/safety/CrisisCard";
import { RedFlagCard } from "@/components/safety/RedFlagCard";
import { Button } from "@/components/ui/Button";
import { Seg } from "@/components/ui/Pills";
import { useToast } from "@/components/ui/Toast";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { Card, Flow, Impact, LogBody, LogResult, PainSite, ParseResult, PbacItems, TimelineDay } from "@/lib/api/types";
import type { Locale } from "@/i18n/config";
import { ALL_SYMPTOMS, COMMON_SYMPTOMS, FLOWS, IMPACTS, MORE_SYMPTOMS, PBAC_WEIGHTS, pbacScore, slug } from "@/lib/vocab";
import { BodyMap } from "./BodyMap";

type PbacKey = `${"pads" | "tampons"}_${"light" | "moderate" | "soaked"}` | `clots_${"small" | "large"}`;
const PBAC_ROWS: ReadonlyArray<{ key: PbacKey; group: keyof typeof PBAC_WEIGHTS; level: string }> = [
  { key: "pads_light", group: "pads", level: "light" },
  { key: "pads_moderate", group: "pads", level: "moderate" },
  { key: "pads_soaked", group: "pads", level: "soaked" },
  { key: "tampons_light", group: "tampons", level: "light" },
  { key: "tampons_moderate", group: "tampons", level: "moderate" },
  { key: "tampons_soaked", group: "tampons", level: "soaked" },
  { key: "clots_small", group: "clots", level: "small" },
  { key: "clots_large", group: "clots", level: "large" },
];

function toItems(counts: Partial<Record<PbacKey, number>>): PbacItems | null {
  const out: Record<string, Record<string, number>> = {};
  for (const r of PBAC_ROWS) {
    const n = counts[r.key] ?? 0;
    if (n > 0) (out[r.group] ??= {})[r.level] = n;
  }
  return Object.keys(out).length ? (out as PbacItems) : null;
}

function fromItems(items: PbacItems | null | undefined): Partial<Record<PbacKey, number>> {
  const out: Partial<Record<PbacKey, number>> = {};
  for (const r of PBAC_ROWS) {
    const n = (items?.[r.group] as Record<string, number> | undefined)?.[r.level];
    if (n) out[r.key] = n;
  }
  return out;
}

/** Log form (mockup tLog): saves with POST /v1/logs and shows any red flag immediately, before anything else. */
export function LogForm({
  date,
  saved,
  isToday,
  dateLabel,
  yearCounts,
  locale,
}: {
  date: string;
  saved?: TimelineDay;
  isToday: boolean;
  dateLabel: string;
  yearCounts: Record<string, number>;
  locale: Locale;
}) {
  const t = useTranslations();
  const router = useRouter();
  const toast = useToast();
  const [flow, setFlow] = useState<Flow>(saved?.flow ?? "none");
  const [counts, setCounts] = useState<Partial<Record<PbacKey, number>>>(() => fromItems(saved?.pbac_items));
  const [pain, setPain] = useState(saved?.pain ?? 0);
  const [sites, setSites] = useState<PainSite[]>((saved?.sites ?? []) as PainSite[]);
  const [symptoms, setSymptoms] = useState<string[]>(saved?.symptoms ?? []);
  const [impact, setImpact] = useState<Impact>((saved?.impact as Impact | undefined) ?? "none");
  const [sleep, setSleep] = useState(saved?.sleep_h == null ? "" : String(saved.sleep_h));
  const [note, setNote] = useState(saved?.note ?? "");
  const [parsed, setParsed] = useState<string | null>(null);
  const [result, setResult] = useState<{ flags: Card[]; crisis: boolean } | null>(null);
  const [saving, startSave] = useTransition();
  const [reading, startRead] = useTransition();
  const resultRef = useRef<HTMLDivElement>(null);

  const items = toItems(counts);
  const score = pbacScore(items);
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const readSentence = () =>
    startRead(async () => {
      try {
        const r = await apiClient<ParseResult>("/logs/parse", { body: { text: note } });
        const known = r.symptoms.filter((s) => ALL_SYMPTOMS.includes(s));
        if (r.flow) setFlow(r.flow);
        if (r.pain !== null) setPain(r.pain);
        if (r.impact) setImpact(r.impact);
        if (known.length) setSymptoms((s) => [...new Set([...s, ...known])]);
        const words = [
          ...known.map((s) => t(`symptoms.${slug(s)}`)),
          ...(r.flow ? [t(`flows.${r.flow}`)] : []),
          ...(r.impact ? [t(`impacts.${slug(r.impact)}`)] : []),
          ...(r.pain !== null ? [t("log.painValue", { pain: r.pain })] : []),
        ];
        setParsed(words.length ? t("log.parsed", { items: words.join(", ") }) : t("log.parsedNone"));
      } catch (e) {
        setParsed(t("log.parseFailed", { detail: e instanceof ApiError ? e.detail : String(e) }));
      }
    });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const body: LogBody = {
      date,
      flow,
      pain,
      pain_sites: sites,
      symptoms,
      impact,
      sleep_h: sleep.trim() === "" ? null : Math.min(24, Math.max(0, Number(sleep))),
      pbac_items: items,
      note,
    };
    startSave(async () => {
      try {
        const r = await apiClient<LogResult>("/logs", { body });
        if (r.red_flags.length || r.crisis) {
          setResult({ flags: r.red_flags, crisis: r.crisis });
          requestAnimationFrame(() => resultRef.current?.focus());
        } else {
          setResult(null);
          toast(t("log.saved"));
        }
        router.refresh();
      } catch (err) {
        toast(t("log.saveFailed", { detail: err instanceof ApiError ? err.detail : String(err) }));
      }
    });
  };

  return (
    <form method="post" className="box form-card" onSubmit={submit} aria-labelledby="log-form-title">
      <h2 id="log-form-title" style={{ fontSize: 18 }}>
        {isToday ? t("log.formToday", { date: dateLabel }) : t("log.formDay", { date: dateLabel })}
      </h2>
      {saved && <p className="xs dim">{t("log.editing")}</p>}

      <div ref={resultRef} tabIndex={-1} aria-live="assertive" style={{ outline: "none" }}>
        {result && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <h3 className="sr-only">{t("log.urgentHeading")}</h3>
            {result.crisis && <CrisisCard />}
            {result.flags.map((c) => (
              <RedFlagCard key={c.observation_id} card={c} locale={locale} headingLevel={3} />
            ))}
          </div>
        )}
      </div>

      <div className="field">
        <span className="label">{t("log.flow")}</span>
        <Seg label={t("log.flow")} options={FLOWS.map((f) => ({ value: f, label: t(`flows.${f}`) }))} selected={[flow]} onToggle={(v) => setFlow(v)} />
      </div>

      {flow !== "none" && (
        <div className="field">
          <span className="label">
            {t("log.pbacTitle", { score })} {score >= 100 && <b className="hi">≥ 100</b>}
          </span>
          <p className="xs faint">{t("log.pbacHint")}</p>
          <div className="pbac">
            {PBAC_ROWS.map((r) => {
              const name = t(`log.pbacItems.${r.key}`);
              const n = counts[r.key] ?? 0;
              const w = (PBAC_WEIGHTS[r.group] as Record<string, number>)[r.level]!;
              return (
                <div key={r.key} style={{ display: "contents" }}>
                  <span className="s">
                    {name} <span className="faint mono">{t("log.pbacWeight", { n: w })}</span>
                  </span>
                  <span className="step">
                    <button type="button" aria-label={t("log.fewer", { item: name })} disabled={n === 0} onClick={() => setCounts((c) => ({ ...c, [r.key]: Math.max(0, n - 1) }))}>
                      −
                    </button>
                    <span aria-live="polite">{n}</span>
                    <button type="button" aria-label={t("log.more", { item: name })} onClick={() => setCounts((c) => ({ ...c, [r.key]: n + 1 }))}>
                      +
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="field">
        <label htmlFor="pain-range">{t("log.pain", { pain })}</label>
        <input id="pain-range" type="range" min={0} max={10} step={1} value={pain} onChange={(e) => setPain(Number(e.target.value))} aria-valuetext={t("log.painValue", { pain })} />
      </div>

      <BodyMap selected={sites} onToggle={(s) => setSites((x) => toggle(x, s))} yearCounts={yearCounts} />

      <div className="field">
        <span className="label">{t("log.symptomsTitle")}</span>
        <Seg
          label={t("log.symptomsTitle")}
          options={COMMON_SYMPTOMS.map((s) => ({ value: s, label: t(`symptoms.${slug(s)}`) }))}
          selected={symptoms}
          onToggle={(v) => setSymptoms((x) => toggle(x, v))}
        />
        <details>
          <summary className="s">{t("log.moreSymptoms")}</summary>
          <Seg
            label={t("log.moreSymptoms")}
            options={MORE_SYMPTOMS.map((s) => ({ value: s, label: t(`symptoms.${slug(s)}`) }))}
            selected={symptoms}
            onToggle={(v) => setSymptoms((x) => toggle(x, v))}
          />
        </details>
      </div>

      <div className="field">
        <span className="label">{t("log.impactTitle")}</span>
        <Seg label={t("log.impactTitle")} options={IMPACTS.map((i) => ({ value: i, label: t(`impacts.${slug(i)}`) }))} selected={[impact]} onToggle={(v) => setImpact(v)} />
      </div>

      <div className="field">
        <label htmlFor="sleep-h">{t("log.sleep")}</label>
        <input id="sleep-h" className="num" type="number" inputMode="decimal" min={0} max={24} step={0.5} value={sleep} onChange={(e) => setSleep(e.target.value)} />
      </div>

      <div className="field">
        <label htmlFor="note-t">{t("log.noteLabel")}</label>
        <textarea id="note-t" rows={2} maxLength={600} dir="auto" placeholder={t("log.notePlaceholder")} value={note} onChange={(e) => setNote(e.target.value)} />
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
          <Button variant="outline" size="sm" pending={reading} disabled={!note.trim()} onClick={readSentence}>
            {t("log.readNote")}
          </Button>
          <button type="button" className="link xs" onClick={() => setNote(t("log.exampleText"))}>
            {t("log.example")}
          </button>
        </div>
        <p className="xs faint">{t("log.noteSaved")}</p>
      </div>
      {parsed && (
        <p className="extract" role="status">
          {parsed}
        </p>
      )}

      <Button type="submit" size="wide" pending={saving}>
        {isToday ? t("log.saveToday") : t("log.saveDay", { date: dateLabel })}
      </Button>
    </form>
  );
}
