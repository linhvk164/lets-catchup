import Link from "next/link";

export function SiteHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header
      className={`mx-auto flex w-full max-w-6xl items-center justify-between px-5 sm:px-8 ${
        compact ? "pt-4" : "pt-6"
      }`}
    >
      <Link href="/" className="group inline-flex items-baseline gap-2">
        <span className="font-display text-xl tracking-tight text-ink sm:text-2xl">
          Let&apos;s Catchup
        </span>
      </Link>
    </header>
  );
}
