"""docs/31 §H, M2 and L8 (docs/30 security assessment).

- M2: a clinician's visit note is stored encrypted (AES-256-GCM, as her own notes and documents are), never as plain
  text in the database.
- L8: notes are kept per clinic. If she ever moves clinic, the new clinic must not read the old clinic's note; the
  database enforces it (a restrictive row-level policy), not just the query.
"""

from conftest import login

from app.db import SYSTEM, Actor, session
from app.security.crypto import decrypt

NOTE = "Discussed cycle diary; repeat ferritin in 8 weeks. (fictional)"


def test_a_visit_note_is_encrypted_at_rest(client, reseed):
    hc = login(client, role="clinician")
    assert client.put("/v1/clinic/patients/noura/visit-note", headers=hc, json={"text": NOTE}).status_code == 200
    with session(SYSTEM) as cur:
        cur.execute("SELECT * FROM clinic_reviews WHERE profile_id='noura'")
        row = cur.fetchone()
    assert "visit_note" not in row  # no plain-text column left
    blob = bytes(row["visit_note_enc"])
    assert NOTE.encode() not in blob and decrypt(blob) == NOTE
    assert client.get("/v1/clinic/patients/noura", headers=hc).json()["visit_note_draft"] == NOTE


def test_a_note_belongs_to_its_clinic(client, reseed):
    hc = login(client, role="clinician")
    client.put("/v1/clinic/patients/noura/visit-note", headers=hc, json={"text": NOTE})
    with session(SYSTEM) as cur:
        cur.execute("SELECT id FROM clinics WHERE id <> 'clinic_corniche' ORDER BY id LIMIT 1")
        other = cur.fetchone()["id"]
        from app.security.crypto import encrypt

        cur.execute(
            "INSERT INTO clinic_reviews (profile_id, clinic_id, clinician_id, visit_note_enc) VALUES ('noura', %s, 'clin-x', %s)",
            (other, encrypt("Another clinic's note (fictional)")),
        )
    # The demo clinician (clinic_corniche) still reads only her own clinic's note
    assert client.get("/v1/clinic/patients/noura", headers=hc).json()["visit_note_draft"] == NOTE
    # and under the clinician's own role the database hides the other clinic's row entirely
    with session(Actor("clinician", "clin-01", "clinic_corniche")) as cur:
        cur.execute("SELECT clinic_id FROM clinic_reviews WHERE profile_id='noura'")
        assert [r["clinic_id"] for r in cur.fetchall()] == ["clinic_corniche"]


def test_marking_reviewed_keeps_one_row_per_clinic(client, reseed):
    hc = login(client, role="clinician")
    for _ in range(2):
        assert client.post("/v1/clinic/patients/noura/review", headers=hc).status_code == 200
    client.put("/v1/clinic/patients/noura/visit-note", headers=hc, json={"text": NOTE})
    with session(SYSTEM) as cur:
        cur.execute("SELECT count(*) AS n FROM clinic_reviews WHERE profile_id='noura'")
        assert cur.fetchone()["n"] == 1
