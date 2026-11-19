// Copied from apps/web/src/lib/api/errors.ts by apps/mobile/scripts/sync-shared.mjs. Edit the web file, then run npm run sync.
/** Why the API refused a session it once issued (header X-Session-Ended): staff idle for 30 minutes, past the 8-hour
 *  limit, signed out (here or everywhere), or expired. */
export type SessionEnded = "idle" | "max" | "revoked" | "expired";
const ENDED: readonly SessionEnded[] = ["idle", "max", "revoked", "expired"];

/** An API call that returned a non-2xx status. `detail` is the FastAPI "detail" message when there is one. `ended`
 *  says why a session stopped working; `stepUp` that an export needs a fresh passkey check first. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: string,
    public readonly ended: SessionEnded | null = null,
    public readonly stepUp: boolean = false,
  ) {
    super(`API ${status}: ${detail}`);
    this.name = "ApiError";
  }
}

/** Builds the ApiError for a failed response, reading the session and step-up headers. */
export async function apiError(res: Response): Promise<ApiError> {
  const h = res.headers.get("x-session-ended");
  const ended = res.status === 401 && ENDED.includes(h as SessionEnded) ? (h as SessionEnded) : null;
  const stepUp = res.status === 403 && res.headers.get("x-step-up") === "required";
  return new ApiError(res.status, await errorDetail(res), ended, stepUp);
}

/** Reads FastAPI's {"detail": "..."} (or a validation list) from an error response. */
export async function errorDetail(res: Response): Promise<string> {
  try {
    const body: unknown = await res.json();
    if (body && typeof body === "object" && "detail" in body) {
      const d = (body as { detail: unknown }).detail;
      if (typeof d === "string") return d;
      if (Array.isArray(d)) {
        return d
          .map((x) => (x && typeof x === "object" && "msg" in x ? String((x as { msg: unknown }).msg) : String(x)))
          .join("; ");
      }
    }
  } catch {
    /* not JSON */
  }
  return res.statusText || `HTTP ${res.status}`;
}
