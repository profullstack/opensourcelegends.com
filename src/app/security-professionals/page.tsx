import type { Metadata } from 'next';
import Link from 'next/link';
import RosterCard from '@/components/RosterCard';
import AdUnit from '@/components/AdUnit';
import { site } from '@/data/site';
import {
  pros,
  totalPlanned,
  lockedCount,
  draftedCount,
  illustratedCount,
} from '@/data/security';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Security Professionals',
  description:
    'Series Three, in progress: 50 trading cards for the cryptographers, defenders, tool authors and security leaders who held the line. Roster open for nominations.',
  openGraph: {
    title: `Security Professionals · ${site.name}`,
    description:
      'Series Three, in progress: 50 trading cards for the cryptographers, defenders, tool authors and security leaders who held the line.',
    url: `${site.url}/security-professionals`,
    type: 'website',
  },
  alternates: { canonical: '/security-professionals' },
};

const CRITERIA = [
  {
    tag: 'Documented',
    head: 'It has to be on the record',
    body: 'Every card cites the paper, the book, the source tree or the report behind the claim. If we cannot link it, it does not go on the card.',
  },
  {
    tag: 'Load-bearing',
    head: 'Somebody still depends on it',
    body: 'A protocol, a tool, a process or a body of research that defenders are using today. A long job title is not a qualification for this set.',
  },
  {
    tag: 'Distinct',
    head: 'Nobody appears twice',
    body: 'Series Two documents the people who broke things. This one documents the people whose job was to hold. A name in Hacking Legends cannot also be here.',
  },
];

export default function SecurityProfessionalsPage() {
  const pct = Math.round((draftedCount / totalPlanned) * 100);

  return (
    <>
      {/* Hero */}
      <section className={styles.hero}>
        <div className="container">
          <span className={`kicker ${styles.kicker}`}>
            Series Three <span className={styles.wip}>In progress</span>
          </span>
          <h1 className={styles.title}>
            <span className="gradient-text">Security</span> Professionals
          </h1>
          <p className={styles.lede}>
            The third set, and the largest. Cryptographers, firewall builders, incident
            responders, tool authors and the security chiefs who had to answer for the
            breach — {totalPlanned} cards for the people who spent their careers holding the
            line rather than crossing it.
          </p>
          <p className={styles.warning}>
            {illustratedCount >= totalPlanned
              ? `All ${totalPlanned} cards are illustrated. The set was built in public and the
                 roster stays open to argument — every stat line and scouting report is a pull
                 request away from changing.`
              : `This set is being built in public. Copy is drafted, stats are in flux, and ${
                  illustratedCount === 0
                    ? 'not a single portrait has been illustrated yet'
                    : `${illustratedCount} of ${totalPlanned} cards are illustrated so far`
                }. What you see below is the working roster.`}
          </p>
          <div className={styles.actions}>
            <a href={site.github} target="_blank" rel="noreferrer" className="btn-primary">
              Nominate a professional
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
              {illustratedCount >= totalPlanned ? (
                <>
                  <li>Take nominations and re-cut any slot the argument goes against.</li>
                  <li>Re-render any card whose copy or stat line changes in review.</li>
                  <li>Print run and packs, alongside the open-licensed downloads.</li>
                </>
              ) : (
                <>
                  <li>Take nominations on the {totalPlanned} names and settle the disputed slots.</li>
                  <li>Lock the stat lines and freeze the list.</li>
                  <li>Illustrate fronts and backs, same treatment as Series One and Two.</li>
                  <li>Card pages, print run and packs, alongside the open-licensed downloads.</li>
                </>
              )}
            </ol>
          </aside>
        </div>
      </section>

      {/* Roster */}
      <section className="section" id="roster">
        <div className="container">
          <div className={styles.head}>
            <span className="kicker">The working roster</span>
            <h2 className={styles.h2}>{pros.length} names, ordered by set number</h2>
            <p className={styles.sub}>
              Open the scouting report for the sources behind each claim, or go to a
              card&apos;s own page. Nothing here is final until the set is frozen — argue
              with any of it on GitHub.
            </p>
          </div>

          <div className={styles.grid}>
            {pros.map((p) => (
              <RosterCard key={p.slug} entry={p} basePath="/security-professionals" />
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
              Fifty slots is not many for a field this old, and the cuts were painful.
              Nominate a defender, challenge a stat line, or rewrite a scouting report —
              every card starts as a pull request.
            </p>
          </div>
          <div className={styles.bandActions}>
            <a href={site.github} target="_blank" rel="noreferrer" className="btn-primary">
              Open a nomination
            </a>
            <Link href="/hacking-legends" className="btn-secondary">See Series Two</Link>
          </div>
        </div>
      </section>
    </>
  );
}
