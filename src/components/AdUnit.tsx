import styles from './AdUnit.module.css';

const SLOT = 'b9a5efa3-b3f8-408f-8bae-0322f42d382d';
const FORMAT = 'banner_300x250';

/**
 * CrawlProof network ad unit. Renders a sandboxed iframe via the global
 * ad.js loader (mounted once in the root layout). Drop <AdUnit /> anywhere
 * inside page content where a 300x250 banner should appear.
 */
export default function AdUnit({ className }: { className?: string }) {
  return (
    <aside className={`${styles.wrap} ${className ?? ''}`} aria-label="Advertisement">
      <span className={styles.label}>Advertisement</span>
      <div className={styles.slot} data-cp-ad="" data-slot={SLOT} data-format={FORMAT} />
    </aside>
  );
}
