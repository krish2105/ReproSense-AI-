// Copied from apps/web/src/lib/api/types.ts by apps/mobile/scripts/sync-shared.mjs. Edit the web file, then run npm run sync.
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
  // live_demo_gaps is refined in AdminMetricsFull
  kpis: {
    reports_shared: number;
    consented: number;
    care_gaps_total: number;
    care_gaps_open: number;
    care_gaps_in_progress: number;
    care_gaps_closed: number;
    close_rate_pct: number;
  };
  live_demo_gaps: Partial<Record<"open" | "in_progress" | "closed", number>>;
}

// ---------------- Phase 2: her app (home, logging, analytics) ----------------

export type Urgency = "urgent" | "soon" | "discuss";
export type PhaseKey = "period" | "follicular" | "fertile" | "luteal";

export interface Source {
  source_id: string;
  title: string;
  url: string;
}
export interface Evidence {
  entry_id: string;
  date: string;
  text: string;
}

/** One observation card from the pipeline (rules decide; text is template- or LLM-written and verified). */
export interface Card {
  observation_id: string;
  kind: "observation" | "care" | "red_flag";
  title: string;
  summary: string;
  explains: string;
  why_we_noticed: Evidence[];
  why_total?: number; // how many entries back the card (why_we_noticed holds the first 12)
  clinician_title?: string; // the clinician view's name for the pattern
  values: Record<string, number | boolean | string | null>;
  what_to_consider: string[];
  questions_for_doctor: string[];
  sources: Source[];
  urgency: Urgency;
  entry_date: string | null;
  crisis_path: boolean;
  creates_care_gap: string | null;
  written_by: string;
  verified_sentences: number;
  dropped_sentences: number;
}

export interface CycleStatus {
  mode: "cycle";
  day: number | null; // null until her first period is logged (a new record)
  length: number | null;
  estimate: boolean;
  estimate_reason?: "little_data" | "irregular" | null; // why phases are estimates (no fertile window then)
  phase: PhaseKey;
  phases: { key: PhaseKey; from: number; to: number }[];
  next_period_from: string | null;
}
/** A cycle with a known day: a new record has none until her first period is logged. */
export type KnownCycle = CycleStatus & { day: number; length: number };
export function isKnownCycle(s: CycleStatus): s is KnownCycle {
  return s.day !== null && s.length !== null;
}
export interface WeekWindow {
  label: string;
  from: number;
  to: number;
}
export interface PregnancyStatus {
  mode: "pregnancy";
  week: number;
  of: number;
  trimester: number;
  windows: WeekWindow[];
  estimate: boolean;
}
export interface AfterBirthStatus {
  mode: "after_birth";
  week: number;
  of: number;
  windows: WeekWindow[];
  estimate: boolean;
}
export type HomeStatus = CycleStatus | PregnancyStatus | AfterBirthStatus;

export interface DayPill {
  date: string;
  dow: string; // English from the API; the UI formats the weekday itself
  day: number; // day of the month
  today: boolean;
  past: boolean;
  logged: boolean;
  flow: boolean;
}
export interface Recommendation {
  kind: "next_step" | "question";
  text: string;
  rule: string;
}
export interface CareGap {
  type: string;
  status: "open" | "in_progress" | "closed";
  due_date: string | null;
}
export type Flow = "none" | "spotting" | "light" | "medium" | "heavy";
export type Impact = "none" | "reduced activity" | "missed work or study" | "stayed in bed";
export type Mood = "calm" | "tired" | "in pain" | "low" | "energetic";
export type PainSite = "lower abdomen" | "upper abdomen" | "left pelvis" | "right pelvis" | "lower back";

export interface LogEntry {
  id: string;
  date: string;
  flow: Flow;
  pain: number;
  pain_sites: string[];
  symptoms: string[];
  impact: Impact | string;
  mood: string | null;
  sleep_h: number | null;
  pbac: number;
  pbac_items: PbacItems | null;
  note: string;
  source: string;
  label: string;
}

export interface NavigatorDraftBody {
  rule_id: string;
  to: string;
  subject: string;
  message_en: string;
  message_ar: string;
  questions_en: string[];
  questions_ar: string[];
  bring_en: string[];
  bring_ar: string[];
  sources: string[];
}
export interface NavigatorDraft {
  id: number;
  profile_id: string;
  rule_id: string;
  draft: NavigatorDraftBody;
  status: "draft" | "approved" | "discarded";
  created_at: string;
  approved_at: string | null;
}
export interface NavigatorList {
  available: { rule_id: string; title: string }[];
  drafts: NavigatorDraft[];
}
export interface NavigatorDecision extends NavigatorDraft {
  sent: false;
  message: string;
}

/** GET /v1/me/home?lang= */
export interface HomeResponse {
  profile: {
    id: string;
    alias: string;
    age: number;
    life_stage: LifeStage;
    pregnancy_weeks: number;
    region: string;
    language: string;
    discreet: boolean;
    trying_to_conceive: boolean;
    ttc_months: number;
  };
  ref_date: string;
  status: HomeStatus;
  day_pills: DayPill[];
  red_flags: Card[];
  crisis: boolean;
  observations: Card[];
  recommendations: Recommendation[];
  care_gaps: CareGap[];
  navigator_drafts: NavigatorDraft[];
  last_log: LogEntry | null;
  today_mood: Mood | null;
  record_strength: "strong" | "building" | "early";
  log_count: number;
}

/** POST /v1/logs */
export interface PbacItems {
  pads?: { light?: number; moderate?: number; soaked?: number };
  tampons?: { light?: number; moderate?: number; soaked?: number };
  clots?: { small?: number; large?: number };
}
export interface LogBody {
  date: string;
  flow: Flow;
  pain: number;
  pain_sites: PainSite[];
  symptoms: string[];
  impact: Impact;
  sleep_h?: number | null;
  pbac_items?: PbacItems | null;
  note: string;
}
export interface LogResult {
  id: string;
  pbac: number;
  red_flags: Card[];
  crisis: boolean;
  patterns: string[];
}
/** POST /v1/logs/parse — shown for confirmation, never saved by itself */
export interface ParseResult {
  symptoms: string[];
  flow: Flow | null;
  impact: Impact | null;
  pain: number | null;
  matched: string[];
  confirm: string;
}

/** GET /v1/analytics?months=3|6|12 */
export interface AnalyticsCycle {
  start: string;
  length: number | null; // null for the cycle still running
  bleed: number;
  max_pain: number;
  pbac: number;
  symptom_days: number;
}
export interface AnalyticsResponse {
  months: 3 | 6 | 12;
  cycles: AnalyticsCycle[];
  avg_length: number | null;
  band: [number, number];
  top_symptoms: [string, number][];
  change_point: { index: number; before: number; after: number } | null;
  summary: string;
}

/** GET /v1/timeline?months= */
export interface TimelineDay {
  id: string;
  date: string;
  flow: Flow;
  pain: number;
  pbac: number;
  symptoms: string[];
  impact: string;
  sites: string[];
  mood: string | null;
  note: string;
}
export interface TimelineEvent {
  id: string;
  type: string;
  date: string;
  details: Record<string, string>;
}
export interface LabResult {
  id: string;
  code: string;
  test: string;
  value: number;
  unit: string;
  ref_low: number | null;
  ref_high: number | null;
  flag: string;
  date: string;
  source_doc_id: number | null;
}
export interface TimelineResponse {
  from: string;
  to: string;
  cycles: { start: string; bleed_days: number; length_days: number | null }[];
  days: TimelineDay[];
  events: TimelineEvent[];
  labs: LabResult[];
}

// ---------------- Phase 3: patterns and the assistant ----------------

export interface TraceStep {
  agent: string; // intake | signal | safety | evidence | writer | verifier | care_gap
  detail: string;
  ms?: number;
  rules?: string[];
  dropped?: number;
}

/** GET /v1/insights?lang= */
export interface InsightsResponse {
  cards: Card[]; // red flags first
  crisis: boolean;
  trace: TraceStep[];
  record_strength: "strong" | "building" | "early";
  cycles_logged: number;
  change_point: { index: number; before: number; after: number } | null;
  entries_count: number;
  rules_version: string;
}

export interface Citation {
  n: number;
  source_id: string;
  title: string;
  url: string;
}
/** POST /v1/assistant/ask */
export interface AskResponse {
  question: string;
  lang: "en" | "ar";
  answer: string; // includes [n] markers that point at citations
  sentences: { text: string; cite: number }[];
  citations: Citation[];
  urgent: { kind: string; message: string; number: string } | null; // kind: "crisis", "bleed", …
  crisis: boolean;
  refused: boolean;
  grounded: boolean;
  trace?: TraceStep[];
}
export interface SuggestedResponse {
  questions: string[];
}

// ---------------- Phase 4: report and sharing ----------------

export interface ReportPayload {
  generated: string;
  alias: string;
  age: number;
  region: string;
  life_stage: LifeStage;
  pregnancy_weeks: number;
  cycles: { start: string; length: number | null; bleed: number }[];
  stats: {
    logs: number;
    period_days: number;
    severe_pain_days: number;
    pbac_by_cycle: number[];
    record_strength: string;
    cycle_change: { index: number; before: number; after: number } | null;
  };
  red_flags: Card[];
  patterns: Card[];
  labs: LabResult[];
  questions: string[];
  sources: string[];
  is_synthetic: boolean;
}
/** POST /v1/reports and GET /v1/reports/latest (null when none exists) */
export interface ReportRow {
  id: number;
  created_at: string;
  payload: ReportPayload;
}
/** POST /v1/shares — the token is returned once and stored hashed */
export interface ShareCreated {
  id: number;
  token: string;
  expires_at: string;
  path: string;
  note: string;
}
/** GET /v1/shares */
export interface ShareRow {
  id: number;
  report_id: number;
  clinic_id: string;
  expires_at: string;
  revoked_at: string | null;
  created_at: string;
}
/** GET /v1/shared/{token} (public; 404 revoked or unknown, 410 expired) */
export interface SharedView {
  payload: ReportPayload;
  expires_at: string;
  report_id: number;
}

// ---------------- Phase 5: clinician and network admin ----------------

export interface ClinicGap {
  id: number;
  type: string; // postpartum_glucose_test | pregnancy_glucose_screen | …
  status: "open" | "in_progress" | "closed";
  due_date: string | null;
  updated_at: string;
}
/** GET /v1/clinic/patients/{id} (consented patients only; 404 otherwise) */
export interface ClinicRecord {
  profile: { id: string; alias: string; age: number; region: string; life_stage: LifeStage; pregnancy_weeks: number; language: string; ttc_months: number };
  sbar: { situation: string; background: string; assessment: string[]; recommendation: string[] };
  cards: Card[];
  crisis: boolean;
  trace: TraceStep[];
  labs: LabResult[];
  care_gaps: ClinicGap[];
  review: { reviewed_at: string | null; visit_note: string | null } | null;
  latest_report: { id: number; created_at: string } | null;
  analytics: AnalyticsResponse;
  timeline: TimelineResponse;
  her_questions: string[];
  visit_note_draft: string;
}
/** POST /v1/clinic/patients/{id}/ask — answers only from her entries */
export interface RecordAnswer {
  answer: string;
  evidence: { entry_id: string | null; date: string; text: string }[];
  from_entries_only: boolean;
}
/** GET /v1/clinic/care-gaps */
export interface ClinicGapRow extends ClinicGap {
  profile_id: string;
  clinic_id: string;
  rule_id: string;
  updated_by: string | null;
  alias: string;
  language: string;
}
/** POST /v1/clinic/care-gaps/{id}/reminder — a draft; nothing is sent */
export interface ReminderDraft {
  en: string;
  ar: string;
  sent: false;
  note: string;
}
export interface AdminMetricsFull extends AdminMetrics {
  clinics: { clinic_id: string; name: string | null; n: number | null; consented: number | null; shared: number | null; gaps: number | null; closed: number | null }[];
  // The glucose-test part of DoH Jawda KPI PC008; null when fewer than 10 women (k-min).
  pc008_glucose: { due: number | null; done: number | null; booked: number | null; open: number | null; done_pct: number | null };
  funnel: { stage: string; n: number }[];
  regions: { region: string; n: number | null; open: number; in_progress: number; closed: number }[];
  fairness: {
    overall: { pct_obs: number; pct_shared: number };
    nationality_group: FairnessRow[];
    age_band: FairnessRow[];
  };
  roi_inputs: { postpartum_gaps: number; reports_shared: number; assumptions: string };
  live_demo_gaps: Partial<Record<"open" | "in_progress" | "closed", number>>;
}
export interface FairnessRow {
  g: string;
  n: number | null;
  pct_obs: number | null;
  pct_shared: number | null;
  flag: string;
}
export interface AuditVerify {
  entries: number;
  chain_ok: boolean;
  first_bad_id: number | null;
}

// ---------------- Phase 6: check-in, documents, privacy ----------------

/** POST /v1/questionnaires/epds — crisis → total is null and only red-flag cards come back */
export interface EpdsResult {
  crisis: boolean;
  total: number | null;
  cards: Card[];
}
export interface ExtractedRow {
  code: string;
  test: string;
  value: number | string;
  unit: string | null;
  ref_low: number | null;
  ref_high: number | null;
  flag: string;
  date: string;
  note?: string | null;
}
/** POST /v1/documents (multipart) */
export interface DocumentUpload {
  id: number;
  rows: ExtractedRow[];
  sample_date: string | null;
  injection_lines_removed: number;
  message: string;
}
/** GET /v1/documents */
export interface DocumentRow {
  id: number;
  filename: string;
  mime: string;
  status: "extracted" | "confirmed";
  extraction: { rows: ExtractedRow[]; sample_date: string | null; injection_lines_removed: number } | null;
  created_at: string;
}
/** GET /v1/privacy */
export interface PrivacyResponse {
  consents: { purpose: "care_share" | "assistant" | "research"; granted: boolean; granted_at: string | null; revoked_at: string | null; clinic_id: string | null; clinic_name: string | null }[];
  home_clinic: { id: string; name: string } | null; // where a share would go, named before she allows it
  audit: { actor_role: string; actor_id: string | null; action: string; target: string | null; at: string }[];
  stored: Record<string, number>;
  promises: string[];
}
export interface FhirExport {
  bundle: { resourceType: string; type: string; entry?: unknown[] };
  validation_errors: string[];
}
