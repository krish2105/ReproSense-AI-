"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isSignedInArea } from "@/lib/enter";
import { LinkPending } from "@/components/chrome/LinkPending";

export interface NavItem {
  href: string;
  label: string;
}

/** Header nav links; the current section gets aria-current="page" (styled as the plum pill). Links into the
 *  signed-in areas never prefetch: an anonymous prefetch caches a redirect to /demo (src/lib/enter.ts). */
export function NavLinks({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <>
      {items.map((i) => {
        const current = i.href === "/" ? path === "/" : path === i.href || path.startsWith(`${i.href}/`);
        return (
          <Link key={i.href} href={i.href} prefetch={isSignedInArea(i.href) ? false : undefined} aria-current={current ? "page" : undefined}>
            {i.label}
            <LinkPending />
          </Link>
        );
      })}
    </>
  );
}
