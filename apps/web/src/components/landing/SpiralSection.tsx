"use client";

import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { formatDayMonth } from "@/lib/format";
import { beadsOf, type SpiralCycle } from "./spiral";
import { webglAvailable } from "./webgl";
import { TableScroll } from "@/components/ui/TableScroll";

// The canvas code is split out and fetched only when needed (never in the first-load JS).
const YearSpiral3D = dynamic(() => import("./YearSpiral3D"), { ssr: false });


/** Flat poster: the same beads as concentric rings, one ring per cycle (shown before 3D, and instead of it). */
function SpiralPoster({ cycles, label }: { cycles: SpiralCycle[]; label: string }) {
  const beads = beadsOf(cycles);
  const C = 170, r0 = 40, step = Math.min(16, 120 / Math.max(cycles.length, 1));
  const fill = { bleed: "var(--ph-m)", late: "var(--ph-l)", day: "var(--ph-f)" } as const;
  return (
    <svg viewBox="0 0 340 340" width="100%" role="img" aria-label={label} style={{ maxWidth: 420, display: "block", marginInline: "auto" }}>
      {cycles.map((_, k) => (
        <circle key={k} cx={C} cy={C} r={r0 + k * step} fill="none" stroke="var(--rule)" />
      ))}
      {beads.map((b, i) => {
        const r = r0 + b.cycle * step;
        const a = b.angle - Math.PI / 2;
        // rounded so server and browser render identical numbers (trig differs in the last digits)
        return <circle key={i} cx={Math.round((C + Math.cos(a) * r) * 100) / 100} cy={Math.round((C + Math.sin(a) * r) * 100) / 100} r={b.kind === "bleed" ? 3.4 : 2.1} fill={fill[b.kind]} />;
      })}
    </svg>
  );
}

export function SpiralSection({ cycles }: { cycles: SpiralCycle[] }) {
  const t = useTranslations("landing");
  const locale = useLocale() === "ar" ? "ar" : "en";
  const box = useRef<HTMLDivElement>(null);
  const [can3d, setCan3d] = useState<boolean | null>(null); // null until the probe has run
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [table, setTable] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    // The WebGL probe creates a context, which is slow on software GL: run it once, when the panel nears the screen.
    let probed = false;
    const io = new IntersectionObserver(
      (es) => {
        const on = Boolean(es[0]?.isIntersecting);
        if (on && !probed) {
          probed = true;
          setCan3d(webglAvailable());
        }
        setVisible(on);
      },
      { rootMargin: "200px" },
    );
    if (box.current) io.observe(box.current);
    return () => {
      mq.removeEventListener("change", onChange);
      io.disconnect();
    };
  }, []);

  const summary = cycles.map((c) => (c.running ? `${c.length}+` : String(c.length))).join(", ");
  const label = t("spiralLabel", { summary });
  const show3d = can3d === true && !reduced && !table;

  return (
    <div>
      <div ref={box} className="panel y3d">
        {table ? (
          <TableScroll label={label} style={{ padding: 16, height: "100%", overflow: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th scope="col">{t("colStart")}</th>
                  <th scope="col">{t("colLength")}</th>
                  <th scope="col">{t("colBleed")}</th>
                </tr>
              </thead>
              <tbody>
                {cycles.map((c) => (
                  <tr key={c.start}>
                    <td>{formatDayMonth(c.start, locale)}</td>
                    <td className="mono">{c.running ? t("running") : c.length}</td>
                    <td className="mono">{c.bleed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        ) : show3d && visible ? (
          <>
            <YearSpiral3D cycles={cycles} animate={!reduced} />
            <span className="hint" aria-hidden="true">
              {t("spiralHint")}
            </span>
            <span className="sr-only">{label}</span>
          </>
        ) : (
          <div style={{ height: "100%", display: "grid", placeItems: "center", padding: 12 }}>
            <SpiralPoster cycles={cycles} label={label} />
          </div>
        )}
      </div>
      <div className="kv" style={{ marginTop: 10, flexWrap: "wrap" }}>
        <span className="xs faint">{!table && (can3d === false || reduced) ? t("spiralFlat") : " "}</span>
        <button type="button" className="link xs" aria-pressed={table} onClick={() => setTable((x) => !x)}>
          {table ? t("spiralView") : t("spiralTable")}
        </button>
      </div>
    </div>
  );
}
