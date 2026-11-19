import "server-only";
import { getTranslations } from "next-intl/server";
import { apiServer } from "@/lib/api/server";
import { isEnded, isStaffRole, type StaffRole } from "@/lib/doors";

export interface DoorParams {
  ended?: string;
  area?: string;
  signed_out?: string;
}
export interface SessionRules {
  idle_minutes: number;
  max_hours: number;
  step_up_minutes: number;
  patient_hours: number;
}
const FALLBACK: SessionRules = { idle_minutes: 30, max_hours: 8, step_up_minutes: 5, patient_hours: 12 };

/** The session rules as the API states them (public). If the API is down the door still renders, with the defaults. */
export async function sessionRules(): Promise<SessionRules> {
  try {
    return await apiServer<SessionRules>("/staff-auth/rules");
  } catch {
    return FALLBACK;
  }
}

/** The notice a staff or DoH door shows: why the last session ended, or that she signed out. Unknown values in the
 *  URL are ignored. Also the role whose one-tap demo area to offer first. */
export async function doorNotice(p: DoorParams): Promise<{ notice: string | null; area: StaffRole | null }> {
  const t = await getTranslations("staffAuth.ended");
  const area = isStaffRole(p.area) ? p.area : null;
  if (isEnded(p.ended)) {
    const rules = await sessionRules();
    return { notice: t(p.ended, { minutes: rules.idle_minutes, hours: rules.max_hours }), area };
  }
  return { notice: p.signed_out === "1" ? t("signedOut") : null, area };
}
