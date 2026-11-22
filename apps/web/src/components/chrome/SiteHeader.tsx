import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { AccountMenu } from "./AccountMenu";
import { BrandMark } from "./BrandMark";
import { DemoBadge } from "./DemoBadge";
import { LangToggle } from "./LangToggle";
import { NavLinks, type NavItem } from "./NavLinks";
import { ThemeToggle } from "./ThemeToggle";

export type HeaderVariant = "site" | "patient" | "clinic" | "admin" | "clinicAdmin";

/** One header on every page (docs/31 §A). The same links in the same order everywhere, so a visitor always sees where
 *  she is (the plum pill) and every view is one tap away: about the product on the left, then the four views. The
 *  areas stay separate routes, layouts and roles (CLAUDE.md rule 9); only the way between them is the same. Staff
 *  areas add the Account menu (their sign-in settings and a Sign out that revokes the session). */
export function SiteHeader({ variant, extra }: { variant: HeaderVariant; extra?: ReactNode }) {
  const t = useTranslations("chrome");
  const about: NavItem[] = [
    { href: "/", label: t("nav.product") },
    { href: "/demo", label: t("nav.demo") },
    { href: "/status", label: t("nav.status") },
  ];
  const views: NavItem[] = [
    { href: "/app", label: t("nav.app") },
    { href: "/clinic", label: t("nav.clinic") },
    { href: "/clinic-admin", label: t("nav.clinicAdmin") },
    { href: "/admin", label: t("nav.admin") },
  ];
  const account: Partial<Record<HeaderVariant, { href: string; door: string }>> = {
    clinic: { href: "/clinic/sign-in", door: "/staff/signin" },
    clinicAdmin: { href: "/clinic-admin/sign-in", door: "/staff/signin" },
    admin: { href: "/admin/sign-in", door: "/doh/signin" },
  };
  const mine = account[variant];
  return (
    <header className="top top-site">
      <div className="wrap">
        <BrandMark />
        <nav className="nav" aria-label={t("navLabel")}>
          <NavLinks groups={[about, views]} />
        </nav>
        {mine && <AccountMenu href={mine.href} door={mine.door} />}
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
