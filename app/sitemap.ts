import type { MetadataRoute } from "next";
import { PRODUCTS } from "@/lib/data/products";
import { LOCALES } from "@/lib/i18n/locales";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://sokoni.africa";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticPaths = [
    { p: "/", change: "weekly" as const, prio: 1.0 },
    { p: "/afriorigin", change: "weekly" as const, prio: 0.95 },
    { p: "/pricing", change: "monthly" as const, prio: 0.9 },
    { p: "/developers", change: "monthly" as const, prio: 0.85 },
    { p: "/commodities", change: "daily" as const, prio: 0.85 },
    { p: "/afcfta", change: "monthly" as const, prio: 0.8 },
    { p: "/marketplace", change: "daily" as const, prio: 0.75 },
    { p: "/suppliers", change: "weekly" as const, prio: 0.7 },
    { p: "/logistics", change: "monthly" as const, prio: 0.7 },
    { p: "/research", change: "monthly" as const, prio: 0.7 },
    { p: "/about", change: "monthly" as const, prio: 0.65 },
    { p: "/security", change: "monthly" as const, prio: 0.6 },
    { p: "/status", change: "daily" as const, prio: 0.55 },
    { p: "/changelog", change: "weekly" as const, prio: 0.5 },
    { p: "/contact", change: "yearly" as const, prio: 0.45 },
    { p: "/signup", change: "monthly" as const, prio: 0.4 },
    { p: "/signin", change: "yearly" as const, prio: 0.3 },
    { p: "/terms", change: "yearly" as const, prio: 0.25 },
    { p: "/privacy", change: "yearly" as const, prio: 0.25 }
  ];

  const localePaths = LOCALES.filter((l) => l.code !== "en").map((l) => ({
    p: `/${l.code}`,
    change: "weekly" as const,
    prio: 0.8
  }));

  const productPaths = PRODUCTS.map((p) => ({
    p: `/marketplace/${p.id}`,
    change: "weekly" as const,
    prio: 0.6
  }));

  return [...staticPaths, ...localePaths, ...productPaths].map(({ p, change, prio }) => ({
    url: `${SITE}${p}`,
    lastModified: now,
    changeFrequency: change,
    priority: prio
  }));
}
