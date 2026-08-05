import Link from "next/link";

export function SiteHeader({ compact: _compact = false }: { compact?: boolean }) {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 pt-6 sm:px-8">
      <Link href="/" className="group inline-flex items-baseline gap-2">
        <span className="font-display text-xl tracking-tight text-ink sm:text-2xl">
          One Postcard Away
        </span>
      </Link>
    </header>
  );
}
