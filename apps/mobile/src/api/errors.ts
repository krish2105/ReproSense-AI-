// Copied from apps/web/src/lib/api/errors.ts by apps/mobile/scripts/sync-shared.mjs. Edit the web file, then run npm run sync.
/** An API call that returned a non-2xx status. `detail` is the FastAPI "detail" message when there is one. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: string,
  ) {
    super(`API ${status}: ${detail}`);
    this.name = "ApiError";
  }
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
