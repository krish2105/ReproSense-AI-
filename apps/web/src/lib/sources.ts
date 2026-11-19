// Sources the UI cites directly (not via an API card). Copied from knowledge_base/sources.yaml;
// a unit test fails if a title or URL here drifts from that file (CLAUDE.md rule 6).
export interface SourceRef {
  id: string;
  title: string;
  url: string;
}

export const SOURCES = {
  doh_800_sakina: {
    id: "doh_800_sakina",
    title: "Department of Health – Abu Dhabi activates 24/7 mental health support hotline 800-SAKINA (725462)",
    url: "https://www.doh.gov.ae/en/news/doh-activates-247-mental-health-support-hotline-800-sakina-(725462)",
  },
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
