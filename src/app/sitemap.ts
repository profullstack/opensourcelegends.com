import type { MetadataRoute } from 'next';
import { cards } from '@/data/cards';
import { hackers } from '@/data/hacking';
import { pros } from '@/data/security';
import { architects } from '@/data/ai';
import { site } from '@/data/site';

// Small enough to stay a single sitemap — the static pages plus one per illustrated card.
// A card page only exists once its art is rendered, so un-illustrated sets contribute
// their index page and nothing else.
export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    '',
    '/cards',
    '/hacking-legends',
    '/security-professionals',
    '/gods-of-ai',
    '/collect',
    '/contribute',
  ].map(
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

  const proPages = pros
    .filter((p) => p.front)
    .map((p) => ({
      url: `${site.url}/security-professionals/${p.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));

  const aiPages = architects
    .filter((a) => a.front)
    .map((a) => ({
      url: `${site.url}/gods-of-ai/${a.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));

  return [...staticPages, ...cardPages, ...hackerPages, ...proPages, ...aiPages];
}
