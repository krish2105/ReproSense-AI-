import type { SessionEnded } from "./api/errors";
import type { Role } from "./api/types";

// The sign-in doors (staff and DoH sign-in, the team's plan section 5). Each role has its own door and area; patient
// and staff interfaces stay separate (CLAUDE.md rule 9).
export const AREA: Record<Role, string> = { patient: "/app", clinician: "/clinic", clinic_admin: "/clinic-admin", admin: "/admin" };
export const DOOR: Record<Role, string> = { patient: "/signin", clinician: "/staff/signin", clinic_admin: "/staff/signin", admin: "/doh/signin" };
export type StaffRole = Exclude<Role, "patient">;

/** The area a path belongs to, or null for public pages. */
export function roleOfPath(path: string): Role | null {
  if (/^\/clinic-admin(\/|$)/.test(path)) return "clinic_admin";
  if (/^\/clinic(\/|$)/.test(path)) return "clinician";
  if (/^\/admin(\/|$)/.test(path)) return "admin";
  if (/^\/app(\/|$)/.test(path)) return "patient";
  return null;
}

/** Where a session that ended goes: the role's door, with the reason (and, for staff, the area for the one-tap demo). */
export function endedPath(role: Role, reason: SessionEnded): string {
  const q = new URLSearchParams({ ended: reason });
  if (role !== "patient") q.set("area", role);
  return `${DOOR[role]}?${q.toString()}`;
}

export function isStaffRole(v: string | undefined | null): v is StaffRole {
  return v === "clinician" || v === "clinic_admin" || v === "admin";
}

export function isEnded(v: string | undefined | null): v is SessionEnded {
  return v === "idle" || v === "max" || v === "revoked" || v === "expired";
}
