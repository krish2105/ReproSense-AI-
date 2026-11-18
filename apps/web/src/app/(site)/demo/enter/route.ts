import { NextResponse, type NextRequest } from "next/server";
import { API_URL } from "@/lib/api/server";

// One-tap entry for the staff views (header "Clinician", "Clinic network" and the clinic admin). Before, a visitor who was not signed in
// as that role landed back on /demo with a notice while the button sat below eight people, so the click looked dead.
// Demo mode only: the API refuses demo logins outside demo mode, and then she lands on /demo with the notice.
const AREAS = { clinician: "/clinic", admin: "/admin", clinic_admin: "/clinic-admin" } as const;
type StaffRole = keyof typeof AREAS;

export async function GET(req: NextRequest) {
  const role = req.nextUrl.searchParams.get("role") as StaffRole | null;
  const fallback = new URL(`/demo${role && role in AREAS ? `?need=${role}` : ""}`, req.url);
  if (!role || !(role in AREAS)) return NextResponse.redirect(fallback);
  try {
    const login = await fetch(new URL("/v1/demo/login", API_URL), {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ role }),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    const cookies = login.headers.getSetCookie();
    if (!login.ok || cookies.length === 0) return NextResponse.redirect(fallback);
    const res = NextResponse.redirect(new URL(AREAS[role], req.url));
    for (const c of cookies) res.headers.append("set-cookie", c);
    res.headers.set("cache-control", "no-store");
    return res;
  } catch {
    return NextResponse.redirect(fallback);
  }
}
