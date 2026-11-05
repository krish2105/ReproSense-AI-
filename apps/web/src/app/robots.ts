import type { MetadataRoute } from "next";

// Public pages may be crawled. Her app, the clinic, the network view and the API sit behind a demo sign-in, and
// /shared links carry a one-time token (those pages also send noindex), so crawlers are kept out of all of them.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/app/", "/clinic/", "/admin/", "/shared/", "/api/"] }],
  };
}
