-- ReproSense schema (PostgreSQL 15+, pgvector). Synthetic data only: every profile row must be is_synthetic.
-- Row-level security is FORCED on every table that holds health data. The API never queries as the table owner:
-- each request runs `SET LOCAL ROLE reprosense_app` and sets app.role / app.user_id / app.clinic_id (see app/db/__init__.py).

CREATE EXTENSION IF NOT EXISTS vector;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'reprosense_app') THEN
    CREATE ROLE reprosense_app NOLOGIN;
  END IF;
END $$;

DROP TABLE IF EXISTS audit_log, kb_chunks, cohort_members, navigator_drafts, clinic_reviews, care_gaps, shares, reports,
  observations, documents, lab_results, events, daily_logs, cycles, consents, profiles, clinics CASCADE;

CREATE OR REPLACE FUNCTION app_role() RETURNS text LANGUAGE sql STABLE AS $$ SELECT coalesce(current_setting('app.role', true), '') $$;
CREATE OR REPLACE FUNCTION app_user() RETURNS text LANGUAGE sql STABLE AS $$ SELECT coalesce(current_setting('app.user_id', true), '') $$;
CREATE OR REPLACE FUNCTION app_clinic() RETURNS text LANGUAGE sql STABLE AS $$ SELECT coalesce(current_setting('app.clinic_id', true), '') $$;

CREATE TABLE clinics (
  id text PRIMARY KEY, name text NOT NULL, region text NOT NULL, is_synthetic boolean NOT NULL DEFAULT true CHECK (is_synthetic)
);

CREATE TABLE profiles (
  id text PRIMARY KEY,
  alias text NOT NULL,                      -- fictional alias, never a real name
  role text NOT NULL CHECK (role IN ('patient', 'clinician', 'admin')),
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

CREATE TABLE care_gaps (
  id serial PRIMARY KEY, profile_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  clinic_id text REFERENCES clinics(id), type text NOT NULL, rule_id text NOT NULL, due_date date,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed')),
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by text, UNIQUE (profile_id, type)
);

CREATE TABLE clinic_reviews (
  profile_id text PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  clinician_id text NOT NULL, reviewed_at timestamptz, visit_note text, updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE navigator_drafts (
  id serial PRIMARY KEY, profile_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rule_id text NOT NULL, draft jsonb NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'discarded')),  -- no 'sent': the app never sends
  created_at timestamptz NOT NULL DEFAULT now(), approved_at timestamptz
);

CREATE TABLE cohort_members (
  patient_id text PRIMARY KEY, is_synthetic boolean NOT NULL CHECK (is_synthetic), age int NOT NULL CHECK (age >= 18),
  age_band text NOT NULL, region text NOT NULL, clinic_id text NOT NULL, nationality_group text NOT NULL,
  obs_irregular_cycles boolean, obs_irregular_plus_androgen boolean, obs_severe_cyclical_pain boolean, obs_heavy_periods boolean,
  recent_delivery boolean, gdm_history boolean, trying_to_conceive boolean, obs_ttc_fertility_assessment boolean,
  postpartum_glucose_test_done boolean, consented_care_share boolean, report_shared boolean,
  care_gap_type text, care_gap_status text, days_overdue int
);

CREATE TABLE kb_chunks (
  id serial PRIMARY KEY, source_id text NOT NULL, title text NOT NULL, url text NOT NULL, section text,
  lang text NOT NULL, text text NOT NULL, embedding vector(256) NOT NULL,
  tsv tsvector GENERATED ALWAYS AS (to_tsvector('simple', text)) STORED
);
CREATE INDEX ON kb_chunks USING gin (tsv);

CREATE TABLE audit_log (
  id bigserial PRIMARY KEY, actor_id text NOT NULL, actor_role text NOT NULL, action text NOT NULL,
  subject_id text, target text, detail jsonb, at timestamptz NOT NULL DEFAULT now(),
  prev_hash text NOT NULL, hash text NOT NULL
);

-- clinician visibility: an active care_share consent to the clinician's clinic. SECURITY DEFINER avoids RLS recursion.
CREATE OR REPLACE FUNCTION clinician_can_see(pid text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT app_role() = 'clinician' AND EXISTS (
    SELECT 1 FROM consents c WHERE c.profile_id = pid AND c.purpose = 'care_share' AND c.granted
      AND c.revoked_at IS NULL AND c.clinic_id = app_clinic())
$$;

-- ---------- grants ----------
GRANT USAGE ON SCHEMA public TO reprosense_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO reprosense_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO reprosense_app;
REVOKE UPDATE, DELETE ON audit_log FROM reprosense_app;      -- append-only

-- ---------- row-level security ----------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['consents','cycles','daily_logs','events','documents','lab_results','observations','reports',
                           'shares','care_gaps','clinic_reviews','navigator_drafts'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format($p$CREATE POLICY sys_all ON %I USING (app_role() = 'system') WITH CHECK (app_role() = 'system')$p$, t);
    EXECUTE format($p$CREATE POLICY patient_own ON %I USING (app_role() = 'patient' AND profile_id = app_user())
                     WITH CHECK (app_role() = 'patient' AND profile_id = app_user())$p$, t);
  END LOOP;
  -- clinicians read only consented patients
  FOREACH t IN ARRAY ARRAY['cycles','daily_logs','events','lab_results','observations','reports','care_gaps','clinic_reviews',
                           'consents','navigator_drafts'] LOOP
    EXECUTE format($p$CREATE POLICY clinician_read ON %I FOR SELECT USING (clinician_can_see(profile_id))$p$, t);
  END LOOP;
  -- clinicians may update care gaps / observations status and write reviews for consented patients
  EXECUTE $p$CREATE POLICY clinician_update ON care_gaps FOR UPDATE USING (clinician_can_see(profile_id)) WITH CHECK (clinician_can_see(profile_id))$p$;
  EXECUTE $p$CREATE POLICY clinician_update ON observations FOR UPDATE USING (clinician_can_see(profile_id)) WITH CHECK (clinician_can_see(profile_id))$p$;
  EXECUTE $p$CREATE POLICY clinician_write ON clinic_reviews FOR INSERT WITH CHECK (clinician_can_see(profile_id))$p$;
  EXECUTE $p$CREATE POLICY clinician_rewrite ON clinic_reviews FOR UPDATE USING (clinician_can_see(profile_id)) WITH CHECK (clinician_can_see(profile_id))$p$;
END $$;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;
CREATE POLICY sys_all ON profiles USING (app_role() = 'system') WITH CHECK (app_role() = 'system');
CREATE POLICY self_read ON profiles FOR SELECT USING (id = app_user());
CREATE POLICY patient_update ON profiles FOR UPDATE USING (app_role() = 'patient' AND id = app_user())
  WITH CHECK (app_role() = 'patient' AND id = app_user());
CREATE POLICY clinician_read ON profiles FOR SELECT USING (clinician_can_see(id));

ALTER TABLE cohort_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_members FORCE ROW LEVEL SECURITY;
CREATE POLICY sys_all ON cohort_members USING (app_role() = 'system') WITH CHECK (app_role() = 'system');
CREATE POLICY staff_read ON cohort_members FOR SELECT USING (app_role() IN ('admin', 'clinician'));

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log FORCE ROW LEVEL SECURITY;
CREATE POLICY sys_all ON audit_log USING (app_role() = 'system') WITH CHECK (app_role() = 'system');
CREATE POLICY anyone_append ON audit_log FOR INSERT WITH CHECK (app_role() IN ('patient', 'clinician', 'admin'));
CREATE POLICY subject_read ON audit_log FOR SELECT USING (app_role() = 'patient' AND subject_id = app_user());
CREATE POLICY admin_read ON audit_log FOR SELECT USING (app_role() = 'admin');
-- the hash chain needs the latest hash; a SECURITY DEFINER helper exposes only that value
CREATE OR REPLACE FUNCTION audit_last_hash() RETURNS text LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT coalesce((SELECT hash FROM audit_log ORDER BY id DESC LIMIT 1), 'GENESIS')
$$;
GRANT EXECUTE ON FUNCTION audit_last_hash(), clinician_can_see(text), app_role(), app_user(), app_clinic() TO reprosense_app;

-- admin dashboard: live care-gap counts as aggregates only (no row access to patient tables)
CREATE OR REPLACE FUNCTION care_gap_counts() RETURNS TABLE(status text, n bigint) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT status, count(*) FROM care_gaps WHERE app_role() IN ('admin', 'system') GROUP BY status
$$;
GRANT EXECUTE ON FUNCTION care_gap_counts() TO reprosense_app;
