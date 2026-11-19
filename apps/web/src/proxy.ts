import { NextResponse, type NextRequest } from "next/server";

/**
 * Next 16's request proxy (formerly middleware.ts). A request ID per page view and per proxied API call
 * (X-Request-ID). Server-rendered pages forward it on every API call
 * they make (lib/api/server.ts) and the API logs it on every line and returns it, so one ID joins the web and API logs.
 * Always generated here: a visitor-chosen ID could collide with or spoof another visit's.
 */
export function proxy(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const headers = new Headers(req.headers);
  headers.set("x-request-id", requestId);
  const res = NextResponse.next({ request: { headers } });
  if (!req.nextUrl.pathname.startsWith("/api/")) res.headers.set("x-request-id", requestId); // the API sets its own
  return res;
}

export const config = {
  matcher: ["/api/:path*", "/((?!_next/static|_next/image|images/|fonts/|demo/|favicon|robots.txt).*)"],
};
