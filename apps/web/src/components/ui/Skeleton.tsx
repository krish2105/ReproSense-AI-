import { useTranslations } from "next-intl";
import type { CSSProperties } from "react";

/** A tint block standing in for content of the same size. */
export function Skeleton({ height = 16, width = "100%", radius, style }: { height?: number | string; width?: number | string; radius?: number; style?: CSSProperties }) {
  return <div className="skel" aria-hidden="true" style={{ height, width, borderRadius: radius, ...style }} />;
}

/** Announces loading once for screen readers; children are the visual skeleton. */
export function LoadingRegion({ children }: { children: React.ReactNode }) {
  const t = useTranslations("states");
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">{t("loading")}</span>
      {children}
    </div>
  );
}
