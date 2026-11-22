import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { apiServer } from "./api/server";
import { ApiError, type SessionEnded } from "./api/errors";
import type { PersonasResponse, Role, WhoAmI } from "./api/types";
import { endedPath } from "./doors";

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
  // Staff views open in one tap (demo sign-in, then straight in); her app needs her to pick a woman first.
  redirect(role === "patient" ? "/demo?need=patient" : `/demo/enter?role=${role}`);
}

/** The demo roster (public, no session needed). Cached per request. */
export const getPersonas = cache(() => apiServer<PersonasResponse>("/demo/personas"));
