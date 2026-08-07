import Image from "next/image";
import Link from "next/link";
import { LandingReveal } from "@/components/LandingReveal";
import {
  getFeaturedArticles,
  getReadingMinutes,
} from "@/lib/articles";

export function LandingArticles() {
  const articles = getFeaturedArticles(3);

  return (
    <section aria-labelledby="articles-heading">
      <LandingReveal>
        <h2
          id="articles-heading"
          className="font-display text-3xl tracking-tight text-ink sm:text-4xl"
        >
          Articles
        </h2>
        <p className="mt-3 max-w-xl text-base text-ink-soft sm:text-lg">
          Guides for long-distance catch-ups and time zones.
        </p>
      </LandingReveal>

      <ul className="mt-10 grid grid-cols-1 gap-8 sm:mt-12 sm:grid-cols-3 sm:gap-5">
        {articles.map((article, index) => {
          const minutes = getReadingMinutes(article);
          return (
            <LandingReveal
              key={article.slug}
              as="li"
              delayMs={index * 70}
              className="min-w-0"
            >
              <Link
                href={`/articles/${article.slug}`}
                className="group flex h-full flex-col"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl sm:rounded-2xl">
                  <Image
                    src={article.image}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover transition duration-300 group-hover:scale-[1.03]"
                    unoptimized
                  />
                </div>
                <div className="mt-3 flex flex-1 flex-col gap-2">
                  <span className="inline-flex w-fit rounded-md bg-ink/[0.06] px-2 py-0.5 text-[11px] font-medium tracking-wide text-ink-soft">
                    {minutes} min read
                  </span>
                  <h3 className="font-display text-lg leading-snug tracking-tight text-ink transition group-hover:text-ocean-deep sm:text-xl">
                    {article.title}
                  </h3>
                  <p className="line-clamp-2 text-sm leading-relaxed text-ink-soft">
                    {article.description}
                  </p>
                </div>
              </Link>
            </LandingReveal>
          );
        })}
      </ul>

      <LandingReveal delayMs={80} className="mt-8 flex justify-center">
        <Link
          href="/articles"
          className="inline-flex items-center justify-center rounded-xl border border-ink/15 bg-white/70 px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-white"
        >
          View all
        </Link>
      </LandingReveal>
    </section>
  );
}
