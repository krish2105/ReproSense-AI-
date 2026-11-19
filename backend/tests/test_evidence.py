"""The public /evidence page reads every number from GET /v1/quality. These tests keep that record honest: it is
complete, its eval date is shown only for the eval numbers it saw, and a missing result stays missing (the page then
says "not measured yet") instead of being filled in."""

from __future__ import annotations

import importlib.util
import json
from pathlib import Path

from app.api import quality

ROOT = Path(__file__).resolve().parents[2]


def _recorder():
    spec = importlib.util.spec_from_file_location("record_evidence", ROOT / "tools" / "record_evidence.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def test_the_recorder_and_the_api_fingerprint_the_eval_the_same_way():
    evals = json.loads(quality.RESULTS.read_text())
    assert _recorder().eval_fingerprint(evals) == quality.eval_fingerprint(evals)
    # the model's run carries its own date, so adding it does not change the word-checks fingerprint
    with_model = {**evals, "heldout_with_model": {"crisis": {"pass": 1, "of": 2}, "model": "m", "round": 5}}
    assert quality.eval_fingerprint(with_model) == quality.eval_fingerprint(evals)
    assert quality.eval_fingerprint({**evals, "questions": 61}) != quality.eval_fingerprint(evals)


def test_the_committed_record_is_complete():
    ev = json.loads(quality.EVIDENCE.read_text(encoding="utf-8"))
    assert ev["recorded"] and ev["eval_file"]["committed"]
    t = ev["tests"]  # failures are recorded and shown, never dropped (make evidence also exits 1 on a failure)
    b, w = t["backend"], t["web_unit"]
    assert b["passed"] > 0 and b["total"] == b["passed"] + b["failed"] + b["skipped"]
    assert w["passed"] > 0 and w["failed"] >= 0 and w["files"] > 0
    assert t["e2e"]["tests"] == sum(t["e2e"]["per_project"].values()) > 0
    lh = ev["lighthouse"]
    assert lh["measured"] and lh["tool"] and lh["source"] and lh["pages"]
    for p in lh["pages"]:
        assert all(0 <= p[k] <= 100 for k in ("performance", "accessibility", "best_practices", "seo")), p


def test_quality_serves_the_evidence_with_the_eval_date(client):
    q = client.get("/v1/quality").json()
    ev = json.loads(quality.EVIDENCE.read_text(encoding="utf-8"))
    assert q["evidence"]["tests"] == ev["tests"]
    assert q["evidence"]["lighthouse"] == ev["lighthouse"]
    same = ev["eval_file"]["fingerprint"] == quality.eval_fingerprint(json.loads(quality.RESULTS.read_text()))
    assert q["evidence"]["eval_committed"] == (ev["eval_file"]["committed"] if same else None)
    assert "eval_file" not in q["evidence"]  # the fingerprint is internal


def test_a_newer_eval_is_never_shown_with_the_older_date(client, monkeypatch, tmp_path):
    evals = json.loads(quality.RESULTS.read_text())
    newer = tmp_path / "eval_results.json"
    newer.write_text(json.dumps({**evals, "grounded_pct": 99.0}))
    monkeypatch.setattr(quality, "RESULTS", newer)
    assert client.get("/v1/quality").json()["evidence"]["eval_committed"] is None


def test_missing_results_stay_missing(client, monkeypatch, tmp_path):
    monkeypatch.setattr(quality, "ATTACKS", tmp_path / "none.json")
    monkeypatch.setattr(quality, "EVIDENCE", tmp_path / "none.json")
    q = client.get("/v1/quality").json()
    assert q["attack_suite"] is None and q["evidence"] is None
