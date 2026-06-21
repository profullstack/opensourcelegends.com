import type { Metadata } from 'next';
import Link from 'next/link';
import { site } from '@/data/site';
import WaitlistForm from '@/components/WaitlistForm';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Collect',
  description: 'Order physical foil packs, join the NFT mint list, or print your own Open Source Legends cards.',
};

const tiers = [
  {
    name: 'Blind Pack',
    price: '$12',
    unit: 'per pack',
    blurb: '5 random cards with at least one foil. The classic way to chase a legend.',
    features: ['5 cards per pack', 'Guaranteed 1 foil', 'Holographic rarity finish', 'Ships worldwide'],
    cta: 'Pre-order packs',
    featured: false,
  },
  {
    name: "Collector's Box",
    price: '$79',
    unit: 'full set',
    blurb: 'The complete Series One in a numbered display box. Every legend, no duplicates.',
    features: ['All 16 cards', 'Numbered limited box', 'Premium foil set', 'Certificate of authenticity'],
    cta: 'Reserve a box',
    featured: true,
  },
  {
    name: 'Legend NFT',
    price: 'TBA',
    unit: 'per mint',
    blurb: 'Mint a card as a verifiable on-chain collectible. Proceeds fund the projects it honors.',
    features: ['1-of-1 + open editions', 'On-chain provenance', 'Funds OSS maintainers', 'No wallet needed to browse'],
    cta: 'Join the mint list',
    featured: false,
  },
];

export default function CollectPage() {
  return (
    <>
      <section className={styles.hero}>
        <div className="container">
          <span className="kicker">Collect</span>
          <h1 className={styles.h1}>Own a piece of open-source history</h1>
          <p className={styles.sub}>
            Physical foil packs, on-chain collectibles, or print-your-own — every path is
            built in the open. Series One ships to backers first.
          </p>
        </div>
      </section>

      <section className={styles.pricingSection}>
        <div className="container">
          <div className={styles.tiers}>
            {tiers.map((t) => (
              <article key={t.name} className={`${styles.tier} ${t.featured ? styles.tierFeatured : ''}`}>
                {t.featured && <span className={styles.badge}>Most popular</span>}
                <h3 className={styles.tierName}>{t.name}</h3>
                <div className={styles.priceRow}>
                  <span className={styles.price}>{t.price}</span>
                  <span className={styles.unit}>{t.unit}</span>
                </div>
                <p className={styles.blurb}>{t.blurb}</p>
                <ul className={styles.features}>
                  {t.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <a href="#waitlist" className={t.featured ? 'btn-primary' : 'btn-secondary'}>{t.cta}</a>
              </article>
            ))}
          </div>
          <p className={styles.disclaimer}>
            Series One is in pre-launch. Join the list below and you&apos;ll be first to order
            when packs drop — no charge until they ship.
          </p>
        </div>
      </section>

      <section id="waitlist" className={styles.waitlist}>
        <div className={`container ${styles.waitlistInner}`}>
          <div>
            <h2 className={styles.h2}>Get first dibs</h2>
            <p>
              Drop your email for launch alerts on physical packs and the NFT mint. We&apos;ll only
              email about Open Source Legends.
            </p>
            <p className={styles.openNote}>
              Prefer to DIY? Every card is {site.license}.{' '}
              <Link href="/contribute">Print your own →</Link>
            </p>
          </div>
          <WaitlistForm />
        </div>
      </section>
    </>
  );
}
