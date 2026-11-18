"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import { webglAvailable } from "@/components/landing/webgl";
import { Seg } from "@/components/ui/Pills";
import type { PainSite } from "@/lib/api/types";
import { SITE_POINTS, slug } from "@/lib/vocab";
import { PAIN_SITES, type siteHeat } from "./bodyHeat";

// The canvas code is fetched only when 3D will be shown (mauve-3d §1).
const BodyMap3D = dynamic(() => import("./BodyMap3D"), { ssr: false });

/**
 * Body map (docs/06 v4, ASSET_INTEGRATION_REPORT.md §5): a 3:4 box with the mannequin art (object-fit: contain, so
 * % of box = % of image), 30px round tap points at the calibrated coordinates, a magenta glow sized by her painful
 * days this year, and left/right meaning HER side. The drawn outline shows only if the image fails to load.
 * With WebGL and motion allowed, a 3D figure (A1) replaces the tap points: regions coloured by her painful days in
 * the last 3 months, and a visible toggle list with the same choices for keyboard and screen readers. The 2D map
 * stays as the poster while 3D loads and as the fallback.
 */
export function BodyMap({
  selected,
  onToggle,
  yearCounts,
  heat,
}: {
  selected: readonly PainSite[];
  onToggle: (site: PainSite) => void;
  yearCounts: Record<string, number>;
  heat?: ReturnType<typeof siteHeat>;
}) {
  const t = useTranslations();
  const uid = useId();
  const [side, setSide] = useState<"front" | "back">("front");
  const [imgFailed, setImgFailed] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const [can3d, setCan3d] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!heat) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    // The WebGL probe is slow on software GL: run it once, when the map nears the screen.
    const io = new IntersectionObserver(
      (es) => {
        if (es[0]?.isIntersecting) {
          io.disconnect();
          setCan3d(webglAvailable());
        }
      },
      { rootMargin: "200px" },
    );
    if (box.current) io.observe(box.current);
    return () => {
      mq.removeEventListener("change", onChange);
      io.disconnect();
    };
  }, [heat]);

  const show3d = !!heat && can3d && !reduced;
  const max = Math.max(1, ...Object.values(yearCounts));
  const yearLines = Object.entries(yearCounts)
    .filter(([, n]) => n > 0)
    .map(([site, n]) => t("log.siteYear", { site: t(`sites.${slug(site)}`), count: n }));

  return (
    // A named group, so a screen reader hears the question before the tap points (each is a toggle with its site name).
    <div className="box" role="group" aria-labelledby={`${uid}-t`} aria-describedby={`${uid}-h`} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div className="kv" style={{ flexWrap: "wrap" }}>
        <b id={`${uid}-t`} style={{ fontSize: 16 }}>
          {t("log.bodyTitle")}
        </b>
        <span id={`${uid}-h`} className="xs faint">
          {show3d ? t("log.heat3d") : t("log.bodyHint")}
        </span>
      </div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Seg
          label={t("log.viewLabel")}
          options={[
            { value: "front", label: t("log.front") },
            { value: "back", label: t("log.back") },
          ]}
          selected={[side]}
          onToggle={(v) => setSide(v)}
        />
      </div>
      <div ref={box} className="bodymap" data-3d={show3d ? (ready ? "ready" : "loading") : undefined}>
        {show3d && heat && <BodyMap3D side={side} selected={selected} level={heat.level} onToggle={onToggle} onReady={() => setReady(true)} />}
        {show3d && ready ? null : imgFailed ? (
          <svg viewBox="0 0 300 400" width="100%" height="100%" aria-hidden="true" style={{ position: "absolute", inset: 0 }}>
            <path
              d="M125 30 C125 14 175 14 175 30 L176 52 C210 58 228 72 230 98 C231 150 215 174 210 210 C207 246 225 276 228 318 C190 354 110 354 72 318 C75 276 93 246 90 210 C85 174 69 150 70 98 C72 72 90 58 124 52 Z"
              fill="var(--ph-o)"
              fillOpacity=".4"
              stroke="var(--ph-l)"
              strokeWidth="2"
            />
          </svg>
        ) : (
          <Image
            key={side}
            src={`/images/app/body-map-${side}.png`}
            alt=""
            fill
            sizes="260px"
            style={{ objectFit: "contain" }}
            onError={() => setImgFailed(true)}
          />
        )}
        {!show3d && SITE_POINTS[side].map((p) => {
          const n = yearCounts[p.site] ?? 0;
          const r = n ? 18 + (n / max) * 34 : 0;
          const on = selected.includes(p.site);
          const name = t(`sites.${slug(p.site)}`);
          return (
            <span key={p.site}>
              {r > 0 && (
                <span
                  aria-hidden="true"
                  className="bm-glow"
                  style={{ left: `${p.x}%`, top: `${p.y}%`, width: r * 2, height: r * 2, margin: `-${r}px 0 0 -${r}px` }}
                />
              )}
              <button
                type="button"
                className="bm-pt"
                aria-pressed={on}
                aria-label={name}
                title={n ? t("log.siteYear", { site: name, count: n }) : name}
                onClick={() => onToggle(p.site)}
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
              />
            </span>
          );
        })}
      </div>
      {show3d && heat ? (
        <>
          <div className="chips bm-list" role="group" aria-label={t("log.sitesList")}>
            {PAIN_SITES.map((s) => {
              const name = t(`sites.${slug(s)}`);
              const n = heat.counts[s];
              return (
                <button key={s} type="button" aria-pressed={selected.includes(s)} aria-label={name} onClick={() => onToggle(s)}>
                  <i aria-hidden="true" style={{ background: `color-mix(in oklab, var(--ph-o), var(--ph-m) ${Math.round(heat.level[s] * 100)}%)` }} />
                  {name}
                  {n > 0 && <span className="faint"> · {t("log.siteRecent", { count: n })}</span>}
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <p className="xs faint" style={{ textAlign: "center" }}>
            {side === "front" ? t("log.frontNote") : t("log.backNote")}
          </p>
          <p className="xs dim" style={{ textAlign: "center" }}>
            {yearLines.length ? yearLines.join(" · ") : t("log.yearNone")}
          </p>
        </>
      )}
      {selected.length > 0 && (
        <p className="s" style={{ textAlign: "center" }} aria-live="polite">
          {t("log.marked", { sites: selected.map((s) => t(`sites.${slug(s)}`)).join(", ") })}
        </p>
      )}
    </div>
  );
}
