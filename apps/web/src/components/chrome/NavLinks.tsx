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
 *  signed-in areas are plain links (a full page load): the client router could replay a redirect it cached for an
 *  earlier visitor (src/lib/enter.ts), and "Clinician" and "Clinic network" sign in on the way (/demo/enter). */
export function NavLinks({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <>
      {items.map((i) => {
        const current = i.href === "/" ? path === "/" : path === i.href || path.startsWith(`${i.href}/`);
        if (isSignedInArea(i.href)) {
          return (
            <a key={i.href} href={i.href} aria-current={current ? "page" : undefined}>
              {i.label}
            </a>
          );
        }
        return (
          <Link key={i.href} href={i.href} aria-current={current ? "page" : undefined}>
            {i.label}
            <LinkPending />
          </Link>
        );
      })}
    </>
  );
}
