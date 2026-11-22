import { NextResponse, type NextRequest } from "next/server";
import { contentSecurityPolicy, newNonce, originOf } from "@/lib/csp";

/**
 * Next 16's request proxy (formerly middleware.ts). Two jobs:
 *
 * 1. A request ID per page view and per proxied API call (X-Request-ID). Server-rendered pages forward it on every API
 *    call they make (lib/api/server.ts) and the API logs it on every line and returns it, so one ID joins the web and
 *    API logs. Always generated here: a visitor-chosen ID could collide with or spoof another visit's.
 * 2. The content security policy on every page (docs/07), with a fresh nonce per request. Next.js finds the nonce in
 *    the request's Content-Security-Policy header and puts it on its framework scripts and inline payloads, so only
 *    the app's own scripts run. Every page is rendered per request (the root layout reads cookies), which a nonce
 *    needs. Not on the API (it sends its own deny-all policy), prefetches, or public files with an extension.
 */
export function proxy(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const headers = new Headers(req.headers);
  headers.set("x-request-id", requestId);
  // docs/31 §B: the page asked for, so a signed-in area can send a re-entry back to exactly this page. Always set here
  // (a visitor-sent value is overwritten), and still checked against an allow-list before any redirect uses it.
  headers.set("x-pathname", req.nextUrl.pathname + req.nextUrl.search);
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith("/api/");
  const isPrefetch = req.headers.has("next-router-prefetch") || req.headers.get("purpose") === "prefetch";
  const isFile = /\.[A-Za-z0-9]+$/.test(pathname); // sw.js, offline.html, manifest.webmanifest, public images

  let policy: string | null = null;
  if (!isApi && !isPrefetch && !isFile) {
    const nonce = newNonce();
    policy = contentSecurityPolicy({
      nonce,
      dev: process.env.NODE_ENV === "development",
      apiOrigin: originOf(process.env.API_URL),
    });
    headers.set("x-nonce", nonce);
    headers.set("Content-Security-Policy", policy);
  }
  const res = NextResponse.next({ request: { headers } });
  if (!isApi) res.headers.set("x-request-id", requestId); // the API sets its own
  if (policy) res.headers.set("Content-Security-Policy", policy);
  return res;
}

export const config = {
  matcher: ["/api/:path*", "/((?!_next/static|_next/image|images/|fonts/|demo/|favicon|robots.txt).*)"],
};
