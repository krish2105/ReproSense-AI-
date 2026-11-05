import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";

/** Loading layout shared by the area loading.tsx files: a title line, an intro line and three cards.
 *  At least one screen tall, so the footer stays below the fold until the page streams in (no layout shift). */
export function AreaSkeleton({ narrow = false }: { narrow?: boolean }) {
  return (
    <LoadingRegion>
      <div className={narrow ? "app-col" : undefined} style={{ display: "flex", flexDirection: "column", gap: 14, paddingBlock: 20, minHeight: "100dvh" }}>
        <Skeleton height={34} width="60%" />
        <Skeleton height={18} width="80%" />
        <Skeleton height={120} radius={22} />
        <Skeleton height={120} radius={22} />
        <Skeleton height={120} radius={22} />
      </div>
    </LoadingRegion>
  );
}
