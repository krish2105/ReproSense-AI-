import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// The browser only ever talks to this origin. /api/v1/* is proxied to the FastAPI service, so the
// httpOnly rs_token cookie that /v1/demo/login sets is a same-origin cookie (HANDOFF.md §5).
const API_URL = process.env.API_URL ?? "http://127.0.0.1:8010";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  // The AI Chat mic uses the Web Speech API, so the microphone is allowed for this origin only.
  { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // A second build folder lets a dev server run beside `next start` (NEXT_DIST_DIR=.next-dev pnpm dev -p 3200).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  reactStrictMode: true,
  images: { formats: ["image/avif", "image/webp"] },
  // Metadata (description, OG) in <head> for every user agent, not streamed into the body.
  htmlLimitedBots: /.*/,
  async rewrites() {
    return [{ source: "/api/v1/:path*", destination: `${API_URL}/v1/:path*` }];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default createNextIntlPlugin("./src/i18n/request.ts")(nextConfig);
