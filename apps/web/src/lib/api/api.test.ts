import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (n: string) => (n === "rs_token" ? { value: "tok123" } : undefined) }),
}));

import { apiClient } from "./client";
import { ApiError } from "./errors";
import { apiServer, apiUrl } from "./server";

afterEach(() => vi.unstubAllGlobals());

function stubFetch(status: number, body: unknown) {
  const fn = vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } }));
  vi.stubGlobal("fetch", fn);
  return fn;
}

describe("apiServer", () => {
  it("calls /v1 on the API and forwards only the rs_token cookie", async () => {
    const fn = stubFetch(200, { ok: true });
    await apiServer("/me/home", { query: { lang: "ar", skip: undefined } });
    const [url, init] = fn.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://127.0.0.1:8010/v1/me/home?lang=ar");
    const headers = init.headers as Record<string, string>;
    expect(headers.cookie).toBe("rs_token=tok123");
    expect(headers.authorization).toBeUndefined();
    expect(init.cache).toBe("no-store");
  });
  it("throws ApiError with the FastAPI detail", async () => {
    stubFetch(403, { detail: "This needs the clinician role." });
    await expect(apiServer("/clinic/patients")).rejects.toEqual(new ApiError(403, "This needs the clinician role."));
  });
  it("builds URLs with encoded query values", () => {
    expect(apiUrl("/analytics", { months: 6 })).toBe("http://127.0.0.1:8010/v1/analytics?months=6");
  });
});

describe("apiClient", () => {
  it("goes through the same-origin proxy with a JSON body", async () => {
    const fn = stubFetch(200, { role: "patient" });
    await apiClient("/demo/login", { body: { persona: "noura" } });
    const [url, init] = fn.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/v1/demo/login");
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("same-origin");
    expect(init.body).toBe(JSON.stringify({ persona: "noura" }));
  });
  it("joins validation errors into one detail", async () => {
    stubFetch(422, { detail: [{ msg: "field required" }, { msg: "bad value" }] });
    await expect(apiClient("/logs", { body: {} })).rejects.toEqual(new ApiError(422, "field required; bad value"));
  });
});
