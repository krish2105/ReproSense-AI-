"""Request IDs and one JSON log line per request (18 Nov production audit: no request IDs, no latency, and no way to
match a failed page to the API log).

Every request gets an ID: the web tier's X-Request-ID when it sends a well-formed one (apps/web/src/proxy.ts makes
one per page view and forwards it on every API call that page makes), else a new one. It is returned in X-Request-ID
and stamped on every log line written while the request runs, so one ID joins the web log and the API log.

Health data never goes into logs: the access line records the route *template*
(`/v1/shared/{token}`, never the token), method, status, latency and role, and nothing from the body or query.
"""

from __future__ import annotations

import json
import logging
import re
import sys
import time
import uuid
from contextvars import ContextVar

REQUEST_ID: ContextVar[str] = ContextVar("request_id", default="-")
_VALID_ID = re.compile(r"^[A-Za-z0-9-]{8,64}$")
_QUIET = {"/healthz", "/v1/ping"}  # health checks and the public pages' wake-up pings: many lines, no information

access = logging.getLogger("reprosense.access")


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        out = {
            "ts": self.formatTime(record, "%Y-%m-%dT%H:%M:%S") + f".{int(record.msecs):03d}Z",
            "level": record.levelname.lower(),
            "logger": record.name,
            "msg": record.getMessage(),
            "request_id": REQUEST_ID.get(),
        }
        out.update(getattr(record, "fields", {}))
        if record.exc_info:
            out["exc"] = self.formatException(record.exc_info)
        return json.dumps(out, ensure_ascii=False, default=str)


def setup_logging(level: str = "INFO") -> None:
    """JSON lines on stdout for the app's loggers (Render keeps stdout). Idempotent."""
    root = logging.getLogger("reprosense")
    if any(isinstance(h.formatter, JsonFormatter) for h in root.handlers):
        return
    h = logging.StreamHandler(sys.stdout)
    h.setFormatter(JsonFormatter())
    logging.Formatter.converter = time.gmtime
    root.addHandler(h)
    root.setLevel(level.upper())
    root.propagate = False


class RequestContext:
    """Outermost ASGI middleware: request ID, latency, one access line, and a logged traceback for anything that
    escapes the app (which then reaches the client as a 500)."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)
        incoming = dict(scope.get("headers") or []).get(b"x-request-id", b"").decode("latin-1")
        rid = incoming if _VALID_ID.match(incoming) else uuid.uuid4().hex
        token = REQUEST_ID.set(rid)
        status = {"code": 500}
        t0 = time.perf_counter()

        async def send_with_id(message):
            if message["type"] == "http.response.start":
                status["code"] = message["status"]
                message.setdefault("headers", [])
                message["headers"] = [*message["headers"], (b"x-request-id", rid.encode())]
            await send(message)

        try:
            await self.app(scope, receive, send_with_id)
        except Exception:
            f = _fields(scope, 500, t0)
            access.exception("unhandled error", extra={"fields": f})
            raise
        else:
            if scope.get("path") not in _QUIET:
                code = status["code"]
                f = _fields(scope, code, t0)
                level = logging.ERROR if code >= 500 else logging.WARNING if code in (429, 503) else logging.INFO
                access.log(level, "request", extra={"fields": f})
        finally:
            REQUEST_ID.reset(token)


def _fields(scope, status: int, t0: float) -> dict:
    route = scope.get("route")
    actor = getattr(scope.get("state", {}).get("actor"), "role", None) if isinstance(scope.get("state"), dict) else None
    return {
        "request_id": REQUEST_ID.get(),  # captured now: a handler may format the record after the request has ended
        "method": scope.get("method"),
        "route": getattr(route, "path", None) or "unmatched",  # the template, never a token or an id from the URL
        "status": status,
        "ms": round((time.perf_counter() - t0) * 1000, 1),
        "role": actor,
    }
