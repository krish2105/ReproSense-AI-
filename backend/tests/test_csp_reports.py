"""docs/31 §H: the browser reports content-security-policy violations to /v1/csp-report, so an injection attempt or a
broken page becomes visible. Only the directive and the blocked host are logged: never a full URL, a query string or
anything she typed. Both report formats are accepted (report-uri and the Reporting API); junk is ignored."""

import logging

OLD_STYLE = {
    "csp-report": {
        "document-uri": "https://reprosense.vercel.app/app/log?date=2026-11-21&say=private%20words",
        "effective-directive": "script-src-elem",
        "blocked-uri": "https://attacker.example/steal.js?c=secret",
    }
}
REPORTING_API = [
    {
        "type": "csp-violation",
        "url": "https://reprosense.vercel.app/clinic/patients/noura",
        "body": {"effectiveDirective": "connect-src", "blockedURL": "https://exfil.example/x?token=abc"},
    }
]


def test_a_report_is_logged_without_urls_or_queries(client, caplog, monkeypatch):
    monkeypatch.setattr(logging.getLogger("reprosense"), "propagate", True)
    with caplog.at_level(logging.WARNING, logger="reprosense.csp"):
        r = client.post(
            "/v1/csp-report",
            content=__import__("json").dumps(OLD_STYLE),
            headers={"content-type": "application/csp-report"},
        )
        r2 = client.post("/v1/csp-report", json=REPORTING_API, headers={"content-type": "application/reports+json"})
    assert r.status_code == 204 and r2.status_code == 204
    text = " ".join(rec.getMessage() + str(getattr(rec, "fields", "")) for rec in caplog.records)
    assert "attacker.example" in text and "exfil.example" in text and "script-src-elem" in text
    for leaked in ("secret", "token=abc", "private", "say=", "noura", "date=2026"):
        assert leaked not in text, leaked


def test_junk_is_ignored(client):
    assert (
        client.post("/v1/csp-report", content=b"\x00not json", headers={"content-type": "application/json"}).status_code
        == 204
    )
    assert (
        client.post("/v1/csp-report", content=b"x" * 20_000, headers={"content-type": "application/json"}).status_code
        == 413
    )
