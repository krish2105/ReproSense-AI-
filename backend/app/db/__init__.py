"""Database access. Every query runs inside `session(...)`, which drops to the RLS-restricted role and sets
the request's identity, so Postgres row-level security (not just API code) decides what each person can see."""

from __future__ import annotations

from collections.abc import Iterator
from contextlib import contextmanager
from dataclasses import dataclass

from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

from app.config import get_settings

_pool: ConnectionPool | None = None


def pool() -> ConnectionPool:
    global _pool
    if _pool is None:
        s = get_settings()
        _pool = ConnectionPool(
            s.database_url,
            min_size=s.db_pool_min,
            max_size=s.db_pool_max,
            timeout=s.db_pool_timeout_s,
            kwargs={"row_factory": dict_row},
            check=ConnectionPool.check_connection,  # a connection the database dropped is replaced, not handed out
            open=True,
        )
    return _pool


def reset_pool(url: str | None = None) -> None:
    global _pool
    if _pool is not None:
        _pool.close()
    _pool = None
    if url:
        get_settings().database_url = url


@dataclass(frozen=True)
class Actor:
    role: str  # patient | clinician | admin (network) | clinic_admin (one clinic) | system
    user_id: str = ""
    clinic_id: str = ""


SYSTEM = Actor("system", "system")


@contextmanager
def session(actor: Actor) -> Iterator:
    """A transaction as `actor`. RLS policies read app.role / app.user_id / app.clinic_id.

    Never open a session while holding another one, and never run the insights pipeline (`pipeline.run`) inside a
    session: retrieval takes its own connection, so N concurrent requests holding one connection each and waiting for a
    second exhausted the pool and all timed out together (tests/test_pool_and_pdf.py runs the app on a 1-connection
    pool to catch this)."""
    with pool().connection() as conn:
        with conn.transaction():
            with conn.cursor() as cur:
                cur.execute("SET LOCAL ROLE reprosense_app")
                cur.execute(
                    "SELECT set_config('app.role', %s, true), set_config('app.user_id', %s, true),"
                    " set_config('app.clinic_id', %s, true)",
                    (actor.role, actor.user_id, actor.clinic_id),
                )
                yield cur
