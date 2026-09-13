import Link from 'next/link';
import CardFlip from '@/components/CardFlip';
import AdUnit from '@/components/AdUnit';
import { cards, featured } from '@/data/cards';
import { hackers, illustratedCount, lockedCount } from '@/data/hacking';
import { pros, totalPlanned as proTotal } from '@/data/security';
import { architects, illustratedCount as aiIllustrated, totalPlanned as aiTotal } from '@/data/ai';
import { builders, illustratedCount as wIllustrated, totalPlanned as wTotal } from '@/data/women';
import { executives, illustratedCount as cIllustrated, totalPlanned as cTotal } from '@/data/ceos';
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
            [String(cards.length), 'Legends in Series One'],
            [String(hackers.length), 'On the Series Two roster'],
            ['CC BY-SA', 'Open-licensed art'],
            ['3', 'Ways to collect'],
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

      {/* Series Two teaser */}
      <section className="section">
        <div className="container">
          <div className={styles.bandInner}>
            <div>
              <span className="kicker">Series Two · In progress</span>
              <h2 className={styles.h2}>Hacking Legends</h2>
              <p>
                The next set covers the other half of the story: the phone phreaks, worm
                authors, disclosure architects and defenders who found the holes in all of
                this. {hackers.length} names on the working roster, {illustratedCount} of
                them illustrated, {lockedCount} stat lines locked — and nominations are
                still open.
              </p>
            </div>
            <div className={styles.bandActions}>
              <Link href="/hacking-legends" className="btn-primary">See the roster →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Series Three teaser */}
      <section className="section">
        <div className="container">
          <div className={styles.bandInner}>
            <div>
              <span className="kicker">Series Three · In progress</span>
              <h2 className={styles.h2}>Security Professionals</h2>
              <p>
                And the half that had to clean up: cryptographers, firewall builders,
                incident responders, tool authors and the security chiefs who answered for
                the breach. {pros.length} of {proTotal} names drafted, art not started, and
                the cuts are still up for argument.
              </p>
            </div>
            <div className={styles.bandActions}>
              <Link href="/security-professionals" className="btn-primary">
                See the roster →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Series Four teaser */}
      <section className="section">
        <div className="container">
          <div className={styles.bandInner}>
            <div>
              <span className="kicker">Series Four · In progress</span>
              <h2 className={styles.h2}>Gods of AI</h2>
              <p>
                The architects of machine learning: backpropagation, attention and
                reinforcement learning, plus the people who wrote the frameworks, kernels
                and quantisers the field runs on. {architects.length} cards, scored
                explicitly on how much they gave away, {aiIllustrated} of {aiTotal}{' '}
                illustrated with original artwork inspired by their contributions.
              </p>
            </div>
            <div className={styles.bandActions}>
              <Link href="/gods-of-ai" className="btn-primary">See the roster →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Series Five teaser */}
      <section className="section">
        <div className="container">
          <div className={styles.bandInner}>
            <div>
              <span className="kicker">Series Five · In progress</span>
              <h2 className={styles.h2}>Women in Tech</h2>
              <p>
                One hundred and eighty years of it: the first compiler, the first assembler,
                the ARM instruction set, the Apollo guidance software, and the code of
                conduct in your repository. {builders.length} cards, {wIllustrated} of{' '}
                {wTotal} illustrated with original artwork inspired by their contributions.
                Series One has forty-seven cards and no women on any of them, which is the reason this set exists.
              </p>
            </div>
            <div className={styles.bandActions}>
              <Link href="/women-in-tech" className="btn-primary">See the roster →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Series Six teaser */}
      <section className="section">
        <div className="container">
          <div className={styles.bandInner}>
            <div>
              <span className="kicker">Series Six · In progress</span>
              <h2 className={styles.h2}>Tech CEOs</h2>
              <p>
                Every other set here cards the person who wrote the thing. This one cards the
                person who decided it would be built, and whether it would be given away:
                the billion dollars IBM put behind Linux, Java under the GPL, the GitHub
                acquisition. {executives.length} cards, {cIllustrated} of {cTotal}{' '}
                illustrated with original artwork inspired by their contributions.
              </p>
            </div>
            <div className={styles.bandActions}>
              <Link href="/tech-ceos" className="btn-primary">See the roster →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* In-content ad */}
      <section className="section">
        <div className="container">
          <AdUnit />
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
