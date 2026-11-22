// docs/31 §H, H2: the web app's own server vouches for the visitor's address when it calls the API. With EDGE_SECRET
// set on both hosts, the API trusts the leftmost X-Forwarded-For entry only from requests carrying x-rs-edge; anyone
// calling the API directly counts against the address its own proxy saw. EDGE_SECRET is a server-only variable (never
// NEXT_PUBLIC_), so it never reaches a browser. Unset (development, tests): nothing is added, behaviour as before.

/** The visitor's address from the platform's X-Forwarded-For (Vercel puts the visitor first), or null. */
export function visitorAddress(xff: string | null | undefined): string | null {
  const first = (xff ?? "").split(",")[0]?.trim();
  return first && /^[0-9a-fA-F:.]{2,45}$/.test(first) ? first : null; // an IPv4 or IPv6 literal, nothing else
}

/** Headers for a server-side call to the API on behalf of the visitor whose request carried `incomingXff`. */
export function edgeHeaders(incomingXff: string | null | undefined, secret: string | undefined = process.env.EDGE_SECRET): Record<string, string> {
  if (!secret) return {};
  const visitor = visitorAddress(incomingXff);
  return visitor ? { "x-rs-edge": secret, "x-forwarded-for": visitor } : { "x-rs-edge": secret };
}
