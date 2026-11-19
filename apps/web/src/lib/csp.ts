// The web app's content security policy (docs/07, "Content security policy"). Built per request by src/proxy.ts with
// a fresh nonce: Next.js reads the nonce from the request's policy and puts it on its own scripts, and 'strict-dynamic'
// lets those scripts load the page's chunks. Any other script, including one typed into a note, is refused.

export interface CspOptions {
  nonce: string;
  /** Development only: React and Next use eval for debugging there (never in production). */
  dev?: boolean;
  /** The API's origin (API_URL). The browser talks to /api/v1 on this origin; the API origin is allowed as well. */
  apiOrigin?: string | null;
}

/** The origin of a URL, or null when it is missing or not http(s). */
export function originOf(url: string | undefined | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:" ? u.origin : null;
  } catch {
    return null;
  }
}

export function contentSecurityPolicy({ nonce, dev = false, apiOrigin = null }: CspOptions): string {
  const connect = ["'self'", ...(apiOrigin ? [apiOrigin] : [])].join(" ");
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    // React writes style="" attributes into the server HTML (and the offline page has a <style> block); a nonce
    // cannot cover attributes, so inline styles stay allowed. Scripts never are.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src ${connect}`,
    // The service worker (/sw.js) and any worker a 3D or charting library starts from a blob.
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "media-src 'self' blob:",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

/** A fresh, unguessable nonce (128 bits) for one response. */
export function newNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes));
}
