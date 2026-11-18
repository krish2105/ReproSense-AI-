import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";

/** Loading skeletons shaped like each area's pages (A8), so nothing jumps when the content arrives. Server
 *  components: they render while the page's API calls are in flight. Announced once to screen readers. */
export function AreaLoading({ area }: { area: "app" | "staff" | "site" }) {
  if (area === "app")
    return (
      <LoadingRegion>
        <div className="app-col">
          <Skeleton height={26} width="60%" style={{ marginInline: "auto" }} />
          <Skeleton height={190} radius={24} />
          <Skeleton height={48} radius={999} />
          <Skeleton height={120} radius={24} />
          <Skeleton height={120} radius={24} />
        </div>
      </LoadingRegion>
    );
  if (area === "staff")
    return (
      <LoadingRegion>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Skeleton height={34} width="45%" />
          <Skeleton height={18} width="70%" />
          <div className="figs">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} height={110} radius={24} />
            ))}
          </div>
          <Skeleton height={220} radius={24} />
        </div>
      </LoadingRegion>
    );
  return (
    <LoadingRegion>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 760 }}>
        <Skeleton height={40} width="55%" />
        <Skeleton height={18} width="80%" />
        <Skeleton height={18} width="65%" />
        <Skeleton height={240} radius={24} style={{ marginTop: 10 }} />
      </div>
    </LoadingRegion>
  );
}

/** A soft fade-in for each new page (A8). Templates remount on every navigation; reduced motion turns it off
 *  (the global prefers-reduced-motion rule). */
export function PageIn({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>;
}
