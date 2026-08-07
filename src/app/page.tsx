import type { Metadata } from "next";
import Image from "next/image";
import { BecauseItsAbout } from "@/components/BecauseItsAbout";
import { LandingArticles } from "@/components/LandingArticles";
import { LandingHeroPostcard } from "@/components/LandingHeroPostcard";
import { LandingReveal } from "@/components/LandingReveal";
import { TransitionLink } from "@/components/TransitionLink";
import { getDefaultPhoto } from "@/lib/photos";

export const metadata: Metadata = {
  title: {
    absolute: "Let's Catch Up: Time Zone Scheduler for Friends Worldwide",
  },
  description:
    "Find the best meeting time across time zones and invite friends with a beautiful digital postcard. Free, simple, and designed for long-distance friendships.",
};

const beachPhoto = getDefaultPhoto(0);

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Create an invitation",
    body: "Write a short message and share your postcard.",
    // Swap these files when you have final shots:
    // public/images/landing/how-1.jpg|how-2.jpg|how-3.jpg
    photo: "/images/postcards/spanish-beach.jpg",
    rotate: "-6deg",
  },
  {
    step: "2",
    title: "Friends add their availability",
    body: "Everyone enters their availability in their own timezone.",
    photo: "/images/postcards/coastal-road.jpg",
    rotate: "3.5deg",
  },
  {
    step: "3",
    title: "Call your friends!",
    body: "Let's Catch Up automatically finds overlapping times so you can call at the best time for everyone.",
    photo: "/images/postcards/seagulls.jpg",
    rotate: "-4deg",
  },
] as const;

const TIMEZONE_POINTS = [
  "Convert time zones automatically",
  "Recommends best time based on availability",
  "Looks cute while doing it",
] as const;

const FAQS = [
  {
    q: "How does Let's Catch Up work?",
    a: "You create a postcard invite and share the link. Friends add their availability. The app finds overlapping times and shows them on the postcard.",
  },
  {
    q: "Does everyone need an account?",
    a: "No. Anyone with the link can open the invite and join.",
  },
  {
    q: "How are time zones handled?",
    a: "Each person picks their city or timezone. Let's Catch Up converts times and finds overlaps automatically. It works as a simple timezone scheduler.",
  },
  {
    q: "Is it free?",
    a: "Yes. Let's Catch Up is free to use.",
  },
  {
    q: "Does it uses AI?",
    a: "No. Availability parsing and recommendations use rule-based logic, not AI models.",
  },
  {
    q: "Can I upload my own postcard photo?",
    a: "Yes. Choose a featured photo or upload your own when you create an invite.",
  },
] as const;

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
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="relative flex flex-col">
      {/* Hero: blurry beach stays in the first viewport only */}
      <section className="relative flex min-h-dvh flex-col">
        <div
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
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

        <div className="relative z-20 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 pb-10 pt-12 sm:px-8 sm:pb-12 sm:pt-14 lg:py-10">
          <div className="grid items-start gap-2 sm:gap-3 lg:grid-cols-2 lg:items-center lg:gap-10">
            <div className="relative z-40 order-1 mx-auto flex w-full max-w-sm flex-col items-center text-center lg:order-2 lg:mx-0 lg:max-w-none lg:items-start lg:text-left">
              <h1 className="landing-enter landing-enter--logo">
                <Image
                  src="/images/logo/logo-color-bluebackground.svg"
                  alt="Let's Catch Up"
                  width={745}
                  height={353}
                  className="h-24 w-auto sm:h-28 lg:h-36"
                  priority
                  unoptimized
                />
              </h1>

              <p className="landing-enter landing-enter--slogan mt-1 max-w-md font-display text-lg leading-snug tracking-tight text-ink [@media(pointer:fine)]:mt-2 sm:text-xl lg:mt-5 lg:text-[2.35rem] lg:leading-[1.15]">
                Find a time together,
                <br />
                wherever your friends are.
              </p>

              <CreateCta className="landing-enter landing-enter--cta relative z-40 mt-5 hidden lg:mt-7 lg:flex" />
            </div>

            <div className="relative z-30 order-2 flex w-full justify-center lg:order-1">
              <LandingHeroPostcard />
            </div>

            <div className="landing-enter landing-enter--cta-mobile relative z-40 order-3 mx-auto mt-2 flex w-full max-w-sm justify-center pb-2 lg:hidden">
              <CreateCta />
            </div>
          </div>
        </div>
      </section>

      {/* Below the fold */}
      <div className="relative z-20 bg-paper">
        <div className="mx-auto w-full max-w-5xl space-y-20 px-5 py-16 sm:space-y-24 sm:px-8 sm:py-20 lg:space-y-28 lg:py-24">
          {/* How it works */}
          <section aria-labelledby="how-it-works-heading">
            <LandingReveal>
              <h2
                id="how-it-works-heading"
                className="font-display text-3xl tracking-tight text-ink sm:text-4xl"
              >
                How it works
              </h2>
              <p className="mt-3 max-w-xl text-base text-ink-soft sm:text-lg">
                Find a time that works, no matter the time zone!
              </p>
            </LandingReveal>

            <ol className="landing-polaroid-row mt-12 flex list-none flex-col items-center gap-10 sm:mt-14 sm:flex-row sm:items-center sm:justify-center sm:gap-0">
              {HOW_IT_WORKS.map((item, index) => (
                <LandingReveal
                  key={item.step}
                  as="li"
                  className="landing-polaroid"
                  delayMs={index * 140}
                >
                  <div
                    className="landing-polaroid__inner"
                    style={{ ["--polaroid-rotate" as string]: item.rotate }}
                  >
                    <div className="landing-polaroid__frame">
                      <div className="landing-polaroid__photo">
                        <Image
                          src={item.photo}
                          alt=""
                          fill
                          sizes="(max-width: 640px) 70vw, 220px"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="landing-polaroid__caption">
                        <p className="landing-polaroid__step">{item.step}</p>
                        <h3 className="landing-polaroid__title">{item.title}</h3>
                        <p className="landing-polaroid__body">{item.body}</p>
                      </div>
                    </div>
                  </div>
                </LandingReveal>
              ))}
            </ol>
          </section>

          <LandingReveal delayMs={60}>
            <BecauseItsAbout />
          </LandingReveal>

          {/* Built for time zones */}
          <section aria-labelledby="timezones-heading">
            <LandingReveal>
              <h2
                id="timezones-heading"
                className="font-display text-3xl tracking-tight text-ink sm:text-4xl"
              >
                Find time with ease
              </h2>
              <p className="mt-3 max-w-xl text-base text-ink-soft sm:text-lg">
              Built for time zones and busy schedules.
              </p>
            </LandingReveal>

            <div className="mt-10 grid items-center gap-10 sm:mt-12 lg:grid-cols-2 lg:gap-12">
              <LandingReveal>
                <ul className="space-y-4">
                  {TIMEZONE_POINTS.map((point) => (
                    <li
                      key={point}
                      className="flex items-start gap-3 text-left text-base text-ink sm:text-lg"
                    >
                      <span
                        className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ocean-deep text-paper"
                        aria-hidden
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="none"
                        >
                          <path
                            d="M2.2 6.2 4.8 8.8 9.8 3.2"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </LandingReveal>

              <LandingReveal delayMs={120} className="flex justify-center lg:justify-end">
                <Image
                  src="/images/landing/text-boxes.svg"
                  alt="Example availability notes across time zones"
                  width={640}
                  height={480}
                  className="h-auto w-full max-w-md"
                  unoptimized
                />
              </LandingReveal>
            </div>
          </section>

          <LandingArticles />

          {/* FAQ */}
          <section aria-labelledby="faq-heading">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 lg:items-start">
              <LandingReveal>
                <h2
                  id="faq-heading"
                  className="font-display text-3xl tracking-tight text-ink sm:text-4xl"
                >
                  FAQ
                </h2>
              </LandingReveal>

              <div className="divide-y divide-ink/10 border-y border-ink/10">
                {FAQS.map((item, index) => (
                  <LandingReveal key={item.q} delayMs={index * 55}>
                    <details className="group py-5">
                      <summary className="cursor-pointer list-none text-left text-base font-medium text-ink marker:content-none [&::-webkit-details-marker]:hidden">
                        <span className="flex items-start justify-between gap-4">
                          {item.q}
                          <span
                            className="mt-0.5 shrink-0 text-ink-soft transition group-open:rotate-45"
                            aria-hidden
                          >
                            +
                          </span>
                        </span>
                      </summary>
                      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft sm:text-base">
                        {item.a}
                      </p>
                    </details>
                  </LandingReveal>
                ))}
              </div>
            </div>
          </section>

          <LandingReveal className="flex flex-col items-center text-center">
            <Image
              src="/images/logo/logo-color-bluebackground.svg"
              alt="Let's Catch Up"
              width={745}
              height={353}
              className="mb-6 h-14 w-auto sm:mb-8 sm:h-16"
              unoptimized
            />
            <h2 className="font-display text-2xl tracking-tight text-ink sm:text-3xl">
              Ready to send one?
            </h2>
            <p className="mt-2 text-sm text-ink-soft sm:text-base">
              Free to use. No account needed.
            </p>
            <CreateCta className="mt-6" />
          </LandingReveal>
        </div>
      </div>
    </div>
  );
}
