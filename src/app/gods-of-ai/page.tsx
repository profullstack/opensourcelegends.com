import type { Metadata } from 'next';
import Link from 'next/link';
import RosterCard from '@/components/RosterCard';
import AdUnit from '@/components/AdUnit';
import { site } from '@/data/site';
import {
  architects,
  totalPlanned,
  lockedCount,
  draftedCount,
  illustratedCount,
} from '@/data/ai';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Gods of AI',
  description:
    'Series Four: 50 trading cards for the architects of machine learning — the people who designed the ideas, the models and the infrastructure, weighted toward those who gave their work away.',
  openGraph: {
    title: `Gods of AI · ${site.name}`,
    description:
      'Series Four: 50 trading cards for the architects of machine learning, weighted toward those who gave their work away.',
    url: `${site.url}/gods-of-ai`,
    type: 'website',
  },
  alternates: { canonical: '/gods-of-ai' },
};

const CRITERIA = [
  {
    tag: 'Architects',
    head: 'They designed something',
    body: 'An idea, a model or a piece of infrastructure that the field is built on. Running a lab is not the qualification; having your name on the thing everyone uses is.',
  },
  {
    tag: 'Open',
    head: 'Giving it away counts double',
    body: 'This is an open source card series, so the weights, the code, the data and the teaching are scored explicitly. A merely good open contribution outranks a brilliant closed one.',
  },
  {
    tag: 'Documented',
    head: 'Cite the paper or the repo',
    body: 'Every card links the artefact behind the claim — the arXiv entry, the GitHub repository, the prize citation. If we cannot link it, it does not go on the card.',
  },
  {
    tag: 'Original art',
    head: 'Inspired by the work',
    body: 'Edition 2 uses original illustrations inspired by each person’s contributions. The art interprets their work; names, biographies and sources remain separately typeset and documented.',
  },
];

export default function GodsOfAiPage() {
  const pct = Math.round((draftedCount / totalPlanned) * 100);

  return (
    <>
      {/* Hero */}
      <section className={styles.hero}>
        <div className="container">
          <span className={`kicker ${styles.kicker}`}>
            Series Four <span className={styles.wip}>In progress</span>
          </span>
          <h1 className={styles.title}>
            <span className="gradient-text">Gods</span> of AI
          </h1>
          <p className={styles.lede}>
            The architects. The people who worked out backpropagation, attention and
            reinforcement learning, and the ones who wrote the frameworks, the kernels and
            the quantisers the whole field runs on — {totalPlanned} cards, weighted
            deliberately toward those who gave the work away.
          </p>
          <p className={styles.warning}>
            Edition 2 pairs each person with original artwork inspired by their contributions.
            Explore the card pages for the illustrations, biographies and sources behind the set.
          </p>
          <div className={styles.actions}>
            <a href={site.github} target="_blank" rel="noreferrer" className="btn-primary">
              Nominate an architect
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
            <h2 className={styles.h2}>{architects.length} names, ordered by set number</h2>
            <p className={styles.sub}>
              Open the scouting report for the paper or repository behind each claim, or go
              to a card&apos;s own page. Nothing here is final until the set is frozen —
              argue with any of it on GitHub.
            </p>
          </div>

          <div className={styles.grid}>
            {architects.map((a) => (
              <RosterCard key={a.slug} entry={a} basePath="/gods-of-ai" />
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
              Fifty slots for a field moving this fast means the cuts were brutal, and the
              openness score is a judgement you are welcome to dispute. Nominate an
              architect, challenge a stat line, or rewrite a scouting report — every card
              starts as a pull request.
            </p>
          </div>
          <div className={styles.bandActions}>
            <a href={site.github} target="_blank" rel="noreferrer" className="btn-primary">
              Open a nomination
            </a>
            <Link href="/security-professionals" className="btn-secondary">See Series Three</Link>
          </div>
        </div>
      </section>
    </>
  );
}
