"use client";

import { useTranslations } from "next-intl";
import { ApiError } from "@/lib/api/errors";
import { passkeyProblem } from "@/lib/passkey";

/** One sentence for what went wrong at a staff or DoH door: the API's own message, or what happened in the device
 *  prompt (closed, unsupported, already saved). */
export function useStaffProblem(): (e: unknown) => string {
  const t = useTranslations("staffAuth.problem");
  return (e) => {
    if (e instanceof ApiError) return t("failed", { detail: e.detail });
    const p = passkeyProblem(e);
    return p === "failed" ? t("failed", { detail: e instanceof Error ? e.message : String(e) }) : t(p);
  };
}
