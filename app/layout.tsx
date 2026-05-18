import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CookieBanner } from "@/components/CookieBanner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap"
});

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://sokoni.africa";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Sokoni — Africa's Trade Engine",
    template: "%s · Sokoni"
  },
  description:
    "AfriOrigin is the AfCFTA compliance SaaS for African SMEs. AI HS classification, Rules of Origin determination, tariff savings, and Certificates of Origin in five languages.",
  keywords: [
    "AfCFTA",
    "African Continental Free Trade Area",
    "Certificate of Origin",
    "Rules of Origin",
    "HS code classification",
    "intra-African trade",
    "PAPSS",
    "African SME exports",
    "trade compliance"
  ],
  authors: [{ name: "Sokoni" }],
  openGraph: {
    title: "Sokoni — Africa's Trade Engine",
    description:
      "One platform for cross-border trade across all 54 African states. AfCFTA compliance, multi-currency settlement, and digital trade documents — built for SMEs.",
    type: "website",
    url: SITE,
    siteName: "Sokoni"
  },
  twitter: {
    card: "summary_large_image",
    title: "Sokoni — Africa's Trade Engine",
    description: "AfCFTA compliance in seconds. AI HS classification, Certificate of Origin in 5 languages.",
    creator: "@sokoni_africa"
  },
  alternates: {
    canonical: "/"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 }
  }
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Sokoni",
    url: SITE,
    logo: `${SITE}/icon`,
    sameAs: [],
    description: "Africa's trade engine — AfCFTA compliance and intra-African B2B trade.",
    foundingDate: "2026",
    areaServed: "Africa"
  };

  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Sokoni AfriOrigin",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: [
      { "@type": "Offer", name: "Free", price: 0, priceCurrency: "USD" },
      { "@type": "Offer", name: "Pro SME", price: 49, priceCurrency: "USD" },
      { "@type": "Offer", name: "SME Bulk", price: 149, priceCurrency: "USD" },
      { "@type": "Offer", name: "Forwarder", price: 299, priceCurrency: "USD" }
    ]
  };

  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-ink-900 focus:px-4 focus:py-2 focus:text-sm focus:text-white"
        >
          Skip to main content
        </a>
        <Header />
        <main id="main" className="flex-1">{children}</main>
        <Footer />
        <CookieBanner />
        <Analytics />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify([orgJsonLd, softwareJsonLd]) }}
        />
      </body>
    </html>
  );
}
