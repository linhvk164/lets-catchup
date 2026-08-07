import articlesData from "@/content/articles.json";

export type ArticleBlock =
  | { type: "heading"; text: string; level?: 2 | 3 }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[]; ordered?: boolean };

export type Article = {
  slug: string;
  title: string;
  description: string;
  image: string;
  category: string;
  content: ArticleBlock[];
};

const articles = articlesData as Article[];

export function getAllArticles(): Article[] {
  return articles;
}

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((article) => article.slug === slug);
}

export function getRelatedArticles(slug: string, limit = 3): Article[] {
  const current = getArticleBySlug(slug);
  if (!current) return articles.slice(0, limit);

  const sameCategory = articles.filter(
    (article) =>
      article.slug !== slug && article.category === current.category
  );
  const others = articles.filter(
    (article) =>
      article.slug !== slug && article.category !== current.category
  );

  return [...sameCategory, ...others].slice(0, limit);
}

/** First N articles for landing and other featured surfaces. */
export function getFeaturedArticles(limit = 5): Article[] {
  return articles.slice(0, limit);
}

export function getArticleWordCount(article: Article): number {
  let words = 0;
  for (const block of article.content) {
    if (block.type === "heading" || block.type === "paragraph") {
      words += block.text.split(/\s+/).filter(Boolean).length;
    } else if (block.type === "list") {
      for (const item of block.items) {
        words += item.split(/\s+/).filter(Boolean).length;
      }
    }
  }
  return words;
}

/** Estimated reading time at ~200 words per minute. */
export function getReadingMinutes(article: Article): number {
  return Math.max(1, Math.ceil(getArticleWordCount(article) / 200));
}
