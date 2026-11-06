import "server-only";
import { cookies } from "next/headers";
import { ApiError, errorDetail } from "./errors";

export const API_URL = process.env.API_URL ?? "http://127.0.0.1:8010";
// A hung API (a sleeping free instance can take ~30-60 s to wake) shows the error screen with Retry, not a spinner.
const API_TIMEOUT_MS = Number(process.env.API_TIMEOUT_MS) || 15_000;
export const SESSION_COOKIE = "rs_token";

type Query = Record<string, string | number | boolean | undefined>;
export interface ServerCall {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Query;
}

export function apiUrl(path: string, query?: Query): string {
  const url = new URL(`/v1${path}`, API_URL);
  for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined) url.searchParams.set(k, String(v));
  return url.toString();
}

/**
 * Server components call the API directly and forward ONLY the rs_token cookie, as a cookie (not a bearer
 * header): the API's rate limiter keys requests by that cookie, so every SSR call doesn't share one IP bucket.
 */
export async function apiServer<T>(path: string, call: ServerCall = {}): Promise<T> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const headers: Record<string, string> = { accept: "application/json" };
  if (token) headers.cookie = `${SESSION_COOKIE}=${token}`;
  if (call.body !== undefined) headers["content-type"] = "application/json";
  const res = await fetch(apiUrl(path, call.query), {
    method: call.method ?? "GET",
    headers,
    body: call.body === undefined ? undefined : JSON.stringify(call.body),
    cache: "no-store",
    signal: AbortSignal.timeout(API_TIMEOUT_MS),
  });
  if (!res.ok) throw new ApiError(res.status, await errorDetail(res));
  return (await res.json()) as T;
}
