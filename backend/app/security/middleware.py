"""Security headers and rate limits (docs/07)."""

from __future__ import annotations

import time
from collections import defaultdict, deque

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.config import get_settings

SENSITIVE = ("/v1/assistant", "/v1/documents", "/v1/clinic/patients/", "/v1/logs/parse", "/v1/demo/signup", "/v1/demo/clinician-join")


class SecurityHeaders(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        resp = await call_next(request)
        resp.headers.setdefault("X-Content-Type-Options", "nosniff")
        resp.headers.setdefault("X-Frame-Options", "DENY")
        resp.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        resp.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        resp.headers.setdefault("Cross-Origin-Resource-Policy", "same-site")
        if not request.url.path.startswith(("/docs", "/openapi")):
            resp.headers.setdefault("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'")
        if request.url.scheme == "https":
            resp.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
        resp.headers.setdefault("Cache-Control", "no-store")
        return resp


class RateLimit(BaseHTTPMiddleware):
    """Sliding one-minute window per client and route group. In-memory (single instance); Redis in production."""

    def __init__(self, app):
        super().__init__(app)
        self.hits: dict[tuple[str, str], deque] = defaultdict(deque)

    async def dispatch(self, request: Request, call_next):
        s = get_settings()
        path = request.url.path
        if not path.startswith("/v1") or request.method == "OPTIONS":
            return await call_next(request)
        group = "sensitive" if any(path.startswith(p) for p in SENSITIVE) and request.method == "POST" else "general"
        limit = s.rate_limit_sensitive_per_min if group == "sensitive" else s.rate_limit_per_min
        who = request.cookies.get("rs_token", "")[-24:] or (request.client.host if request.client else "anon")
        q = self.hits[(who, group)]
        now = time.monotonic()
        while q and now - q[0] > 60:
            q.popleft()
        if len(q) >= limit:
            return JSONResponse(
                {"detail": "Too many requests. Please wait a minute and try again."},
                status_code=429,
                headers={"Retry-After": "60"},
            )
        q.append(now)
        return await call_next(request)
