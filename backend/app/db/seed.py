"""Create the schema and load the synthetic demo data (data/synthetic/output). Run: uv run python -m app.db.seed

Everything loaded here is fictional and marked is_synthetic. Clinic names are invented (no real facility names)."""

from __future__ import annotations

import csv
import json
import time
from datetime import date
from pathlib import Path

import psycopg

from app.config import DATA_DIR, get_settings
from app.db import SYSTEM, session
from app.security.crypto import encrypt

CLINICS = [
    ("clinic_corniche", "Seaside Women's Clinic (fictional)", "Abu Dhabi City"),
    ("clinic_north", "North Island Women's Clinic (fictional)", "Abu Dhabi City"),
    ("clinic_alain", "Garden City Women's Clinic, Al Ain (fictional)", "Al Ain"),
    ("clinic_dhafra", "Western Region Women's Clinic (fictional)", "Al Dhafra"),
]
DEMO_CLINIC = "clinic_corniche"
STAFF = [
    ("clin-01", "Dr. Example (fictional)", "clinician", DEMO_CLINIC),
    ("admin-01", "Clinic network admin (fictional)", "admin", DEMO_CLINIC),
    # K4: one admin per clinic. The demo opens the first; the second shows that a clinic sees only itself.
    ("cadmin-01", "Clinic admin, Seaside Women's Clinic (fictional)", "clinic_admin", DEMO_CLINIC),
    ("cadmin-02", "Clinic admin, North Island Women's Clinic (fictional)", "clinic_admin", "clinic_north"),
]
NEWEST_TABLES = ("clinic_invites", "bp_readings")  # seed_if_empty: a database without these predates the code
NOT_SHARING = {"amina"}  # shows the consent gate: Amina has not shared with a clinic


def age_range(age: int) -> str:
    lo = (age // 5) * 5
    return f"{lo}-{lo + 4}"


ADDONS = ("sign_in.sql", "family.sql")  # tables added after the first hosted seed; every statement is idempotent


def schema_sql() -> str:
    """The whole schema: the health record, then the tables added in build week (sign_in.sql, family.sql)."""
    here = Path(__file__).parent
    return "\n".join([(here / "schema.sql").read_text(), *((here / f).read_text() for f in ADDONS)])


def ensure_addon_tables(url: str | None = None) -> None:
    """At boot: a database seeded before K5 or Y4 gains their tables without a demo reset. Safe to run again."""
    with psycopg.connect(url or get_settings().database_url, autocommit=True) as conn:
        if conn.execute("SELECT to_regclass('public.profiles') IS NOT NULL").fetchone()[0]:
            for f in ADDONS:
                conn.execute((Path(__file__).parent / f).read_text())


ensure_sign_in_tables = ensure_addon_tables  # the K5 name, kept for callers and tests


def apply_schema(url: str | None = None) -> None:
    sql = schema_sql()
    with psycopg.connect(url or get_settings().database_url, autocommit=True) as conn:
        conn.execute(sql)


def _num(v):
    return v if isinstance(v, (int, float)) and not isinstance(v, bool) else None


def load_personas(cur) -> list[str]:
    ids = []
    for f in sorted((DATA_DIR / "personas").glob("*.json")):
        d = json.loads(f.read_text())
        p = d["profile"]
        assert p.get("is_synthetic") is True, f"refusing non-synthetic record {f}"
        ids.append(p["id"])
        cur.execute(
            "INSERT INTO profiles (id, alias, role, language, age, age_range, region, menarche_age, life_stage, pregnant,"
            " pregnancy_weeks, breastfeeding, on_hormonal_contraception, trying_to_conceive, ttc_months, story, clinic_id,"
            " is_synthetic) VALUES (%s,%s,'patient',%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,true)",
            (
                p["id"],
                p["alias"],
                p["language"],
                p["age"],
                age_range(p["age"]),
                p["region"],
                p["menarche_age"],
                p["life_stage"],
                p["pregnant"],
                p.get("pregnancy_weeks", 0),
                p["breastfeeding"],
                p["on_hormonal_contraception"],
                p["trying_to_conceive"],
                p.get("ttc_months", 0),
                p["story"],
                DEMO_CLINIC,
            ),
        )
        for purpose in ("assistant", "care_share"):
            granted = not (purpose == "care_share" and p["id"] in NOT_SHARING)
            cur.execute(
                "INSERT INTO consents (profile_id, purpose, clinic_id, granted, granted_at) VALUES (%s,%s,%s,%s,%s)",
                (p["id"], purpose, DEMO_CLINIC if purpose == "care_share" else None, granted, "2026-09-01"),
            )
        for c in d["cycles"]:
            cur.execute(
                "INSERT INTO cycles (profile_id, start_date, bleed_days, length_days) VALUES (%s,%s,%s,%s)",
                (p["id"], c["start"], c["bleed_days"], c["length_days"]),
            )
        for lg in d["daily_logs"]:
            cur.execute(
                "INSERT INTO daily_logs (id, profile_id, date, flow, pain, pain_sites, symptoms, impact, sleep_h, pbac,"
                " pbac_items, note_enc) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
                (
                    lg["id"],
                    p["id"],
                    lg["date"],
                    lg["flow"],
                    lg["pain"],
                    lg.get("pain_sites", []),
                    lg["symptoms"],
                    lg["impact"],
                    lg.get("sleep_h"),
                    lg.get("pbac", 0),
                    json.dumps(lg.get("pbac_items")) if lg.get("pbac_items") else None,
                    encrypt(lg.get("note")),
                ),
            )
        for e in d["events"]:
            cur.execute(
                "INSERT INTO events (id, profile_id, type, date, details) VALUES (%s,%s,%s,%s,%s)",
                (e["id"], p["id"], e["type"], e["date"], json.dumps(e.get("details", {}))),
            )
        for bp in d.get("bp_readings", []):
            cur.execute(
                "INSERT INTO bp_readings (id, profile_id, date, time, systolic, diastolic, source)"
                " VALUES (%s,%s,%s,%s,%s,%s,'seed')",
                (bp["id"], p["id"], bp["date"], bp.get("time"), bp["systolic"], bp["diastolic"]),
            )
        for lab in d["labs"]:
            cur.execute(
                "INSERT INTO lab_results (profile_id, code, test, value, value_num, unit, ref_low, ref_high, flag, date)"
                " VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
                (
                    p["id"],
                    lab["code"],
                    lab["test"],
                    str(lab["value"]),
                    _num(lab["value"]),
                    lab["unit"],
                    lab["ref_low"],
                    lab["ref_high"],
                    lab["flag"],
                    lab["date"],
                ),
            )
    return ids


def load_cohort(cur) -> int:
    n = 0
    with (DATA_DIR / "cohort.csv").open() as fh:
        for r in csv.DictReader(fh):
            if r["is_synthetic"] != "True" or int(r["age"]) < 18:
                continue
            band = "18-19" if r["age_band"] == "15-19" else r["age_band"]  # every cohort member is 18+ (QUESTIONS #19)

            def b(k: str, row=r) -> bool:
                return row[k] == "True"

            cur.execute(
                "INSERT INTO cohort_members VALUES (%s,true,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
                (
                    r["patient_id"],
                    int(r["age"]),
                    band,
                    r["region"],
                    r["clinic_id"],
                    r["nationality_group"],
                    b("obs_irregular_cycles"),
                    b("obs_irregular_plus_androgen"),
                    b("obs_severe_cyclical_pain"),
                    b("obs_heavy_periods"),
                    b("recent_delivery"),
                    b("gdm_history"),
                    b("trying_to_conceive"),
                    b("obs_ttc_fertility_assessment"),
                    b("postpartum_glucose_test_done"),
                    b("consented_care_share"),
                    b("report_shared"),
                    r["care_gap_type"] or None,
                    r["care_gap_status"] or None,
                    int(r["days_overdue"] or 0),
                ),
            )
            n += 1
    return n


# A request that writes the audit log takes the chain's advisory lock and then table locks; the reset holds table locks
# and may then need that lock, so Postgres can cancel the reset with a deadlock (CI e2e, 19 Nov). The reset is one
# transaction, so it rolls back cleanly and is tried again.
RESET_ATTEMPTS = 3
RETRY_PAUSE_S = 0.3


def _load_demo(sql: str, with_kb: bool) -> tuple[list[str], int]:
    """Schema, data and the assistant's index in one transaction; returns the persona ids and the cohort size."""
    from app.db import pool
    from app.rag.ingest import ingest

    with pool().connection() as conn, conn.transaction(), conn.cursor() as cur:
        cur.execute(sql)
        cur.execute("SET LOCAL ROLE reprosense_app")
        cur.execute(
            "SELECT set_config('app.role', %s, true), set_config('app.user_id', %s, true),"
            " set_config('app.clinic_id', %s, true)",
            (SYSTEM.role, SYSTEM.user_id, SYSTEM.clinic_id),
        )
        for c in CLINICS:
            cur.execute("INSERT INTO clinics (id, name, region) VALUES (%s,%s,%s)", c)
        for sid, alias, role, clinic in STAFF:
            cur.execute(
                "INSERT INTO profiles (id, alias, role, clinic_id) VALUES (%s,%s,%s,%s)", (sid, alias, role, clinic)
            )
        ids = load_personas(cur)
        n = load_cohort(cur)
        if with_kb:
            ingest(cur)
    return ids, n


def seed(url: str | None = None, with_kb: bool = True) -> dict:
    if url:
        from app.db import reset_pool

        reset_pool(url)
    # One transaction for the schema, the data and the assistant's index (step 4e, 7 Nov): a request during a reset
    # waits on the locks, then sees the full demo, never 0 people or an empty index. The cards are written after the
    # commit, because building them reads the index through other connections, which would wait on these locks.
    sql = schema_sql()
    for attempt in range(1, RESET_ATTEMPTS + 1):
        try:
            ids, n = _load_demo(sql, with_kb)
            break
        except psycopg.errors.DeadlockDetected:
            if attempt == RESET_ATTEMPTS:
                raise
            time.sleep(RETRY_PAUSE_S * attempt)
    from app.agents.pipeline import refresh_all
    from app.rag.retrieve import clear_cache

    clear_cache()  # requests that ran during the reset may have cached rows of the old index
    refresh_all(ids)
    return {"personas": len(ids), "cohort": n, "ref_date": str(get_settings().demo_ref_date or date.today())}


def seed_if_empty(url: str | None = None) -> dict | None:
    """First boot on a fresh hosted database (Render free tier has no shell): seed only when the schema is missing
    or holds no personas, so a restart never wipes a demo in progress. Returns what seed() loaded, or None."""
    with psycopg.connect(url or get_settings().database_url, autocommit=True) as conn:
        exists = conn.execute("SELECT to_regclass('public.profiles') IS NOT NULL").fetchone()[0]
        # A table added since this database was seeded (bp_readings, build week K6): the old schema would fail every
        # read of her record, so the demo is seeded again with the current schema.
        current = all(
            conn.execute("SELECT to_regclass(%s) IS NOT NULL", (f"public.{t}",)).fetchone()[0] for t in NEWEST_TABLES
        )
    people = 0
    if exists and not current:
        return seed(url)
    if exists:
        # Count through the app's system session: profiles has FORCED RLS, so a non-superuser owner sees no rows.
        if url:
            from app.db import reset_pool

            reset_pool(url)
        with session(SYSTEM) as cur:
            cur.execute("SELECT count(*) AS n FROM profiles WHERE role = 'patient'")
            people = cur.fetchone()["n"]
    return None if people else seed(url)


if __name__ == "__main__":
    print(seed())
