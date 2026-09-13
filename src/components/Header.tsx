'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { nav, site } from '@/data/site';
import styles from './Header.module.css';

const primaryPaths: readonly string[] = ['/cards', '/collect', '/contribute'];
const primaryNav = nav.filter((item) => primaryPaths.includes(item.href));
const overflowNav = nav.filter((item) => !primaryPaths.includes(item.href));

export default function Header() {
  const [menu, setMenu] = useState<'more' | 'mobile' | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const overflowRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const mobileButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menu) return;

    function dismissOutside(event: Event) {
      const container = menu === 'more' ? overflowRef.current : headerRef.current;
      if (event.target instanceof Node && !container?.contains(event.target)) {
        setMenu(null);
      }
    }

    function dismissOnEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setMenu(null);
      (menu === 'more' ? moreButtonRef : mobileButtonRef).current?.focus();
    }

    document.addEventListener('pointerdown', dismissOutside);
    document.addEventListener('focusin', dismissOutside);
    document.addEventListener('keydown', dismissOnEscape);
    return () => {
      document.removeEventListener('pointerdown', dismissOutside);
      document.removeEventListener('focusin', dismissOutside);
      document.removeEventListener('keydown', dismissOnEscape);
    };
  }, [menu]);

  useEffect(() => {
    const breakpoint = window.matchMedia('(max-width: 880px)');
    const closeMenu = () => setMenu(null);
    breakpoint.addEventListener('change', closeMenu);
    return () => breakpoint.removeEventListener('change', closeMenu);
  }, []);

  return (
    <header ref={headerRef} className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.logo} onClick={() => setMenu(null)}>
          <img src="/favicon.png" alt="" width={28} height={28} />
          <span>Open Source Legends</span>
        </Link>

        <nav className={styles.navDesktop} aria-label="Main navigation">
          {primaryNav.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setMenu(null)}>{n.label}</Link>
          ))}
          <div ref={overflowRef} className={styles.overflow}>
            <button
              ref={moreButtonRef}
              type="button"
              className={styles.moreButton}
              onClick={() => setMenu(menu === 'more' ? null : 'more')}
              aria-expanded={menu === 'more'}
              aria-controls="overflow-navigation"
            >
              More
              <svg className={styles.chevron} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            <div id="overflow-navigation" className={styles.dropdown} hidden={menu !== 'more'}>
              {overflowNav.map((n) => (
                <Link key={n.href} href={n.href} onClick={() => setMenu(null)}>{n.label}</Link>
              ))}
              <a className={styles.github} href={site.github} target="_blank" rel="noreferrer" onClick={() => setMenu(null)}>GitHub <span aria-hidden="true">↗</span></a>
            </div>
          </div>
        </nav>

        <div className={styles.actions}>
          <Link href="/collect" className="btn-primary" onClick={() => setMenu(null)}>Get a pack</Link>
        </div>

        <button
          ref={mobileButtonRef}
          type="button"
          className={styles.hamburger}
          onClick={() => setMenu(menu === 'mobile' ? null : 'mobile')}
          aria-label={menu === 'mobile' ? 'Close menu' : 'Open menu'}
          aria-expanded={menu === 'mobile'}
          aria-controls="mobile-navigation"
        >
          <span /><span /><span />
        </button>
      </div>

      <nav id="mobile-navigation" className={styles.mobile} aria-label="Main navigation" hidden={menu !== 'mobile'}>
        {nav.map((n) => (
          <Link key={n.href} href={n.href} onClick={() => setMenu(null)}>{n.label}</Link>
        ))}
        <a href={site.github} target="_blank" rel="noreferrer" onClick={() => setMenu(null)}>GitHub</a>
        <Link href="/collect" className="btn-primary" onClick={() => setMenu(null)}>Get a pack</Link>
      </nav>
    </header>
  );
}
