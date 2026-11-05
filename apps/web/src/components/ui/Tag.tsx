import type { ReactNode } from "react";
import type { Tone } from "@/lib/rules";

/** State pill (.tag .t-*). Status colours always carry words, never colour alone. */
export function Tag({ tone, children, className }: { tone: Tone; children: ReactNode; className?: string }) {
  return <span className={`tag t-${tone}${className ? ` ${className}` : ""}`}>{children}</span>;
}
