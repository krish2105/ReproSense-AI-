import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";

/** Loading layout shared by the area loading.tsx files: a title line, an intro line and three cards. */
export function AreaSkeleton({ narrow = false }: { narrow?: boolean }) {
  return (
    <LoadingRegion>
      <div className={narrow ? "app-col" : undefined} style={{ display: "flex", flexDirection: "column", gap: 14, paddingBlock: 20 }}>
        <Skeleton height={34} width="60%" />
        <Skeleton height={18} width="80%" />
        <Skeleton height={120} radius={22} />
        <Skeleton height={120} radius={22} />
        <Skeleton height={120} radius={22} />
      </div>
    </LoadingRegion>
  );
}
