import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/students",
        "/fees",
        "/expenses",
        "/reports",
        "/attendance",
        "/matches",
        "/performance",
        "/rankings",
        "/goals",
        "/training",
        "/notifications",
        "/settings",
        "/users",
        "/coaches",
        "/admissions",
        "/audit-logs",
        "/profile",
        "/student",
        "/parent",
        "/coach",
        "/scan",
        "/api/",
      ],
    },
    sitemap: "https://young-fighters-academy.vercel.app/sitemap.xml",
  };
}