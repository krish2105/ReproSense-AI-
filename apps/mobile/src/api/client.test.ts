import { api, API_URL } from "./client";
import { ApiError } from "./errors";

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
  jest.useRealTimers();
});

function respond(status: number, body: unknown) {
  return Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } }));
}

test("sends her token as a bearer header and parses the JSON", async () => {
  const fetchMock = jest.fn((_url: RequestInfo | URL, _init?: RequestInit) => respond(200, { ok: true }));
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  await expect(api<{ ok: boolean }>("/me/home?lang=en", { token: "tok-1" })).resolves.toEqual({ ok: true });
  const [url, init] = fetchMock.mock.calls[0]!;
  expect(url).toBe(`${API_URL}/v1/me/home?lang=en`);
  expect((init?.headers as Record<string, string>).authorization).toBe("Bearer tok-1");
  expect(init?.credentials).toBe("omit"); // no session cookie is kept on the phone
});

test("a POST sends JSON", async () => {
  const fetchMock = jest.fn((_url: RequestInfo | URL, _init?: RequestInit) => respond(200, { id: "x" }));
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  await api("/logs", { body: { date: "2026-11-22" }, token: "t" });
  const init = fetchMock.mock.calls[0]![1]!;
  expect(init.method).toBe("POST");
  expect((init.headers as Record<string, string>)["content-type"]).toBe("application/json");
  expect(init.body).toBe(JSON.stringify({ date: "2026-11-22" }));
});

test("a 401 becomes an ApiError with the API's detail", async () => {
  globalThis.fetch = jest.fn(() => respond(401, { detail: "Sign in again" })) as unknown as typeof fetch;
  await expect(api("/me/home")).rejects.toEqual(new ApiError(401, "Sign in again"));
});

test("a hung API gives up after the timeout with status 0", async () => {
  globalThis.fetch = jest.fn(
    (_url: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })));
      }),
  ) as unknown as typeof fetch;
  const err = await api("/me/home", { timeoutMs: 20 }).catch((e: unknown) => e);
  expect(err).toBeInstanceOf(ApiError);
  expect((err as ApiError).status).toBe(0);
  expect((err as ApiError).detail).toMatch(/too long/);
});
