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
  // The longest matching link is the current one: on /clinic/sign-in that is "Your sign-in", not "Clinician".
  const matches = (href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`));
  const best = items.filter((i) => matches(i.href)).sort((a, b) => b.href.length - a.href.length)[0]?.href;
  return (
    <>
      {items.map((i) => {
        const current = i.href === best;
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
