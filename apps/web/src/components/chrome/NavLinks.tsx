"use client";

import Link from "next/link";
import { Fragment } from "react";
import { usePathname } from "next/navigation";
import { isSignedInArea } from "@/lib/enter";
import { LinkPending } from "@/components/chrome/LinkPending";

export interface NavItem {
  href: string;
  label: string;
}

/** Header nav links in groups with a quiet divider between them; the current section gets aria-current="page"
 *  (styled as the plum pill). Links into the signed-in areas are plain links (a full page load): the client router
 *  could replay a redirect it cached for an earlier visitor (src/lib/enter.ts), and the staff views sign in on the way
 *  (/demo/enter). */
export function NavLinks({ groups }: { groups: NavItem[][] }) {
  const path = usePathname();
  // The longest matching link is the current one: on /clinic/patients/x that is "Clinician"; on /clinic-admin it is
  // "Clinic admin", never "Clinician" (a prefix match needs the slash).
  const matches = (href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`));
  const best = groups
    .flat()
    .filter((i) => matches(i.href))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
  return (
    <>
      {groups.map((items, g) => (
        <Fragment key={items[0]?.href ?? g}>
          {g > 0 && <span className="nav-sep" aria-hidden="true" />}
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
        </Fragment>
      ))}
    </>
  );
}
