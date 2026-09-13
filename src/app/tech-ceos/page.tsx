import type { Metadata } from 'next';
import Link from 'next/link';
import RosterCard from '@/components/RosterCard';
import AdUnit from '@/components/AdUnit';
import { site } from '@/data/site';
import {
  executives,
  alreadyCarded,
  totalPlanned,
  lockedCount,
  draftedCount,
  illustratedCount,
} from '@/data/ceos';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Tech CEOs',
  description:
    'Series Six: 50 trading cards for the people who ran the companies, from the HP garage in 1939 to OpenAI — scored on how much they gave away.',
  openGraph: {
    title: `Tech CEOs · ${site.name}`,
    description:
      'Series Six: 50 trading cards for the people who ran the companies, scored on how much they gave away.',
    url: `${site.url}/tech-ceos`,
    type: 'website',
  },
  alternates: { canonical: '/tech-ceos' },
};

const CRITERIA = [
  {
    tag: 'Ran it',
    head: 'Chief executive, founder, or both',
    body: 'They held the job and made the calls. A brilliant CTO or a famous investor does not qualify here; several people on this list are carded for a single decision they signed off on.',
  },
  {
    tag: 'Consequential',
    head: 'The industry moved',
    body: 'A market appeared, a business model became standard, an architecture won, or a company the size of a country changed direction. Personal wealth is not the measure and is not scored.',
  },
  {
    tag: 'Open',
    head: 'What they gave away is scored',
    body: 'This is an open source card collection, so every card carries an openness number: code released, standards published, patents pledged, platforms left open. It is a judgement and you are welcome to argue with it.',
  },
  {
    tag: 'Honest',
    head: 'The bad decisions get printed too',
    body: 'An antitrust ruling, a licence fight, a driver the kernel maintainers hated. Several people here spent years on the opposing side of the arguments this site was founded on, and the scouting reports say so.',
  },
];

export default function TechCeosPage() {
  const pct = Math.round((draftedCount / totalPlanned) * 100);

  return (
    <>
      {/* Hero */}
      <section className={styles.hero}>
        <div className="container">
          <span className={`kicker ${styles.kicker}`}>
            Series Six <span className={styles.wip}>In progress</span>
          </span>
          <h1 className={styles.title}>
            <span className="gradient-text">Tech</span> CEOs
          </h1>
          <p className={styles.lede}>
            Every other set here cards the person who wrote the thing. This one cards the
            person who decided it would be built, priced, staffed and — the part this site
            actually cares about — whether it would be given away.
          </p>
          <p className={styles.warning}>
            Being admired is not the bar and neither is being liked. Gates is on this list for
            the letter that called copying software theft. Huang is on it for a driver the
            kernel maintainers spent a decade complaining about. Both of them also shipped
            things nothing else in this collection would exist without.
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
            <h2 className={styles.h2}>{executives.length} names, roughly in the order they took charge</h2>
            <p className={styles.sub}>
              Open the scouting report for the sources behind each claim, or go to a
              card&apos;s own page. Nothing here is final until the set is frozen.
            </p>
          </div>

          <div className={styles.grid}>
            {executives.map((e) => (
              <RosterCard key={e.slug} entry={e} basePath="/tech-ceos" />
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
              No name appears in two series, so these {alreadyCarded.length} founders and
              chief executives are not repeated here. Shuttleworth, Mullenweg and Hykes ran
              companies too; they were carded for what they built first.
            </p>
          </div>
          <div className={styles.criteria}>
            {alreadyCarded.map((p) => (
              <article key={p.href} className={styles.criterion}>
                <span className={styles.criterionTag}>{p.set}</span>
                <h3>
                  <Link href={p.href}>{p.name}</Link>
                </h3>
                <p>{p.company}</p>
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
              Fifty slots across eighty-five years of the industry means the cuts were
              severe, and there are obvious names not on this list. Nominate someone,
              challenge a stat line, or rewrite a scouting report. Every card starts as a
              pull request.
            </p>
          </div>
          <div className={styles.bandActions}>
            <a href={site.github} target="_blank" rel="noreferrer" className="btn-primary">
              Open a nomination
            </a>
            <Link href="/women-in-tech" className="btn-secondary">See Series Five</Link>
          </div>
        </div>
      </section>
    </>
  );
}
