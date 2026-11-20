import { describe, expect, it, vi } from "vitest";
import { fetchPdf, PdfNotReady, retryDelayMs } from "./pdf";

const pdf = () => new Response(new Blob(["%PDF-1.7"]), { status: 200, headers: { "content-type": "application/pdf" } });
const busy = (after = "5") =>
  new Response(JSON.stringify({ detail: "The report is still being prepared." }), {
    status: 503,
    headers: { "content-type": "application/json", "retry-after": after },
  });

describe("fetchPdf", () => {
  it("waits through 503s and returns the PDF (the first download after the API wakes)", async () => {
    const f = vi.fn().mockResolvedValueOnce(busy()).mockResolvedValueOnce(busy()).mockResolvedValueOnce(pdf());
    const sleep = vi.fn().mockResolvedValue(undefined);
    const blob = await fetchPdf("/api/v1/reports/4.pdf", 8, { fetch: f, sleep });
    expect(await blob.text()).toBe("%PDF-1.7");
    expect(f).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledWith(5000);
  });

  it("never hands back the JSON error as a PDF", async () => {
    const f = vi.fn().mockResolvedValue(busy());
    const sleep = vi.fn().mockResolvedValue(undefined);
    await expect(fetchPdf("/x.pdf", 3, { fetch: f, sleep })).rejects.toBeInstanceOf(PdfNotReady);
    expect(f).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it("does not retry a missing report or a signed-out session", async () => {
    for (const status of [401, 404]) {
      const f = vi.fn().mockResolvedValue(new Response("{}", { status }));
      const sleep = vi.fn();
      await expect(fetchPdf("/x.pdf", 5, { fetch: f, sleep })).rejects.toMatchObject({ status });
      expect(f).toHaveBeenCalledTimes(1);
      expect(sleep).not.toHaveBeenCalled();
    }
  });
});

describe("retryDelayMs", () => {
  it("follows Retry-After, kept between 1 and 10 seconds", () => {
    expect(retryDelayMs("5")).toBe(5000);
    expect(retryDelayMs("120")).toBe(10000);
    expect(retryDelayMs("0")).toBe(3000);
    expect(retryDelayMs(null)).toBe(3000);
    expect(retryDelayMs("soon")).toBe(3000);
  });
});
