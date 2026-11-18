-- Her own sign-in (build week K5): passkeys first, a 6-digit email code as backup. Applied after schema.sql by the
-- seed, and at every API boot (app/db/seed.py ensure_sign_in_tables), so a database seeded before K5 gains these
-- tables without a reset. Every statement is safe to run again.

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

-- Passkey challenges live on the server, expire after 5 minutes and are consumed on first use.
CREATE TABLE IF NOT EXISTS auth_challenges (
  challenge text PRIMARY KEY, purpose text NOT NULL CHECK (purpose IN ('register', 'login')),
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

GRANT SELECT, INSERT, UPDATE, DELETE ON passkeys, sign_in_emails, auth_challenges, email_codes TO reprosense_app;
GRANT USAGE, SELECT ON SEQUENCE passkeys_id_seq, email_codes_id_seq TO reprosense_app;

-- Row-level security: the API reads these as the system actor before anyone is signed in; she sees only her own
-- passkeys and email link. No clinician or admin policy: staff never see how she signs in.
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
