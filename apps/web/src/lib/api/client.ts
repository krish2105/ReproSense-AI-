import { ApiError, errorDetail } from "./errors";

export interface ClientCall {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
}

/** Browser-side call through the same-origin proxy (/api/v1/* → the API), so the httpOnly cookie rides along. */
export async function apiClient<T>(path: string, call: ClientCall = {}): Promise<T> {
  const res = await fetch(`/api/v1${path}`, {
    method: call.method ?? (call.body === undefined ? "GET" : "POST"),
    headers: call.body === undefined ? { accept: "application/json" } : { accept: "application/json", "content-type": "application/json" },
    body: call.body === undefined ? undefined : JSON.stringify(call.body),
    credentials: "same-origin",
    signal: call.signal,
  });
  if (!res.ok) throw new ApiError(res.status, await errorDetail(res));
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
