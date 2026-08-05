import Link from "next/link";
import { LandingHeroPostcard } from "@/components/LandingHeroPostcard";

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 pb-16 pt-14 sm:px-8 sm:pt-20">
        <section className="animate-fade-rise flex flex-1 flex-col items-center text-center">
          <p className="font-display text-4xl leading-[1.1] tracking-tight text-ink sm:text-5xl md:text-[3.4rem]">
            One Postcard Away
          </p>

          <h1 className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft sm:text-xl">
            Find a moment to catch up, no matter where you are.
          </h1>

          <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-soft/85 sm:text-base">
            One Postcard Away helps friends across time zones find a time that
            works for everyone.
          </p>

          <div className="mt-8 w-full max-w-sm">
            <Link
              href="/create"
              className="inline-flex w-full items-center justify-center rounded-xl bg-ocean-deep px-5 py-3.5 text-sm font-medium text-paper shadow-[0_12px_28px_rgba(31,79,92,0.28)] transition hover:bg-ocean active:scale-[0.98]"
            >
              Create a postcard
            </Link>
          </div>

          <div className="mt-12 w-full sm:mt-14">
            <LandingHeroPostcard />
          </div>
        </section>
      </main>
    </div>
  );
}
