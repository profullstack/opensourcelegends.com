import Link from 'next/link';
import { nav, site } from '@/data/site';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brand}>
          <Link href="/" className={styles.logo}>
            <img src="/favicon.png" alt="" width={26} height={26} />
            <span>Open Source Legends</span>
          </Link>
          <p>{site.tagline}</p>
          <p className={styles.license}>
            Artwork &amp; card data licensed <strong>{site.license}</strong>.
          </p>
        </div>

        <nav className={styles.links}>
          <h4>Explore</h4>
          {nav.map((n) => (
            <Link key={n.href} href={n.href}>{n.label}</Link>
          ))}
        </nav>

        <nav className={styles.links}>
          <h4>Community</h4>
          <a href={site.github} target="_blank" rel="noreferrer">GitHub</a>
          <a href={site.twitter} target="_blank" rel="noreferrer">X</a>
          <a href={site.youtube} target="_blank" rel="noreferrer">YouTube</a>
          <a href={`mailto:${site.email}`}>Contact</a>
        </nav>
      </div>

      <div className={`container ${styles.bottom}`}>
        <span>© {new Date().getFullYear()} Open Source Legends. A Profullstack project.</span>
        <span className="mono">Built in the open ◦ {site.license}</span>
      </div>
    </footer>
  );
}
