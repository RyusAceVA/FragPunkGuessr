import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { Barlow_Condensed, Geist_Mono, Manrope } from "next/font/google";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { AppProviders } from "@/components/providers/app-providers";
import { siteConfig } from "@/lib/site-config";

import "./globals.css";

/* Corps : Manrope — lisible, moderne, neutre */
const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
});

/* Display : Barlow Condensed — condensé italique capitales, ADN punk */
const barlowCondensed = Barlow_Condensed({
  variable: "--font-display",
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});

/* Données : Geist Mono — coordonnées, compteurs, codes */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
};

export const viewport: Viewport = {
  themeColor: "#151218",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale} className="dark" data-scroll-behavior="smooth">
      <body
        className={`${manrope.variable} ${geistMono.variable} ${barlowCondensed.variable} flex min-h-dvh flex-col antialiased`}
      >
        <NextIntlClientProvider>
          <AppProviders>
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
