import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { apiServer } from "./api/server";
import { ApiError } from "./api/errors";
import type { PersonasResponse, Role, WhoAmI } from "./api/types";

/** The signed-in demo actor, or null when there is no valid session. Cached per request (layout + page share it). */
export const getSession = cache(async (): Promise<WhoAmI | null> => {
  try {
    return await apiServer<WhoAmI>("/demo/whoami");
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) return null;
    throw e;
  }
});

/** Guards a role-separated area (CLAUDE.md rule 9). redirect() is called outside any try/catch on purpose. */
export async function requireRole(role: Role): Promise<WhoAmI> {
  const me = await getSession();
  if (!me) redirect("/demo");
  if (me.role !== role) redirect(`/demo?need=${role}`);
  return me;
}

/** The demo roster (public, no session needed). Cached per request. */
export const getPersonas = cache(() => apiServer<PersonasResponse>("/demo/personas"));
