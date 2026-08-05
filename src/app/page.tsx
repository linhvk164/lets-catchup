import { LandingHeroPostcard } from "@/components/LandingHeroPostcard";
import { TransitionLink } from "@/components/TransitionLink";

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pb-16 pt-10 sm:px-8 sm:pt-14">
        <div className="grid flex-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="order-2 flex justify-center lg:order-1 lg:justify-center lg:px-4">
            <LandingHeroPostcard />
          </div>

          <section className="animate-fade-rise order-1 flex w-full max-w-xl flex-col items-start text-left lg:order-2 lg:max-w-none">
            <h1 className="font-display text-4xl leading-[1.1] tracking-tight text-ink sm:text-5xl md:text-[3.4rem]">
              Let&apos;s Catch-up
            </h1>

            <p className="mt-3 text-lg leading-snug text-ink-soft sm:text-xl">
              Send a postcard invite.
            </p>

            <p className="mt-1.5 max-w-md text-sm leading-snug text-ink-soft/85 sm:text-base">
              Allows friends across time zones find a time that works for
              everyone.
            </p>

            <div className="mt-7 w-full max-w-sm">
              <TransitionLink
                href="/create"
                className="inline-flex w-full items-center justify-center rounded-xl bg-ocean-deep px-5 py-3.5 text-sm font-medium text-paper transition hover:bg-ocean active:scale-[0.98]"
              >
                Create a postcard invite
              </TransitionLink>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
