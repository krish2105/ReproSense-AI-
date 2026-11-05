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
