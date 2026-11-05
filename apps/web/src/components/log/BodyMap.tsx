"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { Seg } from "@/components/ui/Pills";
import type { PainSite } from "@/lib/api/types";
import { SITE_POINTS, slug } from "@/lib/vocab";

/**
 * Body map (docs/06 v4, ASSET_INTEGRATION_REPORT.md §5): a 3:4 box with the mannequin art (object-fit: contain, so
 * % of box = % of image), 30px round tap points at the calibrated coordinates, a magenta glow sized by her painful
 * days this year, and left/right meaning HER side. The drawn outline shows only if the image fails to load.
 */
export function BodyMap({
  selected,
  onToggle,
  yearCounts,
}: {
  selected: readonly PainSite[];
  onToggle: (site: PainSite) => void;
  yearCounts: Record<string, number>;
}) {
  const t = useTranslations();
  const uid = useId();
  const [side, setSide] = useState<"front" | "back">("front");
  const [imgFailed, setImgFailed] = useState(false);
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
          {t("log.bodyHint")}
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
      <div className="bodymap">
        {imgFailed ? (
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
        {SITE_POINTS[side].map((p) => {
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
      <p className="xs faint" style={{ textAlign: "center" }}>
        {side === "front" ? t("log.frontNote") : t("log.backNote")}
      </p>
      <p className="xs dim" style={{ textAlign: "center" }}>
        {yearLines.length ? yearLines.join(" · ") : t("log.yearNone")}
      </p>
      {selected.length > 0 && (
        <p className="s" style={{ textAlign: "center" }} aria-live="polite">
          {t("log.marked", { sites: selected.map((s) => t(`sites.${slug(s)}`)).join(", ") })}
        </p>
      )}
    </div>
  );
}
