import { endedPath, roleOfPath } from "../doors";
import { apiError } from "./errors";

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
  if (!res.ok) {
    const err = await apiError(res);
    // A session that ended (30 idle minutes, the 8-hour limit, signed out elsewhere): open the area's sign-in door with
    // a notice that says why, instead of an error under a button. Public pages have no area and keep the error.
    const role = typeof window === "undefined" ? null : roleOfPath(window.location.pathname);
    if (err.ended && role) window.location.assign(endedPath(role, err.ended));
    throw err;
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
