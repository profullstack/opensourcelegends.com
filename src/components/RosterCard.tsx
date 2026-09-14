'use client';
import { useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import type { RosterEntry } from '@/data/roster';
import { rarityLabel, statusLabel } from '@/data/roster';
import styles from './RosterCard.module.css';

// Match CardFlip and CardDetail when the portrait artwork changes.
const CARD_VERSION = 'v2-painted-20260914';

function host(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function ArtWrap({
  href,
  className,
  label,
  children,
}: {
  href?: string;
  className: string;
  label: string;
  children: ReactNode;
}) {
  if (!href) {
    return <span className={className}>{children}</span>;
  }
  return (
    <Link href={href} className={className} aria-label={label}>
      {children}
    </Link>
  );
}

// Shared by every hand-curated series. A set is illustrated card by card: anyone
// with a rendered front shows it, the rest fall back to a data-only proof so the
// whole roster stays reviewable before a single portrait is commissioned.
// Card pages only exist once art does, so an un-illustrated entry renders its own
// name as plain text rather than linking somewhere that would 404.
// The root is an <article>, not a <button>, because the expanded report carries
// real links (the card permalink and the sources behind the claims).
export default function RosterCard({
  entry,
  basePath,
}: {
  entry: RosterEntry;
  /** Series index route, e.g. "/hacking-legends". Card pages hang off it. */
  basePath: string;
}) {
  const [open, setOpen] = useState(false);
  const hacker = entry;
  const hasPage = Boolean(hacker.front);
  const href = `${basePath}/${hacker.slug}`;

  return (
    <article className={`${styles.card} ${open ? styles.open : ''}`} data-rarity={hacker.rarity}>
      <div className={styles.top}>
        <span className={`${styles.num} mono`}>{String(hacker.number).padStart(3, '0')}</span>
        <span className={styles.rarity}>{rarityLabel[hacker.rarity]}</span>
      </div>

      <ArtWrap
        href={hasPage ? href : undefined}
        className={styles.artLink}
        label={`${hacker.name} — ${hacker.title}`}
      >
        {hacker.front ? (
          <span className={styles.art}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${hacker.front}?v=${CARD_VERSION}`} alt={`${hacker.name} card front`} loading="lazy" width={500} height={745} />
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
      </ArtWrap>

      <div className={styles.body}>
        {hasPage ? (
          <Link href={href} className={styles.name}>
            {hacker.name}
          </Link>
        ) : (
          <span className={styles.name}>{hacker.name}</span>
        )}
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
        {hasPage && (
          <Link href={href} className={styles.permalink}>
            Card page <span aria-hidden>→</span>
          </Link>
        )}
      </div>
    </article>
  );
}
