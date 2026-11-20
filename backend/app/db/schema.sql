-- ReproSense schema (PostgreSQL 15+, pgvector). Synthetic data only: every profile row must be is_synthetic.
-- Row-level security is FORCED on every table that holds health data. The API never queries as the table owner:
-- each request runs `SET LOCAL ROLE reprosense_app` and sets app.role / app.user_id / app.clinic_id (see app/db/__init__.py).

CREATE EXTENSION IF NOT EXISTS vector;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'reprosense_app') THEN
    CREATE ROLE reprosense_app NOLOGIN;
  END IF;
END $$;
-- The connecting user must be able to SET ROLE to it. A superuser (local Postgres) can anyway; a managed database
-- owner such as Supabase's "postgres" is not a superuser, so grant the membership explicitly. On a fresh managed
-- project the owner created the role and may grant it; if it may not, say why instead of failing the whole schema.
DO $$ BEGIN
  EXECUTE format('GRANT reprosense_app TO %I', current_user);
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'reprosense_app was not granted to %: it must already be allowed to SET ROLE reprosense_app', current_user;
END $$;

-- The sign-in and family tables (sign_in.sql, family.sql, applied after this file) go too: a demo reset clears every
-- joined record and every passkey, authenticator and setup link. auth_sessions and revoked_tokens stay: a reset signs
-- nobody out and never brings a signed-out token back.
DROP TABLE IF EXISTS family_links, mfa_tickets, staff_setup_links, staff_totp, email_codes, auth_challenges, sign_in_emails, passkeys, clinic_invites, audit_log, kb_chunks, cohort_members, navigator_drafts, clinic_reviews, care_gaps, shares, reports,
  observations, documents, lab_results, feeds, bp_readings, events, daily_logs, cycles, consents, profiles, clinics CASCADE;

CREATE OR REPLACE FUNCTION app_role() RETURNS text LANGUAGE sql STABLE AS $$ SELECT coalesce(current_setting('app.role', true), '') $$;
CREATE OR REPLACE FUNCTION app_user() RETURNS text LANGUAGE sql STABLE AS $$ SELECT coalesce(current_setting('app.user_id', true), '') $$;
CREATE OR REPLACE FUNCTION app_clinic() RETURNS text LANGUAGE sql STABLE AS $$ SELECT coalesce(current_setting('app.clinic_id', true), '') $$;

CREATE TABLE clinics (
  id text PRIMARY KEY, name text NOT NULL, region text NOT NULL, is_synthetic boolean NOT NULL DEFAULT true CHECK (is_synthetic)
);

CREATE TABLE profiles (
  id text PRIMARY KEY,
  alias text NOT NULL,                      -- fictional alias, never a real name
  role text NOT NULL CHECK (role IN ('patient', 'clinician', 'admin', 'clinic_admin')),  -- clinic_admin: one clinic (K4)
  language text NOT NULL DEFAULT 'en',
  age int, age_range text, region text, menarche_age int,
  life_stage text, pregnant boolean NOT NULL DEFAULT false, pregnancy_weeks int NOT NULL DEFAULT 0,
  breastfeeding boolean NOT NULL DEFAULT false, on_hormonal_contraception boolean NOT NULL DEFAULT false,
  trying_to_conceive boolean NOT NULL DEFAULT false, ttc_months int NOT NULL DEFAULT 0,
  story text, clinic_id text REFERENCES clinics(id),
  discreet boolean NOT NULL DEFAULT false, onboarded boolean NOT NULL DEFAULT true,
  is_synthetic boolean NOT NULL DEFAULT true CHECK (is_synthetic),   -- the database refuses non-synthetic people
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE consents (
  id serial PRIMARY KEY, profile_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  purpose text NOT NULL CHECK (purpose IN ('care_share', 'assistant', 'research')),
  clinic_id text REFERENCES clinics(id), granted boolean NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now(), revoked_at timestamptz
);

CREATE TABLE cycles (
  id serial PRIMARY KEY, profile_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_date date NOT NULL, bleed_days int NOT NULL, length_days int
);

CREATE TABLE daily_logs (
  id text PRIMARY KEY, profile_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL, flow text NOT NULL DEFAULT 'none', pain int NOT NULL DEFAULT 0 CHECK (pain BETWEEN 0 AND 10),
  pain_sites text[] NOT NULL DEFAULT '{}', symptoms text[] NOT NULL DEFAULT '{}', impact text NOT NULL DEFAULT 'none',
  mood text, sleep_h numeric, pbac int NOT NULL DEFAULT 0, pbac_items jsonb,
  note_enc bytea,                            -- AES-GCM ciphertext (app/security/crypto.py)
  source text NOT NULL DEFAULT 'seed', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON daily_logs (profile_id, date);

CREATE TABLE events (
  id text PRIMARY KEY, profile_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL, date date NOT NULL, details jsonb NOT NULL DEFAULT '{}'
);

-- Blood pressure in pregnancy and the 12 weeks after birth (build week K6). The plausible range is checked here too, so
-- no path into the database can store a reading the rules engine would misread (API: app/services/blood_pressure.py).
CREATE TABLE bp_readings (
  id text PRIMARY KEY, profile_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL, time time,
  systolic int NOT NULL CHECK (systolic BETWEEN 70 AND 250),
  diastolic int NOT NULL CHECK (diastolic BETWEEN 40 AND 150),
  source text NOT NULL DEFAULT 'app', created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (systolic > diastolic)
);
CREATE INDEX ON bp_readings (profile_id, date);

-- Feeding log in the 12 months after a birth (build week D2): one row per feed she taps, with any worry she marks.
-- Information only: no amounts, no score (app/services/feeding.py). Not in clinician_read: the clinic record omits it.
CREATE TABLE feeds (
  id text PRIMARY KEY, profile_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL, time time,
  kind text NOT NULL CHECK (kind IN ('breast','expressed','formula')),
  worries text[] NOT NULL DEFAULT '{}' CHECK (worries <@ ARRAY['latch','pain','few_wet_nappies']::text[]),
  source text NOT NULL DEFAULT 'app', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON feeds (profile_id, date);

CREATE TABLE documents (
  id serial PRIMARY KEY, profile_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  filename text NOT NULL, mime text NOT NULL, text_enc bytea, status text NOT NULL DEFAULT 'extracted',
  extraction jsonb, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE lab_results (
  id serial PRIMARY KEY, profile_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  code text NOT NULL, test text NOT NULL, value text NOT NULL, value_num numeric, unit text,
  ref_low numeric, ref_high numeric, flag text NOT NULL DEFAULT '', date date NOT NULL,
  source_doc_id int REFERENCES documents(id) ON DELETE SET NULL, confirmed boolean NOT NULL DEFAULT true
);

CREATE TABLE observations (
  id serial PRIMARY KEY, profile_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rule_id text NOT NULL, kind text NOT NULL, urgency text NOT NULL, status text NOT NULL DEFAULT 'open',
  supporting_entry_ids text[] NOT NULL DEFAULT '{}', values jsonb NOT NULL DEFAULT '{}', card jsonb,
  trace jsonb, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (profile_id, rule_id)
);

CREATE TABLE reports (
  id serial PRIMARY KEY, profile_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE shares (
  id serial PRIMARY KEY, profile_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  report_id int REFERENCES reports(id) ON DELETE CASCADE, clinic_id text REFERENCES clinics(id),
  token_hash text NOT NULL UNIQUE, expires_at timestamptz NOT NULL, revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- opened_at: when a rule opened it (the loop's first step). window_end: the last day of its guideline window, never
-- moved forward to "today" the way due_date is, so a follow-up past its window with no booking can be flagged overdue.
CREATE TABLE care_gaps (
  id serial PRIMARY KEY, profile_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  clinic_id text REFERENCES clinics(id), type text NOT NULL, rule_id text NOT NULL, due_date date,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed')),
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by text, opened_at timestamptz NOT NULL DEFAULT now(),
  window_end date, UNIQUE (profile_id, type)
);

CREATE TABLE clinic_reviews (
  profile_id text PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  clinician_id text NOT NULL, reviewed_at timestamptz, visit_note text, updated_at timestamptz NOT NULL DEFAULT now()
);

-- origin 'patient': her own appointment request. origin 'clinic': a reminder her clinician drafted for an open follow-up
-- (care_gap_id). Either way the app only drafts; the person who approves it sends it herself.
CREATE TABLE navigator_drafts (
  id serial PRIMARY KEY, profile_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rule_id text NOT NULL, draft jsonb NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'discarded')),  -- no 'sent': the app never sends
  created_at timestamptz NOT NULL DEFAULT now(), approved_at timestamptz,
  origin text NOT NULL DEFAULT 'patient' CHECK (origin IN ('patient', 'clinic')),
  care_gap_id int REFERENCES care_gaps(id) ON DELETE CASCADE, created_by text
);

CREATE TABLE cohort_members (
  patient_id text PRIMARY KEY, is_synthetic boolean NOT NULL CHECK (is_synthetic), age int NOT NULL CHECK (age >= 18),
  age_band text NOT NULL, region text NOT NULL, clinic_id text NOT NULL, nationality_group text NOT NULL,
  obs_irregular_cycles boolean, obs_irregular_plus_androgen boolean, obs_severe_cyclical_pain boolean, obs_heavy_periods boolean,
  recent_delivery boolean, gdm_history boolean, trying_to_conceive boolean, obs_ttc_fertility_assessment boolean,
  postpartum_glucose_test_done boolean, consented_care_share boolean, report_shared boolean,
  care_gap_type text, care_gap_status text, days_overdue int,
  -- The loop's dates for the synthetic cohort (app/services/followups.py cohort_loop: derived from the member's id and
  -- the demo date, so a demo reset gives the same figures). No real person's timings.
  gap_opened_on date, gap_booked_on date, gap_done_on date, gap_result_on date, gap_window_end date,
  report_opened_on date, birth_on date, postnatal_steps jsonb
);

CREATE TABLE kb_chunks (
  id serial PRIMARY KEY, source_id text NOT NULL, title text NOT NULL, url text NOT NULL, section text,
  lang text NOT NULL, text text NOT NULL, embedding vector(256) NOT NULL,
  tsv tsvector GENERATED ALWAYS AS (to_tsvector('simple', text)) STORED
);
CREATE INDEX ON kb_chunks USING gin (tsv);

-- K4 clinic onboarding: a clinic admin invites a clinician by a single-use link or QR. Only the token's sha256 is stored;
-- the token itself is shown once, to the admin who made it.
CREATE TABLE clinic_invites (
  id serial PRIMARY KEY, clinic_id text NOT NULL REFERENCES clinics(id), token_hash text NOT NULL UNIQUE,
  created_by text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL,
  accepted_at timestamptz, accepted_by text REFERENCES profiles(id) ON DELETE SET NULL, revoked_at timestamptz,
  CHECK (accepted_at IS NULL OR revoked_at IS NULL)
);

CREATE TABLE audit_log (
  id bigserial PRIMARY KEY, actor_id text NOT NULL, actor_role text NOT NULL, action text NOT NULL,
  subject_id text, target text, detail jsonb, at timestamptz NOT NULL DEFAULT now(),
  prev_hash text NOT NULL, hash text NOT NULL
);

-- clinician visibility: an active care_share consent to the clinician's clinic. SECURITY DEFINER avoids RLS recursion.
CREATE OR REPLACE FUNCTION clinician_can_see(pid text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT app_role() = 'clinician' AND EXISTS (
    SELECT 1 FROM consents c WHERE c.profile_id = pid AND c.purpose = 'care_share' AND c.granted
      AND c.revoked_at IS NULL AND c.clinic_id = app_clinic())
$$;

-- ---------- grants ----------
GRANT USAGE ON SCHEMA public TO reprosense_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO reprosense_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO reprosense_app;
REVOKE UPDATE, DELETE ON audit_log FROM reprosense_app;      -- append-only
REVOKE DELETE ON clinic_invites FROM reprosense_app;          -- revoked, never deleted: the history stays
-- Who a profile is (role, clinic, is_synthetic, alias, age...) is set once, when it is made. The API may change only her
-- three settings (PATCH /v1/me), so a mass-assignment slip can never turn her into a clinician: her passkey would then
-- open the staff door with her clinic (20 Nov security assessment, F4). Owner connections (seed, CLI) are unaffected.
REVOKE UPDATE ON profiles FROM reprosense_app;
GRANT UPDATE (discreet, language, onboarded) ON profiles TO reprosense_app;

-- ---------- row-level security ----------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['consents','cycles','daily_logs','events','documents','lab_results','observations','reports',
                           'shares','care_gaps','clinic_reviews','navigator_drafts','bp_readings','feeds'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format($p$CREATE POLICY sys_all ON %I USING (app_role() = 'system') WITH CHECK (app_role() = 'system')$p$, t);
    EXECUTE format($p$CREATE POLICY patient_own ON %I USING (app_role() = 'patient' AND profile_id = app_user())
                     WITH CHECK (app_role() = 'patient' AND profile_id = app_user())$p$, t);
  END LOOP;
  -- clinicians read only consented patients
  FOREACH t IN ARRAY ARRAY['cycles','daily_logs','events','lab_results','observations','reports','care_gaps','clinic_reviews',
                           'consents','navigator_drafts','bp_readings'] LOOP
    EXECUTE format($p$CREATE POLICY clinician_read ON %I FOR SELECT USING (clinician_can_see(profile_id))$p$, t);
  END LOOP;
  -- clinicians may update care gaps / observations status and write reviews for consented patients
  EXECUTE $p$CREATE POLICY clinician_update ON care_gaps FOR UPDATE USING (clinician_can_see(profile_id)) WITH CHECK (clinician_can_see(profile_id))$p$;
  EXECUTE $p$CREATE POLICY clinician_update ON observations FOR UPDATE USING (clinician_can_see(profile_id)) WITH CHECK (clinician_can_see(profile_id))$p$;
  EXECUTE $p$CREATE POLICY clinician_write ON clinic_reviews FOR INSERT WITH CHECK (clinician_can_see(profile_id))$p$;
  EXECUTE $p$CREATE POLICY clinician_rewrite ON clinic_reviews FOR UPDATE USING (clinician_can_see(profile_id)) WITH CHECK (clinician_can_see(profile_id))$p$;
  -- a clinician drafts (and approves or discards) reminders for a consented patient; she never edits her requests
  EXECUTE $p$CREATE POLICY clinician_draft ON navigator_drafts FOR INSERT WITH CHECK (origin = 'clinic' AND clinician_can_see(profile_id))$p$;
  EXECUTE $p$CREATE POLICY clinician_decide ON navigator_drafts FOR UPDATE USING (origin = 'clinic' AND clinician_can_see(profile_id))
            WITH CHECK (origin = 'clinic' AND clinician_can_see(profile_id))$p$;
END $$;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;
CREATE POLICY sys_all ON profiles USING (app_role() = 'system') WITH CHECK (app_role() = 'system');
CREATE POLICY self_read ON profiles FOR SELECT USING (id = app_user());
CREATE POLICY patient_update ON profiles FOR UPDATE USING (app_role() = 'patient' AND id = app_user())
  WITH CHECK (app_role() = 'patient' AND id = app_user());
CREATE POLICY clinician_read ON profiles FOR SELECT USING (clinician_can_see(id));
-- a clinic admin sees her own clinic's staff (never a patient row)
CREATE POLICY clinic_admin_team ON profiles FOR SELECT
  USING (app_role() = 'clinic_admin' AND role IN ('clinician', 'clinic_admin') AND clinic_id = app_clinic());
-- the network admin sees staff rows only (which clinic a clinician works at, for the event timeline), never a patient
CREATE POLICY admin_staff ON profiles FOR SELECT
  USING (app_role() = 'admin' AND role IN ('clinician', 'clinic_admin', 'admin'));

ALTER TABLE cohort_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_members FORCE ROW LEVEL SECURITY;
CREATE POLICY sys_all ON cohort_members USING (app_role() = 'system') WITH CHECK (app_role() = 'system');
-- the network admin reads the whole synthetic cohort; a clinician or a clinic admin only her own clinic's rows
CREATE POLICY staff_read ON cohort_members FOR SELECT
  USING (app_role() = 'admin' OR (app_role() IN ('clinician', 'clinic_admin') AND clinic_id = app_clinic()));

ALTER TABLE clinic_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_invites FORCE ROW LEVEL SECURITY;
CREATE POLICY sys_all ON clinic_invites USING (app_role() = 'system') WITH CHECK (app_role() = 'system');
CREATE POLICY clinic_admin_read ON clinic_invites FOR SELECT USING (app_role() = 'clinic_admin' AND clinic_id = app_clinic());
CREATE POLICY clinic_admin_create ON clinic_invites FOR INSERT
  WITH CHECK (app_role() = 'clinic_admin' AND clinic_id = app_clinic() AND created_by = app_user());
CREATE POLICY clinic_admin_revoke ON clinic_invites FOR UPDATE
  USING (app_role() = 'clinic_admin' AND clinic_id = app_clinic())
  WITH CHECK (app_role() = 'clinic_admin' AND clinic_id = app_clinic());

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log FORCE ROW LEVEL SECURITY;
CREATE POLICY sys_all ON audit_log USING (app_role() = 'system') WITH CHECK (app_role() = 'system');
CREATE POLICY anyone_append ON audit_log FOR INSERT WITH CHECK (app_role() IN ('patient', 'clinician', 'admin', 'clinic_admin'));
CREATE POLICY subject_read ON audit_log FOR SELECT USING (app_role() = 'patient' AND subject_id = app_user());
CREATE POLICY admin_read ON audit_log FOR SELECT USING (app_role() = 'admin');
-- the hash chain needs the latest hash; a SECURITY DEFINER helper exposes only that value
CREATE OR REPLACE FUNCTION audit_last_hash() RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT coalesce((SELECT hash FROM audit_log ORDER BY id DESC LIMIT 1), 'GENESIS')
$$;
GRANT EXECUTE ON FUNCTION audit_last_hash(), clinician_can_see(text), app_role(), app_user(), app_clinic() TO reprosense_app;

-- admin dashboard: live care-gap counts as aggregates only (no row access to patient tables)
CREATE OR REPLACE FUNCTION care_gap_counts() RETURNS TABLE(status text, n bigint) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT status, count(*) FROM care_gaps WHERE app_role() IN ('admin', 'system') GROUP BY status
$$;
GRANT EXECUTE ON FUNCTION care_gap_counts() TO reprosense_app;
-- The same counts by follow-up type (the after-birth glucose test is one part of DoH Jawda KPI PC008).
CREATE OR REPLACE FUNCTION care_gap_counts_by_type() RETURNS TABLE(type text, status text, n bigint) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT type, status, count(*) FROM care_gaps WHERE app_role() IN ('admin', 'system') GROUP BY type, status
$$;
GRANT EXECUTE ON FUNCTION care_gap_counts_by_type() TO reprosense_app;

-- K4: a clinic admin's own clinic, as counts only. Follow-ups from the synthetic cohort plus the live demo records that
-- share with her clinic (an active care_share consent), by type, status and age band. Nothing for any other role or
-- clinic. Under a non-superuser owner the profiles join is filtered by RLS and the band reads 'not recorded'.
CREATE OR REPLACE FUNCTION clinic_follow_up_counts() RETURNS TABLE(type text, status text, age_band text, n bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT f.type, f.status, f.age_band, count(*) FROM (
    SELECT m.care_gap_type AS type, m.care_gap_status AS status, m.age_band
      FROM cohort_members m WHERE m.clinic_id = app_clinic() AND m.care_gap_type IS NOT NULL
    UNION ALL
    SELECT g.type, g.status, coalesce(p.age_range, 'not recorded')
      FROM care_gaps g LEFT JOIN profiles p ON p.id = g.profile_id
      WHERE g.clinic_id = app_clinic() AND EXISTS (
        SELECT 1 FROM consents c WHERE c.profile_id = g.profile_id AND c.purpose = 'care_share' AND c.granted
          AND c.revoked_at IS NULL AND c.clinic_id = app_clinic())
  ) f WHERE app_role() = 'clinic_admin' AND app_clinic() <> '' GROUP BY f.type, f.status, f.age_band
$$;
-- Records shared with her clinic: synthetic cohort members who consented plus live demo records with an active consent.
CREATE OR REPLACE FUNCTION clinic_shared_record_count() RETURNS bigint
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT CASE WHEN app_role() = 'clinic_admin' AND app_clinic() <> '' THEN
    (SELECT count(*) FROM cohort_members WHERE clinic_id = app_clinic() AND consented_care_share)
    + (SELECT count(DISTINCT profile_id) FROM consents WHERE purpose = 'care_share' AND granted AND revoked_at IS NULL
         AND clinic_id = app_clinic())
  ELSE 0 END
$$;
GRANT EXECUTE ON FUNCTION clinic_follow_up_counts(), clinic_shared_record_count() TO reprosense_app;

-- ---------- the closed loop, made visible (sections 4 and 8) ----------
-- One follow-up's audit trail, for the woman herself or a clinician she shares with: the actions on this follow-up,
-- her care_share choices, her confirmed lab uploads and the clinicians' opens of her record. Nothing for anyone else.
CREATE OR REPLACE FUNCTION follow_up_audit(pid text, gap int)
RETURNS TABLE(id bigint, at timestamptz, actor_role text, actor_id text, action text, target text, detail jsonb, hash text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT a.id, a.at, a.actor_role, a.actor_id, a.action, a.target, a.detail, a.hash FROM audit_log a
  WHERE (clinician_can_see(pid) OR (app_role() = 'patient' AND pid = app_user()))
    AND a.subject_id = pid
    AND (a.target = 'care_gap:' || gap OR a.target = 'care_share' OR a.action IN ('confirm_document', 'view_record',
         'view_shared_report', 'download_shared_report'))
  ORDER BY a.id
$$;

-- Every live follow-up as dates only (no profile id): when a rule opened it, when it was booked, done, when a result
-- came back and when a clinician first opened her record after it opened. Network admin: all; a clinic admin: those
-- shared with her clinic (an active care_share consent), as in clinic_follow_up_counts(). Reads only tables whose
-- RLS is not forced (care_gaps, consents, audit_log), so it also works under a managed database's owner.
CREATE OR REPLACE FUNCTION follow_up_loop()
RETURNS TABLE(clinic_id text, type text, status text, opened_at timestamptz, window_end date, booked_at timestamptz,
              done_at timestamptz, result_at timestamptz, report_opened_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT g.clinic_id, g.type, g.status, g.opened_at, g.window_end,
    (SELECT min(a.at) FROM audit_log a WHERE a.target = 'care_gap:' || g.id AND a.action = 'care_gap_in_progress'),
    CASE WHEN g.status = 'closed' THEN g.updated_at END,
    (SELECT min(a.at) FROM audit_log a WHERE a.subject_id = g.profile_id AND a.action = 'confirm_document'
       AND a.at >= g.opened_at AND coalesce(a.detail -> 'codes', '[]'::jsonb) ? 'OGTT2H'),
    (SELECT min(a.at) FROM audit_log a WHERE a.subject_id = g.profile_id AND a.actor_role = 'clinician'
       AND a.action IN ('view_record', 'view_shared_report', 'download_shared_report') AND a.at >= g.opened_at)
  FROM care_gaps g
  WHERE app_role() = 'admin'
     OR (app_role() = 'clinic_admin' AND app_clinic() <> '' AND g.clinic_id = app_clinic() AND EXISTS (
          SELECT 1 FROM consents c WHERE c.profile_id = g.profile_id AND c.purpose = 'care_share' AND c.granted
            AND c.revoked_at IS NULL AND c.clinic_id = app_clinic()))
$$;

-- The event timeline: the audit log with the clinic each row belongs to (a staff actor's clinic, an invite's clinic,
-- the clinic a follow-up the rules engine opened or closed is shared with, or a clinic's own target). The network
-- admin reads every row, or one clinic's with p_clinic; a clinic admin always and only her own clinic's, whatever she
-- asks for. Ids only: the API pseudonymises patients' ids.
CREATE OR REPLACE FUNCTION audit_event_rows(p_clinic text DEFAULT NULL)
RETURNS TABLE(id bigint, at timestamptz, actor_role text, actor_id text, action text, subject_id text, target text,
              clinic_id text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT e.* FROM (
    SELECT a.id, a.at, a.actor_role, a.actor_id, a.action, a.subject_id, a.target,
      coalesce(s.clinic_id, i.clinic_id, g.clinic_id,
               CASE WHEN a.target LIKE 'clinic:%' THEN substr(a.target, 8) END) AS clinic_id
    FROM audit_log a
    LEFT JOIN profiles s ON s.id = a.actor_id AND s.role IN ('clinician', 'clinic_admin')
    LEFT JOIN clinic_invites i ON a.target = 'clinic_invite:' || i.id
    -- the rules engine opening or closing a follow-up belongs to the clinic the record is shared with
    LEFT JOIN care_gaps g ON a.actor_role = 'system' AND a.target = 'care_gap:' || g.id
  ) e
  WHERE (app_role() = 'admin' AND (p_clinic IS NULL OR e.clinic_id = p_clinic))
     OR (app_role() = 'clinic_admin' AND app_clinic() <> '' AND e.clinic_id = app_clinic())
$$;
GRANT EXECUTE ON FUNCTION follow_up_audit(text, int), follow_up_loop(), audit_event_rows(text) TO reprosense_app;

-- The three SECURITY DEFINER helpers above read consents, audit_log and care_gaps as the table owner and rely on the
-- owner bypassing RLS. A superuser (local Postgres) always does; a managed database owner such as Supabase's
-- "postgres" does not when RLS is FORCED, which made clinician_can_see() recurse through the consents policy
-- ("stack depth limit exceeded"), chained a clinician's audit entry onto GENESIS, and showed the admin zero gaps.
-- So these three keep RLS ENABLED but not forced: every API request still runs as reprosense_app and is filtered by
-- the policies; only owner connections (migrations, seed, these helpers) bypass. tests/test_rls.py covers both.
ALTER TABLE consents NO FORCE ROW LEVEL SECURITY;
ALTER TABLE care_gaps NO FORCE ROW LEVEL SECURITY;
ALTER TABLE audit_log NO FORCE ROW LEVEL SECURITY;
