"""A demo reset never shows an empty database (Atharva's 7 Nov handoff, step 4e).

Reset used to commit the schema (every table dropped and recreated), then the data, then the assistant's index, so
/readyz and every screen could see 0 people or an empty index for a moment. Now the schema, the data and the index
land in one transaction: a request during a reset waits for the locks, then sees the full demo."""

import threading
import time

from app.db import SYSTEM, session
from app.db.seed import seed


def _counts() -> tuple[int, int]:
    with session(SYSTEM) as cur:
        cur.execute("SELECT count(*) AS n FROM profiles WHERE role = 'patient'")
        people = cur.fetchone()["n"]
        cur.execute("SELECT count(*) AS n FROM kb_chunks")
        return people, cur.fetchone()["n"]


def test_a_reader_never_sees_an_empty_demo_during_a_reset():
    people, chunks = _counts()
    assert people == 8 and chunks > 0
    seen, errors = [], []
    t = threading.Thread(target=seed)
    t.start()
    while t.is_alive():
        try:
            seen.append(_counts())
        except Exception as e:  # noqa: BLE001 - a missing table during the reset counts as a failure too
            errors.append(repr(e)[:120])
        time.sleep(0.005)
    t.join()
    assert not errors, errors[:3]
    assert seen, "the reader ran during the reset"
    empty = [c for c in seen if c[0] == 0 or c[1] == 0]
    assert not empty, f"{len(empty)} of {len(seen)} reads saw an empty demo, e.g. {empty[0]}"
    assert _counts() == (people, chunks)
