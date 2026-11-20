// Fetch a doctor PDF, waiting while the API is still rendering it.
//
// The API answers 503 + Retry-After when a render passes its time limit; the render keeps going and is cached, so the
// same request a few seconds later returns the PDF. A plain <a download> would instead save that JSON error as
// "report.pdf" (live check, 20 Nov: the first PDF after the free host woke). See backend/app/reports/render_pool.py.

export class PdfNotReady extends Error {
  constructor(public status: number) {
    super(`PDF not ready (${status})`);
  }
}

type Deps = { fetch: typeof fetch; sleep: (ms: number) => Promise<void> };
const defaults: Deps = { fetch: (...a) => fetch(...a), sleep: (ms) => new Promise((r) => setTimeout(r, ms)) };

/** Seconds to wait before the next try: the server's Retry-After, kept between 1 and 10. */
export function retryDelayMs(retryAfter: string | null): number {
  const s = Number(retryAfter);
  return Math.min(Math.max(Number.isFinite(s) && s > 0 ? s : 3, 1), 10) * 1000;
}

/** The PDF, after up to `tries` attempts. Throws PdfNotReady if it never arrives or the answer is not a PDF. */
export async function fetchPdf(href: string, tries = 8, deps: Deps = defaults): Promise<Blob> {
  let status = 0;
  for (let i = 0; i < tries; i++) {
    const r = await deps.fetch(href, { credentials: "same-origin", headers: { Accept: "application/pdf" } });
    status = r.status;
    if (r.ok && (r.headers.get("content-type") ?? "").includes("application/pdf")) return r.blob();
    if (r.status !== 503 || i === tries - 1) break;
    await deps.sleep(retryDelayMs(r.headers.get("retry-after")));
  }
  throw new PdfNotReady(status);
}
