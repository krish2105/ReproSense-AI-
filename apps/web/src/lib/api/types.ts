// Response shapes of the FastAPI service (backend/app/api/*). Checked field by field against live responses.

export type Role = "patient" | "clinician" | "admin";
export type LifeStage = "periods" | "trying_to_conceive" | "pregnancy" | "after_birth" | "perimenopause";

/** GET /v1/demo/personas */
export interface Persona {
  id: string;
  alias: string; // e.g. "Noura A. (fictional)"
  age: number;
  region: string; // "Abu Dhabi City" | "Al Ain" | "Al Dhafra"
  life_stage: LifeStage;
  pregnancy_weeks: number | null;
  story: string;
  language: string;
  rules: string[] | null; // observation rule ids, null when nothing is flagged
  shares_with_clinic: boolean;
}
export interface StaffMember {
  id: string;
  role: Exclude<Role, "patient">;
  alias: string;
}
export interface PersonasResponse {
  personas: Persona[];
  staff: StaffMember[];
  ref_date: string; // "YYYY-MM-DD", the demo's pinned "today"
}

/** POST /v1/demo/login */
export type LoginBody = { persona: string; role?: "patient" } | { role: "clinician" | "admin" };
export interface LoginResponse {
  role: Role;
  user_id: string;
  token: string;
}

/** GET /v1/demo/whoami */
export interface WhoAmI {
  role: Role;
  user_id: string;
  clinic_id: string;
}

/** GET /v1/clinic/patients (consented patients only, red flags first) */
export interface ClinicPatientRow {
  id: string;
  alias: string;
  age: number;
  region: string;
  life_stage: LifeStage;
  pregnancy_weeks: number;
  red_flags: number;
  open_obs: number;
  rules: string[];
  last_report: string | null;
  open_gaps: number;
  reviewed_at: string | null;
}
export interface ClinicPatientsResponse {
  patients: ClinicPatientRow[];
  clinic_id: string;
}

/** GET /v1/admin/metrics (the parts used so far; Phase 5 extends this) */
export interface AdminMetrics {
  cohort: { n: number; is_synthetic: boolean; note: string };
  kpis: {
    reports_shared: number;
    consented: number;
    care_gaps_total: number;
    care_gaps_open: number;
    care_gaps_in_progress: number;
    care_gaps_closed: number;
    close_rate_pct: number;
  };
  live_demo_gaps: { open: number };
}
