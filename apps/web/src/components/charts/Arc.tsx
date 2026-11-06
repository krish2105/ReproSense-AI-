import { useId } from "react";
import { getTranslations } from "next-intl/server";
import { isKnownCycle, type AfterBirthStatus, type CycleStatus, type PregnancyStatus } from "@/lib/api/types";
import { ButtonLink } from "@/components/ui/Button";
import type { Locale } from "@/i18n/config";
import { afterBirthSegments, ARC, arcPath, cycleSegments, markerAt, pregnancySegments, trimesterOf, type Segment } from "@/lib/arc";
import { formatDayMonth } from "@/lib/format";

// Signature arc (docs/06). Colour is never the only channel (mauve-charts): every segment has a worded legend,
// segments are separated by gaps, the fertile segment is hatched, light mode adds a thin outline, and the
// figure carries a one-sentence summary for screen readers.

const COLOR: Record<string, string> = {
  period: "var(--ph-m)",
  follicular: "var(--ph-f)",
  luteal: "var(--ph-l)",
  t1: "var(--ph-o)",
  t2: "var(--ph-m)",
  t3: "var(--ph-l)",
  recovery: "var(--ph-l)",
  window: "var(--ok)",
};

function ArcSvg({
  segments,
  max,
  pos,
  hatchKey,
  inner,
  labelId,
}: {
  segments: Segment[];
  max: number;
  pos: number;
  hatchKey?: string;
  inner?: { from: number; to: number };
  labelId: string;
}) {
  const uid = useId().replace(/:/g, "");
  const hatch = `hatch-${uid}`;
  const [mx, my] = markerAt(pos, max);
  return (
    <svg viewBox={`0 0 ${ARC.W} ${ARC.H}`} width="100%" role="img" aria-labelledby={labelId} style={{ display: "block", maxWidth: 320, marginInline: "auto" }}>
      <defs>
        <pattern id={hatch} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
          <rect width="6" height="6" fill="var(--ph-o)" />
          <line x1="0" y1="0" x2="0" y2="6" stroke="var(--ph-l)" strokeOpacity="0.7" strokeWidth="2.4" />
        </pattern>
      </defs>
      <path d={arcPath(0, max, max)} stroke="var(--rule)" strokeWidth={ARC.stroke} strokeLinecap="round" fill="none" />
      {segments.map((s) => {
        const d = arcPath(s.from, s.to, max);
        if (!d) return null;
        return (
          <g key={s.key}>
            <path d={d} stroke="var(--arc-outline)" strokeWidth={ARC.stroke + 2} strokeLinecap="round" fill="none" />
            <path d={d} stroke={s.key === hatchKey ? `url(#${hatch})` : COLOR[s.key]} strokeWidth={ARC.stroke} strokeLinecap="round" fill="none" />
          </g>
        );
      })}
      {inner && <path d={arcPath(inner.from, inner.to, max, ARC.r - 18)} stroke="var(--plum)" strokeWidth={4} strokeLinecap="round" fill="none" />}
      <circle cx={mx} cy={my} r={13} fill="var(--plum)" stroke="var(--sheet)" strokeWidth={4} />
    </svg>
  );
}

function Legend({ items }: { items: { label: string; swatch: string; hatch?: boolean }[] }) {
  return (
    <ul className="leg" style={{ justifyContent: "center", listStyle: "none", padding: 0, margin: "6px 0 0" }}>
      {items.map((i) => (
        <li key={i.label}>
          <i
            aria-hidden="true"
            style={
              i.hatch
                ? { background: "repeating-linear-gradient(45deg,var(--ph-o) 0 3px,var(--ph-l) 3px 5px)" }
                : { background: i.swatch, boxShadow: "inset 0 0 0 1px var(--arc-outline)" }
            }
          />
          {i.label}
        </li>
      ))}
    </ul>
  );
}

export async function CycleArc({ status, locale, peri = false }: { status: CycleStatus; locale: Locale; peri?: boolean }) {
  const t = await getTranslations("arc");
  if (!isKnownCycle(status)) {
    // A new record: nothing to estimate yet, so say what will appear and how to start (web-screen §6 empty states).
    return (
      <section className="box" aria-labelledby="arc-empty" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h2 id="arc-empty" style={{ fontSize: 17 }}>
          {t("noCycleTitle")}
        </h2>
        <p className="s dim">{t("noCycleBody")}</p>
        <ButtonLink href="/app/log" size="sm" className="self-start">
          {t("noCycleAction")}
        </ButtonLink>
      </section>
    );
  }
  const max = Math.max(status.length, status.day);
  const phaseName = t(`phases.${status.phase}`);
  const longer = status.day > status.length;
  const labelId = `arc-cycle`;
  return (
    <figure className="box gauge" style={{ margin: 0 }}>
      <ArcSvg segments={cycleSegments(status.phases, status.length)} max={max} pos={status.day} hatchKey="fertile" labelId={labelId} />
      <div className="ctr" aria-hidden="true">
        <b>{t("day", { day: status.day })}</b>
        <span>{longer ? t("longer", { length: status.length }) : status.estimate ? t("phaseEstimate", { phase: phaseName }) : t("phase", { phase: phaseName })}</span>
      </div>
      <figcaption>
        <span id={labelId} className="sr-only">
          {t("summaryCycle", { day: status.day, length: status.length, phase: phaseName })}
        </span>
        <Legend
          items={[
            { label: t("phases.period"), swatch: COLOR.period! },
            { label: t("phases.follicular"), swatch: COLOR.follicular! },
            ...(status.phases.some((ph) => ph.key === "fertile") ? [{ label: t("phases.fertile"), swatch: "", hatch: true }] : []),
            { label: t("phases.luteal"), swatch: COLOR.luteal! },
          ]}
        />
        {status.estimate && (
          <p className="xs faint" style={{ marginTop: 6, textAlign: "center" }}>
            {peri ? t("estimateNotePeri") : status.estimate_reason === "little_data" ? t("estimateNoteNew") : t("estimateNote")}
          </p>
        )}
        {status.next_period_from && !status.estimate && (
          <p className="xs dim" style={{ marginTop: 6, textAlign: "center" }}>
            {t("nextPeriod", { date: formatDayMonth(status.next_period_from, locale) })}
          </p>
        )}
        {/* Intended use (research/2026-11-06/03 §1.5): phase estimates are never contraceptive advice */}
        <p className="xs faint" style={{ marginTop: 4, textAlign: "center" }}>
          {t("notContraception")}
        </p>
      </figcaption>
    </figure>
  );
}

export async function PregnancyArc({ status }: { status: PregnancyStatus }) {
  const t = await getTranslations("arc");
  const w = status.windows[0];
  const tri = trimesterOf(status.week);
  const labelId = "arc-pregnancy";
  return (
    <figure className="box gauge" style={{ margin: 0 }}>
      <ArcSvg segments={pregnancySegments()} max={40} pos={status.week} inner={w ? { from: w.from, to: w.to } : undefined} labelId={labelId} />
      <div className="ctr" aria-hidden="true">
        <b>{t("week", { week: status.week })}</b>
        <span>
          {t("trimester", { n: String(tri) })} · {t("weeksLeft", { left: Math.max(40 - status.week, 0) })}
        </span>
      </div>
      <figcaption>
        <span id={labelId} className="sr-only">
          {t("summaryPregnancy", { week: status.week })} {t("trimester", { n: String(tri) })}.{" "}
          {w ? t("window", { from: w.from, to: w.to }) : ""}
        </span>
        <Legend
          items={[
            { label: t("t1"), swatch: COLOR.t1! },
            { label: t("t2"), swatch: COLOR.t2! },
            { label: t("t3"), swatch: COLOR.t3! },
            ...(w ? [{ label: t("window", { from: w.from, to: w.to }), swatch: "var(--plum)" }] : []),
          ]}
        />
      </figcaption>
    </figure>
  );
}

export async function AfterBirthArc({ status }: { status: AfterBirthStatus }) {
  const t = await getTranslations("arc");
  const w = status.windows[0] ?? { label: "", from: 4, to: 12 };
  const max = status.of || 12;
  const labelId = "arc-after";
  return (
    <figure className="box gauge" style={{ margin: 0 }}>
      <ArcSvg segments={afterBirthSegments(w, max)} max={max} pos={Math.min(status.week, max)} labelId={labelId} />
      <div className="ctr" aria-hidden="true">
        <b>{t("week", { week: status.week })}</b>
        <span>{t("afterBirth")}</span>
      </div>
      <figcaption>
        <span id={labelId} className="sr-only">
          {t("summaryAfter", { week: status.week, from: w.from, to: w.to })}
        </span>
        <Legend
          items={[
            { label: t("recovery", { to: w.from }), swatch: COLOR.recovery! },
            { label: t("window", { from: w.from, to: w.to }), swatch: COLOR.window! },
          ]}
        />
      </figcaption>
    </figure>
  );
}
