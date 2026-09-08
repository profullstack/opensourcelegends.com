import { architects, getArchitect, rarityLabel } from '@/data/ai';
import { OG_CONTENT_TYPE, OG_SIZE, renderCardOg } from '@/lib/og';

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = 'Gods of AI trading card';

export function generateStaticParams() {
  return architects.filter((p) => p.front).map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getArchitect(slug);
  if (!p?.front) throw new Error(`No illustrated card for slug ${slug}`);

  return renderCardOg({
    number: p.number,
    name: p.name,
    handle: p.handle,
    title: p.title,
    rarity: p.rarity,
    rarityLabel: rarityLabel[p.rarity],
    impact: p.impact,
    front: p.front,
    setLabel: 'Gods of AI',
  });
}
