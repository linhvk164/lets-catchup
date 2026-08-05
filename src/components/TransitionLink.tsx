"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/** App link used for navigations that participate in shared view transitions. */
export function TransitionLink({
  href,
  children,
  className,
  ...rest
}: {
  href: string;
  children: ReactNode;
  className?: string;
} & Omit<ComponentProps<typeof Link>, "href">) {
  return (
    <Link href={href} className={className} prefetch {...rest}>
      {children}
    </Link>
  );
}
