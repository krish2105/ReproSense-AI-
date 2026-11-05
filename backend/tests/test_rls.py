"""Row-level security is enforced by Postgres itself, not just by API code."""

import psycopg
import pytest

from app.config import get_settings
from app.db import Actor, session

CLIN = Actor("clinician", "clin-01", "clinic_corniche")


def count(actor, sql, args=()):
    with session(actor) as cur:
        cur.execute(sql, args)
        return cur.fetchone()["n"]


def test_clinician_cannot_read_non_consented_patient():
    assert count(CLIN, "SELECT count(*) n FROM daily_logs WHERE profile_id='amina'") == 0
    assert count(CLIN, "SELECT count(*) n FROM daily_logs WHERE profile_id='noura'") > 0


def test_clinician_of_another_clinic_sees_nothing():
    other = Actor("clinician", "clin-x", "clinic_alain")
    assert count(other, "SELECT count(*) n FROM daily_logs") == 0
    assert count(other, "SELECT count(*) n FROM profiles WHERE role='patient'") == 0


def test_patient_sees_only_herself():
    me = Actor("patient", "noura")
    assert count(me, "SELECT count(*) n FROM daily_logs WHERE profile_id <> 'noura'") == 0
    assert count(me, "SELECT count(*) n FROM profiles") == 1


def test_patient_cannot_write_into_another_record():
    with pytest.raises(psycopg.errors.InsufficientPrivilege):
        with session(Actor("patient", "noura")) as cur:
            cur.execute("INSERT INTO daily_logs (id, profile_id, date) VALUES ('x-1','sara','2026-11-22')")


def test_admin_has_no_row_access_to_health_data():
    admin = Actor("admin", "admin-01")
    assert count(admin, "SELECT count(*) n FROM daily_logs") == 0
    assert count(admin, "SELECT count(*) n FROM lab_results") == 0
    assert count(admin, "SELECT count(*) n FROM cohort_members") == 1200


def test_no_identity_no_data():
    anon = Actor("", "")
    assert count(anon, "SELECT count(*) n FROM daily_logs") == 0
    assert count(anon, "SELECT count(*) n FROM profiles") == 0


def test_audit_log_is_append_only():
    with pytest.raises(psycopg.errors.InsufficientPrivilege):
        with session(Actor("patient", "noura")) as cur:
            cur.execute("UPDATE audit_log SET action='x'")


def test_database_refuses_non_synthetic_people():
    with pytest.raises(psycopg.errors.CheckViolation):
        with psycopg.connect(get_settings().database_url) as conn:
            conn.execute("INSERT INTO profiles (id, alias, role, is_synthetic) VALUES ('real-1','x','patient',false)")


def test_schema_works_under_a_non_superuser_owner():
    """Supabase's database owner is not a superuser. Build the schema and seed as such an owner, then check the three
    SECURITY DEFINER helpers and the first-boot seed, which only a superuser owner exercised before (docs/16)."""
    from psycopg import conninfo, sql

    from app.db import reset_pool
    from app.db.seed import seed_if_empty

    base = get_settings().database_url
    admin = conninfo.make_conninfo(base, dbname="postgres")
    owner_db = "reprosense_nonsuper_test"
    with psycopg.connect(admin, autocommit=True) as conn:
        conn.execute(sql.SQL("DROP DATABASE IF EXISTS {}").format(sql.Identifier(owner_db)))
        if not conn.execute("SELECT 1 FROM pg_roles WHERE rolname = 'rs_owner_test'").fetchone():
            conn.execute("CREATE ROLE rs_owner_test LOGIN PASSWORD 'rs_owner_test' CREATEROLE NOSUPERUSER NOBYPASSRLS")
        conn.execute(sql.SQL("CREATE DATABASE {} OWNER rs_owner_test").format(sql.Identifier(owner_db)))
        # On a fresh managed project the owner creates reprosense_app itself and so administers it. Roles are shared
        # across this test cluster, so give the test owner the same standing on the existing role.
        if conn.execute("SELECT 1 FROM pg_roles WHERE rolname = 'reprosense_app'").fetchone():
            conn.execute("GRANT reprosense_app TO rs_owner_test WITH ADMIN OPTION")
    with psycopg.connect(conninfo.make_conninfo(base, dbname=owner_db), autocommit=True) as conn:
        conn.execute("CREATE EXTENSION IF NOT EXISTS vector")  # Supabase: enabled from the dashboard
    url = conninfo.make_conninfo(base, dbname=owner_db, user="rs_owner_test", password="rs_owner_test")
    try:
        first = seed_if_empty(url)
        assert first and first["personas"] == 8
        assert seed_if_empty(url) is None  # a restart never reseeds
        with session(Actor("clinician", "clin-01", "clinic_corniche")) as cur:  # no recursion through consents
            cur.execute("SELECT count(*) AS n FROM profiles WHERE role = 'patient'")
            assert cur.fetchone()["n"] > 0
            cur.execute("SELECT audit_last_hash() AS h")
            assert cur.fetchone()["h"]
        with session(Actor("admin", "admin-01", "clinic_corniche")) as cur:
            cur.execute("SELECT sum(n) AS n FROM care_gap_counts()")
            assert cur.fetchone()["n"] > 0
    finally:
        reset_pool(base)
        with psycopg.connect(admin, autocommit=True) as conn:
            conn.execute(sql.SQL("DROP DATABASE IF EXISTS {} WITH (FORCE)").format(sql.Identifier(owner_db)))
            conn.execute("DROP ROLE IF EXISTS rs_owner_test")
