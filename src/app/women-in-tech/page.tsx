import type { Metadata } from 'next';
import Link from 'next/link';
import RosterCard from '@/components/RosterCard';
import AdUnit from '@/components/AdUnit';
import { site } from '@/data/site';
import {
  builders,
  alreadyCarded,
  totalPlanned,
  lockedCount,
  draftedCount,
  illustratedCount,
} from '@/data/women';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Women in Tech',
  description:
    'Series Five: 50 trading cards for the women who built computing, from the first published algorithm in 1843 to the researchers auditing models today.',
  openGraph: {
    title: `Women in Tech · ${site.name}`,
    description:
      'Series Five: 50 trading cards for the women who built computing, from the first published algorithm to the people auditing models today.',
    url: `${site.url}/women-in-tech`,
    type: 'website',
  },
  alternates: { canonical: '/women-in-tech' },
};

const CRITERIA = [
  {
    tag: 'Built it',
    head: 'A thing that exists',
    body: 'A compiler, an instruction set, a filesystem, a licence, a dataset, a proof. Being first woman to hold a job title is not the qualification; shipping the thing is.',
  },
  {
    tag: 'Open',
    head: 'Giving it away counts double',
    body: 'This is an open source card series, so code, weights, specs and teaching are scored explicitly. The openness number is a judgement and you are welcome to argue with it.',
  },
  {
    tag: 'Documented',
    head: 'Cite the paper or the repo',
    body: 'Every card links the artefact behind the claim. Several of these careers were classified, uncredited or attributed to someone else at the time, which is noted where it applies.',
  },
  {
    tag: 'Original art',
    head: 'Inspired by the work',
    body: 'Edition 2 uses original illustrations inspired by each person’s contributions. The art interprets their work; names, biographies and sources remain separately typeset and documented.',
  },
];

export default function WomenInTechPage() {
  const pct = Math.round((draftedCount / totalPlanned) * 100);

  return (
    <>
      {/* Hero */}
      <section className={styles.hero}>
        <div className="container">
          <span className={`kicker ${styles.kicker}`}>
            Series Five <span className={styles.wip}>In progress</span>
          </span>
          <h1 className={styles.title}>
            <span className="gradient-text">Women</span> in Tech
          </h1>
          <p className={styles.lede}>
            One hundred and eighty years, from the first published algorithm to the people
            auditing models today. The first compiler, the first assembler, the ARM
            instruction set, the Apollo guidance software, TF-IDF, zero-knowledge proofs,
            differential privacy and the code of conduct in your repository.
          </p>
          <p className={styles.warning}>
            Series One of this collection has forty-seven cards and not one woman on any of
            them. That is the honest reason this set exists, and it is not a flattering one.
          </p>
          <div className={styles.actions}>
            <a href={site.github} target="_blank" rel="noreferrer" className="btn-primary">
              Nominate someone
            </a>
            <Link href="#roster" className="btn-secondary">See the roster →</Link>
          </div>
        </div>
      </section>

      {/* Progress */}
      <section className={styles.progress}>
        <div className={`container ${styles.progressInner}`}>
          <div className={styles.bars}>
            <div className={styles.barRow}>
              <span className={styles.barLabel}>Roster drafted</span>
              <span className={styles.barTrack}>
                <span className={styles.barFill} style={{ width: `${pct}%` }} />
              </span>
              <span className={`${styles.barVal} mono`}>{draftedCount}/{totalPlanned}</span>
            </div>
            <div className={styles.barRow}>
              <span className={styles.barLabel}>Cards locked</span>
              <span className={styles.barTrack}>
                <span
                  className={styles.barFill}
                  style={{ width: `${Math.round((lockedCount / totalPlanned) * 100)}%` }}
                />
              </span>
              <span className={`${styles.barVal} mono`}>{lockedCount}/{totalPlanned}</span>
            </div>
            <div className={styles.barRow}>
              <span className={styles.barLabel}>Artwork rendered</span>
              <span className={styles.barTrack}>
                <span
                  className={styles.barFill}
                  style={{ width: `${Math.round((illustratedCount / totalPlanned) * 100)}%` }}
                />
              </span>
              <span className={`${styles.barVal} mono`}>{illustratedCount}/{totalPlanned}</span>
            </div>
          </div>

          <aside className={styles.aside}>
            <h2 className={styles.asideHead}>What ships next</h2>
            <ol className={styles.steps}>
              <li>Review the new artwork and the sources behind each contribution.</li>
              <li>Take nominations and re-cut any slot the argument goes against.</li>
              <li>Re-render any card whose copy or stat line changes in review.</li>
              <li>Print run and packs, alongside the open-licensed downloads.</li>
            </ol>
          </aside>
        </div>
      </section>

      {/* Roster */}
      <section className="section" id="roster">
        <div className="container">
          <div className={styles.head}>
            <span className="kicker">The working roster</span>
            <h2 className={styles.h2}>{builders.length} names, ordered by set number</h2>
            <p className={styles.sub}>
              Open the scouting report for the paper, patent or repository behind each claim,
              or go to a card&apos;s own page. Nothing here is final until the set is frozen.
            </p>
          </div>

          <div className={styles.grid}>
            {builders.map((b) => (
              <RosterCard key={b.slug} entry={b} basePath="/women-in-tech" />
            ))}
          </div>
        </div>
      </section>

      {/* Already carded elsewhere */}
      <section className="section">
        <div className="container">
          <div className={styles.head}>
            <span className="kicker">Not missing</span>
            <h2 className={styles.h2}>Already in the collection</h2>
            <p className={styles.sub}>
              No name appears in two series, so these {alreadyCarded.length} are not repeated
              here. A set like this looking as though it forgot Radia Perlman would be worse
              than the duplication.
            </p>
          </div>
          <div className={styles.criteria}>
            {alreadyCarded.map((p) => (
              <article key={p.href} className={styles.criterion}>
                <span className={styles.criterionTag}>{p.set}</span>
                <h3>
                  <Link href={p.href}>{p.name}</Link>
                </h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <AdUnit />
        </div>
      </section>

      {/* Criteria */}
      <section className="section">
        <div className="container">
          <div className={styles.head}>
            <span className="kicker">Selection</span>
            <h2 className={styles.h2}>What earns a card</h2>
          </div>
          <div className={styles.criteria}>
            {CRITERIA.map((c) => (
              <article key={c.tag} className={styles.criterion}>
                <span className={styles.criterionTag}>{c.tag}</span>
                <h3>{c.head}</h3>
                <p>{c.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Band */}
      <section className={styles.band}>
        <div className={`container ${styles.bandInner}`}>
          <div>
            <h2 className={styles.h2}>Who are we missing?</h2>
            <p>
              Fifty slots across a hundred and eighty years means the cuts were severe, and
              there are obvious names not on this list. Nominate someone, challenge a stat
              line, or rewrite a scouting report. Every card starts as a pull request.
            </p>
          </div>
          <div className={styles.bandActions}>
            <a href={site.github} target="_blank" rel="noreferrer" className="btn-primary">
              Open a nomination
            </a>
            <Link href="/gods-of-ai" className="btn-secondary">See Series Four</Link>
          </div>
        </div>
      </section>
    </>
  );
}
