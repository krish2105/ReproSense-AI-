import { useTranslations } from "next-intl";
import type { Source } from "@/lib/api/types";
import type { SourceRef } from "@/lib/sources";

/** "Sources: A; B" with links that open in a new tab (CLAUDE.md rule 6). Titles come from sources.yaml via the API. */
export function SourceLinks({ sources, className = "xs faint" }: { sources: ReadonlyArray<Source | SourceRef>; className?: string }) {
  const t = useTranslations("home");
  if (!sources.length) return null;
  return (
    <p className={className}>
      {t("sources")}:{" "}
      {sources.map((s, i) => (
        <span key={"source_id" in s ? s.source_id : s.id}>
          {i > 0 && "; "}
          <a href={s.url} target="_blank" rel="noopener noreferrer" lang="en" dir="ltr">
            {s.title}
          </a>
        </span>
      ))}
    </p>
  );
}
