import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { site } from '@/data/site';
import Script from "next/script";

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
        <Script data-site="6e37a389-d4cc-46c3-8e7d-20e5c9fd8b42" src="https://crawlproof.com/stats.js" strategy="afterInteractive" />
        {/* Global CrawlProof ad loader — hydrates every <AdUnit /> ([data-cp-ad]) rendered in page content. */}
        <Script src="https://crawlproof.com/ad.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
