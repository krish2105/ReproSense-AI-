import { Platform } from "react-native";
import { ApiError, errorDetail } from "./errors";

// The Android emulator reaches the host computer at 10.0.2.2; the iOS simulator at 127.0.0.1.
const LOCAL_API = Platform.OS === "android" ? "http://10.0.2.2:8010" : "http://127.0.0.1:8010";

/** EXPO_PUBLIC_API_URL is set for store and preview builds (the live API); development uses the local API. */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || LOCAL_API).replace(/\/$/, "");

/** Same limit as the web app (API_TIMEOUT_MS): a hung API shows the error state instead of a spinner. */
export const API_TIMEOUT_MS = 15_000;

export interface Call {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  token?: string | null;
  timeoutMs?: number;
}

/** Calls /v1{path} with the bearer token. Throws ApiError: status 0 means the API could not be reached in time. */
export async function api<T>(path: string, call: Call = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), call.timeoutMs ?? API_TIMEOUT_MS);
  const headers: Record<string, string> = { accept: "application/json" };
  if (call.body !== undefined) headers["content-type"] = "application/json";
  if (call.token) headers.authorization = `Bearer ${call.token}`;
  try {
    const res = await fetch(`${API_URL}/v1${path}`, {
      method: call.method ?? (call.body === undefined ? "GET" : "POST"),
      headers,
      body: call.body === undefined ? undefined : JSON.stringify(call.body),
      signal: controller.signal,
      // Bearer only: no cookie is stored or sent, so the token in SecureStore is the one session on the phone (docs/21).
      credentials: "omit",
    });
    if (!res.ok) throw new ApiError(res.status, await errorDetail(res));
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    const name = (e as { name?: string } | null)?.name;
    throw new ApiError(0, name === "AbortError" ? "The server took too long to answer." : "The server could not be reached.");
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Uploads multipart/form-data (lab reports). Same bearer-only rule and timeout handling as api(). Expo's fetch takes
 * file parts that are Blobs (an expo-file-system File is one), not React Native's { uri, name, type } objects.
 */
export async function apiUpload<T>(path: string, form: FormData, token: string | null, timeoutMs = 30_000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const headers: Record<string, string> = { accept: "application/json" };
  if (token) headers.authorization = `Bearer ${token}`;
  try {
    const res = await fetch(`${API_URL}/v1${path}`, { method: "POST", headers, body: form, signal: controller.signal, credentials: "omit" });
    if (!res.ok) throw new ApiError(res.status, await errorDetail(res));
    return (await res.json()) as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    const name = (e as { name?: string } | null)?.name;
    throw new ApiError(0, name === "AbortError" ? "The server took too long to answer." : "The server could not be reached.");
  } finally {
    clearTimeout(timer);
  }
}
