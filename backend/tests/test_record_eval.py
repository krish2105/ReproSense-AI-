"""Record-lane eval (tests/record_eval.jsonl): 22 questions in English and Arabic about the seeded personas' own data.

The expected values are computed here, independently of app/agents/record.py, from the seeded persona files
(data/synthetic/output/personas). The test checks that the file still matches the seeded data, that each question takes
the record lane with the expected topic, and that every number in the answer equals a code-computed value: each expected
number appears, and no other number does. The 702 knowledge and safety eval questions never leave the knowledge lane."""

import json
import re
from datetime import date, timedelta
from pathlib import Path

import pytest
from conftest import login

from app.agents import router
from app.config import DATA_DIR

REF = date(2026, 11, 22)  # the demo's "today" (app.config demo_ref_date)
FILE = Path(__file__).parent / "record_eval.jsonl"
ROWS = [json.loads(line) for line in FILE.read_text().splitlines() if line.strip()]
SEVERE = 7  # pain of 7 out of 10 or more (severe_pain_cycles_6)


def persona(name: str) -> dict:
    return json.loads((DATA_DIR / "personas" / f"{name}.json").read_text())


def _d(s) -> date:
    return date.fromisoformat(str(s)[:10])


def _day_parts(s, year: bool) -> list:
    d = _d(s)
    return [d.day, d.year] if year else [d.day]


def _num(v):
    return int(v) if float(v).is_integer() else float(v)


def _window(q: str) -> tuple[int | None, bool]:
    t = q.lower()
    m = re.search(r"last (\d+) months?|آخر (\d+) شهور", t)
    if m:
        return int(m.group(1) or m.group(2)) * 30, True
    if "this year" in t:
        return 365, True
    return 90, False


def expected(row: dict) -> dict:
    """The facts for one question, computed straight from the persona file."""
    b = persona(row["persona"])
    topic, q = row["topic"], row["q"]
    # Arabic says counts of 1 and 2 in words (يوم واحد، يومين), so only larger counts must appear as digits
    count = (lambda n: [] if n in (1, 2) else [n]) if row["lang"] == "ar" else (lambda n: [n])  # noqa: E731
    logs = sorted(b["daily_logs"], key=lambda x: x["date"])
    if topic == "cycles":
        lens = [c["length_days"] for c in b["cycles"] if c["length_days"]][-6:]
        must = list(lens)
        cur = b["cycles"][-1]
        if not cur["length_days"]:
            must += _day_parts(cur["start"], True)
        return {"lengths": lens, "must": must, "may": [len(lens)]}
    if topic == "last_period":
        last = b["cycles"][-1]
        ago = (REF - _d(last["start"])).days
        return {"start": last["start"], "must": [*_day_parts(last["start"], True), last["bleed_days"], ago], "may": []}
    if topic in ("pain", "impact"):
        days, named = _window(q)
        span = [lg for lg in logs if _d(lg["date"]) >= REF - timedelta(days=days)]
        since = _day_parts(REF - timedelta(days=days), False)
        if topic == "pain":
            pain = [lg for lg in span if (lg.get("pain") or 0) >= 1]
            severe = [lg for lg in pain if lg["pain"] >= SEVERE]
            top = max(pain, key=lambda lg: (lg["pain"], lg["date"]))
            must = [days, *since, SEVERE, 10, *count(len(severe)), *count(len(pain)), top["pain"]]
            must += _day_parts(top["date"], False)
            return {"severe_days": len(severe), "pain_days": len(pain), "highest": top["pain"], "must": must, "may": []}
        missed = [lg for lg in span if lg["impact"] == "missed work or study"]
        every = [lg for lg in logs if lg["impact"] == "missed work or study"]
        must = [days, *since] + (count(len(missed)) if missed else [])
        if not named and len(every) != len(missed):
            must += [*count(len(every)), *_day_parts(logs[0]["date"], True)]
        return {"missed_days": len(missed), "must": must, "may": []}
    if topic == "labs":
        want = row["labs"]
        labs = [lab for lab in b["labs"] if not want or lab["code"] in want]
        must, may = [], []
        for lab in labs:
            may += [_num(x) for x in re.findall(r"\d+(?:\.\d+)?", lab["test"])]  # the lab's own test name
            must += _day_parts(lab["date"], True)
            if isinstance(lab["value"], (int, float)):
                must.append(lab["value"])
            must += [x for x in (lab["ref_low"], lab["ref_high"]) if x is not None]
        return {"values": {lab["code"]: lab["value"] for lab in labs}, "must": must, "may": may}
    if topic == "bp":
        rs = sorted(b["bp_readings"], key=lambda r: (r["date"], r.get("time") or ""))
        last = rs[-1]
        must = [last["systolic"], last["diastolic"], *_day_parts(last["date"], True), *count(len(rs))]
        must += _day_parts(rs[0]["date"], False)
        if last.get("time"):
            must += [int(x) for x in last["time"].split(":")]
        may = [int(x) for r in rs if r.get("time") for x in r["time"].split(":")]
        return {"latest": f"{last['systolic']}/{last['diastolic']}", "must": must, "may": may}
    if topic == "postnatal":
        birth = _d(next(e["date"] for e in b["events"] if e["type"] == "delivery"))
        discharge = birth + timedelta(days=2)
        windows = [
            (discharge + timedelta(days=2), discharge + timedelta(days=3)),
            (discharge + timedelta(days=7), discharge + timedelta(days=14)),
            (birth + timedelta(days=10), birth + timedelta(days=14)),
            (birth + timedelta(weeks=6), birth + timedelta(weeks=8)),
            (birth + timedelta(weeks=4), birth + timedelta(weeks=12)),
        ]
        may = [x for a, z in windows for x in (a.day, z.day)] + [5, 1, 6, 7, 14]
        return {"steps": 5, "must": [5], "may": may}
    raise AssertionError(topic)


def numbers(text: str) -> set:
    return {_num(x) for x in re.findall(r"\d+(?:\.\d+)?", text)}


def test_the_eval_file_is_computed_from_the_seeded_personas():
    assert 20 <= len(ROWS) <= 25 and {r["lang"] for r in ROWS} == {"en", "ar"}
    assert {r["topic"] for r in ROWS} == {"cycles", "last_period", "pain", "impact", "labs", "bp", "postnatal"}
    for r in ROWS:
        assert r["expect"] == {k: v for k, v in expected(r).items() if k not in ("must", "may")}, r["id"]


@pytest.mark.parametrize("row", ROWS, ids=[r["id"] for r in ROWS])
def test_every_number_in_the_answer_is_the_code_computed_value(client, row):
    a = client.post(
        "/v1/assistant/ask", headers=login(client, row["persona"]), json={"question": row["q"], "lang": row["lang"]}
    ).json()
    assert a["lane"] == "record" and a["record"]["topic"] == row["topic"], a.get("trace")
    assert a["record"]["from_entries"] and not a["urgent"] and not a["crisis"]
    exp = expected(row)
    got = numbers(a["answer"])
    must = {_num(x) for x in exp["must"]}
    assert must <= got, f"missing {must - got}: {a['answer']}"
    assert got <= must | {_num(x) for x in exp["may"]}, f"unexpected {got - must}: {a['answer']}"
    chips = [e for line in a["record"]["lines"] for e in line["evidence"]]
    assert all(str(e["entry_id"]).startswith((row["persona"] + "-", "lab-", "cycle-")) for e in chips)


def test_no_eval_question_leaves_the_knowledge_lane():
    tests = Path(__file__).parent
    rows = [
        json.loads(line)
        for f in ("rag_eval.jsonl", "rag_heldout.jsonl")
        for line in (tests / f).read_text().splitlines()
        if line.strip()
    ]
    assert len(rows) == 702
    moved = [(r["id"], router.classify(r["q"])) for r in rows if router.classify(r["q"])["lane"] != "knowledge"]
    assert moved == []
