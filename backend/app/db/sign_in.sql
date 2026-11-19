-- Her own sign-in (build week K5): passkeys first, a 6-digit email code as backup. Staff and DoH sign-in (plan section
-- 5): sessions, the revoked-token list, the DoH authenticator, setup links and the DoH door's tickets. Applied after
-- schema.sql by the seed, and at every API boot (app/db/seed.py ensure_sign_in_tables), so an older database gains
-- these tables without a reset. Every statement is safe to run again.

-- A passkey is a public key and a counter. Face ID, a fingerprint or a phone PIN never leave her device.
CREATE TABLE IF NOT EXISTS passkeys (
  id serial PRIMARY KEY, profile_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  credential_id text NOT NULL UNIQUE,         -- base64url, as the browser reports it
  public_key bytea NOT NULL,                  -- COSE public key
  sign_count bigint NOT NULL DEFAULT 0, transports text[] NOT NULL DEFAULT '{}', label text,
  created_at timestamptz NOT NULL DEFAULT now(), last_used_at timestamptz
);

-- The address itself is never stored: only a keyed hash (HMAC-SHA256, app/security/crypto.py) to find her record.
CREATE TABLE IF NOT EXISTS sign_in_emails (
  profile_id text PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  email_hash text NOT NULL UNIQUE, created_at timestamptz NOT NULL DEFAULT now()
);

-- Passkey challenges live on the server, expire after 5 minutes and are consumed on first use. Each door has its own
-- purpose (her sign-in, the staff door, the DoH door, the step-up check before an export), so an answer to one cannot
-- be used at another.
CREATE TABLE IF NOT EXISTS auth_challenges (
  challenge text PRIMARY KEY,
  purpose text NOT NULL CHECK (purpose IN ('register', 'login', 'staff_login', 'doh_login', 'step_up')),
  profile_id text REFERENCES profiles(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL, used_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);

-- 6-digit codes: only a keyed hash of the code, a 10-minute expiry and 5 tries.
CREATE TABLE IF NOT EXISTS email_codes (
  id serial PRIMARY KEY, email_hash text NOT NULL, purpose text NOT NULL CHECK (purpose IN ('sign_in', 'link')),
  profile_id text REFERENCES profiles(id) ON DELETE CASCADE, code_hash text NOT NULL,
  attempts int NOT NULL DEFAULT 0, expires_at timestamptz NOT NULL, used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS email_codes_lookup ON email_codes (email_hash, created_at);

-- A database made before staff sign-in gains the new purposes (changed once; later boots skip it).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'auth_challenges'::regclass AND contype = 'c'
                 AND pg_get_constraintdef(oid) LIKE '%step_up%') THEN
    ALTER TABLE auth_challenges DROP CONSTRAINT IF EXISTS auth_challenges_purpose_check;
    ALTER TABLE auth_challenges ADD CONSTRAINT auth_challenges_purpose_check
      CHECK (purpose IN ('register', 'login', 'staff_login', 'doh_login', 'step_up'));
  END IF;
END $$;

-- ---------- Staff and DoH sign-in (build week, the team's plan section 5) ----------
-- Every session, of every role, has a row: its token id (jti), how it started, when it was last used, and its last
-- step-up check. Staff and DoH sessions end after 30 idle minutes and 8 hours at most; hers keep 12 hours
-- (app/security/auth.py). No link to profiles, so a demo reset keeps it and never signs a judge out.
CREATE TABLE IF NOT EXISTS auth_sessions (
  id bigserial PRIMARY KEY, jti text NOT NULL UNIQUE, profile_id text NOT NULL, role text NOT NULL,
  clinic_id text NOT NULL DEFAULT '', how text NOT NULL, device text,
  created_at timestamptz NOT NULL, last_seen_at timestamptz NOT NULL, expires_at timestamptz NOT NULL,
  step_up_at timestamptz
);

-- Signed-out tokens by jti, kept until they would have expired anyway: a copied cookie stops working at once. Kept
-- across a demo reset too, so a reset never brings a signed-out token back.
CREATE TABLE IF NOT EXISTS revoked_tokens (
  jti text PRIMARY KEY, profile_id text NOT NULL, reason text NOT NULL,
  revoked_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL
);
-- Indexes made once: CREATE INDEX IF NOT EXISTS would take a share lock on these tables for the whole demo reset,
-- holding up every sign-in and every staff request until the reset commits.
DO $$ BEGIN
  IF to_regclass('auth_sessions_profile') IS NULL THEN
    CREATE INDEX auth_sessions_profile ON auth_sessions (profile_id, expires_at);
  END IF;
  IF to_regclass('auth_sessions_expiry') IS NULL THEN
    CREATE INDEX auth_sessions_expiry ON auth_sessions (expires_at);
  END IF;
  IF to_regclass('revoked_tokens_expiry') IS NULL THEN
    CREATE INDEX revoked_tokens_expiry ON revoked_tokens (expires_at);
  END IF;
END $$;

-- The DoH admin's authenticator app (TOTP, RFC 6238): the shared secret, encrypted with NOTES_KEY (AES-GCM), and the
-- last 30-second step used, so each code works once.
CREATE TABLE IF NOT EXISTS staff_totp (
  profile_id text PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE, secret_enc bytea NOT NULL,
  last_step bigint NOT NULL DEFAULT 0, confirmed_at timestamptz NOT NULL
);

-- A DoH admin's single-use setup link, made only by the operator's CLI (app/security/create_doh_admin.py), never over
-- HTTP: 24 hours, only the token's sha256 is stored, and 5 wrong codes end it. It holds the passkey added and the new
-- authenticator secret (encrypted) until the first code proves the app was set up.
CREATE TABLE IF NOT EXISTS staff_setup_links (
  id serial PRIMARY KEY, profile_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE, created_by text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL, used_at timestamptz, passkey_id int, secret_enc bytea, attempts int NOT NULL DEFAULT 0
);

-- Between the DoH door's two steps: the passkey was checked and the code is still to come. 5 minutes, 5 tries, once.
CREATE TABLE IF NOT EXISTS mfa_tickets (
  ticket_hash text PRIMARY KEY, profile_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL, used_at timestamptz, attempts int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON passkeys, sign_in_emails, auth_challenges, email_codes, auth_sessions,
  revoked_tokens, staff_totp, staff_setup_links, mfa_tickets TO reprosense_app;
GRANT USAGE, SELECT ON SEQUENCE passkeys_id_seq, email_codes_id_seq, auth_sessions_id_seq, staff_setup_links_id_seq
  TO reprosense_app;

-- Row-level security: the API reads these as the system actor before anyone is signed in; she sees only her own
-- passkeys and email link, and a staff member only her own passkeys. Staff never see how she signs in.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['passkeys', 'sign_in_emails', 'auth_challenges', 'email_codes'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = t AND policyname = 'sys_all') THEN
      EXECUTE format($p$CREATE POLICY sys_all ON %I USING (app_role() = 'system') WITH CHECK (app_role() = 'system')$p$, t);
    END IF;
  END LOOP;
  FOREACH t IN ARRAY ARRAY['passkeys', 'sign_in_emails'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = t AND policyname = 'patient_own') THEN
      EXECUTE format($p$CREATE POLICY patient_own ON %I USING (app_role() = 'patient' AND profile_id = app_user())
                       WITH CHECK (app_role() = 'patient' AND profile_id = app_user())$p$, t);
    END IF;
  END LOOP;
END $$;

-- The staff tables: the system actor only (sessions, the revoked list, secrets, setup links and tickets are never read
-- as a person). RLS is switched on once, so a later boot or a demo reset takes no lock on the session tables.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['auth_sessions', 'revoked_tokens', 'staff_totp', 'staff_setup_links', 'mfa_tickets'] LOOP
    IF NOT (SELECT relrowsecurity AND relforcerowsecurity FROM pg_class WHERE oid = t::regclass) THEN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = t AND policyname = 'sys_all') THEN
      EXECUTE format($p$CREATE POLICY sys_all ON %I USING (app_role() = 'system') WITH CHECK (app_role() = 'system')$p$, t);
    END IF;
  END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'passkeys' AND policyname = 'staff_own') THEN
    CREATE POLICY staff_own ON passkeys
      USING (app_role() IN ('clinician', 'clinic_admin', 'admin') AND profile_id = app_user())
      WITH CHECK (app_role() IN ('clinician', 'clinic_admin', 'admin') AND profile_id = app_user());
  END IF;
END $$;
