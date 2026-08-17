import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://young-fighters-academy.vercel.app";
  const now = new Date();

  return [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/programs`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/coaches`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/players`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/matches`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/gallery`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/apply`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}