import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { BrandMark } from "./BrandMark";
import { DemoBadge } from "./DemoBadge";
import { LangToggle } from "./LangToggle";
import { NavLinks, type NavItem } from "./NavLinks";
import { ThemeToggle } from "./ThemeToggle";

export type HeaderVariant = "site" | "patient" | "clinic" | "admin";

/** Glass pill header from the mockup (.top / .brand / .nav / .util). Each area gets its own nav (CLAUDE.md rule 9). */
export function SiteHeader({ variant, extra }: { variant: HeaderVariant; extra?: ReactNode }) {
  const t = useTranslations("chrome");
  const all: Record<string, NavItem> = {
    product: { href: "/", label: t("nav.product") },
    status: { href: "/status", label: t("nav.status") },
    demo: { href: "/demo", label: t("nav.demo") },
    app: { href: "/app", label: t("nav.app") },
    clinic: { href: "/clinic", label: t("nav.clinic") },
    admin: { href: "/admin", label: t("nav.admin") },
  };
  const byVariant: Record<HeaderVariant, NavItem[]> = {
    site: [all.product!, all.demo!, all.app!, all.clinic!, all.admin!, all.status!],
    patient: [all.demo!, all.app!],
    clinic: [all.demo!, all.clinic!],
    admin: [all.demo!, all.admin!],
  };
  return (
    <header className={variant === "site" ? "top top-site" : "top"}>
      <div className="wrap">
        <BrandMark />
        <nav className="nav" aria-label={t("navLabel")}>
          <NavLinks items={byVariant[variant]} />
        </nav>
        <div className="util">
          <DemoBadge />
          {extra}
          <LangToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
