import type { MetadataRoute } from "next";
import { getAllArticles } from "@/lib/articles";

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000")
  );
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl().replace(/\/$/, "");
  const now = new Date();

  const articleEntries: MetadataRoute.Sitemap = getAllArticles().map(
    (article) => ({
      url: `${base}/articles/${article.slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    })
  );

  return [
    {
      url: base,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/create`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${base}/articles`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...articleEntries,
    {
      url: `${base}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${base}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
  ];
}
