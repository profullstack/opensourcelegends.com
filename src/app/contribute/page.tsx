import type { Metadata } from 'next';
import { site } from '@/data/site';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Contribute',
  description: 'Nominate a legend, design a card, or improve the stats. Open Source Legends is built in the open.',
  alternates: { canonical: '/contribute' },
};

const steps = [
  {
    n: '01',
    title: 'Nominate a legend',
    body: 'Open an issue with the person, project, or company and why they belong in the set. The community votes with reactions.',
  },
  {
    n: '02',
    title: 'Draft the card data',
    body: 'Add a record to the roster for the series you are contributing to — see the spec below. Every factual claim needs a public source we can check.',
  },
  {
    n: '03',
    title: 'Render the faces',
    body: 'Run the series pipeline to produce the front and back PNGs from your record. Card art is generated from the data, so nobody hand-edits a card image.',
  },
  {
    n: '04',
    title: 'Open a pull request',
    body: 'Ship the roster record plus the rendered faces. Maintainers review for accuracy, sourcing, licensing, and balance.',
  },
];

export default function ContributePage() {
  return (
    <>
      <section className={styles.hero}>
        <div className="container">
          <span className="kicker">Built in the open</span>
          <h1 className={styles.h1}>Every legend starts as a pull request</h1>
          <p className={styles.sub}>
            The roster is community-curated. Card art and data are licensed{' '}
            <strong>{site.license}</strong> — fork it, print it, remix it, and send legends back upstream.
          </p>
          <div className={styles.actions}>
            <a href={site.github} target="_blank" rel="noreferrer" className="btn-primary">View the repo</a>
            <a href={`${site.github}/issues/new`} target="_blank" rel="noreferrer" className="btn-secondary">
              Nominate a legend
            </a>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className={styles.steps}>
            {steps.map((s) => (
              <article key={s.n} className={styles.step}>
                <span className={styles.stepNum}>{s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.specSection}>
        <div className="container">
          <div className={styles.sectionHead}>
            <span className="kicker">The card spec</span>
            <h2 className={styles.h2}>One legend, one record</h2>
            <p className={styles.specSub}>
              Series Two is the set currently taking nominations. Its roster is
              hand-curated in <span className="mono">src/data/hacking.ts</span>, and that
              file is the source of truth — the pipeline reads it directly, so there is no
              second copy to keep in sync.
            </p>
          </div>
          <pre className={styles.code}>
            <code>{`// src/data/hacking.ts
{
  number: 31,
  slug: "ada-lovelace",
  name: "Ada Lovelace",
  handle: "",                  // optional scene handle
  title: "The First Programmer",
  knownFor: "The first published algorithm",
  rarity: "iconic",            // iconic | legendary | epic | rare
  impact: 96,                  // headline score, 0-100
  technical: 97,               // the four stat bars on the card back
  social: 70,
  notoriety: 60,
  influence: 95,
  nationality: "England",
  era: "1815-1852",
  domains: ["Computing theory", "Mathematics"],
  scouting: "Wrote the first published algorithm...",
  note: "Curator's voice. Never a fabricated quote.",
  status: "draft",             // locked | draft | candidate
  sources: [                   // required — at least one public reference
    { label: "Ada Lovelace", url: "https://en.wikipedia.org/wiki/Ada_Lovelace" },
  ],
}`}</code>
          </pre>

          <div className={styles.specNotes}>
            <article>
              <h3>Then render the faces</h3>
              <p>
                <span className="mono">pnpm hacking validate</span> checks the roster and
                reports what art is missing.{' '}
                <span className="mono">pnpm hacking all 31</span> generates the portrait,
                renders the front and back, and writes them to{' '}
                <span className="mono">public/cards/hacking/</span>. The{' '}
                <span className="mono">front</span> and <span className="mono">back</span>{' '}
                fields are written by that step — never by hand.
              </p>
            </article>
            <article>
              <h3>Series One works differently</h3>
              <p>
                Series One is complete and locked. Its fact-checked roster lives in{' '}
                <span className="mono">data/roster.locked.json</span>, and{' '}
                <span className="mono">src/data/cards.ts</span> is generated from it — the
                header of that file says so. Edit the JSON and re-run{' '}
                <span className="mono">node scripts/open-source-legends.mjs all</span>;
                a pull request that edits <span className="mono">cards.ts</span> directly
                will be overwritten by the next render.
              </p>
            </article>
            <article>
              <h3>Sourcing is not optional</h3>
              <p>
                Every historical claim on a card has to be checkable. The{' '}
                <span className="mono">sources</span> array is rendered on the card page
                and in the roster&apos;s scouting report, so a reader can go straight to
                the reporting, court record, talk or primary writing behind it.
              </p>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
