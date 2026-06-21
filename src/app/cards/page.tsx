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
  const preview = cards.slice(0, 12);

  return (
    <section className="section">
      <div className="container">
        <header className={styles.head}>
          <span className="kicker">Series One</span>
          <h1 className={styles.h1}>A first look at the set</h1>
          <p className={styles.sub}>
            50 legends of open source. Here&apos;s a preview — hover or tap a card to flip it
            and read the scouting report. The full deck ships in the packs.
          </p>
        </header>

        <div className={styles.grid}>
          {preview.map((c) => (
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
