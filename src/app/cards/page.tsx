import type { Metadata } from 'next';
import Link from 'next/link';
import CardFlip from '@/components/CardFlip';
import { cards } from '@/data/cards';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'The Set',
  description: 'A preview of Open Source Legends Series One — 50 collectible cards.',
};

export default function CardsPage() {
  return (
    <section className="section">
      <div className="container">
        <header className={styles.head}>
          <span className="kicker">Series One</span>
          <h1 className={styles.h1}>The set</h1>
          <p className={styles.sub}>
            {cards.length} legends of open source. Hover or tap a card to flip it
            and read the scouting report.
          </p>
        </header>

        <div className={styles.grid}>
          {cards.map((c) => (
            <CardFlip key={c.slug} card={c} />
          ))}
        </div>

        <div className={styles.cta}>
          <Link href="/collect" className="btn-primary">Get the full deck →</Link>
          <Link href="/contribute" className="btn-secondary">Nominate a legend</Link>
        </div>
      </div>
    </section>
  );
}
