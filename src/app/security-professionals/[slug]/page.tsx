import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CardDetail from '@/components/CardDetail';
import { pros, getPro, rarityLabel, statusLabel, getPortraitCredit } from '@/data/security';
import { site } from '@/data/site';

type Params = { params: Promise<{ slug: string }> };

// Only illustrated cards get a page — an entry with no face has nothing to show,
// and listing it here would prerender 404s.
export function generateStaticParams() {
  return pros.filter((p) => p.front).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const p = getPro(slug);
  if (!p) return { title: 'Card not found' };

  const title = `${p.name} — ${p.title}`;
  const description = `${p.knownFor}. Card #${String(p.number).padStart(3, '0')} in ${site.name} Series Three: Security Professionals, ${rarityLabel[p.rarity]} rarity, impact ${p.impact}.`;
  const url = `${site.url}/security-professionals/${p.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'profile' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function ProPage({ params }: Params) {
  const { slug } = await params;
  const p = getPro(slug);
  if (!p) notFound();

  const i = pros.findIndex((x) => x.slug === p.slug);
  const prev = i > 0 ? pros[i - 1] : undefined;
  const next = i < pros.length - 1 ? pros[i + 1] : undefined;

  // A card page exists only once its art does. While the set is unillustrated this
  // is every slug, which is intended — better a 404 than a page with no card on it.
  if (!p.front || !p.back) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: p.name,
    alternateName: p.handle,
    jobTitle: p.title,
    description: p.scouting,
    nationality: p.nationality,
    url: `${site.url}/security-professionals/${p.slug}`,
    image: `${site.url}${p.front}`,
    ...(p.sources?.length ? { sameAs: p.sources.map((s) => s.url) } : {}),
    subjectOf: {
      '@type': 'CreativeWork',
      name: `${p.name} — ${site.name} Security Professionals card #${String(p.number).padStart(3, '0')}`,
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
        setLabel="Security Professionals"
        setHref="/security-professionals"
        number={p.number}
        slug={p.slug}
        name={p.name}
        handle={p.handle}
        title={p.title}
        knownFor={p.knownFor}
        rarity={p.rarity}
        rarityLabel={rarityLabel[p.rarity]}
        statusLabel={statusLabel[p.status]}
        impact={p.impact}
        nationality={p.nationality}
        era={p.era}
        chips={p.domains}
        chipsLabel="Domains"
        scouting={p.scouting}
        note={p.note}
        noteLabel="Curator’s note"
        stats={[
          { label: 'Technical depth', value: p.technical },
          { label: 'Defensive craft', value: p.defense },
          { label: 'Research', value: p.research },
          { label: 'Influence', value: p.influence },
        ]}
        sources={p.sources}
        portraitCredit={getPortraitCredit(p.slug)}
        front={p.front}
        back={p.back}
        prev={prev?.front ? { slug: prev.slug, name: prev.name, front: prev.front } : undefined}
        next={next?.front ? { slug: next.slug, name: next.name, front: next.front } : undefined}
      />
    </>
  );
}
