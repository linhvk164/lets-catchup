import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleContent } from "@/components/ArticleContent";
import { InfoPage } from "@/components/InfoPage";
import {
  getAllArticles,
  getArticleBySlug,
  getRelatedArticles,
} from "@/lib/articles";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllArticles().map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) {
    return { title: "Article" };
  }

  return {
    title: article.title,
    description: article.description,
    openGraph: {
      title: article.title,
      description: article.description,
      images: [{ url: article.image }],
      type: "article",
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const related = getRelatedArticles(slug, 3);

  return (
    <InfoPage backHref="/articles" backLabel="Articles" showTitle={false}>
      <div className="relative aspect-[2/1] overflow-hidden rounded-xl sm:rounded-2xl">
        <Image
          src={article.image}
          alt=""
          fill
          priority
          sizes="(max-width: 768px) 100vw, 672px"
          className="object-cover"
          unoptimized
        />
      </div>

      <header className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-soft/70">
          {article.category}
        </p>
        <h1 className="font-display text-3xl tracking-tight text-ink sm:text-4xl">
          {article.title}
        </h1>
        <p className="text-base leading-relaxed text-ink-soft sm:text-lg">
          {article.description}
        </p>
      </header>

      <ArticleContent blocks={article.content} />

      <section className="space-y-4 border-t border-ink/10 pt-8">
        <h2 className="font-display text-xl tracking-tight text-ink sm:text-[1.35rem]">
          Related articles
        </h2>
        <ul className="space-y-4">
          {related.map((item) => (
            <li key={item.slug}>
              <Link
                href={`/articles/${item.slug}`}
                className="group flex gap-4 transition"
              >
                <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg sm:h-20 sm:w-28 sm:rounded-xl">
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    sizes="112px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-soft/70">
                    {item.category}
                  </p>
                  <p className="font-display text-lg leading-snug tracking-tight text-ink transition group-hover:text-ocean-deep">
                    {item.title}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="border-t border-ink/10 pt-6 text-sm text-ink-soft/80">
        Created by Let&apos;s Catch Up
      </p>
    </InfoPage>
  );
}
