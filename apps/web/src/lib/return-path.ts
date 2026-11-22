// docs/31 §B: where a demo re-entry may land. Back to her app (or a staff view) signs her back in through /demo/enter
// and lands on the exact page she left, but only on a same-origin path inside that role's own area. Anything else (an
// absolute URL, "//evil", a backslash, another area, odd characters) falls back to the area's home, so the parameter
// can never become an open redirect.

export type DemoRole = "patient" | "clinician" | "admin" | "clinic_admin";

export const AREA_HOME: Record<DemoRole, string> = {
  patient: "/app",
  clinician: "/clinic",
  admin: "/admin",
  clinic_admin: "/clinic-admin",
};

const SAFE = /^\/(app|clinic|admin|clinic-admin)(\/[A-Za-z0-9._~%-]+)*\/?(\?[A-Za-z0-9._~%=&+-]*)?$/;

export function safeReturnPath(role: DemoRole, next: string | null | undefined): string {
  const home = AREA_HOME[role];
  if (typeof next !== "string" || next.length > 300) return home;
  const m = SAFE.exec(next);
  if (!m || `/${m[1]}` !== home) return home;
  const segments = next.split("?")[0]!.split("/");
  if (segments.some((seg) => seg === "." || seg === ".." || /%2e|%2f|%5c/i.test(seg))) return home; // no climbing out, encoded or not
  return next;
}

/** A fictional demo woman's public id from the roster ("noura"); never a record someone started on /join. */
export function isDemoPersonaId(id: string | null | undefined): id is string {
  return typeof id === "string" && /^[a-z][a-z0-9-]{0,39}$/.test(id) && !id.startsWith("guest-");
}
