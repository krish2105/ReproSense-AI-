"use client";

import { useTranslations } from "next-intl";
import { type CSSProperties, type MouseEvent, type ReactNode, useState } from "react";
import { fetchPdf, PdfNotReady } from "@/lib/pdf";

// A PDF link that still works without JavaScript, but with it waits while the API is rendering the PDF instead of
// saving the 503 error as a file (src/lib/pdf.ts). Ctrl/Cmd/middle clicks keep the browser's own behaviour.
export function PdfLink({
  href,
  download,
  newTab = false,
  className,
  style,
  children,
}: {
  href: string;
  download?: string;
  newTab?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const t = useTranslations("states");
  const [state, setState] = useState<"idle" | "busy" | "failed" | "gone">("idle");

  const onClick = async (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (state === "busy") return;
    // Open the tab now, inside the click, or the browser blocks it as a pop-up once the PDF arrives.
    const win = newTab ? window.open("", "_blank") : null;
    if (win) win.document.title = t("pdfPreparing");
    setState("busy");
    try {
      const url = URL.createObjectURL(await fetchPdf(href));
      if (newTab) {
        if (win) win.location.href = url;
        else window.location.assign(url);
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.download = download ?? "";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setState("idle");
    } catch (err) {
      win?.close();
      // 404/401/403: the report or her record no longer exists (e.g. after a demo reset), so waiting won't help.
      const status = err instanceof PdfNotReady ? err.status : 0;
      setState(status === 404 || status === 401 || status === 403 ? "gone" : "failed");
    }
  };

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap", ...style }}>
      <a
        className={className}
        href={href}
        download={download}
        target={newTab ? "_blank" : undefined}
        rel={newTab ? "noopener" : undefined}
        aria-busy={state === "busy"}
        onClick={onClick}
      >
        {children}
      </a>
      <span role="status" className="xs dim">
        {state === "busy" ? t("pdfPreparing") : state === "failed" ? t("pdfFailed") : state === "gone" ? t("pdfGone") : ""}
      </span>
    </span>
  );
}
