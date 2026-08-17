import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CardDetail from '@/components/CardDetail';
import { hackers, getHacker, rarityLabel, statusLabel } from '@/data/hacking';
import { site } from '@/data/site';

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return hackers.map((h) => ({ slug: h.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const h = getHacker(slug);
  if (!h) return { title: 'Card not found' };

  const title = `${h.name} — ${h.title}`;
  const description = `${h.knownFor}. Card #${String(h.number).padStart(3, '0')} in ${site.name} Series Two: Hacking Legends, ${rarityLabel[h.rarity]} rarity, impact ${h.impact}.`;
  const url = `${site.url}/hacking-legends/${h.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'profile' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function HackerPage({ params }: Params) {
  const { slug } = await params;
  const h = getHacker(slug);
  if (!h) notFound();

  const i = hackers.findIndex((x) => x.slug === h.slug);
  const prev = i > 0 ? hackers[i - 1] : undefined;
  const next = i < hackers.length - 1 ? hackers[i + 1] : undefined;

  // Art is published for the whole set, but keep the page honest if a face is
  // ever missing rather than rendering a broken image.
  if (!h.front || !h.back) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: h.name,
    alternateName: h.handle,
    jobTitle: h.title,
    description: h.scouting,
    nationality: h.nationality,
    url: `${site.url}/hacking-legends/${h.slug}`,
    image: `${site.url}${h.front}`,
    ...(h.sources?.length
      ? { sameAs: h.sources.map((s) => s.url) }
      : {}),
    subjectOf: {
      '@type': 'CreativeWork',
      name: `${h.name} — ${site.name} Hacking Legends card #${String(h.number).padStart(3, '0')}`,
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
        setLabel="Hacking Legends"
        setHref="/hacking-legends"
        number={h.number}
        slug={h.slug}
        name={h.name}
        handle={h.handle}
        title={h.title}
        knownFor={h.knownFor}
        rarity={h.rarity}
        rarityLabel={rarityLabel[h.rarity]}
        statusLabel={statusLabel[h.status]}
        impact={h.impact}
        nationality={h.nationality}
        era={h.era}
        chips={h.domains}
        chipsLabel="Domains"
        scouting={h.scouting}
        note={h.note}
        noteLabel="Curator’s note"
        stats={[
          { label: 'Technical', value: h.technical },
          { label: 'Social', value: h.social },
          { label: 'Notoriety', value: h.notoriety },
          { label: 'Influence', value: h.influence },
        ]}
        sources={h.sources}
        front={h.front}
        back={h.back}
        prev={prev?.front ? { slug: prev.slug, name: prev.name, front: prev.front } : undefined}
        next={next?.front ? { slug: next.slug, name: next.name, front: next.front } : undefined}
      />
    </>
  );
}
