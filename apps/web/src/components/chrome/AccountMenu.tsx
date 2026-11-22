"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { SignOutButton } from "./SignOutButton";

/** The staff Account menu (docs/31 §A): "Account & security" and "Sign out", in the same place in every staff area.
 *  A disclosure, not an ARIA menu: a button with aria-expanded and a list of ordinary controls, so links, Tab and screen
 *  readers behave as they do everywhere else. Esc or a click outside closes it and puts focus back on the button. */
export function AccountMenu({ href, door }: { href: string; door: string }) {
  const t = useTranslations("chrome");
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  return (
    <div className="acct" ref={box}>
      <button ref={button} type="button" className="acct-btn" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        {t("account")}
        <Icon name="chevron" size={14} className="acct-chev" />
      </button>
      <div id={id} className="acct-menu" hidden={!open}>
        <a href={href} aria-current={path === href ? "page" : undefined}>
          {t("nav.signIn")}
        </a>
        <SignOutButton door={door} className="acct-out" />
      </div>
    </div>
  );
}
