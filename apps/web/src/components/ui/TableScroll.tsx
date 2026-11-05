import type { CSSProperties, ReactNode } from "react";

/**
 * The scroll box around a wide table (mockup `.tbl`). On a phone a table can be wider than the screen, so the box is
 * a named, focusable region: keyboard users can reach it and scroll it with the arrow keys (WCAG 2.1.1; axe rule
 * scrollable-region-focusable), and screen readers announce what it holds.
 */
export function TableScroll({ label, children, style }: { label: string; children: ReactNode; style?: CSSProperties }) {
  return (
    <div className="tbl" role="region" aria-label={label} tabIndex={0} style={style}>
      {children}
    </div>
  );
}
