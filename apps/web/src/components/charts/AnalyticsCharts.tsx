import { getTranslations } from "next-intl/server";
import type { AnalyticsCycle, TimelineResponse } from "@/lib/api/types";
import type { Locale } from "@/i18n/config";
import { formatDayMonth, parseIsoDate } from "@/lib/format";

// Hand-built SVG charts (mauve-charts): one axis, strong tokens for marks (plum line, magenta bars),
// text in ink tokens, recessive grid, labels from the same scale, LTR time inside RTL, a summary per figure.

const monthShort = (iso: string, locale: Locale) =>
  new Intl.DateTimeFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-GB", { month: "short", timeZone: "UTC" }).format(parseIsoDate(iso));

export async function CycleLengthChart({ cycles, locale }: { cycles: AnalyticsCycle[]; locale: Locale }) {
  const t = await getTranslations("analytics");
  const done = cycles.filter((c): c is AnalyticsCycle & { length: number } => c.length !== null);
  const W = 340, H = 200, l = 30, r = 14, top = 14, b = 26;
  const yMax = Math.max(70, Math.ceil((Math.max(0, ...done.map((c) => c.length)) + 5) / 10) * 10);
  const ys = (v: number) => top + (1 - Math.min(v, yMax) / yMax) * (H - top - b);
  const xs = (i: number) => l + (done.length < 2 ? 0.5 : i / (done.length - 1)) * (W - l - r);
  const pts = done.map((c, i) => [xs(i), ys(c.length)] as const);
  let d = "";
  pts.forEach(([x, y], i) => {
    if (i === 0) d = `M${x.toFixed(1)} ${y.toFixed(1)}`;
    else {
      const [x0, y0] = pts[i - 1]!;
      const mx = (x0 + x) / 2;
      d += ` C${mx.toFixed(1)} ${y0.toFixed(1)} ${mx.toFixed(1)} ${y.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
  });
  const outside = done.filter((c) => c.length < 21 || c.length > 35).length;
  const every = done.length > 7 ? 2 : 1;
  const ticks = [0, 20, 40, 60, 80, 100].filter((v) => v <= yMax);
  return (
    <figure className="box" style={{ margin: 0 }}>
      <h2 style={{ fontSize: 17 }} id="len-title">
        {t("lengthTitle")}
      </h2>
      <p className="xs faint">{t("lengthCaption")}</p>
      <div dir="ltr">
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-labelledby="len-title len-sum">
          {ticks.map((v) => (
            <g key={v}>
              <line x1={l} x2={W - r + 6} y1={ys(v)} y2={ys(v)} stroke="var(--rule)" strokeDasharray="3 4" />
              <text x={l - 8} y={ys(v) + 4} textAnchor="end" fontSize="10" fill="var(--faint-text)">
                {v}
              </text>
            </g>
          ))}
          <rect x={l} y={ys(35)} width={W - l - r + 6} height={ys(21) - ys(35)} fill="var(--ok-soft)" />
          <line x1={l} x2={W - r + 6} y1={ys(35)} y2={ys(35)} stroke="var(--ok)" strokeDasharray="4 3" />
          <line x1={l} x2={W - r + 6} y1={ys(21)} y2={ys(21)} stroke="var(--ok)" strokeDasharray="4 3" />
          <text x={W - r + 4} y={ys(35) + 12} textAnchor="end" fontSize="10" fontWeight="600" fill="var(--ink-2)">
            {t("band")}
          </text>
          {d && <path d={d} fill="none" stroke="var(--plum)" strokeWidth="2" strokeLinecap="round" />}
          {done.map((c, i) => {
            const [x, y] = pts[i]!;
            const out = c.length < 21 || c.length > 35;
            return (
              <g key={c.start}>
                <circle cx={x} cy={y} r="4.5" fill="var(--sheet)" stroke="var(--plum)" strokeWidth="2">
                  <title>{t("lengthPoint", { date: formatDayMonth(c.start, locale), length: c.length })}</title>
                </circle>
                {out && (
                  <text x={x} y={y - 9} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ink)">
                    {c.length}
                  </text>
                )}
                {i % every === 0 && (
                  <text x={x} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--faint-text)">
                    {monthShort(c.start, locale)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <figcaption id="len-sum" className="s dim" style={{ marginTop: 4 }}>
        {t("outside", { n: outside })}
      </figcaption>
    </figure>
  );
}

export async function BarsChart({
  id,
  title,
  caption,
  summary,
  bars,
  max,
  threshold,
  locale,
}: {
  id: string;
  title: string;
  caption: string;
  summary: string;
  bars: { start: string; value: number; label: string }[];
  max: number;
  threshold?: { value: number; label: string };
  locale: Locale;
}) {
  const W = 340, H = 170, l = 30, b = 22, top = 16, r = 10;
  const slot = (W - l - r) / Math.max(bars.length, 1);
  const bw = Math.max(8, Math.min(26, slot - 8));
  const ys = (v: number) => top + (1 - Math.min(v, max) / max) * (H - top - b);
  const every = bars.length > 7 ? 2 : 1;
  return (
    <figure className="box" style={{ margin: 0 }}>
      <h2 style={{ fontSize: 17 }} id={`${id}-title`}>
        {title}
      </h2>
      <p className="xs faint">{caption}</p>
      <div dir="ltr">
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-labelledby={`${id}-title ${id}-sum`}>
          {[0, max / 2, max].filter((v) => !threshold || Math.abs(v - threshold.value) > max * 0.12).map((v) => (
            <g key={v}>
              <line x1={l} x2={W - r} y1={ys(v)} y2={ys(v)} stroke="var(--rule)" strokeDasharray="3 4" />
              <text x={l - 8} y={ys(v) + 4} textAnchor="end" fontSize="10" fill="var(--faint-text)">
                {Math.round(v)}
              </text>
            </g>
          ))}
          {threshold && (
            <g>
              <line x1={l} x2={W - r} y1={ys(threshold.value)} y2={ys(threshold.value)} stroke="var(--ink-2)" strokeDasharray="5 3" />
              <text x={l - 8} y={ys(threshold.value) + 4} textAnchor="end" fontSize="10" fontWeight="700" fill="var(--ink)">
                {threshold.label}
              </text>
            </g>
          )}
          {bars.map((bar, i) => {
            const x = l + i * slot + (slot - bw) / 2;
            const h = Math.max(ys(0) - ys(bar.value), 3);
            return (
              <g key={bar.start}>
                <rect x={x} y={ys(0) - h} width={bw} height={h} rx={Math.min(4, bw / 2)} fill="var(--ph-m)">
                  <title>{bar.label}</title>
                </rect>
                {threshold && bar.value >= threshold.value && (
                  <text x={x + bw / 2} y={ys(0) - h - 4} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ink)">
                    {bar.value}
                  </text>
                )}
                {i % every === 0 && (
                  <text x={x + bw / 2} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--faint-text)">
                    {monthShort(bar.start, locale)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <figcaption id={`${id}-sum`} className="s dim" style={{ marginTop: 4 }}>
        {summary}
      </figcaption>
    </figure>
  );
}

/** Every logged day of the range as a dot: filled = bleeding, ring = pain 7+, diamond = event (mockup yearChart, to scale). */
export async function YearDots({ timeline, months, locale }: { timeline: TimelineResponse; months: number; locale: Locale }) {
  const t = await getTranslations("analytics");
  const start = parseIsoDate(timeline.from);
  const end = parseIsoDate(timeline.to);
  const rows: { y: number; m: number }[] = [];
  for (let y = start.getUTCFullYear(), m = start.getUTCMonth(); y < end.getUTCFullYear() || (y === end.getUTCFullYear() && m <= end.getUTCMonth()); m === 11 ? (y++, (m = 0)) : m++) rows.push({ y, m });
  const L = 40, cell = 10, rowH = 14, top = 6;
  const W = L + 31 * cell + 6, H = top + rows.length * rowH + 4;
  const rowOf = (iso: string) => {
    const d = parseIsoDate(iso);
    return rows.findIndex((r) => r.y === d.getUTCFullYear() && r.m === d.getUTCMonth());
  };
  const cx = (iso: string) => L + (parseIsoDate(iso).getUTCDate() - 0.5) * cell;
  const cy = (row: number) => top + row * rowH + rowH / 2;
  const bleed = timeline.days.filter((d) => d.flow !== "none").length;
  const label = (r: { y: number; m: number }) =>
    new Intl.DateTimeFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-GB", { month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(r.y, r.m, 15)));
  return (
    <figure className="box" style={{ margin: 0 }}>
      <h2 style={{ fontSize: 17 }} id="year-title">
        {t("yearTitle")}
      </h2>
      <p className="xs faint">{t("yearCaption")}</p>
      <div dir="ltr" style={{ overflowX: "auto" }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ minWidth: 300 }} role="img" aria-labelledby="year-title year-sum">
          {rows.map((r, i) => (
            <text key={`${r.y}-${r.m}`} x={L - 8} y={cy(i) + 3.5} textAnchor="end" fontSize="9" fill="var(--faint-text)">
              {label(r)}
            </text>
          ))}
          {timeline.days.map((d) => {
            const row = rowOf(d.date);
            if (row < 0) return null;
            const bleeding = d.flow !== "none";
            return (
              <g key={d.id}>
                <circle cx={cx(d.date)} cy={cy(row)} r={bleeding ? 3.6 : 2.4} fill={bleeding ? "var(--ph-m)" : "var(--ink-3)"} fillOpacity={bleeding ? 1 : 0.55} />
                {d.pain >= 7 && <circle cx={cx(d.date)} cy={cy(row)} r="5.4" fill="none" stroke="var(--plum)" strokeWidth="1.4" />}
              </g>
            );
          })}
          {timeline.events.map((e) => {
            const row = rowOf(e.date);
            if (row < 0) return null;
            const x = cx(e.date), y = cy(row);
            const name = t.has(`events.${e.type}`) ? t(`events.${e.type}`) : t("events.other");
            return (
              <rect key={e.id} x={x - 3.5} y={y - 3.5} width="7" height="7" transform={`rotate(45 ${x} ${y})`} fill="var(--plum)">
                <title>{t("eventOn", { event: name, date: formatDayMonth(e.date, locale) })}</title>
              </rect>
            );
          })}
        </svg>
      </div>
      <figcaption id="year-sum" className="s dim" style={{ marginTop: 4 }}>
        {t("yearSummary", { logged: timeline.days.length, months, bleed })}
      </figcaption>
    </figure>
  );
}
