import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://sokoni.africa";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/api/", "/afriorigin/certificate"]
      }
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE
  };
}
