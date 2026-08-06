import type { ReactNode } from "react";

/** Diagonal arrow used on outbound / directional text links. */
export function LinkArrow({
  direction = "out",
}: {
  direction?: "out" | "back";
}) {
  return (
    <span aria-hidden className="relative -top-px text-[0.85em] leading-none">
      {direction === "back" ? "↖" : "↗"}
    </span>
  );
}

/** Outbound link with a top-right arrow affordance. */
export function ExternalLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-baseline gap-0.5 underline-offset-2 transition hover:underline ${className}`}
    >
      <span>{children}</span>
      <LinkArrow direction="out" />
    </a>
  );
}
