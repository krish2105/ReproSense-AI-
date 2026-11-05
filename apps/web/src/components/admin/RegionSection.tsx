"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { webglAvailable } from "@/components/landing/webgl";
import { westToEast, type RegionCounts } from "./regions";

// The canvas code is split out and fetched only when the panel is near the screen (never in first-load JS).
const RegionColumns3D = dynamic(() => import("./RegionColumns3D"), { ssr: false });

const KEYS = ["open", "in_progress", "closed"] as const;
const COLOR = { open: "var(--accent)", in_progress: "var(--warn)", closed: "var(--ok)" } as const;

/** The same numbers as grouped columns: the still view for reduced motion, no WebGL and before 3D loads. */
function RegionPoster({ regions, names, label }: { regions: RegionCounts[]; names: Record<string, string>; label: string }) {
  const W = 640, H = 250, base = 204, top = 26, bw = 36, gap = 6;
  const max = Math.max(1, ...regions.flatMap((r) => KEYS.map((k) => r[k])));
  const gw = W / Math.max(regions.length, 1);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={label} style={{ display: "block", maxWidth: 720, marginInline: "auto" }}>
      <line x1={12} x2={W - 12} y1={base} y2={base} stroke="var(--rule-2)" />
      {regions.map((r, i) => {
        const cx = gw * (i + 0.5);
        return (
          <g key={r.region}>
            {KEYS.map((k, j) => {
              const h = Math.max(2, (r[k] / max) * (base - top - 20));
              const x = cx + (j - 1) * (bw + gap) - bw / 2;
              return (
                <g key={k}>
                  {/* rounded data end, square at the baseline */}
                  <rect x={x} y={base - h} width={bw} height={h} rx={4} fill={COLOR[k]} />
                  <rect x={x} y={base - Math.min(h, 4)} width={bw} height={Math.min(h, 4)} fill={COLOR[k]} />
                  <text x={x + bw / 2} y={base - h - 7} textAnchor="middle" fontSize="12.5" fontWeight="700" fill="var(--ink)">
                    {r[k]}
                  </text>
                </g>
              );
            })}
            <text x={cx} y={base + 24} textAnchor="middle" fontSize="13.5" fill="var(--ink-2)">
              {names[r.region] ?? r.region}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Admin panel "Follow-ups by region, in 3D" (mockup map3d). Colour always travels with words: the legend
 *  names each status, the summary and the table below give every number. */
export function RegionSection({ regions, names }: { regions: RegionCounts[]; names: Record<string, string> }) {
  const t = useTranslations("admin");
  const ts = useTranslations("clinic.gapStatus");
  const box = useRef<HTMLDivElement>(null);
  const [can3d, setCan3d] = useState<boolean | null>(null); // null until the probe has run
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [ready, setReady] = useState(false); // the flat chart stays until WebGL has drawn

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

  const ordered = westToEast(regions);
  const summary = ordered.map((r) => t("map3dRow", { region: names[r.region] ?? r.region, open: r.open, booked: r.in_progress, done: r.closed })).join("; ");
  const label = t("map3dLabel", { summary });
  const show3d = can3d === true && !reduced;
  const flat = can3d === false || reduced;

  return (
    <section className="panel" aria-labelledby="map3d-title" style={{ padding: 20, marginTop: 20 }}>
      <h2 id="map3d-title" style={{ fontSize: 18 }}>
        {t("map3dTitle")}
      </h2>
      <p className="s dim" style={{ marginTop: 4 }}>
        {t("map3dNote")}
      </p>
      <ul className="leg" style={{ listStyle: "none", padding: 0, margin: "10px 0 0" }}>
        {KEYS.map((k) => (
          <li key={k}>
            <i style={{ background: COLOR[k] }} aria-hidden="true" />
            {ts(k)}
          </li>
        ))}
      </ul>
      <div ref={box} className={flat ? "y3d map3d is-flat" : "y3d map3d"} style={{ marginTop: 12 }}>
        <div dir="ltr" className={ready && show3d ? "map3d-flat is-hidden" : "map3d-flat"}>
          <RegionPoster regions={ordered} names={names} label={label} />
        </div>
        {show3d && visible && (
          <>
            <RegionColumns3D regions={regions} names={names} animate={!reduced} onReady={() => setReady(true)} />
            {ready && (
              <span className="hint" aria-hidden="true">
                {t("map3dHint")}
              </span>
            )}
          </>
        )}
      </div>
      <div className="kv" style={{ marginTop: 10, flexWrap: "wrap" }}>
        <span className="xs faint">{flat ? t("map3dFlat") : "\u00a0"}</span>
        <a className="link xs" href="#regions-title">
          {t("map3dTable")}
        </a>
      </div>
    </section>
  );
}
