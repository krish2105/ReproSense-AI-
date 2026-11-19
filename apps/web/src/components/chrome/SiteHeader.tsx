import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { BrandMark } from "./BrandMark";
import { DemoBadge } from "./DemoBadge";
import { LangToggle } from "./LangToggle";
import { NavLinks, type NavItem } from "./NavLinks";
import { SignOutButton } from "./SignOutButton";
import { ThemeToggle } from "./ThemeToggle";

export type HeaderVariant = "site" | "patient" | "clinic" | "admin" | "clinicAdmin";

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
    clinicAdmin: { href: "/clinic-admin", label: t("nav.clinicAdmin") },
  };
  // Staff areas: their own "Your sign-in" page and a Sign out that revokes the session (plan section 5).
  const account: Partial<Record<HeaderVariant, { href: string; door: string }>> = {
    clinic: { href: "/clinic/sign-in", door: "/staff/signin" },
    clinicAdmin: { href: "/clinic-admin/sign-in", door: "/staff/signin" },
    admin: { href: "/admin/sign-in", door: "/doh/signin" },
  };
  const mine = account[variant];
  const byVariant: Record<HeaderVariant, NavItem[]> = {
    site: [all.product!, all.demo!, all.app!, all.clinic!, all.admin!, all.status!],
    patient: [all.demo!, all.app!],
    clinic: [all.demo!, all.clinic!],
    admin: [all.demo!, all.admin!],
    clinicAdmin: [all.demo!, all.clinicAdmin!],
  };
  return (
    <header className={variant === "site" ? "top top-site" : "top"}>
      <div className="wrap">
        <BrandMark />
        <nav className="nav" aria-label={t("navLabel")}>
          <NavLinks items={mine ? [...byVariant[variant], { href: mine.href, label: t("nav.signIn") }] : byVariant[variant]} />
          {mine && <SignOutButton door={mine.door} />}
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
