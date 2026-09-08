import { executives, getExecutive, rarityLabel } from '@/data/ceos';
import { OG_CONTENT_TYPE, OG_SIZE, renderCardOg } from '@/lib/og';

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = 'Tech CEOs trading card';

export function generateStaticParams() {
  return executives.filter((e) => e.front).map((e) => ({ slug: e.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = getExecutive(slug);
  if (!e?.front) throw new Error(`No illustrated card for slug ${slug}`);

  return renderCardOg({
    number: e.number,
    name: e.name,
    handle: e.handle,
    title: e.title,
    rarity: e.rarity,
    rarityLabel: rarityLabel[e.rarity],
    impact: e.impact,
    front: e.front,
    setLabel: 'Tech CEOs',
  });
}
