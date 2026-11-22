"""Content-security-policy violation reports (docs/31 §H).

The web's policy (apps/web/src/lib/csp.ts) sends the browser's reports here, in either format: report-uri
({"csp-report": {...}}) or the Reporting API ([{"type": "csp-violation", "body": {...}}]). Each report becomes one
warning line with the directive and the blocked host only: never a full URL, a query string, a page path or anything
she typed. No session is needed (the browser sends reports without one); the general rate limit applies."""

from __future__ import annotations

import json
import logging
from urllib.parse import urlparse

from fastapi import APIRouter, Request, Response

router = APIRouter(prefix="/v1")
log = logging.getLogger("reprosense.csp")
MAX_BYTES = 8 * 1024


def _host(value: object) -> str:
    """'attacker.example' for a URL; the CSP keyword ('inline', 'eval', 'data') otherwise; never a path or query."""
    text = str(value or "")[:200]
    host = urlparse(text).hostname
    if host:
        return host
    return text if text in {"inline", "eval", "data", "blob", "self", "wasm-eval", "trusted-types-policy"} else "other"


def _reports(payload: object) -> list[tuple[str, str]]:
    found: list[tuple[str, str]] = []
    if isinstance(payload, dict) and isinstance(payload.get("csp-report"), dict):
        r = payload["csp-report"]
        found.append(
            (str(r.get("effective-directive") or r.get("violated-directive") or "")[:40], _host(r.get("blocked-uri")))
        )
    elif isinstance(payload, list):
        for item in payload[:20]:
            if isinstance(item, dict) and item.get("type") == "csp-violation" and isinstance(item.get("body"), dict):
                b = item["body"]
                found.append((str(b.get("effectiveDirective") or "")[:40], _host(b.get("blockedURL"))))
    return [(d.split()[0] if d else "unknown", h) for d, h in found]


@router.post("/csp-report", status_code=204)
async def csp_report(request: Request) -> Response:
    body = await request.body()
    if len(body) > MAX_BYTES:
        return Response(status_code=413)
    try:
        payload = json.loads(body.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return Response(status_code=204)  # junk is ignored, never an error the browser retries
    for directive, blocked in _reports(payload):
        log.warning("csp violation", extra={"fields": {"directive": directive, "blocked": blocked}})
    return Response(status_code=204)
