'use client';
import { useState } from 'react';
import type { Card } from '@/data/cards';
import styles from './CardFlip.module.css';

export default function CardFlip({ card }: { card: Card }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <button
      type="button"
      className={`${styles.scene} ${flipped ? styles.flipped : ''}`}
      data-rarity={card.rarity}
      onClick={() => setFlipped((f) => !f)}
      aria-label={`${card.name} — ${card.title}. Tap to flip.`}
    >
      <span className={styles.inner}>
        <span className={styles.face}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={card.front} alt={`${card.name} card front`} loading="lazy" width={1024} height={1536} />
        </span>
        <span className={`${styles.face} ${styles.back}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={card.back} alt={`${card.name} card back`} loading="lazy" width={1024} height={1536} />
        </span>
      </span>
    </button>
  );
}
