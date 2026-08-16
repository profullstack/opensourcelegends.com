import type { Metadata } from 'next';
import Link from 'next/link';
import RosterCard from '@/components/RosterCard';
import AdUnit from '@/components/AdUnit';
import { site } from '@/data/site';
import {
  hackers,
  totalPlanned,
  lockedCount,
  draftedCount,
  illustratedCount,
} from '@/data/hacking';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Hacking Legends',
  description:
    'Series Two, in progress: a trading-card set for the phreaks, breakers and defenders who shaped computer security. Roster open for nominations.',
  openGraph: {
    title: `Hacking Legends · ${site.name}`,
    description:
      'Series Two, in progress: a trading-card set for the phreaks, breakers and defenders who shaped computer security.',
    url: `${site.url}/hacking-legends`,
    type: 'website',
  },
};

const CRITERIA = [
  {
    tag: 'Documented',
    head: 'It has to be on the record',
    body: 'Every card cites public reporting, court records, conference talks or the person’s own writing. No rumours, no scene folklore presented as fact.',
  },
  {
    tag: 'Consequential',
    head: 'Something changed after them',
    body: 'A protocol got patched, a law got written, an industry got built, or a generation copied the technique. Notoriety alone does not earn a card.',
  },
  {
    tag: 'Honest',
    head: 'Convictions get printed too',
    body: 'Several legends in this set went to prison. The cards say so plainly. Documenting a history is not endorsing every part of it.',
  },
];

export default function HackingLegendsPage() {
  const pct = Math.round((draftedCount / totalPlanned) * 100);

  return (
    <>
      {/* Hero */}
      <section className={styles.hero}>
        <div className="container">
          <span className={`kicker ${styles.kicker}`}>
            Series Two <span className={styles.wip}>In progress</span>
          </span>
          <h1 className={styles.title}>
            <span className="gradient-text">Hacking</span> Legends
          </h1>
          <p className={styles.lede}>
            The second set. Phone phreaks, worm authors, disclosure architects and the
            defenders who cleaned up after all of them — {totalPlanned} cards for the people
            who found the holes in the software the world runs on.
          </p>
          <p className={styles.warning}>
            This set is being built in public. Copy is drafted, stats are in flux, and{' '}
            {illustratedCount === 0
              ? 'not a single portrait has been illustrated yet'
              : `${illustratedCount} of ${totalPlanned} cards are illustrated so far`}
            . What you see below is the working roster.
          </p>
          <div className={styles.actions}>
            <a href={site.github} target="_blank" rel="noreferrer" className="btn-primary">
              Nominate a hacker
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
              <li>Finish the remaining scouting reports and lock the stat lines.</li>
              <li>Close nominations and freeze the {totalPlanned}-card list.</li>
              <li>Illustrate fronts and backs, same treatment as Series One.</li>
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
            <h2 className={styles.h2}>{hackers.length} names, so far</h2>
            <p className={styles.sub}>
              Tap a card for the full scouting report. Nothing here is final until the set
              is frozen — argue with any of it on GitHub.
            </p>
          </div>

          <div className={styles.grid}>
            {hackers.map((h) => (
              <RosterCard key={h.slug} hacker={h} />
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
              Series Two is community-curated in the open, exactly like Series One. Nominate
              a legend, challenge a stat line, or rewrite a scouting report — every card
              starts as a pull request.
            </p>
          </div>
          <div className={styles.bandActions}>
            <a href={site.github} target="_blank" rel="noreferrer" className="btn-primary">
              Open a nomination
            </a>
            <Link href="/cards" className="btn-secondary">See Series One</Link>
          </div>
        </div>
      </section>
    </>
  );
}
