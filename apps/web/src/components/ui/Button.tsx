import Link from "next/link";
import { LinkPending } from "@/components/chrome/LinkPending";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "outline";
type Size = "md" | "sm" | "wide";
interface Look {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

function classes({ variant = "primary", size = "md", className }: Omit<Look, "children">) {
  return ["btn", variant === "primary" ? "btn-a" : "btn-o", size === "sm" && "btn-sm", size === "wide" && "btn-wide", className]
    .filter(Boolean)
    .join(" ");
}

/** .btn-a (plum) or .btn-o (outline) from the mockup. `pending` disables it and sets aria-busy. */
export function Button({
  variant,
  size,
  className,
  pending = false,
  children,
  type = "button",
  disabled,
  ...rest
}: Look & { pending?: boolean } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={classes({ variant, size, className })} disabled={disabled || pending} aria-busy={pending || undefined} {...rest}>
      {children}
    </button>
  );
}

/** A link that looks like a button (navigation, not an action). */
export function ButtonLink({ variant, size, className, children, href, ...rest }: Look & { href: string } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <Link href={href} className={classes({ variant, size, className })} {...rest}>
      {children}
      <LinkPending />
    </Link>
  );
}
