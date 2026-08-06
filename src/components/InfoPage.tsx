import type { ReactNode } from "react";
import Link from "next/link";
import { LinkArrow } from "@/components/ExternalLink";

/** Shared readable layout for About, Privacy, and similar informational pages. */
export function InfoPage({
  title,
  children,
  updated,
}: {
  title: string;
  children: ReactNode;
  updated?: string;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <main className="mx-auto w-full max-w-[46rem] flex-1 px-5 pb-8 pt-10 sm:px-8 sm:pt-14">
        <Link
          href="/"
          className="inline-flex items-baseline gap-0.5 text-sm text-ink-soft underline-offset-2 transition hover:text-ink hover:underline"
        >
          <LinkArrow direction="back" />
          <span>Let&apos;s Catch up</span>
        </Link>
        <h1 className="mt-6 font-display text-3xl tracking-tight text-ink sm:text-4xl">
          {title}
        </h1>
        {updated ? (
          <p className="mt-2 text-sm text-ink-soft/80">{updated}</p>
        ) : null}
        <div className="info-prose mt-10 space-y-10 text-base leading-relaxed text-ink-soft">
          {children}
        </div>
      </main>
    </div>
  );
}

export function InfoSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl tracking-tight text-ink sm:text-[1.35rem]">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
