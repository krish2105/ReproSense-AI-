/** A soft fade-in for each new page (A8). Templates remount on every navigation; reduced motion turns it off
 *  (the global prefers-reduced-motion rule). Route loading.tsx boundaries are deliberately not used: with Next 15.5
 *  they kept router.refresh() transitions (blood-pressure save, language switch) from settling, and streamed tables
 *  under them raced hydration (React #418). The tapped link shows its own pending state (LinkPending). */
export function PageIn({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>;
}
