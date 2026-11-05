// Her app sections. Flip `ready` when a screen exists so nothing links to a missing page (CLAUDE.md rule 8).
import type { IconName } from "@/components/ui/Icon";

export type TabKey = "home" | "log" | "timeline" | "insights" | "assistant" | "report";
export interface Tab {
  key: TabKey;
  href: string;
  icon: IconName;
  ready: boolean;
}

export const TABS: readonly Tab[] = [
  { key: "home", href: "/app", icon: "home", ready: true },
  { key: "log", href: "/app/log", icon: "calendar", ready: true },
  { key: "timeline", href: "/app/timeline", icon: "analytics", ready: true },
  { key: "insights", href: "/app/insights", icon: "patterns", ready: true },
  { key: "assistant", href: "/app/assistant", icon: "chat", ready: true },
  { key: "report", href: "/app/report", icon: "report", ready: false },
];

export const isTabReady = (key: TabKey) => TABS.some((t) => t.key === key && t.ready);
