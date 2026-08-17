import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CardDetail from '@/components/CardDetail';
import { cards, getCard, rarityLabel } from '@/data/cards';
import { site } from '@/data/site';

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return cards.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const card = getCard(slug);
  if (!card) return { title: 'Card not found' };

  const title = `${card.name} — ${card.title}`;
  const description = `${card.knownFor}. Card #${String(card.number).padStart(3, '0')} in ${site.name} Series One, ${rarityLabel[card.rarity]} rarity, impact ${card.impact}.`;
  const url = `${site.url}/cards/${card.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'profile' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function CardPage({ params }: Params) {
  const { slug } = await params;
  const card = getCard(slug);
  if (!card) notFound();

  const i = cards.findIndex((c) => c.slug === card.slug);
  const prev = i > 0 ? cards[i - 1] : undefined;
  const next = i < cards.length - 1 ? cards[i + 1] : undefined;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: card.name,
    jobTitle: card.title,
    description: card.scouting,
    nationality: card.nationality,
    url: `${site.url}/cards/${card.slug}`,
    image: `${site.url}${card.front}`,
    subjectOf: {
      '@type': 'CreativeWork',
      name: `${card.name} — ${site.name} card #${String(card.number).padStart(3, '0')}`,
      license: 'https://creativecommons.org/licenses/by-sa/4.0/',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CardDetail
        setLabel="Series One"
        setHref="/cards"
        number={card.number}
        slug={card.slug}
        name={card.name}
        title={card.title}
        knownFor={card.knownFor}
        rarity={card.rarity}
        rarityLabel={rarityLabel[card.rarity]}
        impact={card.impact}
        nationality={card.nationality}
        era={card.era}
        chips={card.projects}
        chipsLabel="Signature projects"
        scouting={card.scouting}
        quote={card.quote}
        front={card.front}
        back={card.back}
        prev={prev && { slug: prev.slug, name: prev.name, front: prev.front }}
        next={next && { slug: next.slug, name: next.name, front: next.front }}
      />
    </>
  );
}
