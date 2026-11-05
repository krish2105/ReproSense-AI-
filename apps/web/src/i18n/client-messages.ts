import "server-only";
import type { AbstractIntlMessages } from "next-intl";
import { getMessages } from "next-intl/server";

// Only the namespaces that client components in an area read are sent to the browser; server components read
// every message on the server. Keeps each page's payload small (the full catalogue is ~70 kB).
export const SHARED_CLIENT = ["chrome", "states", "tags", "urgent", "stages", "regions", "safety"] as const;
export const AREA_CLIENT = {
  site: ["demo", "landing", "tokens", "join", "joinClinician"],
  patient: ["tabs", "home", "navigator", "moods", "flows", "impacts", "sites", "symptoms", "log", "insights", "assistant", "report", "clinics", "checkin", "documents", "privacy"],
  clinic: ["clinic", "insights"],
  admin: ["admin", "clinic"],
} as const;

export async function clientMessages(area?: keyof typeof AREA_CLIENT): Promise<AbstractIntlMessages> {
  const all = await getMessages();
  const keys = [...SHARED_CLIENT, ...(area ? AREA_CLIENT[area] : [])];
  return Object.fromEntries(keys.filter((k) => k in all).map((k) => [k, all[k]])) as AbstractIntlMessages;
}
