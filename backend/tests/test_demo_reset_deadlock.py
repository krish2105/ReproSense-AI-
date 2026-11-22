"""A demo reset survives a deadlock with a request that arrives mid-reset (19 Nov, CI e2e run 44401661447).

The reset rebuilds the schema and the data in one transaction (test_demo_reset_atomic.py). A request that writes the
audit log takes the chain's advisory lock and then a table lock; the reset holds table locks and then needs the same
lock, so Postgres can detect a deadlock and cancel the reset. The reset now rolls back and tries again, so the demo is
always reset (and the e2e test that starts with a reset no longer fails at random)."""

import psycopg
import pytest

import app.db.seed as seed_mod


def test_a_reset_cancelled_by_a_deadlock_is_retried(monkeypatch):
    real = seed_mod._load_demo
    calls = []

    def flaky(sql, with_kb):
        calls.append(1)
        if len(calls) == 1:
            raise psycopg.errors.DeadlockDetected("deadlock detected")
        return real(sql, with_kb)

    monkeypatch.setattr(seed_mod, "_load_demo", flaky)
    monkeypatch.setattr(seed_mod, "RETRY_PAUSE_S", 0)
    out = seed_mod.seed()
    assert len(calls) == 2
    assert out["personas"] == 9


def test_a_reset_gives_up_after_its_last_try(monkeypatch):
    calls = []

    def always(sql, with_kb):
        calls.append(1)
        raise psycopg.errors.DeadlockDetected("deadlock detected")

    monkeypatch.setattr(seed_mod, "_load_demo", always)
    monkeypatch.setattr(seed_mod, "RETRY_PAUSE_S", 0)
    with pytest.raises(psycopg.errors.DeadlockDetected):
        seed_mod.seed()
    assert len(calls) == seed_mod.RESET_ATTEMPTS
