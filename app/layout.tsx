import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

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

export const metadata: Metadata = {
  title: "Sokoni — Africa's Trade Engine",
  description:
    "The unified B2B trade platform for the AfCFTA market. Verified suppliers, multi-currency PAPSS settlement, real-time commodity prices, and digital trade documents for 1.3B people.",
  openGraph: {
    title: "Sokoni — Africa's Trade Engine",
    description:
      "One platform for cross-border trade across all 54 African states. Built for the AfCFTA Digital Trade Protocol.",
    type: "website"
  }
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
