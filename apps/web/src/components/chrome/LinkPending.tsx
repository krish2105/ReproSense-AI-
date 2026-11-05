"use client";

import { useLinkStatus } from "next/link";

/**
 * Put inside a <Link>: it shows at once that the tap was taken while the next screen loads. Route-level loading.tsx
 * skeletons are not used, because their streamed boundary raced with hydration on full page loads (React #418;
 * research/2026-11-05-web-build-notes.md §6), so link feedback comes from here instead.
 */
export function LinkPending() {
  const { pending } = useLinkStatus();
  return <span className={pending ? "link-pending is-on" : "link-pending"} aria-hidden="true" />;
}
