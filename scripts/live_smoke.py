"""Functional check of the LIVE demo path (not just uptime). Read-only except for a report row and an audit entry.

Runs the 3-minute path a judge takes, through the public API and web: wake the API, open Noura, her home and
patterns, ask the assistant, make the doctor PDF, switch to the clinician and Fatima, open the clinic network and
verify the audit chain. Never resets the demo. Standard library only, so it runs anywhere:

    LIVE_API_URL=https://reprosense-api.onrender.com LIVE_WEB_URL=https://reprosense.vercel.app python3 scripts/live_smoke.py

Exit 0 when every step passes; otherwise prints each failed step and exits 1 (the workflow then opens an issue).
"""

from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.request

API = os.environ.get("LIVE_API_URL", "https://reprosense-api.onrender.com").rstrip("/")
WEB = os.environ.get("LIVE_WEB_URL", "https://reprosense.vercel.app").rstrip("/")
UA = "reprosense-live-check/1.0"
results: list[tuple[str, bool, str]] = []


def call(method: str, url: str, body: dict | None = None, token: str | None = None, timeout: int = 60):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers={"User-Agent": UA, "Accept": "*/*"})
    if data is not None:
        req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Cookie", f"rs_token={token}")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.headers.get("Content-Type", ""), r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.headers.get("Content-Type", ""), e.read()


def step(name: str, fn) -> object:
    try:
        out = fn()
        results.append((name, True, ""))
        return out
    except Exception as e:  # noqa: BLE001 (report every failure, keep going)
        results.append((name, False, str(e)[:300]))
        return None


def need(cond: bool, msg: str) -> None:
    if not cond:
        raise AssertionError(msg)


def wake():
    for attempt in range(4):
        try:
            code, _, body = call("GET", f"{API}/readyz", timeout=75)
            if code == 200:
                d = json.loads(body)
                need(d.get("db") is True and d.get("personas", 0) >= 8 and d.get("kb_chunks", 0) > 0, f"not ready: {d}")
                return d
        except Exception:  # noqa: BLE001 (a sleeping free instance takes about a minute)
            pass
        time.sleep(20)
    raise AssertionError("API did not wake within about 5 minutes")


def login(who: dict) -> str:
    code, _, body = call("POST", f"{API}/v1/demo/login", who)
    need(code == 200, f"demo login {who} -> {code}")
    return json.loads(body)["token"]


def get_json(path: str, token: str):
    code, _, body = call("GET", f"{API}{path}", token=token)
    need(code == 200, f"GET {path} -> {code}")
    return json.loads(body)


def main() -> int:
    ready = step("API awake and demo data seeded", wake)
    if ready is None:
        return report()
    noura = step("Noura signs in", lambda: login({"persona": "noura"}))
    if noura:
        step("Noura's home", lambda: need(isinstance(get_json("/v1/me/home", noura), dict), "home is not JSON"))

        def patterns():
            cards = get_json("/v1/insights", noura).get("cards", [])
            ids = {c.get("observation_id") for c in cards}
            need("OBS_IRREGULAR_CYCLES" in ids, f"expected her irregular-cycles pattern, got {sorted(ids)}")

        step("Noura's patterns with evidence", patterns)

        def ask():
            code, _, body = call("POST", f"{API}/v1/assistant/ask", {"question": "What is PCOS?", "lang": "en"}, noura)
            need(code == 200, f"ask -> {code}")
            need(len(json.loads(body).get("citations", [])) >= 1, "answer has no sources")

        step("Assistant answers with sources", ask)

        def pdf():
            code, _, body = call("POST", f"{API}/v1/reports", {}, noura)
            need(code == 200, f"create report -> {code}")
            rid = json.loads(body)["id"]
            code, ctype, data = call("GET", f"{API}/v1/reports/{rid}.pdf", token=noura, timeout=90)
            need(code == 200 and "pdf" in ctype and data[:4] == b"%PDF", f"PDF -> {code} {ctype}")

        step("Doctor PDF downloads", pdf)
    clin = step("Clinician signs in", lambda: login({"role": "clinician"}))
    if clin:

        def fatima():
            pts = get_json("/v1/clinic/patients", clin)
            text = json.dumps(pts)
            need("fatima" in text, "Fatima is not in the clinician's list")
            get_json("/v1/clinic/patients/fatima", clin)

        step("Clinician opens Fatima", fatima)
    adm = step("Clinic network signs in", lambda: login({"role": "admin"}))
    if adm:
        step("Network metrics", lambda: get_json("/v1/admin/metrics", adm))
        step("Audit chain intact", lambda: need(get_json("/v1/admin/audit/verify", adm).get("chain_ok") is True, "chain broken"))

    def web():
        for path in ("/", "/demo", "/status"):
            code, _, body = call("GET", f"{WEB}{path}", timeout=60)
            need(code == 200, f"{path} -> {code}")
            need(b"fictional" in body.lower() or path == "/status", f"{path}: no 'fictional' demo badge")

    step("Web pages answer with the demo badge", web)
    return report()


def report() -> int:
    width = max(len(n) for n, _, _ in results)
    for name, ok, why in results:
        print(f"{'PASS' if ok else 'FAIL'}  {name.ljust(width)}  {why}")
    failed = [n for n, ok, _ in results if not ok]
    print(f"\n{len(results) - len(failed)} of {len(results)} steps passed against {API} and {WEB}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
