// Copied from apps/web/src/lib/api/types.ts by apps/mobile/scripts/sync-shared.mjs. Edit the web file, then run npm run sync.
// Response shapes of the FastAPI service (backend/app/api/*). Checked field by field against live responses.

export type Role = "patient" | "clinician" | "admin" | "clinic_admin";
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
export type LoginBody = { persona: string; role?: "patient" } | { role: "clinician" | "admin" | "clinic_admin" };
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
  overdue_gaps: number; // open follow-ups past their window with no booking
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
/** Her first 6 weeks after a birth (GET /v1/me/home .postnatal; DoH Postnatal Care Program Standard, May 2025). */
export type PostnatalStepId = "teleconsult" | "visit_2w" | "mood" | "visit_6w" | "glucose_test";
export interface PostnatalStep {
  id: PostnatalStepId;
  from: string;
  to: string;
  status: "done" | "due" | "upcoming" | "not_recorded";
  done_on: string | null;
  recordable: boolean;
  sources: string[];
  source_links: Source[];
}
export interface Postnatal {
  birth_date: string;
  discharge_date: string;
  discharge_assumed: boolean;
  days_since_birth: number;
  weeks_since_birth: number;
  steps: PostnatalStep[];
  done: number;
  total: number;
}

/** Her baby's first 12 months (GET /v1/me/home .baby, POST /v1/baby/{id}; build week D1). DoH Abu Dhabi's newborn
 * screening standard, the ADPHC immunisation schedule (April 2026) and the well-child visits standard. `label` and
 * `vaccines` come in the language asked for; `vaccine_codes` are the schedule's own names (BCG, PCV20, ...). */
export type BabyItemId =
  | "newborn_exam"
  | "hearing_screen"
  | "heart_screen"
  | "heel_prick"
  | "vaccines_birth"
  | "rsv_antibody"
  | "check_1m"
  | "check_2m"
  | "vaccines_2m"
  | "check_4m"
  | "vaccines_4m"
  | "check_6m"
  | "vaccines_6m"
  | "check_9m";
export interface BabyItem {
  id: BabyItemId;
  kind: "screening" | "vaccination" | "check";
  age_months: number; // the published age (0: at birth)
  label: string;
  vaccine_codes: string[];
  vaccines: string[];
  due_from: string;
  due_to: string;
  status: "done" | "due" | "upcoming" | "not_recorded"; // never "missed": the app cannot know what happened
  done_on: string | null;
  sources: string[];
  source_links: Source[];
}
export interface BabySchedule {
  birth_date: string;
  age_days: number;
  age_weeks: number;
  age_months: number;
  items: BabyItem[];
  next: BabyItemId[]; // due now, or else the nearest items to come
  done: number;
  total: number;
}

/** Planning a pregnancy (GET /v1/me/home .preconception, POST /v1/preconception/{id}; build week Y1, Trying stage). */
export type PreconceptionItemId = "folic_acid" | "premarital_results" | "rubella" | "cycle_checkup" | "fertility_check";
export interface PreconceptionItem {
  id: PreconceptionItemId;
  done: boolean;
  done_on: string | null;
  relevant: boolean; // her own record points to it (the matching rule fires)
  sources: string[];
  source_links: Source[];
}
export interface Preconception {
  items: PreconceptionItem[];
  done: number;
  total: number;
}

/** One blood-pressure reading (build week K6; POST /v1/bp). time is "HH:MM" or null. */
export interface BpReading {
  id: string;
  date: string;
  time: string | null;
  systolic: number;
  diastolic: number;
  source: string;
}
export interface BpBody {
  date: string;
  time?: string | null;
  systolic: number;
  diastolic: number;
}
export interface BpResult {
  id: string;
  reading: BpReading;
  red_flags: Card[];
  crisis: boolean;
  patterns: string[];
}
/** GET /v1/me/home .blood_pressure: she can log while pregnant and for 12 weeks after a birth. */
export interface BpSummary {
  eligible: boolean;
  latest: BpReading | null;
  recent: BpReading[]; // newest first
}

/** GET /v1/me/home .feeding, POST /v1/feeds (build week D2): her last 7 days of feeds after a birth. No amounts. */
export type FeedKind = "breast" | "expressed" | "formula";
export type FeedWorryId = "latch" | "pain" | "few_wet_nappies";
export interface FeedDay {
  date: string;
  breast: number;
  expressed: number;
  formula: number;
  total: number;
}
export interface FeedingSummary {
  days: FeedDay[]; // 7 days, oldest first, the last is ref_date
  today: number;
  last: { id: string; date: string; time: string | null; kind: FeedKind; worries: FeedWorryId[] } | null;
  worries: { id: FeedWorryId; times: number; last_on: string; text: string; sources: string[]; source_links: Source[] }[];
  note: string;
}

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
  days_logged: number; // distinct dates with a daily log (same number on home, Patterns, clinician)
  postnatal: Postnatal | null;
  baby: BabySchedule | null;
  preconception: Preconception | null;
  blood_pressure: BpSummary;
  feeding: FeedingSummary | null;
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
  /** "model" only when her AI switch is on and a model is configured (build week K2) */
  read_by?: "rules" | "model";
  /** from the word checks on her own words, never from the model; shown before she saves */
  urgent?: { kind: string; message: string; number: "998"; sources: string[] } | null;
  crisis?: boolean;
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
  sleep_h: number | null;
  pbac_items: PbacItems | null;
  source: string | null; // "app" for her own entries; the log form reopens those
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
  bp_readings: BpReading[]; // oldest first, within the range
  bp_eligible: boolean;
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
  days_logged: number;
  rules_version: string;
  checked: CheckedItem[]; // period checks that did not become a card (backend/app/services/checked.py)
}

export interface CheckedItem {
  id: "cycles" | "skin_hair" | "pain" | "bleeding";
  rule_id: string;
  label: string;
  text: string;
  sources: string[];
  source_links: Source[];
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
  urgent: { kind: string; message: string; number: string; support_line?: { name: string; tel: string } } | null; // kind: "crisis", "bleed", …
  crisis: boolean;
  refused: boolean;
  grounded: boolean;
  trace?: TraceStep[];
  /** Which lane answered (section 7): the cited knowledge answer, a safety reply, her own record, or her next steps. */
  lane?: "knowledge" | "safety" | "record" | "next_step" | "food";
  record?: HerRecord; // lane "record": her own numbers, computed by code
  next_steps?: NextStepItem[]; // lane "next_step": a short list she approves
  lead?: string; // lane "next_step": the sentence before the list
}
/** Lane (b): every line is computed by code from her entries; each chip opens that day in her calendar. */
export interface HerRecord {
  topic: "cycles" | "last_period" | "pain" | "impact" | "labs" | "bp" | "postnatal" | "other_person";
  from_entries: true;
  written_by: string; // "code", or the model that reworded lines whose numbers code fixed
  lines: { text: string; evidence: Evidence[]; evidence_total: number }[];
}
/** Lane (c): red flags first, then patterns and due care steps. Drafts only: nothing is sent. */
export interface NextStepItem {
  id: string;
  kind: "red_flag" | "pattern" | "care_step" | "postnatal_step";
  rule_id: string | null;
  title: string;
  text: string;
  evidence: Evidence[];
  questions: string[];
  sources: Source[];
  draft: {
    id: number;
    status: NavigatorDraft["status"];
    to: string | null;
    subject: string | null;
    message: string | null;
    bring: string[];
    sent: false;
  } | null;
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
  window_end: string | null; // the last day of its guideline window (never moved forward, unlike due_date)
  overdue: boolean; // open (never booked) and its window ended before today
  history?: FollowUpHistory | null; // in the record view: the loop, step by step
}

// ---------------- The closed loop (follow-up history, event timeline, loop metrics) ----------------

export type FollowUpStepKind =
  | "opened"
  | "shared"
  | "unshared"
  | "reminder"
  | "reminder_approved"
  | "reminder_discarded"
  | "booked"
  | "reopened"
  | "done"
  | "result";
/** One line of a follow-up's story: when, who (role; a staff id only in the clinician's view), and the evidence. */
export interface FollowUpStep {
  step: FollowUpStepKind;
  at: string;
  actor_role: "system" | "patient" | "clinician" | "clinic_admin" | "admin";
  actor_id: string | null;
  days: number | null; // calendar days since the step before (null on the first line)
  evidence: {
    audit_id?: number;
    audit_hash?: string;
    // opened
    rule_id?: string;
    title?: string;
    why?: string;
    sources?: Source[];
    entries?: string[];
    still_in_record?: boolean;
    // shared
    clinic?: string | null;
    clinic_id?: string | null;
    before_opened?: boolean;
    active?: boolean;
    // done
    reason?: "rule_resolved";
    record_opened_before?: string | null;
    // reminders: never sent by the app
    sent?: false;
    // result
    tests?: { code: string; test: string; value: string; unit: string | null; date: string }[];
    document_id?: number | null;
  };
}
/** GET /v1/me/followups/{id}/history and /v1/clinic/patients/{pid}/followups/{id}/history */
export interface FollowUpHistory {
  follow_up: {
    id: number;
    type: string;
    rule_id: string;
    status: ClinicGap["status"];
    due_date: string | null;
    window_end: string | null;
    opened_at: string;
    overdue: boolean;
  };
  steps: FollowUpStep[];
  pending: ("booked" | "done" | "result")[];
  summary: { opened_to_booked: number | null; booked_to_done: number | null; opened_to_result: number | null; done_in_window: boolean | null };
}
/** GET /v1/me/followups?lang= */
export interface FollowUpsResponse {
  follow_ups: FollowUpHistory[];
  ref_date: string;
}
/** A share with small-group protection: every number is null when the group, the count or its complement is under k. */
export interface LoopRatio {
  n: number | null;
  of: number | null;
  pct: number | null;
  suppressed: boolean;
}
/** The loop, measured (on /admin/metrics and /clinic-admin/dashboard). Medians are null under k. */
export interface LoopMetrics {
  k_min: number;
  follow_ups: number | null;
  median_days: Record<"opened_to_booked" | "booked_to_done" | "opened_to_result", { days: number | null; n: number | null }>;
  done_in_window: LoopRatio;
  overdue: { n: number | null; suppressed: boolean };
  postnatal_in_window: LoopRatio;
  record_opened_before_visit: LoopRatio;
  note: string;
}
/** One audit-log row on the event timeline: pseudonymous ids only, never names, never the detail column. */
export interface AuditEvent {
  id: number;
  at: string;
  actor_role: string;
  actor: string | null;
  action: string;
  record: string | null;
  target: string | null;
  clinic_id: string | null;
}
/** GET /v1/admin/events and /v1/clinic-admin/events */
export interface EventsResponse {
  events: AuditEvent[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
  snapshot: number;
  filters: { roles: string[]; actions: string[] };
  applied: { role: string | null; action: string | null; from: string | null; to: string | null };
  scope: "network" | "clinic";
  clinic_id: string | null;
  chain: { ok: boolean; entries: number; first_bad_id: number | null };
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
  postnatal: Postnatal | null;
  baby: BabySchedule | null; // D1, read-only for the clinician
  bp_readings: BpReading[]; // newest first
  days_logged: number;
  visit_note_draft: string;
  previsit_brief: PrevisitBrief;
}
/** One line of the pre-visit brief: a fact from her entries, with the entries behind it (K3). */
export interface BriefLine {
  id: string;
  kind: "red_flag" | "pattern" | "cycle" | "pain" | "lab" | "care_step" | "question";
  status: "urgent" | "new" | "ongoing" | "resolved" | "done" | "booked" | "due" | "H" | "L" | null;
  rule_id: string | null;
  text: string;
  evidence: Evidence[];
  evidence_total: number;
  sources: Source[];
  written_by: string;
  due_date?: string | null;
}
/** GET /v1/brief?lang= (her) and ClinicRecord.previsit_brief (clinician): "what changed since the last visit" */
export interface PrevisitBrief {
  since: string;
  since_basis: "shared_report" | "clinician_review" | "default_90_days";
  ref_date: string;
  lang: "en" | "ar";
  audience: "patient" | "clinician";
  crisis: boolean;
  ai_on: boolean;
  written_by: string;
  dropped_sentences: number;
  lines: BriefLine[];
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
/** POST /v1/clinic/care-gaps/{id}/reminder — a stored draft (navigator_drafts, origin clinic); nothing is sent */
export interface ReminderDraft {
  id: number;
  status: "draft" | "approved" | "discarded";
  care_gap_id: number;
  en: string;
  ar: string;
  sent: false;
  note: string;
}
/** POST /v1/clinic/reminders/{id}/approve|discard */
export interface ReminderDecision extends ReminderDraft {
  message: string;
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
  loop: LoopMetrics;
  population: PopulationView;
}
/** A group's women with a pattern, split by whether they shared a report; all null when any part is under 10. */
export interface PatternSplit {
  with_pattern: number | null;
  shared: number | null;
  not_shared: number | null;
  shared_pct: number | null;
}
/** Counts a health department would see, from the synthetic cohort (backend/app/api/admin.py `_population`). */
export interface PopulationView {
  overall: PatternSplit;
  regions: ({ region: string; n: number | null } & PatternSplit)[];
  age_bands: { age_band: string; n: number | null; cycles: number | null; pain: number | null; heavy: number | null }[];
  trying: { trying: number | null; due: number | null; shared: number | null; not_shared: number | null };
  note: string;
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
  /** "photo": read from a photo by the AI model (build week); "file": a PDF or text file. */
  source?: "file" | "photo";
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
/** Family support links (build week Y4): GET/POST /v1/family-links, DELETE /v1/family-links/{id}, GET /v1/family/{token} */
export type FamilyRelation = "husband" | "mother" | "sister" | "friend" | "other";
export interface FamilyLink {
  id: number;
  relation: FamilyRelation;
  include_details: boolean;
  expires_at: string;
  revoked_at: string | null;
  last_viewed_at: string | null;
  created_at: string;
  active: boolean; // not turned off and not expired (decided by the API)
}
export interface FamilyLinkCreated {
  id: number;
  token: string;
  path: string;
  expires_at: string;
}
export interface FamilyView {
  first_name: string;
  stage: "periods" | "trying_to_conceive" | "pregnancy" | "after_birth" | "perimenopause";
  relation: FamilyRelation;
  steps: { id: string; from: string | null; to: string | null; status: "due" | "upcoming" }[];
  steps_done: number | null;
  details: { pregnancy_weeks: number | null; weeks_since_birth: number | null; patterns: string[] /* rule ids */ } | null;
  expires_at: string;
  ref_date: string;
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

/** POST /v1/auth/passkey/login/verify and /v1/auth/email/verify: her own record, signed in (K5) */
export interface SignedIn {
  role: "patient";
  user_id: string;
}
/** GET /v1/auth/methods: what the sign-in page offers (the email code needs a configured provider) */
export interface AuthMethods {
  passkey: boolean;
  email: boolean;
}
/** GET /v1/auth/me: her sign-in methods, for Privacy. Never the address itself. */
export interface AuthMe {
  own_record: boolean; // a record she started on /join (demo people open with one tap instead)
  passkeys: { id: number; label: string | null; created_at: string; last_used_at: string | null }[];
  email_linked: boolean;
  email_available: boolean;
}

/** GET /v1/documents/photo: whether a photographed report can be read right now. */
export interface PhotoReading {
  available: boolean;
  reason: "no_model" | "ai_off" | null;
}

/** Clinic onboarding (K4, PR #109): /v1/clinic-admin/* for a clinic admin, /v1/clinic-invites/* public. */
export interface ClinicRef {
  id: string;
  name: string; // "Seaside Women's Clinic (fictional)"
  region: string;
}
export type InviteStatus = "pending" | "accepted" | "expired" | "revoked";
export interface InviteCreated {
  id: number;
  status: "pending";
  token: string; // shown only once
  join_path: string; // "/clinic-invite/<token>"
  join_url: string;
  qr_payload: string;
  created_at: string;
  expires_at: string;
  clinic: ClinicRef;
  note: string;
}
export interface InviteRow {
  id: number;
  status: InviteStatus;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
  accepted_by: { id: string; alias: string } | null;
}
export interface InvitesResponse {
  clinic_id: string;
  invites: InviteRow[];
}
export interface TeamResponse {
  clinic: ClinicRef;
  clinicians: Array<{ id: string; alias: string; joined_at: string; joined_by_invite: boolean }>;
}
/** Counts under 10 (or blanked to protect a small group) are null: show "fewer than 10", never 0. */
export interface ClinicDashboard {
  clinic: ClinicRef;
  is_synthetic: boolean;
  k_min: number;
  follow_ups: { open: number | null; booked: number | null; done: number | null; total: number | null; done_pct: number | null };
  pc008_glucose: { due: number | null; booked: number | null; done: number | null; open: number | null; done_pct: number | null; suppressed: boolean; note: string };
  shared_records: number | null;
  team: { clinicians: number; pending_invites: number };
  loop: LoopMetrics;
  note: string;
}
export interface InvitePreview {
  clinic: ClinicRef;
  status: InviteStatus;
  expires_at: string;
  role: "clinician";
}

// ---------- Staff and DoH sign-in (the team's plan section 5) ----------
/** How a session started: a one-tap demo, her join or sign-in, an invite, a staff passkey, or the DoH door. */
export type SessionHow = "demo" | "signup" | "invite" | "passkey" | "email_code" | "passkey_code" | "legacy";
export interface StaffPasskey {
  id: number;
  label: string | null;
  created_at: string;
  last_used_at: string | null;
}
/** GET /v1/staff-auth/me: the staff "Your sign-in" panel */
export interface StaffMe {
  role: Exclude<Role, "patient">;
  user_id: string;
  alias: string;
  clinic_id: string;
  shared_demo_account: boolean; // a fictional demo account every judge opens with one tap
  can_add_passkey: boolean; // clinicians and clinic admins; a DoH admin's passkeys come from the setup link
  passkeys: StaffPasskey[];
  authenticator_set: boolean;
  session: {
    how: SessionHow;
    started_at: string;
    last_seen_at: string;
    expires_at: string;
    idle_minutes: number;
    max_hours: number;
    step_up_until: string | null;
  };
  step_up: "demo_confirm" | "passkey";
}
/** POST /v1/staff-auth/passkey/login/verify and /v1/staff-auth/doh/code */
export interface StaffSignedIn {
  role: Exclude<Role, "patient">;
  user_id: string;
  area: string;
}
/** POST /v1/staff-auth/doh/passkey/verify: the passkey checked, the authenticator code still to come */
export interface DohTicket {
  next: "code";
  ticket: string;
  expires_in: number;
}
/** GET /v1/staff-auth/setup/{token} */
export interface DohSetupPreview {
  status: "pending" | "used" | "expired";
  role: "admin";
  alias: string;
  expires_at: string;
  passkey_added: boolean;
}
/** POST /v1/staff-auth/setup/{token}/authenticator: what the QR code holds */
export interface DohAuthenticator {
  otpauth_uri: string;
  secret: string;
  issuer: string;
}
/** POST /v1/staff-auth/step-up/options. `fresh`: a check in the last few minutes still holds (no options then). */
export type StepUpOptions = ({ mode: "demo_confirm" } | { mode: "passkey"; options?: unknown }) & { fresh: boolean; valid_minutes: number };
/** GET /v1/sessions: the account's signed-in devices */
export interface SessionRow {
  id: number;
  how: SessionHow;
  device: string | null;
  started_at: string;
  last_seen_at: string;
  expires_at: string;
  current: boolean;
}
export interface SessionsList {
  shared_demo_account: boolean;
  idle_minutes: number | null;
  sessions: SessionRow[];
}
