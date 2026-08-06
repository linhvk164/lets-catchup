import Image from "next/image";
import { LandingHeroPostcard } from "@/components/LandingHeroPostcard";
import { TransitionLink } from "@/components/TransitionLink";
import { getDefaultPhoto } from "@/lib/photos";

const beachPhoto = getDefaultPhoto(0);

function CreateCta({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex w-full flex-col items-center lg:w-auto lg:flex-row lg:items-center lg:gap-3 ${className}`}
    >
      <TransitionLink
        href="/create"
        className="inline-flex w-[82%] max-w-xs items-center justify-center rounded-xl bg-ocean-deep px-5 py-3 text-sm font-medium text-paper transition hover:bg-ocean active:scale-[0.98] sm:py-3.5 lg:w-auto lg:max-w-none lg:px-6"
      >
        Create a postcard
      </TransitionLink>
      <p className="mt-1.5 text-sm text-ink-soft lg:mt-0">no account needed</p>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="relative flex flex-col lg:min-h-0 lg:flex-1">
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
          className="landing-bg-settle object-cover blur-md sm:blur-lg"
          unoptimized
        />
        <div className="absolute inset-0 bg-paper/55 sm:bg-paper/50" />
      </div>

      <main className="relative z-20 mx-auto flex w-full max-w-6xl flex-col px-5 pb-8 pt-12 sm:px-8 sm:pb-10 sm:pt-14 lg:flex-1 lg:justify-center lg:py-8 lg:pb-8 lg:pt-8">
        <div className="grid items-start gap-2 sm:gap-3 lg:grid-cols-2 lg:items-center lg:gap-10">
          <section className="relative z-40 order-1 mx-auto flex w-full max-w-sm flex-col items-center text-center lg:order-2 lg:mx-0 lg:max-w-none lg:items-start lg:text-left">
            <h1 className="sr-only">Let&apos;s Catch-up</h1>
            <Image
              src="/images/logo/logo-color-bluebackground.svg"
              alt="Let's Catch-up"
              width={745}
              height={353}
              className="landing-enter landing-enter--logo h-24 w-auto sm:h-28 lg:h-36"
              priority
              unoptimized
            />

            <p className="landing-enter landing-enter--slogan mt-1 max-w-md font-display text-lg leading-snug tracking-tight text-ink [@media(pointer:fine)]:mt-2 sm:text-xl lg:mt-5 lg:text-[2.35rem] lg:leading-[1.15]">
              Find a time together,
              <br />
              wherever your friends are.
            </p>

            <CreateCta className="landing-enter landing-enter--cta relative z-40 mt-5 hidden lg:mt-7 lg:flex" />
          </section>

          <div className="relative z-30 order-2 flex w-full justify-center lg:order-1">
            <LandingHeroPostcard />
          </div>

          <div className="landing-enter landing-enter--cta-mobile relative z-40 order-3 mx-auto mt-2 flex w-full max-w-sm justify-center pb-4 lg:hidden">
            <CreateCta />
          </div>
        </div>
      </main>
    </div>
  );
}
