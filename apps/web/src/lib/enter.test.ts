import { describe, expect, it } from "vitest";
import { isSignedInArea } from "./enter";

describe("isSignedInArea", () => {
  it("matches the three signed-in areas and nothing public", () => {
    for (const href of ["/app", "/app/report", "/clinic", "/clinic/patients/noura", "/admin", "/app?x=1"]) expect(isSignedInArea(href)).toBe(true);
    for (const href of ["/", "/demo", "/status", "/tokens", "/shared/abc", "/apple", "/administer"]) expect(isSignedInArea(href)).toBe(false);
  });
});
