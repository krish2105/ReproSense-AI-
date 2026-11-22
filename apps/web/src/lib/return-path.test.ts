import { describe, expect, it } from "vitest";
import { isDemoPersonaId, safeReturnPath } from "./return-path";

describe("safeReturnPath (docs/31 §B)", () => {
  it("keeps a page inside the role's own area", () => {
    expect(safeReturnPath("patient", "/app/insights")).toBe("/app/insights");
    expect(safeReturnPath("patient", "/app")).toBe("/app");
    expect(safeReturnPath("clinician", "/clinic/patients/fatima")).toBe("/clinic/patients/fatima");
    expect(safeReturnPath("clinic_admin", "/clinic-admin/sign-in")).toBe("/clinic-admin/sign-in");
    expect(safeReturnPath("admin", "/admin?from=2026-11-01&to=2026-11-22")).toBe("/admin?from=2026-11-01&to=2026-11-22");
  });

  it("never leaves the area or the site", () => {
    for (const bad of [
      "https://evil.example/app",
      "//evil.example/app",
      "/\\evil.example",
      "/app/../clinic",
      "/app/%2e%2e/clinic",
      "/app/%2Fevil",
      "/app//x",
      "/clinic-admin",
      "/app<script>",
      "javascript:alert(1)",
      "",
      null,
      undefined,
      `/app/${"a".repeat(400)}`,
    ]) {
      expect(safeReturnPath("patient", bad as string | null | undefined)).toBe("/app");
    }
    expect(safeReturnPath("clinician", "/clinic-admin")).toBe("/clinic"); // a different area, not a prefix match
    expect(safeReturnPath("clinician", "/app/insights")).toBe("/clinic");
  });
});

describe("isDemoPersonaId", () => {
  it("accepts roster ids and refuses joined records and junk", () => {
    expect(isDemoPersonaId("noura")).toBe(true);
    expect(isDemoPersonaId("guest-1a2b")).toBe(false);
    expect(isDemoPersonaId("Noura")).toBe(false);
    expect(isDemoPersonaId("noura;admin")).toBe(false);
    expect(isDemoPersonaId(undefined)).toBe(false);
  });
});
