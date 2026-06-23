import Link from 'next/link';
import CardFlip from '@/components/CardFlip';
import { cards, featured } from '@/data/cards';
import { site } from '@/data/site';
import styles from './page.module.css';

export default function Home() {
  const fan = cards.slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroCopy}>
            <span className="kicker">Series One · {cards.length} legends</span>
            <h1 className={styles.title}>
              The <span className="gradient-text">legends</span> who built
              the software the world runs on.
            </h1>
            <p className={styles.lede}>
              A collectible trading-card series honoring the creators of open source —
              from the kernel to the compiler. Open-licensed artwork, limited physical
              packs, and on-chain collectibles.
            </p>
            <div className={styles.heroActions}>
              <Link href="/collect" className="btn-primary">Get a pack</Link>
              <Link href="/cards" className="btn-secondary">Browse the set →</Link>
            </div>
            <p className={styles.heroNote}>
              Card data &amp; art are <strong>{site.license}</strong> — fork it, print it, remix it.
            </p>
          </div>

          <div className={styles.fan} aria-hidden>
            {fan.map((c, i) => (
              <div key={c.slug} className={styles.fanCard} data-pos={i}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${c.front}?v=g1`} alt="" className={styles.fanImg} loading="eager" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stat strip */}
      <section className={styles.stats}>
        <div className={`container ${styles.statsInner}`}>
          {[
            ['50', 'Legends in Series One'],
            ['CC BY-SA', 'Open-licensed art'],
            ['3', 'Ways to collect'],
            ['∞', 'Community submissions'],
          ].map(([n, label]) => (
            <div key={label} className={styles.stat}>
              <span className={styles.statNum}>{n}</span>
              <span className={styles.statLabel}>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="section">
        <div className="container">
          <div className={styles.sectionHead}>
            <div>
              <span className="kicker">The roster</span>
              <h2 className={styles.h2}>Meet the legends</h2>
              <p className={styles.sectionSub}>Hover or tap a card to flip it.</p>
            </div>
            <Link href="/cards" className="btn-secondary">Browse the set →</Link>
          </div>
          <div className={styles.grid}>
            {featured.map((c) => (
              <CardFlip key={c.slug} card={c} />
            ))}
          </div>
        </div>
      </section>

      {/* Three ways to collect */}
      <section className="section">
        <div className="container">
          <div className={styles.sectionHead}>
            <div>
              <span className="kicker">Collect</span>
              <h2 className={styles.h2}>Three ways to own a legend</h2>
            </div>
          </div>
          <div className={styles.pillars}>
            <article className={styles.pillar}>
              <span className={styles.pillarTag}>Physical</span>
              <h3>Foil trading packs</h3>
              <p>
                Premium 350gsm cards with holographic rarity foils, shipped worldwide.
                Blind packs of 5 or the full collector&apos;s box.
              </p>
              <Link href="/collect" className={styles.pillarLink}>Pre-order packs →</Link>
            </article>

            <article className={`${styles.pillar} ${styles.pillarFeatured}`}>
              <span className={styles.pillarTag}>Digital · NFT</span>
              <h3>On-chain collectibles</h3>
              <p>
                Mint a legend as a verifiable digital collectible. Each mint funds the
                open-source projects it celebrates. Optional &mdash; no wallet required to browse.
              </p>
              <Link href="/collect" className={styles.pillarLink}>Join the mint list →</Link>
            </article>

            <article className={styles.pillar}>
              <span className={styles.pillarTag}>Open Source</span>
              <h3>Print your own</h3>
              <p>
                Every card&apos;s art and stats are {site.license}. Download the source,
                print at home, or submit a new legend by pull request.
              </p>
              <Link href="/contribute" className={styles.pillarLink}>Contribute on GitHub →</Link>
            </article>
          </div>
        </div>
      </section>

      {/* Contribute band */}
      <section className={styles.band}>
        <div className={`container ${styles.bandInner}`}>
          <div>
            <h2 className={styles.h2}>Know a legend we missed?</h2>
            <p>
              The set is community-curated and built in the open. Nominate a maintainer,
              design a card, or improve the stats — every legend starts as a pull request.
            </p>
          </div>
          <div className={styles.bandActions}>
            <a href={site.github} target="_blank" rel="noreferrer" className="btn-primary">Open a nomination</a>
            <Link href="/contribute" className="btn-secondary">How it works</Link>
          </div>
        </div>
      </section>
    </>
  );
}
