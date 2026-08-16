'use client';
import { useState } from 'react';
import type { Hacker } from '@/data/hacking';
import { rarityLabel, statusLabel } from '@/data/hacking';
import styles from './RosterCard.module.css';

// Series Two has no artwork yet — this renders the card data as a proof so the
// roster is reviewable before a single portrait is commissioned.
export default function RosterCard({ hacker }: { hacker: Hacker }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      type="button"
      className={`${styles.card} ${open ? styles.open : ''}`}
      data-rarity={hacker.rarity}
      onClick={() => setOpen((o) => !o)}
      aria-expanded={open}
      aria-label={`${hacker.name} — ${hacker.title}. Tap for the scouting report.`}
    >
      <span className={styles.top}>
        <span className={`${styles.num} mono`}>
          {String(hacker.number).padStart(3, '0')}
        </span>
        <span className={styles.rarity}>{rarityLabel[hacker.rarity]}</span>
      </span>

      <span className={styles.plate} aria-hidden>
        <span className={`${styles.glyph} mono`}>
          {hacker.handle ? `~${hacker.handle.toLowerCase().replace(/\s+/g, '')}` : hacker.name.split(' ').map((w) => w[0]).join('')}
        </span>
        <span className={styles.plateNote}>art pending</span>
      </span>

      <span className={styles.body}>
        <span className={styles.name}>{hacker.name}</span>
        {hacker.handle && <span className={`${styles.handle} mono`}>“{hacker.handle}”</span>}
        <span className={styles.title}>{hacker.title}</span>
        <span className={styles.known}>{hacker.knownFor}</span>

        <span className={styles.domains}>
          {hacker.domains.map((d) => (
            <span key={d} className={styles.domain}>{d}</span>
          ))}
        </span>

        <span className={styles.meta}>
          <span className="mono">{hacker.nationality}</span>
          <span className="mono">{hacker.era}</span>
          <span className={styles.impact}>
            <span className={styles.impactBar}>
              <span className={styles.impactFill} style={{ width: `${hacker.impact}%` }} />
            </span>
            <span className="mono">{hacker.impact}</span>
          </span>
        </span>

        <span className={styles.scouting}>{hacker.scouting}</span>
      </span>

      <span className={styles.foot}>
        <span className={styles.status} data-status={hacker.status}>
          {statusLabel[hacker.status]}
        </span>
        <span className={styles.more}>{open ? 'Hide report' : 'Scouting report'}</span>
      </span>
    </button>
  );
}
