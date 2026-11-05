"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "./Icon";

/**
 * Native modal <dialog>: the page behind becomes inert, Esc closes it, focus moves in and returns to the opener.
 * Controlled: render with open={true}; onClose fires for Esc, the close button and a click on the backdrop.
 */
export function Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const t = useTranslations("states");

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      d.showModal();
    } else if (!open && d.open) {
      d.close();
    }
  }, [open]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const onNativeClose = () => {
      onClose();
      opener.current?.focus();
    };
    d.addEventListener("close", onNativeClose);
    return () => d.removeEventListener("close", onNativeClose);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      className="dlg"
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === ref.current) ref.current?.close(); // click on the backdrop, outside the panel
      }}
    >
      <div className="panel">
        <div className="dlg-head">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="icon-btn" onClick={() => ref.current?.close()} aria-label={t("close")}>
            <Icon name="close" size={18} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
