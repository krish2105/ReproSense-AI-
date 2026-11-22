"""docs/31 §H, M7: checking the audit chain and exporting it no longer load the whole log into memory.

Both read the log in fixed batches through a server-side cursor, so memory stays flat however long the log grows. The
check still walks every row, every time: only a full walk shows that an old row was edited (attack 12), so there is
no shortcut that could hide an edit for a while. The export records itself first, in its own transaction, then streams
the rows."""

import csv
import io

import psycopg
from conftest import login

from app.api import admin as admin_api
from app.config import get_settings
from app.security import audit


def test_the_chain_is_walked_in_batches_and_an_edit_in_a_later_batch_is_found(client, monkeypatch):
    h = login(client, role="admin")
    for _ in range(5):  # a few chained rows
        client.get("/v1/admin/events", headers=h)
    monkeypatch.setattr(audit, "BATCH", 2)
    ok = client.get("/v1/admin/audit/verify", headers=h).json()
    assert ok["chain_ok"] is True and ok["entries"] >= 5
    with psycopg.connect(get_settings().database_url, autocommit=True) as conn:
        last, action = conn.execute("SELECT id, action FROM audit_log ORDER BY id DESC LIMIT 1").fetchone()
        conn.execute("UPDATE audit_log SET action='edited' WHERE id=%s", (last,))
        try:
            bad = client.get("/v1/admin/audit/verify", headers=h).json()
            assert bad["chain_ok"] is False and bad["first_bad_id"] == last, bad
        finally:
            conn.execute("UPDATE audit_log SET action=%s WHERE id=%s", (action, last))


def test_the_export_streams_every_row_and_records_itself(client):
    h = login(client, role="admin")
    assert client.post("/v1/staff-auth/step-up/demo", headers=h).status_code == 200  # one tap in a demo session
    r = client.get("/v1/admin/audit/export.csv", headers=h)
    assert r.status_code == 200 and r.headers["content-type"].startswith("text/csv")
    rows = list(csv.reader(io.StringIO(r.text)))
    assert rows[0] == list(admin_api.AUDIT_COLUMNS)
    assert any(row[admin_api.AUDIT_COLUMNS.index("action")] == "export_audit_log" for row in rows[1:])
    with psycopg.connect(get_settings().database_url) as conn:
        assert len(rows) - 1 >= conn.execute("SELECT count(*) FROM audit_log").fetchone()[0] - 1  # nothing left out
