-- Family support links (build week Y4, Year of the Family 2026). Applied after schema.sql by the seed, and at every API
-- boot (app/db/seed.py ensure_addon_tables), so a database seeded before Y4 gains the table without a reset. Every
-- statement is safe to run again.
--
-- She shares a read-only view with her husband, her mother or someone else she trusts: her upcoming care steps and
-- "how you can help" tips, and health details only if she ticks them. Only a SHA-256 of the link's token is stored;
-- the link expires and she can revoke it at any time. Every view is written to her audit log.
CREATE TABLE IF NOT EXISTS family_links (
  id serial PRIMARY KEY,
  profile_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  relation text NOT NULL CHECK (relation IN ('husband', 'mother', 'sister', 'friend', 'other')),
  include_details boolean NOT NULL DEFAULT false,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  last_viewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS family_links_profile ON family_links (profile_id, id DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON family_links TO reprosense_app;
GRANT USAGE, SELECT ON SEQUENCE family_links_id_seq TO reprosense_app;

-- Row-level security: she manages her own links; the public view resolves a token as the system actor. No clinician or
-- admin policy: staff never see who she shares with.
DO $$
BEGIN
  ALTER TABLE family_links ENABLE ROW LEVEL SECURITY;
  ALTER TABLE family_links FORCE ROW LEVEL SECURITY;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'family_links' AND policyname = 'sys_all') THEN
    CREATE POLICY sys_all ON family_links USING (app_role() = 'system') WITH CHECK (app_role() = 'system');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'family_links' AND policyname = 'patient_own') THEN
    CREATE POLICY patient_own ON family_links USING (app_role() = 'patient' AND profile_id = app_user())
      WITH CHECK (app_role() = 'patient' AND profile_id = app_user());
  END IF;
END $$;
