import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { apiServer } from "./api/server";
import { ApiError, type SessionEnded } from "./api/errors";
import type { PersonasResponse, Role, WhoAmI } from "./api/types";
import { endedPath } from "./doors";
import { isDemoPersonaId, safeReturnPath } from "./return-path";

/** docs/31 §B: the fictional woman this browser last opened (backend/app/security/auth.py DEMO_PERSONA_COOKIE). */
const DEMO_PERSONA_COOKIE = "rs_demo_persona";

/** The signed-in actor, or why a session this browser holds has ended (idle, 8-hour limit, signed out). Cached per
 *  request (layout + page share it). */
export const getSessionState = cache(async (): Promise<{ me: WhoAmI | null; ended: SessionEnded | null }> => {
  try {
    return { me: await apiServer<WhoAmI>("/demo/whoami"), ended: null };
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) return { me: null, ended: e.ended };
    throw e;
  }
});

/** The signed-in actor, or null when there is no valid session. */
export const getSession = cache(async (): Promise<WhoAmI | null> => (await getSessionState()).me);

/** Guards a role-separated area (CLAUDE.md rule 9). redirect() is called outside any try/catch on purpose. */
export async function requireRole(role: Role): Promise<WhoAmI> {
  const { me, ended } = await getSessionState();
  if (me?.role === role) return me;
  // A session that ended (30 idle minutes, the 8-hour limit, signed out) goes to its door with a notice saying why;
  // the door still offers the one-tap demo, so judges are one tap from where they were. Her expired 12 hours keep the
  // old way back (pick a woman on /demo).
  if (ended && !me && !(role === "patient" && ended === "expired")) redirect(endedPath(role, ended));
  // docs/31 §B: Back always works. The demo holds one sign-in at a time, so a staff view replaces hers; coming back,
  // she is signed in again and lands on the exact page she left. Staff views open in one tap the same way. Her app
  // needs a woman: the one this browser last opened (rs_demo_persona, set by the API), else the roster.
  const here = safeReturnPath(role, (await headers()).get("x-pathname"));
  if (role === "patient") {
    const persona = (await cookies()).get(DEMO_PERSONA_COOKIE)?.value;
    if (isDemoPersonaId(persona)) redirect(`/demo/enter?role=patient&persona=${persona}&next=${encodeURIComponent(here)}`);
    redirect("/demo?need=patient");
  }
  redirect(`/demo/enter?role=${role}&next=${encodeURIComponent(here)}`);
}

/** The demo roster (public, no session needed). Cached per request. */
export const getPersonas = cache(() => apiServer<PersonasResponse>("/demo/personas"));
