// Copied from apps/web/src/lib/sources.ts by apps/mobile/scripts/sync-shared.mjs. Edit the web file, then run npm run sync.
// Sources the UI cites directly (not via an API card). Copied from knowledge_base/sources.yaml;
// a unit test fails if a title or URL here drifts from that file (CLAUDE.md rule 6).
export interface SourceRef {
  id: string;
  title: string;
  url: string;
}

export const SOURCES = {
  nhs_pregnancy_urgent: {
    id: "nhs_pregnancy_urgent",
    title: "NHS: Signs and symptoms in pregnancy you should not ignore",
    url: "https://www.nhs.uk/pregnancy/related-conditions/common-symptoms/",
  },
  nice_ng201: { id: "nice_ng201", title: "NICE NG201 Antenatal care", url: "https://www.nice.org.uk/guidance/ng201" },
  nice_cg192: { id: "nice_cg192", title: "NICE CG192 Antenatal and postnatal mental health", url: "https://www.nice.org.uk/guidance/cg192" },
} as const satisfies Record<string, SourceRef>;
