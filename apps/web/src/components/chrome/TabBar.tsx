"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Icon, type IconName } from "@/components/ui/Icon";

interface Tab {
  key: "home" | "log" | "timeline" | "insights" | "assistant" | "report";
  href: string;
  icon: IconName;
  /** Flip to true when the screen exists, so the bar never links to a missing page (CLAUDE.md rule 8). */
  ready: boolean;
}

export const TABS: readonly Tab[] = [
  { key: "home", href: "/app", icon: "home", ready: true },
  { key: "log", href: "/app/log", icon: "calendar", ready: false },
  { key: "timeline", href: "/app/timeline", icon: "analytics", ready: false },
  { key: "insights", href: "/app/insights", icon: "patterns", ready: false },
  { key: "assistant", href: "/app/assistant", icon: "chat", ready: false },
  { key: "report", href: "/app/report", icon: "report", ready: false },
];

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
          </Link>
        );
      })}
    </nav>
  );
}
