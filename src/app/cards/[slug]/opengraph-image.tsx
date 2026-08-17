import { cards, getCard, rarityLabel } from '@/data/cards';
import { OG_CONTENT_TYPE, OG_SIZE, renderCardOg } from '@/lib/og';

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = 'Open Source Legends trading card';

export function generateStaticParams() {
  return cards.map((c) => ({ slug: c.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const card = getCard(slug);
  if (!card) throw new Error(`No card for slug ${slug}`);

  return renderCardOg({
    number: card.number,
    name: card.name,
    title: card.title,
    rarity: card.rarity,
    rarityLabel: rarityLabel[card.rarity],
    impact: card.impact,
    front: card.front,
    setLabel: 'Series One',
  });
}
