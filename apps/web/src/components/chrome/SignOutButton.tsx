"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { enterAs } from "@/lib/enter";

/** Sign out that really signs out (plan section 5): the API revokes this session's token, so a copied cookie stops
 *  working too, then the door opens with a notice. A session that already ended still leaves cleanly. */
export function SignOutButton({ door }: { door: string }) {
  const t = useTranslations("chrome");
  const [busy, setBusy] = useState(false);
  const out = async () => {
    setBusy(true);
    try {
      await fetch("/api/v1/sessions/sign-out", { method: "POST", credentials: "same-origin", headers: { accept: "application/json" } });
    } catch {
      /* offline: the door still opens; the cookie is cleared by the next sign-in */
    }
    enterAs(`${door}?signed_out=1`);
  };
  return (
    <button type="button" className="nav-out" onClick={out} disabled={busy} aria-busy={busy || undefined}>
      {t("signOut")}
    </button>
  );
}
