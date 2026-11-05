"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  href: string;
  label: string;
}

/** Header nav links; the current section gets aria-current="page" (styled as the plum pill). */
export function NavLinks({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <>
      {items.map((i) => {
        const current = path === i.href || (i.href !== "/" && path.startsWith(`${i.href}/`));
        return (
          <Link key={i.href} href={i.href} aria-current={current ? "page" : undefined}>
            {i.label}
          </Link>
        );
      })}
    </>
  );
}
