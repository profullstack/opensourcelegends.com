import type { MetadataRoute } from 'next';
import { cards } from '@/data/cards';
import { hackers } from '@/data/hacking';
import { site } from '@/data/site';

// Small enough to stay a single sitemap — 4 static pages plus one per card.
export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = ['', '/cards', '/hacking-legends', '/collect', '/contribute'].map(
    (path) => ({
      url: `${site.url}${path}`,
      changeFrequency: 'weekly' as const,
      priority: path === '' ? 1 : 0.8,
    }),
  );

  const cardPages = cards.map((c) => ({
    url: `${site.url}/cards/${c.slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  const hackerPages = hackers
    .filter((h) => h.front)
    .map((h) => ({
      url: `${site.url}/hacking-legends/${h.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));

  return [...staticPages, ...cardPages, ...hackerPages];
}
