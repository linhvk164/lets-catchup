import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { getDefaultPhoto } from "@/lib/photos";

const beachPhoto = getDefaultPhoto(0);

/** Shared readable layout for About, Privacy, Articles, and similar pages. */
export function InfoPage({
  title,
  children,
  updated,
  backHref = "/",
  backLabel = "Back",
  showTitle = true,
  wide = false,
}: {
  title?: string;
  children: ReactNode;
  updated?: string;
  backHref?: string;
  backLabel?: string;
  /** When false, omit the default h1 (page supplies its own). */
  showTitle?: boolean;
  /** Wider content column (e.g. article index grid). */
  wide?: boolean;
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
          className="scale-110 object-cover blur-md sm:blur-lg"
          unoptimized
        />
        <div className="absolute inset-0 bg-paper/55 sm:bg-paper/50" />
      </div>

      <div className="relative z-20 flex min-h-full flex-1 flex-col">
        <SiteHeader compact />

        <main
          className={`mx-auto w-full flex-1 pb-14 pt-2 sm:px-8 sm:pb-16 ${
            wide ? "max-w-5xl" : "max-w-3xl"
          }`}
        >
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-ink-soft transition hover:text-ink sm:px-0"
          >
            <span aria-hidden>←</span>
            {backLabel}
          </Link>

          <article className="mt-4 bg-white px-5 py-8 shadow-[0_18px_50px_rgba(31,79,92,0.12)] sm:mt-5 sm:px-10 sm:py-12 lg:px-12 lg:py-14">
            {showTitle && title ? (
              <>
                <h1 className="font-display text-3xl tracking-tight text-ink sm:text-4xl">
                  {title}
                </h1>
                {updated ? (
                  <p className="mt-2 text-sm text-ink-soft/80">{updated}</p>
                ) : null}
              </>
            ) : null}
            <div
              className={`info-prose text-base leading-relaxed text-ink-soft ${
                showTitle && title ? "mt-8 space-y-10 sm:mt-10" : "space-y-8"
              }`}
            >
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
