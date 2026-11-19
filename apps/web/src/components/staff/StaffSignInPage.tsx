import "server-only";
import { getLocale } from "next-intl/server";
import { isLocale } from "@/i18n/config";
import { apiServer } from "@/lib/api/server";
import type { SessionsList, StaffMe } from "@/lib/api/types";
import { clockTime, lastActive } from "@/lib/when";
import { StaffSignInPanel } from "./StaffSignInPanel";

/** Your sign-in, for one staff area (the area's layout has already checked the role). */
export async function StaffSignInPage({ door }: { door: "/staff/signin" | "/doh/signin" }) {
  const raw = await getLocale();
  const locale = isLocale(raw) ? raw : "en";
  const [me, sessions] = await Promise.all([apiServer<StaffMe>("/staff-auth/me"), apiServer<SessionsList>("/sessions")]);
  const times = { endsAt: clockTime(me.session.expires_at, locale), lastActive: lastActive(sessions.sessions, locale) };
  return <StaffSignInPanel me={me} sessions={sessions} door={door} locale={locale} times={times} />;
}
