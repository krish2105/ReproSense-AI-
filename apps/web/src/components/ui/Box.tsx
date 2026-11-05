import type { HTMLAttributes, ReactNode } from "react";

/** .box: the mockup's white rounded card. */
export function Box({ children, className, ...rest }: { children: ReactNode } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`box${className ? ` ${className}` : ""}`} {...rest}>
      {children}
    </div>
  );
}

/** .panel: the glass panel used for larger sections. */
export function Panel({ children, className, ...rest }: { children: ReactNode } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`panel${className ? ` ${className}` : ""}`} {...rest}>
      {children}
    </div>
  );
}
