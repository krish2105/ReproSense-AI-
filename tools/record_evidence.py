#!/usr/bin/env python3
"""Record the test counts behind the public /evidence page in backend/app/evidence.json (GET /v1/quality serves it).

    make evidence                 # from the repository root, on a committed tree; needs the test database like make test
    python3 tools/record_evidence.py --allow-dirty   # try it on uncommitted work (the record then names no commit)

What it measures, in order:
1. Backend: runs the whole pytest suite once (`uv run pytest -q`) and counts passed, failed and skipped tests.
   The suite rewrites app/ai/eval_results.json; the committed file is put back afterwards, byte for byte.
2. Web unit tests: runs `pnpm exec vitest run` and counts passed and failed tests.
3. End-to-end: lists the Playwright tests (`playwright test --list`, which starts no server or browser). CI runs them
   all on every push; this script does not run them.
4. The eval file: when it was last committed and a fingerprint of its numbers, so /evidence shows that date only while
   the numbers are unchanged.
Lighthouse is not measured here. The record keeps the last Lighthouse run (with its date, tool and source) until
someone measures again and edits that block. Synthetic data only.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET
from datetime import UTC, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BACKEND = ROOT / "backend"
WEB = ROOT / "apps" / "web"
OUT = BACKEND / "app" / "evidence.json"
EVAL = BACKEND / "app" / "ai" / "eval_results.json"
# Files a test run rewrites; they are restored after the run and do not make the tree "dirty".
REWRITTEN = (
    "backend/app/evidence.json",
    "backend/app/ai/eval_results.json",
    "backend/app/security/attack_results.json",
)


def eval_fingerprint(evals: dict) -> str:
    """Same function as app.api.quality.eval_fingerprint (tests/test_evidence.py keeps the two equal)."""
    core = {k: v for k, v in evals.items() if k != "heldout_with_model"}
    return hashlib.sha256(json.dumps(core, sort_keys=True, ensure_ascii=False).encode()).hexdigest()[:16]


def git(*args: str) -> str:
    return subprocess.run(["git", *args], cwd=ROOT, check=True, capture_output=True, text=True).stdout.strip()


def backend_counts() -> dict:
    saved = {p: p.read_bytes() for p in (ROOT / f for f in REWRITTEN[1:]) if p.exists()}
    try:
        with tempfile.TemporaryDirectory() as tmp:
            xml = Path(tmp) / "backend.xml"
            cmd = ["uv", "run", "pytest", "-q", "-p", "no:cacheprovider", f"--junitxml={xml}"]
            subprocess.run(cmd, cwd=BACKEND, check=False)
            if not xml.exists():
                raise SystemExit("The backend tests did not run (no report). See the pytest output above.")
            cases = list(ET.parse(xml).getroot().iter("testcase"))
        remeasured = json.loads(EVAL.read_text(encoding="utf-8")) if EVAL.exists() else None
    finally:
        for p, data in saved.items():
            p.write_bytes(data)
    failed = sum(c.find("failure") is not None or c.find("error") is not None for c in cases)
    skipped = sum(c.find("skipped") is not None for c in cases)
    committed = json.loads(EVAL.read_text(encoding="utf-8")) if EVAL.exists() else None
    if remeasured and committed and eval_fingerprint(remeasured) != eval_fingerprint(committed):
        print("warning: this run's eval numbers differ from the committed eval_results.json; commit the new file")
    return {"passed": len(cases) - failed - skipped, "failed": failed, "skipped": skipped, "total": len(cases)}


def web_unit_counts() -> dict:
    with tempfile.TemporaryDirectory() as tmp:
        out = Path(tmp) / "vitest.json"
        subprocess.run(
            ["pnpm", "exec", "vitest", "run", "--reporter=json", f"--outputFile={out}"], cwd=WEB, check=False
        )
        if not out.exists():
            raise SystemExit("The web unit tests did not run (no report).")
        r = json.loads(out.read_text(encoding="utf-8"))
    return {"passed": r["numPassedTests"], "failed": r["numFailedTests"], "files": len(r["testResults"])}


def e2e_counts() -> dict:
    res = subprocess.run(
        ["pnpm", "exec", "playwright", "test", "--list", "--reporter=json"], cwd=WEB, capture_output=True, text=True
    )
    if res.returncode != 0:
        raise SystemExit(f"Could not list the end-to-end tests:\n{res.stderr}")
    per: dict[str, int] = {}

    def walk(suite: dict) -> None:
        for spec in suite.get("specs", []):
            for t in spec.get("tests", []):
                per[t["projectName"]] = per.get(t["projectName"], 0) + 1
        for s in suite.get("suites", []):
            walk(s)

    for s in json.loads(res.stdout)["suites"]:
        walk(s)
    return {"tests": sum(per.values()), "per_project": dict(sorted(per.items()))}


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--allow-dirty", action="store_true", help="record uncommitted work (no commit is named)")
    args = ap.parse_args()
    changed = [ln[3:] for ln in git("status", "--porcelain").splitlines() if ln[3:] not in REWRITTEN]
    if changed and not args.allow_dirty:
        print("Commit first, so the record names the code it measured. Uncommitted:", *changed, sep="\n  ")
        return 1
    previous = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {}
    tests = {"backend": backend_counts(), "web_unit": web_unit_counts(), "e2e": e2e_counts()}
    evals = json.loads(EVAL.read_text(encoding="utf-8")) if EVAL.exists() else None
    eval_file = None
    if evals is not None:
        sha, day = git("log", "-1", "--format=%h %cs", "--", str(EVAL.relative_to(ROOT))).split()
        eval_file = {"fingerprint": eval_fingerprint(evals), "committed": day, "commit": sha}
    record = {
        "recorded": datetime.now(UTC).date().isoformat(),
        "commit": None if changed else git("rev-parse", "--short=7", "HEAD"),
        "tests": tests,
        "eval_file": eval_file,
        "lighthouse": previous.get("lighthouse"),
        "note": "Written by tools/record_evidence.py (make evidence). Test counts are from one run at the commit named;"
        " CI runs every suite again on each push. Lighthouse is copied from the run it names.",
    }
    OUT.write_text(json.dumps(record, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    b, w, e = tests["backend"], tests["web_unit"], tests["e2e"]
    print(f"backend {b['passed']} passed, {b['failed']} failed, {b['skipped']} skipped · web unit {w['passed']} passed")
    print(f"e2e {e['tests']} listed {e['per_project']} · written to {OUT.relative_to(ROOT)}")
    return 1 if b["failed"] or w["failed"] else 0


if __name__ == "__main__":
    sys.exit(main())
