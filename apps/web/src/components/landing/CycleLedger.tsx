import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { formatDayMonth } from "@/lib/format";

/**
 * The clinical cycle chart (mockup ledger()): one row per cycle, x = day of the cycle, drawn to scale, with the
 * 21–35 day band behind every row, bleeding days filled and a tick where the next period started.
 */
export async function CycleLedger({ cycles, locale, rows = 8 }: { cycles: { start: string; bleed_days: number; length_days: number | null }[]; locale: Locale; rows?: number }) {
  const t = await getTranslations("landing");
  const cs = cycles.filter((c) => c.length_days !== null).slice(-rows) as { start: string; bleed_days: number; length_days: number }[];
  if (!cs.length) return null;
  const maxDay = Math.max(40, ...cs.map((c) => c.length_days)) + 2;
  const W = 560, L = 64, R = 10, rowH = 22, top = 18, H = top + cs.length * rowH + 22;
  const xs = (d: number) => L + (d / maxDay) * (W - L - R);
  const outside = cs.filter((c) => c.length_days < 21 || c.length_days > 35).length;
  return (
    <figure style={{ margin: 0 }}>
      <div dir="ltr" style={{ overflowX: "auto" }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ minWidth: 300, display: "block" }} role="img" aria-labelledby="ledger-sum">
          {[0, 7, 14, 21, 28, 35, 42, 49, 56].filter((d) => d <= maxDay).map((d) => (
            <g key={d}>
              <line x1={xs(d)} x2={xs(d)} y1={top - 4} y2={H - 20} stroke="var(--rule)" />
              <text x={xs(d)} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--faint-text)">
                {d}
              </text>
            </g>
          ))}
          {cs.map((c, i) => {
            const y = top + i * rowH;
            return (
              <g key={c.start}>
                <title>{t("chartRow", { date: formatDayMonth(c.start, locale), length: c.length_days, bleed: c.bleed_days })}</title>
                <text x={L - 8} y={y + 12} textAnchor="end" fontSize="10.5" fill="var(--ink-2)">
                  {formatDayMonth(c.start, locale)}
                </text>
                <rect x={xs(21)} y={y + 2} width={xs(35) - xs(21)} height={rowH - 6} rx="4" fill="var(--ok-soft)" />
                {Array.from({ length: c.bleed_days }, (_, d) => (
                  <rect key={d} x={xs(d) + 1} y={y + 4} width={xs(1) - xs(0) - 2} height={rowH - 10} rx="2" fill="var(--accent)" />
                ))}
                <line x1={xs(c.bleed_days)} x2={xs(c.length_days)} y1={y + 9} y2={y + 9} stroke="var(--rule-2)" strokeWidth="2" strokeLinecap="round" />
                <rect x={xs(c.length_days) - 1.5} y={y + 2} width="3" height={rowH - 6} rx="1.5" fill="var(--ink)" />
                <text x={xs(c.length_days) + 6} y={y + 12} fontSize="10" fontWeight="700" fill="var(--ink)">
                  {c.length_days}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <figcaption id="ledger-sum" className="xs dim" style={{ marginTop: 6 }}>
        {t("chartSummary", { outside, count: cs.length })} <span className="faint">{t("chartAxis")}: 0–{maxDay - 2}</span>
      </figcaption>
      <ul className="legend" style={{ listStyle: "none", padding: 0, margin: "8px 0 0" }}>
        <li>
          <i style={{ background: "var(--accent)" }} aria-hidden="true" />
          {t("legendBleed")}
        </li>
        <li>
          <i style={{ background: "var(--ok-soft)", border: "1px solid var(--ok)" }} aria-hidden="true" />
          {t("legendBand")}
        </li>
        <li>
          <i style={{ background: "var(--ink)" }} aria-hidden="true" />
          {t("legendNext")}
        </li>
      </ul>
    </figure>
  );
}
