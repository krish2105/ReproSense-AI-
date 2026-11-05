"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icon";
import { LinkPending } from "@/components/chrome/LinkPending";
import { TABS } from "./tabs";

/** Floating tab bar (Home · Calendar · Analytics · Patterns · AI Chat · Report). Hidden until two tabs exist. */
export function TabBar() {
  const t = useTranslations("tabs");
  const tl = useTranslations("chrome");
  const path = usePathname();
  const ready = TABS.filter((x) => x.ready);
  if (ready.length < 2) return null;
  return (
    <nav className="tabbar is-app" aria-label={tl("tabsLabel")}>
      {ready.map((tab) => {
        const current = tab.href === "/app" ? path === "/app" : path === tab.href || path.startsWith(`${tab.href}/`);
        return (
          <Link key={tab.key} href={tab.href} aria-current={current ? "page" : undefined}>
            <Icon name={tab.icon} />
            <span>{t(tab.key)}</span>
            <LinkPending />
          </Link>
        );
      })}
    </nav>
  );
}
