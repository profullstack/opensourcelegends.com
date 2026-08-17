import { hackers, getHacker, rarityLabel } from '@/data/hacking';
import { OG_CONTENT_TYPE, OG_SIZE, renderCardOg } from '@/lib/og';

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = 'Hacking Legends trading card';

export function generateStaticParams() {
  return hackers.filter((h) => h.front).map((h) => ({ slug: h.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const h = getHacker(slug);
  if (!h?.front) throw new Error(`No illustrated card for slug ${slug}`);

  return renderCardOg({
    number: h.number,
    name: h.name,
    handle: h.handle,
    title: h.title,
    rarity: h.rarity,
    rarityLabel: rarityLabel[h.rarity],
    impact: h.impact,
    front: h.front,
    setLabel: 'Hacking Legends',
  });
}
