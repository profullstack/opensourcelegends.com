'use client';
import { useState } from 'react';
import Link from 'next/link';
import { nav, site } from '@/data/site';
import styles from './Header.module.css';

export default function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.logo} onClick={() => setOpen(false)}>
          <img src="/crest.svg" alt="" width={28} height={28} />
          <span>Open Source Legends</span>
        </Link>

        <nav className={styles.navDesktop}>
          {nav.map((n) => (
            <Link key={n.href} href={n.href}>{n.label}</Link>
          ))}
          <a href={site.github} target="_blank" rel="noreferrer">GitHub</a>
        </nav>

        <div className={styles.actions}>
          <Link href="/collect" className="btn-primary">Get a pack</Link>
        </div>

        <button
          className={styles.hamburger}
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <span /><span /><span />
        </button>
      </div>

      {open && (
        <nav className={styles.mobile}>
          {nav.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)}>{n.label}</Link>
          ))}
          <a href={site.github} target="_blank" rel="noreferrer">GitHub</a>
          <Link href="/collect" className="btn-primary" onClick={() => setOpen(false)}>Get a pack</Link>
        </nav>
      )}
    </header>
  );
}
