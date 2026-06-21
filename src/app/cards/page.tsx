import type { Metadata } from 'next';
import LegendCard from '@/components/LegendCard';
import { legends } from '@/data/legends';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'The Set',
  description: 'Every card in Open Source Legends Series One.',
};

export default function CardsPage() {
  const byRarity = {
    iconic: legends.filter((l) => l.rarity === 'iconic').length,
    legendary: legends.filter((l) => l.rarity === 'legendary').length,
    epic: legends.filter((l) => l.rarity === 'epic').length,
    rare: legends.filter((l) => l.rarity === 'rare').length,
  };

  return (
    <section className="section">
      <div className="container">
        <header className={styles.head}>
          <span className="kicker">Series One</span>
          <h1 className={styles.h1}>The complete set</h1>
          <p className={styles.sub}>
            {legends.length} legends of open source. Hover a card for its skill stack and impact rating.
          </p>
          <div className={styles.legend}>
            <span data-r="iconic">Iconic · {byRarity.iconic}</span>
            <span data-r="legendary">Legendary · {byRarity.legendary}</span>
            <span data-r="epic">Epic · {byRarity.epic}</span>
            <span data-r="rare">Rare · {byRarity.rare}</span>
          </div>
        </header>

        <div className={styles.grid}>
          {legends.map((l) => (
            <LegendCard key={l.slug} legend={l} />
          ))}
        </div>
      </div>
    </section>
  );
}
