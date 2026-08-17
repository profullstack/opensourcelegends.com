'use client';
import { useState } from 'react';
import Link from 'next/link';
import type { Hacker } from '@/data/hacking';
import { rarityLabel, statusLabel } from '@/data/hacking';
import styles from './RosterCard.module.css';

function host(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

// Series Two is illustrated card by card. Anyone with a rendered front shows it;
// the rest fall back to a data-only proof so the whole roster stays reviewable.
// The root is an <article>, not a <button>, because the expanded report carries
// real links (the card permalink and the sources behind the claims).
export default function RosterCard({ hacker }: { hacker: Hacker }) {
  const [open, setOpen] = useState(false);
  const href = `/hacking-legends/${hacker.slug}`;

  return (
    <article className={`${styles.card} ${open ? styles.open : ''}`} data-rarity={hacker.rarity}>
      <div className={styles.top}>
        <span className={`${styles.num} mono`}>{String(hacker.number).padStart(3, '0')}</span>
        <span className={styles.rarity}>{rarityLabel[hacker.rarity]}</span>
      </div>

      <Link href={href} className={styles.artLink} aria-label={`${hacker.name} — ${hacker.title}`}>
        {hacker.front ? (
          <span className={styles.art}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={hacker.front} alt={`${hacker.name} card front`} loading="lazy" width={500} height={745} />
          </span>
        ) : (
          <span className={styles.plate} aria-hidden>
            <span className={`${styles.glyph} mono`}>
              {hacker.handle
                ? `~${hacker.handle.toLowerCase().replace(/\s+/g, '')}`
                : hacker.name.split(' ').map((w) => w[0]).join('')}
            </span>
            <span className={styles.plateNote}>art pending</span>
          </span>
        )}
      </Link>

      <div className={styles.body}>
        <Link href={href} className={styles.name}>
          {hacker.name}
        </Link>
        {hacker.handle && <span className={`${styles.handle} mono`}>“{hacker.handle}”</span>}
        <span className={styles.title}>{hacker.title}</span>
        <span className={styles.known}>{hacker.knownFor}</span>

        <div className={styles.domains}>
          {hacker.domains.map((d) => (
            <span key={d} className={styles.domain}>
              {d}
            </span>
          ))}
        </div>

        <div className={styles.meta}>
          <span className="mono">{hacker.nationality}</span>
          <span className="mono">{hacker.era}</span>
          <span className={styles.impact}>
            <span className={styles.impactBar}>
              <span className={styles.impactFill} style={{ width: `${hacker.impact}%` }} />
            </span>
            <span className="mono">{hacker.impact}</span>
          </span>
        </div>

        <p className={styles.scouting}>{hacker.scouting}</p>

        {open && hacker.sources && hacker.sources.length > 0 && (
          <div className={styles.sources}>
            <span className={styles.sourcesHead}>Sources</span>
            <ul>
              {hacker.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noreferrer nofollow">
                    {s.label}
                  </a>{' '}
                  <span className={`${styles.sourceHost} mono`}>{host(s.url)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className={styles.foot}>
        <span className={styles.status} data-status={hacker.status}>
          {statusLabel[hacker.status]}
        </span>
        <button type="button" className={styles.more} onClick={() => setOpen((o) => !o)}>
          {open ? 'Hide report' : 'Scouting report'}
        </button>
        <Link href={href} className={styles.permalink}>
          Card page <span aria-hidden>→</span>
        </Link>
      </div>
    </article>
  );
}
