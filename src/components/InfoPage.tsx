import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { getDefaultPhoto } from "@/lib/photos";

const beachPhoto = getDefaultPhoto(0);

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
    <div className="relative flex min-h-full flex-col">
      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        aria-hidden
      >
        <Image
          src={beachPhoto.src}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover blur-md sm:blur-lg scale-110"
          unoptimized
        />
        <div className="absolute inset-0 bg-paper/55 sm:bg-paper/50" />
      </div>

      <div className="relative z-20 flex min-h-full flex-1 flex-col">
        <SiteHeader compact />

        <main className="mx-auto w-full max-w-3xl flex-1 pb-14 pt-2 sm:px-8 sm:pb-16">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-ink-soft transition hover:text-ink sm:px-0"
          >
            <span aria-hidden>←</span>
            Back
          </Link>

          <article className="mt-4 bg-white px-5 py-8 shadow-[0_18px_50px_rgba(31,79,92,0.12)] sm:mt-5 sm:px-10 sm:py-12 lg:px-12 lg:py-14">
            <h1 className="font-display text-3xl tracking-tight text-ink sm:text-4xl">
              {title}
            </h1>
            {updated ? (
              <p className="mt-2 text-sm text-ink-soft/80">{updated}</p>
            ) : null}
            <div className="info-prose mt-8 space-y-10 text-base leading-relaxed text-ink-soft sm:mt-10">
              {children}
            </div>
          </article>
        </main>
      </div>
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
