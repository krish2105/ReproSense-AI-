"""Connection-pool deadlock, retrieval cache, and doctor-PDF worker processes (found in the 18 Nov production audit).

Root cause: the insights pipeline ran inside an open database session, and retrieval took a second connection from the
pool. N concurrent writes holding one connection each and waiting for a second exhausted the pool (max 10) and all
failed together after the pool timeout. A 1-connection pool makes the deadlock deterministic, so these tests pin it.
"""

from __future__ import annotations

import time
from concurrent.futures import Future, ThreadPoolExecutor

import pytest
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

import app.db as dbm
from app.config import get_settings
from tests.conftest import login


def _pool(size: int, timeout: float) -> None:
    dbm.reset_pool()
    dbm._pool = ConnectionPool(
        get_settings().database_url,
        min_size=1,
        max_size=size,
        timeout=timeout,
        kwargs={"row_factory": dict_row},
        open=True,
    )


@pytest.fixture
def tiny_pool():
    _pool(1, 3)
    yield
    dbm.reset_pool()


def test_a_report_needs_only_one_connection_at_a_time(client, tiny_pool):
    r = client.post("/v1/reports", headers=login(client, "noura"))
    assert r.status_code == 200, r.text  # was a PoolTimeout (500) after 3 s: the pipeline ran inside the read session


def test_saving_a_log_needs_only_one_connection_at_a_time(client, tiny_pool, reseed):
    r = client.post("/v1/logs", headers=login(client, "noura"), json={"date": "2026-11-21", "flow": "light"})
    assert r.status_code == 200, r.text


def test_concurrent_writes_do_not_exhaust_a_small_pool(client, reseed):
    """12 report and log requests at once on a 3-connection pool all succeed (load and failure-scenario test)."""
    _pool(3, 15)
    try:
        h = login(client, "sara")

        def hit(i: int) -> int:
            if i % 2:
                return client.post("/v1/reports", headers=h).status_code
            return client.post("/v1/logs", headers=h, json={"date": "2026-11-19", "flow": "medium"}).status_code

        with ThreadPoolExecutor(12) as ex:
            assert list(ex.map(hit, range(12))) == [200] * 12
    finally:
        dbm.reset_pool()


def test_a_full_pool_is_a_503_with_retry_after(client, monkeypatch):
    from psycopg_pool import PoolTimeout

    import app.api.patient as patient_api

    def busy(*_a, **_k):
        raise PoolTimeout("all connections busy")

    monkeypatch.setattr(patient_api, "session", busy)
    r = client.get("/v1/me", headers=login(client, "noura"))
    assert r.status_code == 503 and r.headers.get("retry-after")


def test_retrieval_is_cached_between_page_views(monkeypatch):
    from app.rag import retrieve

    retrieve.clear_cache()
    calls = {"n": 0}
    real = retrieve.session

    def counting(actor):
        calls["n"] += 1
        return real(actor)

    monkeypatch.setattr(retrieve, "session", counting)
    first = retrieve.search("heavy periods and tiredness", k=3, lang="en")
    second = retrieve.search("heavy periods and tiredness", k=3, lang="en")
    assert calls["n"] == 1 and [p.chunk_id for p in first] == [p.chunk_id for p in second]


# ---------- doctor PDFs ----------
def _clear_pdf_cache():
    from app.reports import render_pool

    with render_pool._lock:
        render_pool._cache.clear()


def test_pdfs_render_in_workers_and_are_cached(client, monkeypatch):
    from app.reports import render_pool

    h = login(client, "fatima")
    rep = client.post("/v1/reports", headers=h).json()
    _clear_pdf_cache()
    first = client.get(f"/v1/reports/{rep['id']}.pdf", headers=h)
    assert first.status_code == 200 and first.content.startswith(b"%PDF")
    assert render_pool.cached(rep["payload"]) == first.content

    def no_render(*_a, **_k):
        raise AssertionError("rendered again")

    monkeypatch.setattr(render_pool, "_executor", no_render)
    again = client.get(f"/v1/reports/{rep['id']}.pdf", headers=h)
    assert again.content == first.content  # a saved report never changes: served from the cache


def test_a_slow_pdf_is_a_clear_503_then_cached(client, monkeypatch):
    from app.reports import render_pool

    pending: Future = Future()

    class Pool:
        def submit(self, *_a, **_k):
            return pending

    monkeypatch.setattr(render_pool, "_executor", lambda: Pool())
    monkeypatch.setattr(get_settings(), "pdf_timeout_s", 0.2)
    _clear_pdf_cache()
    h = login(client, "noura")
    rep = client.post("/v1/reports", headers=h).json()
    t0 = time.perf_counter()
    r = client.get(f"/v1/reports/{rep['id']}.pdf", headers=h)
    assert r.status_code == 503 and r.headers["retry-after"] == "5" and time.perf_counter() - t0 < 5
    pending.set_result(b"%PDF-1.7 finished later")  # the render completes after she was told to retry
    assert client.get(f"/v1/reports/{rep['id']}.pdf", headers=h).content == b"%PDF-1.7 finished later"


def test_pdfs_can_render_in_process(client, monkeypatch):
    from app.reports import render_pool

    def no_pool():
        raise AssertionError("no pool expected")

    monkeypatch.setattr(get_settings(), "pdf_workers", 0)
    monkeypatch.setattr(render_pool, "_executor", no_pool)
    _clear_pdf_cache()
    h = login(client, "hessa")
    rep = client.post("/v1/reports", headers=h).json()
    assert client.get(f"/v1/reports/{rep['id']}.pdf", headers=h).content.startswith(b"%PDF")
