import { describe, expect, it } from "vitest";
import { contentSecurityPolicy, newNonce, originOf } from "./csp";

function directives(policy: string): Record<string, string[]> {
  return Object.fromEntries(
    policy.split(";").map((d) => {
      const [name, ...values] = d.trim().split(/\s+/);
      return [name, values];
    }),
  );
}

describe("content security policy", () => {
  const p = directives(contentSecurityPolicy({ nonce: "abc123==", apiOrigin: "https://api.example.test" }));

  it("runs only this origin's scripts that carry the nonce, never inline or eval", () => {
    expect(p["script-src"]).toEqual(["'self'", "'nonce-abc123=='", "'strict-dynamic'"]);
    expect(p["script-src"]).not.toContain("'unsafe-inline'");
    expect(p["script-src"]).not.toContain("'unsafe-eval'");
  });

  it("keeps everything else to this origin, and nobody may frame the app", () => {
    expect(p["default-src"]).toEqual(["'self'"]);
    expect(p["connect-src"]).toEqual(["'self'", "https://api.example.test"]);
    expect(p["img-src"]).toEqual(["'self'", "data:", "blob:"]);
    expect(p["style-src"]).toEqual(["'self'", "'unsafe-inline'"]);
    expect(p["frame-ancestors"]).toEqual(["'none'"]);
    expect(p["base-uri"]).toEqual(["'self'"]);
    expect(p["form-action"]).toEqual(["'self'"]);
    expect(p["object-src"]).toEqual(["'none'"]);
    expect(p["worker-src"]).toEqual(["'self'", "blob:"]);
  });

  it("allows eval in development only", () => {
    expect(directives(contentSecurityPolicy({ nonce: "n", dev: true }))["script-src"]).toContain("'unsafe-eval'");
    expect(directives(contentSecurityPolicy({ nonce: "n" }))["connect-src"]).toEqual(["'self'"]);
  });

  it("uses a fresh, unguessable nonce for each response", () => {
    const seen = new Set(Array.from({ length: 50 }, newNonce));
    expect(seen.size).toBe(50);
    for (const n of seen) expect(n).toMatch(/^[A-Za-z0-9+/]{22}==$/);
  });

  it("takes only an http(s) origin from API_URL", () => {
    expect(originOf("http://127.0.0.1:8010/v1")).toBe("http://127.0.0.1:8010");
    expect(originOf("https://reprosense-api.onrender.com")).toBe("https://reprosense-api.onrender.com");
    expect(originOf("javascript:alert(1)")).toBeNull();
    expect(originOf("not a url")).toBeNull();
    expect(originOf(undefined)).toBeNull();
  });
});

describe("violation reports (docs/31 §H)", () => {
  it("asks the browser to report what it blocked, in both formats", async () => {
    const { contentSecurityPolicy: build, CSP_REPORT_PATH, REPORTING_ENDPOINTS } = await import("./csp");
    const p = build({ nonce: "n" });
    expect(p).toContain(`report-uri ${CSP_REPORT_PATH}`);
    expect(p).toContain("report-to csp");
    expect(REPORTING_ENDPOINTS).toBe('csp="/api/v1/csp-report"');
  });
});
