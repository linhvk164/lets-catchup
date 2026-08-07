"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink } from "@/components/ExternalLink";

function shouldShowFooter(pathname: string | null): boolean {
  if (!pathname) return true;
  if (pathname === "/create" || pathname.startsWith("/create/")) return false;
  // /catchup/[id]/edit
  if (/^\/catchup\/[^/]+\/edit\/?$/.test(pathname)) return false;
  return true;
}

export function SiteFooter() {
  const pathname = usePathname();
  if (!shouldShowFooter(pathname)) return null;

  const isHome = pathname === "/";

  return (
    <footer
      className={`relative z-40 mt-auto w-full shrink-0 bg-paper px-5 sm:px-8 ${
        isHome
          ? "pb-10 pt-8 sm:pb-12 sm:pt-10"
          : "pb-6 pt-6 sm:pb-10 sm:pt-12 lg:pb-12 lg:pt-16"
      }`}
    >
      <nav
        aria-label="Site"
        className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-[12px] leading-relaxed text-ink-soft/80 sm:text-[13px]"
      >
        <span>
          Created by{" "}
          <ExternalLink
            href="https://linhvkhuong.com"
            className="hover:text-ink-soft"
          >
            linhvkhuong.com
          </ExternalLink>
        </span>
        <span aria-hidden className="text-ink/20">
          ·
        </span>
        <Link
          href="/articles"
          className="underline-offset-2 transition hover:text-ink-soft hover:underline"
        >
          Articles
        </Link>
        <span aria-hidden className="text-ink/20">
          ·
        </span>
        <Link
          href="/about"
          className="underline-offset-2 transition hover:text-ink-soft hover:underline"
        >
          About
        </Link>
        <span aria-hidden className="text-ink/20">
          ·
        </span>
        <Link
          href="/privacy"
          className="underline-offset-2 transition hover:text-ink-soft hover:underline"
        >
          Privacy
        </Link>
      </nav>
    </footer>
  );
}
