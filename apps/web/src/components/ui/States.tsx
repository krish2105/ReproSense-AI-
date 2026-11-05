import Image from "next/image";
import type { ReactNode } from "react";

/** Empty state: what will appear here and how to add the first entry. */
export function EmptyState({ title, body, action, headingLevel = 3 }: { title: string; body: string; action?: ReactNode; headingLevel?: 1 | 2 | 3 }) {
  const H = headingLevel === 1 ? "h1" : headingLevel === 2 ? "h2" : "h3";
  return (
    <div className="state">
      <Image src="/images/app/empty-state.png" alt="" width={112} height={112} />
      <H>{title}</H>
      <p>{body}</p>
      {action}
    </div>
  );
}

/** Error state: what happened and how to fix it, with a recovery action. Never apologises, never vague. */
export function ErrorState({ title, body, action, headingLevel = 2 }: { title: string; body: string; action?: ReactNode; headingLevel?: 1 | 2 | 3 }) {
  const H = headingLevel === 1 ? "h1" : headingLevel === 2 ? "h2" : "h3";
  return (
    <div className="state err" role="alert">
      <H>{title}</H>
      <p>{body}</p>
      {action}
    </div>
  );
}
