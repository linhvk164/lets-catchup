import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { InfoPage } from "@/components/InfoPage";
import { getAllArticles } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Articles",
  description:
    "Guides on planning calls across time zones, staying close to friends abroad, and simpler long-distance catch-ups.",
};

export default function ArticlesPage() {
  const articles = getAllArticles();

  return (
    <InfoPage title="Articles" wide>
      <p>
        Practical guides for planning catch-ups across time zones and staying
        close when friends live far away.
      </p>

      <ul className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-10">
        {articles.map((article) => (
          <li key={article.slug} className="min-w-0">
            <Link
              href={`/articles/${article.slug}`}
              className="group flex h-full flex-col space-y-3 transition"
            >
              <div className="relative aspect-[3/2] w-full overflow-hidden rounded-xl sm:rounded-2xl">
                <Image
                  src={article.image}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 420px"
                  className="object-cover transition duration-300 group-hover:scale-[1.02]"
                  unoptimized
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-soft/70">
                  {article.category}
                </p>
                <h2 className="font-display text-xl tracking-tight text-ink transition group-hover:text-ocean-deep sm:text-[1.35rem]">
                  {article.title}
                </h2>
                <p className="line-clamp-3 text-sm leading-relaxed text-ink-soft sm:text-base">
                  {article.description}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </InfoPage>
  );
}
