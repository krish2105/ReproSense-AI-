"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { SourceLinks } from "@/components/safety/SourceLinks";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { FeedDay, FeedKind, FeedWorryId, FeedingSummary } from "@/lib/api/types";
import { formatDayMonth, parseIsoDate } from "@/lib/format";
import type { Locale } from "@/i18n/config";
import { axisMax, KINDS, stack } from "./feedBars";

const WORRIES: FeedWorryId[] = ["latch", "pain", "few_wet_nappies"];
const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Her feeding log after a birth (build week D2): one tap per feed (breast, expressed milk or formula) on the demo's
 * today, an optional worry, and her last 7 days as stacked bars. A worry gets the API's fixed line to talk to her
 * midwife, nurse or doctor, with its source. No amounts, no targets, no verdict on the baby.
 */
export function FeedingCard({ s, refDate }: { s: FeedingSummary; refDate: string }) {
  const t = useTranslations("feeding");
  const locale: Locale = useLocale() === "ar" ? "ar" : "en";
  const router = useRouter();
  const toast = useToast();
  const titleId = useId();
  const [worries, setWorries] = useState<FeedWorryId[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [kindPending, setKindPending] = useState<FeedKind | null>(null);
  const toggle = (w: FeedWorryId) => setWorries((ws) => (ws.includes(w) ? ws.filter((x) => x !== w) : [...ws, w]));
  const log = (kind: FeedKind) => {
    setKindPending(kind);
    start(async () => {
      setError(null);
      const now = new Date(); // the clock time of her tap; the day is the demo's today (ref_date)
      try {
        await apiClient("/feeds", { body: { date: refDate, time: `${pad(now.getHours())}:${pad(now.getMinutes())}`, kind, worries } });
        setWorries([]);
        toast(t("saved", { kind: t(`kind.${kind}`) }));
        router.refresh();
      } catch (e) {
        setError(t("saveFailed", { detail: e instanceof ApiError ? e.detail : String(e) }));
      }
    });
  };

  return (
    <section className="box" aria-labelledby={titleId} data-testid="feeding-card">
      <div className="kv" style={{ alignItems: "baseline" }}>
        <h2 id={titleId} style={{ fontSize: 17 }}>
          {t("title")}
        </h2>
        <span className="xs faint" data-testid="feeding-today">
          {t("today", { count: s.today })}
        </span>
      </div>
      <p className="xs" style={{ margin: "6px 0 10px" }}>
        {t("intro")}
      </p>

      <fieldset className="feed-worries">
        <legend className="xs">{t("worryLegend")}</legend>
        <div className="chips">
          {WORRIES.map((w) => (
            <button key={w} type="button" aria-pressed={worries.includes(w)} onClick={() => toggle(w)}>
              {t(`worry.${w}`)}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="feed-kinds">
        {KINDS.map((k) => (
          <Button key={k} variant="outline" size="sm" pending={pending && kindPending === k} disabled={pending} onClick={() => log(k)} aria-label={t("logAs", { kind: t(`kind.${k}`) })}>
            {t(`kind.${k}`)}
          </Button>
        ))}
      </div>
      {error && (
        <p className="state err s" role="alert">
          {error}
        </p>
      )}

      <FeedChart days={s.days} locale={locale} />

      {s.worries.length > 0 && (
        <ul className="plain feed-support" aria-label={t("supportTitle")}>
          {s.worries.map((w) => (
            <li key={w.id} data-worry={w.id}>
              <p className="s" style={{ margin: 0, fontWeight: 600 }}>
                {t("worryLogged", { worry: t(`worry.${w.id}`), times: w.times, date: formatDayMonth(w.last_on, locale) })}
              </p>
              <p className="s" dir="auto" style={{ margin: "4px 0 0" }}>
                {w.text}
              </p>
              <SourceLinks sources={w.source_links} />
            </li>
          ))}
        </ul>
      )}
      <p className="xs faint" dir="auto" style={{ marginTop: 10 }}>
        {s.note}
      </p>
    </section>
  );
}

function FeedChart({ days, locale }: { days: FeedDay[]; locale: Locale }) {
  const t = useTranslations("feeding");
  const id = useId();
  const W = 340, H = 150, l = 26, b = 22, top = 12, r = 8;
  const max = axisMax(days);
  const slot = (W - l - r) / days.length;
  const bw = Math.min(24, slot - 10);
  const ys = (v: number) => top + (1 - v / max) * (H - top - b);
  const weekday = (iso: string) =>
    new Intl.DateTimeFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-GB", { weekday: "short", timeZone: "UTC" }).format(parseIsoDate(iso));
  const total = days.reduce((n, d) => n + d.total, 0);
  const dayLabel = (d: FeedDay) =>
    t("dayLabel", { date: formatDayMonth(d.date, locale), total: d.total, breast: d.breast, expressed: d.expressed, formula: d.formula });
  const FILL: Record<FeedKind, { fill: string; stroke?: string }> = {
    breast: { fill: "var(--plum)" },
    expressed: { fill: "url(#feed-hatch)", stroke: "var(--plum)" },
    formula: { fill: "var(--sheet)", stroke: "var(--plum)" },
  };
  return (
    <figure style={{ margin: "14px 0 0" }}>
      <p className="label" id={`${id}-title`}>
        {t("chartTitle")}
      </p>
      <ul className="plain feed-legend xs" aria-hidden="true">
        {KINDS.map((k) => (
          <li key={k}>
            <svg width="12" height="12" viewBox="0 0 12 12">
              <rect x="1" y="1" width="10" height="10" rx="2" fill={FILL[k].fill} stroke={FILL[k].stroke} strokeWidth="1.5" />
            </svg>
            {t(`kind.${k}`)}
          </li>
        ))}
      </ul>
      <div dir="ltr">
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-labelledby={`${id}-title ${id}-sum`}>
          <defs>
            <pattern id="feed-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="5" height="5" fill="var(--sheet)" />
              <line x1="0" y1="0" x2="0" y2="5" stroke="var(--plum)" strokeWidth="2.4" />
            </pattern>
          </defs>
          {[0, max / 2, max].map((v) => (
            <g key={v}>
              <line x1={l} x2={W - r} y1={ys(v)} y2={ys(v)} stroke="var(--rule)" strokeDasharray="3 4" />
              <text x={l - 8} y={ys(v) + 4} textAnchor="end" fontSize="10" fill="var(--faint-text)">
                {v}
              </text>
            </g>
          ))}
          {days.map((d, i) => {
            const x = l + i * slot + (slot - bw) / 2;
            return (
              <g key={d.date}>
                <title>{dayLabel(d)}</title>
                {stack(d).map((seg) => (
                  <rect
                    key={seg.kind}
                    x={x}
                    y={ys(seg.to) + 1}
                    width={bw}
                    height={Math.max(ys(seg.from) - ys(seg.to) - 1, 2)}
                    rx={3}
                    fill={FILL[seg.kind].fill}
                    stroke={FILL[seg.kind].stroke}
                    strokeWidth={FILL[seg.kind].stroke ? 1.5 : 0}
                  />
                ))}
                <text x={x + bw / 2} y={ys(d.total) - 4} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ink)">
                  {d.total}
                </text>
                <text x={x + bw / 2} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--faint-text)">
                  {weekday(d.date)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <figcaption id={`${id}-sum`} className="xs faint" style={{ marginTop: 4 }}>
        {t("chartSummary", { total, days: days.length })}
      </figcaption>
      <details className="feed-table">
        <summary className="xs">{t("tableToggle")}</summary>
        <ul className="plain xs">
          {days.map((d) => (
            <li key={d.date}>{dayLabel(d)}</li>
          ))}
        </ul>
      </details>
    </figure>
  );
}
