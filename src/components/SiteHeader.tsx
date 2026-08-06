import Image from "next/image";
import Link from "next/link";

/** Centered wordmark with horizontal rules on both sides. */
export function SiteHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header
      className={`relative z-20 mx-auto flex w-full max-w-6xl items-center gap-4 px-5 sm:gap-6 sm:px-8 ${
        compact ? "pt-4 pb-3" : "pt-6 pb-4"
      }`}
    >
      <div className="h-px min-w-0 flex-1 bg-ink/20" aria-hidden />
      <Link
        href="/"
        className="inline-flex shrink-0 items-center transition hover:opacity-90"
        aria-label="Let's Catch-up home"
      >
        <Image
          src="/images/logo/logo-color.svg"
          alt="Let's Catch-up"
          width={745}
          height={353}
          className="h-11 w-auto sm:h-12"
          priority
          unoptimized
        />
      </Link>
      <div className="h-px min-w-0 flex-1 bg-ink/20" aria-hidden />
    </header>
  );
}
