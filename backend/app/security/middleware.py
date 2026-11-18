"""Security headers and rate limits (docs/07)."""

from __future__ import annotations

import hashlib
import time
from collections import defaultdict, deque

import jwt
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.config import get_settings

SENSITIVE = (
    "/v1/assistant",
    "/v1/documents",
    "/v1/clinic/patients/",
    "/v1/logs/parse",
    "/v1/demo/signup",
    "/v1/clinic-invites",
    "/v1/auth/",
    "/v1/demo/reset",
)


def client_key(request: Request) -> str:
    """Who a request counts against. A session token counts only once its signature checks out: keying on the raw
    cookie let a client send a fresh random cookie with every request and never be limited (18 Nov audit). A verified
    token gets its own bucket (judges sharing one persona are not throttled together); anything else counts against
    the client address."""
    from app.security.auth import ALG

    auth = request.headers.get("authorization", "")
    token = auth[7:] if auth.lower().startswith("bearer ") else request.cookies.get("rs_token", "")
    if token:
        try:
            jwt.decode(token, get_settings().demo_token_secret, algorithms=[ALG], audience="reprosense-demo")
            return "t:" + hashlib.sha256(token.encode()).hexdigest()[:24]
        except jwt.PyJWTError:
            pass
    return "ip:" + (request.client.host if request.client else "anon")


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

    SWEEP_EVERY = 1000  # requests between sweeps of idle buckets, so the table cannot grow without bound

    def __init__(self, app):
        super().__init__(app)
        self.hits: dict[tuple[str, str], deque] = defaultdict(deque)
        self._seen = 0

    def _sweep(self, now: float) -> None:
        for k in [k for k, q in self.hits.items() if not q or now - q[-1] > 60]:
            del self.hits[k]

    async def dispatch(self, request: Request, call_next):
        s = get_settings()
        path = request.url.path
        # /v1/ping is the public pages' wake-up call: constant reply, no work, so it never uses up her requests.
        if not path.startswith("/v1") or request.method == "OPTIONS" or path == "/v1/ping":
            return await call_next(request)
        group = "sensitive" if any(path.startswith(p) for p in SENSITIVE) and request.method == "POST" else "general"
        limit = s.rate_limit_sensitive_per_min if group == "sensitive" else s.rate_limit_per_min
        now = time.monotonic()
        self._seen += 1
        if self._seen % self.SWEEP_EVERY == 0:
            self._sweep(now)
        q = self.hits[(client_key(request), group)]
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


class ModelBudget:
    """Gives every API request one time budget for all its model calls (app.ai.llm.request_budget).

    Plain ASGI, so the budget is set in the same context the endpoint (and its thread pool) runs in."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)
        from app.ai.llm import request_budget

        with request_budget(get_settings().llm_request_budget_s):
            await self.app(scope, receive, send)
