import { describe, expect, it } from "vitest";
import { endedPath, isEnded, isStaffRole, roleOfPath } from "./doors";

describe("sign-in doors", () => {
  it("knows each area from its path, and nothing else", () => {
    expect(roleOfPath("/clinic")).toBe("clinician");
    expect(roleOfPath("/clinic/patients/noura")).toBe("clinician");
    expect(roleOfPath("/clinic-admin/sign-in")).toBe("clinic_admin");
    expect(roleOfPath("/admin")).toBe("admin");
    expect(roleOfPath("/app/privacy")).toBe("patient");
    expect(roleOfPath("/clinic-invite/abc")).toBeNull();
    expect(roleOfPath("/staff/signin")).toBeNull();
    expect(roleOfPath("/")).toBeNull();
  });
  it("sends an ended session to its own door with the reason", () => {
    expect(endedPath("clinician", "idle")).toBe("/staff/signin?ended=idle&area=clinician");
    expect(endedPath("clinic_admin", "max")).toBe("/staff/signin?ended=max&area=clinic_admin");
    expect(endedPath("admin", "revoked")).toBe("/doh/signin?ended=revoked&area=admin");
    expect(endedPath("patient", "revoked")).toBe("/signin?ended=revoked");
  });
  it("accepts only known roles and reasons from a URL", () => {
    expect(isStaffRole("admin")).toBe(true);
    expect(isStaffRole("patient")).toBe(false);
    expect(isStaffRole("root")).toBe(false);
    expect(isEnded("idle")).toBe(true);
    expect(isEnded("<script>")).toBe(false);
  });
});
