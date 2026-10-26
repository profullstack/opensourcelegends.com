import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Footer as PfsFooter } from '@profullstack/footer/react';
import { site } from '@/data/site';
import Script from "next/script";

// Re-render hourly so the shared @profullstack/footer (fetched from its @latest
// template) stays current instead of being baked at build time for a year.
export const revalidate = 3600;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  openGraph: {
    title: site.name,
    description: site.description,
    url: site.url,
    siteName: site.name,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: site.name,
    description: site.description,
  },
  icons: { icon: '/favicon.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
        <PfsFooter site="https://opensourcelegends.com/" since={2026} />
        <Script data-site="6e37a389-d4cc-46c3-8e7d-20e5c9fd8b42" src="https://crawlproof.com/stats.js" strategy="afterInteractive" />
        {/* Global CrawlProof ad loader — hydrates every <AdUnit /> ([data-cp-ad]) rendered in page content. */}
        <Script src="https://crawlproof.com/ad.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
