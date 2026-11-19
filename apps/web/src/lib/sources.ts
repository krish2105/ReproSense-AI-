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
  // The pilot proposal on /pilot#proposal (docs/29)
  doh_jawda_pc_v7: {
    id: "doh_jawda_pc_v7",
    title: "Jawda Primary Care Service Quality Performance Indicators, Version 7: KPI PC008 Post-Partum Follow-Up and Care Coordination — DoH Abu Dhabi (July 2023)",
    url: "https://www.doh.gov.ae/-/media/Feature/Muashir/Jawda/Jawda-Quarterly-Submission-Guidelines/PrimaryCare-JAWDA---Update-2022.ashx",
  },
  agarwal_2022_gdm_followup: {
    id: "agarwal_2022_gdm_followup",
    title: "Gestational diabetes mellitus in a multi-ethnic, high-risk population: adequacy of screening for diabetes 6 weeks after delivery — Agarwal, Lal, Vyas, IJERPH 2022 (Al Ain)",
    url: "https://doi.org/10.3390/ijerph192113946",
  },
  bashir_2022_gdm_mutabaah: {
    id: "bashir_2022_gdm_mutabaah",
    title: "Incidence of gestational diabetes mellitus in the United Arab Emirates; comparison of six diagnostic criteria: The Mutaba'ah Study — Bashir et al., Frontiers in Endocrinology 2022",
    url: "https://doi.org/10.3389/fendo.2022.1069477",
  },
  doh_postnatal_standard_2025: {
    id: "doh_postnatal_standard_2025",
    title: "Postnatal Care Program Standard — DoH Abu Dhabi (DoH/ST/HQS/PCP/V1/2025, May 2025)",
    url: "https://www.doh.gov.ae/-/media/B164DC4D53DF4640A1DB640CBEED6228.ashx",
  },
  lewis_sus_2018: {
    id: "lewis_sus_2018",
    title: "The System Usability Scale: Past, Present, and Future — Lewis, International Journal of Human–Computer Interaction 34(7), 2018",
    url: "https://doi.org/10.1080/10447318.2018.1455307",
  },
} as const satisfies Record<string, SourceRef>;
