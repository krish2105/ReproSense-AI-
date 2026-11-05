"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";

/** The two live controls on the token page: a real dialog and a real toast. */
export function TokenActions() {
  const t = useTranslations("tokens");
  const toast = useToast();
  const [open, setOpen] = useState(false);
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      <Button onClick={() => setOpen(true)}>{t("openDialog")}</Button>
      <Button variant="outline" onClick={() => toast(t("toastText"))}>
        {t("showToast")}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title={t("dialogTitle")}>
        <p className="s dim">{t("dialogBody")}</p>
      </Dialog>
    </div>
  );
}
