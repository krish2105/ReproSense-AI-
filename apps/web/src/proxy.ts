import { NextResponse, type NextRequest } from "next/server";
import { contentSecurityPolicy, newNonce, originOf } from "@/lib/csp";

// Content security policy on every page (docs/07). A fresh nonce per request: Next.js finds it in the request's
// Content-Security-Policy header and puts it on its framework scripts and inline payloads, so only the app's own
// scripts run. Every page is rendered per request (the root layout reads cookies), which a nonce needs.
export function proxy(request: NextRequest) {
  const nonce = newNonce();
  const policy = contentSecurityPolicy({
    nonce,
    dev: process.env.NODE_ENV === "development",
    apiOrigin: originOf(process.env.API_URL),
  });
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", policy);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", policy);
  return response;
}

export const config = {
  matcher: [
    {
      // Pages only: not the API proxy (the API sets its own deny-all policy), build assets or files with an extension
      // (public images, sw.js, robots.txt, the offline page).
      source: "/((?!api/|_next/static|_next/image|.*\\.[A-Za-z0-9]+$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
