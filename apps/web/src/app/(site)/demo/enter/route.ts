import { NextResponse, type NextRequest } from "next/server";
import { edgeHeaders } from "@/lib/api/edge";
import { API_URL } from "@/lib/api/server";
import { AREA_HOME, isDemoPersonaId, safeReturnPath, type DemoRole } from "@/lib/return-path";

// One-tap entry for the views, and the way back into them (docs/31 §B).
// - Staff: the header's "Clinician", "Clinic network" and "Clinic admin" sign in on the way. Before, a visitor who was
//   not signed in as that role landed back on /demo with a notice while the button sat below eight people, so the click
//   looked dead.
// - Her app: Back after a staff view signs the woman this browser last opened back in (role=patient&persona=noura).
// `next` lands on the exact page she left, but only inside that role's own area (lib/return-path.ts).
// Demo mode only: the API refuses demo logins outside demo mode, and then she lands on /demo with the notice.
// Server redirects throughout, so this route never becomes a history entry and Back never lands on it.
const ROLES = Object.keys(AREA_HOME) as DemoRole[];
const PERSONA_COOKIE = "rs_demo_persona";
// A sign-in that fails to stick (a cookie the browser refuses) would bounce between this route and the area forever.
// Count entries per browser for 10 seconds; a person never switches views 6 times in 10 seconds, a loop does in under one.
const COUNTER = "rs_enter_n";
const LOOP_LIMIT = 6;

function count(res: NextResponse, n: number): NextResponse {
  res.cookies.set(COUNTER, String(n), { httpOnly: true, sameSite: "lax", path: "/demo", maxAge: 10 });
  res.headers.set("cache-control", "no-store");
  return res;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const role = q.get("role") as DemoRole | null;
  const persona = q.get("persona");
  const n = Number.parseInt(req.cookies.get(COUNTER)?.value ?? "0", 10) || 0;
  const known = role !== null && ROLES.includes(role);
  const fallback = new URL(`/demo${known ? `?need=${role}` : ""}`, req.url);
  if (!known || n >= LOOP_LIMIT || (role === "patient" && !isDemoPersonaId(persona))) {
    const res = NextResponse.redirect(fallback);
    if (role === "patient") res.cookies.delete(PERSONA_COOKIE); // a hint that cannot sign her in is dropped
    return count(res, n + 1);
  }
  const next = safeReturnPath(role, q.get("next"));
  try {
    const login = await fetch(new URL("/v1/demo/login", API_URL), {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json", ...edgeHeaders(req.headers.get("x-forwarded-for")) },
      body: JSON.stringify(role === "patient" ? { role, persona } : { role }),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    const cookies = login.headers.getSetCookie();
    if (!login.ok || cookies.length === 0) {
      const res = NextResponse.redirect(fallback);
      if (role === "patient") res.cookies.delete(PERSONA_COOKIE);
      return count(res, n + 1);
    }
    // The counter first: res.cookies rewrites the whole Set-Cookie header, so the session cookies are appended last.
    const res = count(NextResponse.redirect(new URL(next, req.url)), n + 1);
    for (const c of cookies) res.headers.append("set-cookie", c);
    return res;
  } catch {
    return count(NextResponse.redirect(fallback), n + 1);
  }
}
