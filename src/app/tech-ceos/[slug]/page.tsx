import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CardDetail from '@/components/CardDetail';
import { executives, getExecutive, rarityLabel, statusLabel, getPortraitCredit } from '@/data/ceos';
import { site } from '@/data/site';

type Params = { params: Promise<{ slug: string }> };

// Only illustrated cards get a page — an entry with no face has nothing to show,
// and listing it here would prerender 404s.
export function generateStaticParams() {
  return executives.filter((e) => e.front).map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const e = getExecutive(slug);
  if (!e) return { title: 'Card not found' };

  const title = `${e.name} — ${e.title}`;
  const description = `${e.knownFor}. Card #${String(e.number).padStart(3, '0')} in ${site.name} Series Six: Tech CEOs, ${rarityLabel[e.rarity]} rarity, impact ${e.impact}.`;
  const url = `${site.url}/tech-ceos/${e.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'profile' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function ExecutivePage({ params }: Params) {
  const { slug } = await params;
  const e = getExecutive(slug);
  if (!e) notFound();

  const i = executives.findIndex((x) => x.slug === e.slug);
  const prev = i > 0 ? executives[i - 1] : undefined;
  const next = i < executives.length - 1 ? executives[i + 1] : undefined;

  // A card page exists only once its art does. Better a 404 than a page with no
  // card on it.
  if (!e.front || !e.back) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: e.name,
    alternateName: e.handle,
    jobTitle: e.title,
    description: e.scouting,
    nationality: e.nationality,
    url: `${site.url}/tech-ceos/${e.slug}`,
    image: `${site.url}${e.front}`,
    ...(e.sources?.length ? { sameAs: e.sources.map((s) => s.url) } : {}),
    subjectOf: {
      '@type': 'CreativeWork',
      name: `${e.name} — ${site.name} Tech CEOs card #${String(e.number).padStart(3, '0')}`,
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
        setLabel="Tech CEOs"
        setHref="/tech-ceos"
        number={e.number}
        slug={e.slug}
        name={e.name}
        handle={e.handle}
        title={e.title}
        knownFor={e.knownFor}
        rarity={e.rarity}
        rarityLabel={rarityLabel[e.rarity]}
        statusLabel={statusLabel[e.status]}
        impact={e.impact}
        nationality={e.nationality}
        era={e.era}
        chips={e.domains}
        chipsLabel="Domains"
        scouting={e.scouting}
        note={e.note}
        noteLabel="Curator’s note"
        stats={[
          { label: 'Product sense', value: e.product },
          { label: 'Operating', value: e.operating },
          { label: 'Openness', value: e.openness },
          { label: 'Influence', value: e.influence },
        ]}
        sources={e.sources}
        portraitCredit={getPortraitCredit(e.slug)}
        front={e.front}
        back={e.back}
        prev={prev?.front ? { slug: prev.slug, name: prev.name, front: prev.front } : undefined}
        next={next?.front ? { slug: next.slug, name: next.name, front: next.front } : undefined}
      />
    </>
  );
}
