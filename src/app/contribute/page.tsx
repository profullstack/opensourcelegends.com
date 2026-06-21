import type { Metadata } from 'next';
import { site } from '@/data/site';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Contribute',
  description: 'Nominate a legend, design a card, or improve the stats. Open Source Legends is built in the open.',
};

const steps = [
  {
    n: '01',
    title: 'Nominate a legend',
    body: 'Open an issue with the person, project, or company and why they belong in the set. The community votes with reactions.',
  },
  {
    n: '02',
    title: 'Draft the card',
    body: 'Add a record to legends.ts — title, signature projects, skill stack, impact score, and a great quote. Keep it accurate and sourced.',
  },
  {
    n: '03',
    title: 'Open a pull request',
    body: 'Submit art (or use the monogram fallback) and your card data. Maintainers review for accuracy, licensing, and balance.',
  },
  {
    n: '04',
    title: 'Ship it',
    body: 'Merged cards join the printable set and the next physical series. Contributors are credited on the card and in the repo.',
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
            <h2 className={styles.h2}>One legend, one object</h2>
            <p className={styles.specSub}>
              Every card is a typed record. Add yours to <span className="mono">src/data/legends.ts</span>.
            </p>
          </div>
          <pre className={styles.code}>
            <code>{`{
  number: 17,
  slug: "ada-lovelace",
  name: "Ada Lovelace",
  title: "The First Programmer",
  rarity: "iconic",          // iconic | legendary | epic | rare
  impact: 96,                // headline score, 0–99
  era: "1815 – 1852",
  nationality: "England",
  signatureProjects: ["Analytical Engine", "Note G"],
  skills: [
    { label: "Algorithmic Thinking", value: 99 },
    { label: "Vision", value: 99 },
    { label: "Mathematics", value: 97 },
    { label: "Open Source Impact", value: 90 },
  ],
  scouting: "Wrote the first published algorithm...",
  quote: "That brain of mine is something more than merely mortal.",
}`}</code>
          </pre>
        </div>
      </section>
    </>
  );
}
