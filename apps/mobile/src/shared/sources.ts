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
    url: "https://www.nhs.uk/pregnancy/common-symptoms/",
  },
  nice_ng201: { id: "nice_ng201", title: "NICE NG201 Antenatal care", url: "https://www.nice.org.uk/guidance/ng201" },
  nice_ng133: {
    id: "nice_ng133",
    title: "NICE NG133 Hypertension in pregnancy: diagnosis and management",
    url: "https://www.nice.org.uk/guidance/ng133",
  },
  nice_cg192: { id: "nice_cg192", title: "NICE CG192 Antenatal and postnatal mental health", url: "https://www.nice.org.uk/guidance/cg192" },
  ada_standards_pregnancy: {
    id: "ada_standards_pregnancy",
    title: "ADA Standards of Care in Diabetes — Management of Diabetes in Pregnancy (current year)",
    url: "https://diabetesjournals.org/care",
  },
  nice_ng3: { id: "nice_ng3", title: "NICE NG3 Diabetes in pregnancy", url: "https://www.nice.org.uk/guidance/ng3" },
} as const satisfies Record<string, SourceRef>;
