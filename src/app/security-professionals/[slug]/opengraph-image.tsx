import { pros, getPro, rarityLabel } from '@/data/security';
import { OG_CONTENT_TYPE, OG_SIZE, renderCardOg } from '@/lib/og';

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = 'Security Professionals trading card';

export function generateStaticParams() {
  return pros.filter((p) => p.front).map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getPro(slug);
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
    setLabel: 'Security Professionals',
  });
}
