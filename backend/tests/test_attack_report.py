"""The published attack score stays honest: one test per attack in the catalogue, the committed results match the
catalogue, and /v1/quality serves them for the /status page."""

from __future__ import annotations

import inspect
import json
from datetime import UTC, datetime
from xml.etree import ElementTree as ET

from app.security import attack_report as ar
from tests import test_attack_suite as suite


def test_each_attack_has_exactly_one_named_test():
    tests = {n for n, f in inspect.getmembers(suite, inspect.isfunction) if n.startswith("test_")}
    assert [a["id"] for a in ar.ATTACKS] == list(range(1, 15))
    assert {a["test"] for a in ar.ATTACKS} == tests  # no attack without a test, no test outside the catalogue
    assert all(a["test"].startswith(f"test_attack_{a['id']:02d}_") for a in ar.ATTACKS)
    assert all(a["layer"] in ar.LAYERS for a in ar.ATTACKS)


def test_the_score_counts_only_passing_tests_as_blocked():
    outcomes = {a["test"]: "blocked" for a in ar.ATTACKS}
    outcomes[ar.ATTACKS[12]["test"]] = "not_run"
    outcomes[ar.ATTACKS[13]["test"]] = "not_blocked"
    r = ar.build(outcomes, "abc1234", datetime(2026, 11, 19, tzinfo=UTC))
    assert (r["total"], r["blocked"], r["not_run"], r["not_blocked"]) == (14, 12, 1, 1)
    del outcomes[ar.ATTACKS[0]["test"]]  # a test that never ran is not counted as blocked
    assert ar.build(outcomes, "abc1234", datetime(2026, 11, 19, tzinfo=UTC))["attacks"][0]["result"] == "not_blocked"


def test_a_failed_or_errored_case_is_not_blocked():
    xml = ET.fromstring(
        "<testsuite><testcase name='a'/><testcase name='b'><failure/></testcase>"
        "<testcase name='c'><error/></testcase><testcase name='d'><skipped/></testcase></testsuite>"
    )
    assert {c.get("name"): ar._outcome(c) for c in xml.iter("testcase")} == {
        "a": "blocked",
        "b": "not_blocked",
        "c": "not_blocked",
        "d": "not_run",
    }


def test_the_committed_results_match_the_catalogue():
    r = json.loads(ar.RESULTS.read_text(encoding="utf-8"))
    assert [(a["id"], a["name"], a["layer"], a["test"]) for a in r["attacks"]] == [
        (a["id"], a["name"], a["layer"], a["test"]) for a in ar.ATTACKS
    ]
    assert r["total"] == 14 and r["blocked"] == sum(a["result"] == "blocked" for a in r["attacks"])
    assert r["commit"] and r["date"]


def test_the_quality_endpoint_serves_the_attack_score(client):
    q = client.get("/v1/quality").json()
    assert q["attack_suite"] == json.loads(ar.RESULTS.read_text(encoding="utf-8"))
