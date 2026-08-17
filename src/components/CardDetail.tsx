import Link from 'next/link';
import CopyLink from './CopyLink';
import { site } from '@/data/site';
import styles from './CardDetail.module.css';

// Bumped alongside CardFlip so a re-render of the art shows up without a hard refresh.
const CARD_VERSION = 'g1';

export type DetailStat = { label: string; value: number };
export type DetailSource = { label: string; url: string };

export type DetailNeighbour = { slug: string; name: string; front: string };

export type CardDetailProps = {
  /** Which series this card belongs to, e.g. "Series One". */
  setLabel: string;
  /** Index page for the series. */
  setHref: string;
  number: number;
  slug: string;
  name: string;
  handle?: string;
  title: string;
  knownFor: string;
  rarity: string;
  rarityLabel: string;
  /** Shown as the headline score. */
  impact: number;
  nationality: string;
  era: string;
  /** Projects (Series One) or domains (Series Two). */
  chips: string[];
  chipsLabel: string;
  scouting: string;
  quote?: string;
  note?: string;
  noteLabel?: string;
  /** Secondary stat bars. Series Two prints four; Series One has none. */
  stats?: DetailStat[];
  sources?: DetailSource[];
  statusLabel?: string;
  front: string;
  back: string;
  prev?: DetailNeighbour;
  next?: DetailNeighbour;
};

function host(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

export default function CardDetail(props: CardDetailProps) {
  const {
    setLabel,
    setHref,
    number,
    slug,
    name,
    handle,
    title,
    knownFor,
    rarity,
    rarityLabel,
    impact,
    nationality,
    era,
    chips,
    chipsLabel,
    scouting,
    quote,
    note,
    noteLabel = 'Collector’s note',
    stats,
    sources,
    statusLabel,
    front,
    back,
    prev,
    next,
  } = props;

  const url = `${site.url}${setHref}/${slug}`;
  const v = `?v=${CARD_VERSION}`;
  const shareText = `${name} — ${title} · ${site.name}`;

  return (
    <section className={styles.wrap}>
      <div className="container">
        <nav className={styles.crumbs} aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden>/</span>
          <Link href={setHref}>{setLabel}</Link>
          <span aria-hidden>/</span>
          <span>{name}</span>
        </nav>

        <div className={styles.layout}>
          <div className={styles.stickyCol}>
            <div className={styles.faces}>
              <div>
                <div className={styles.face}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`${front}${v}`}
                    alt={`${name} trading card, front`}
                    width={500}
                    height={745}
                    loading="eager"
                  />
                </div>
                <span className={styles.faceLabel}>Front</span>
              </div>
              <div>
                <div className={styles.face}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`${back}${v}`}
                    alt={`${name} trading card, back`}
                    width={500}
                    height={745}
                    loading="eager"
                  />
                </div>
                <span className={styles.faceLabel}>Back</span>
              </div>
            </div>

            <div className={styles.share}>
              <CopyLink url={url} />
              <a
                className={styles.shareBtn}
                href={`https://x.com/intent/post?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`}
                target="_blank"
                rel="noreferrer"
              >
                Share on X
              </a>
              <a className={styles.shareBtn} href={front} download>
                Download the art
              </a>
              <Link className={styles.shareBtn} href="/collect">
                Get a pack
              </Link>
            </div>
          </div>

          <div>
            <header className={styles.head}>
              <div className={styles.tags}>
                <span className={styles.num}>
                  #{String(number).padStart(3, '0')} · {setLabel}
                </span>
                <span className={styles.rarity} data-rarity={rarity}>
                  {rarityLabel}
                </span>
                {statusLabel && <span className={styles.status}>{statusLabel}</span>}
              </div>
              <h1 className={styles.name}>{name}</h1>
              {handle && <span className={styles.handle}>“{handle}”</span>}
              <p className={styles.title}>{title}</p>
              <p className={styles.known}>{knownFor}</p>
            </header>

            <div className={styles.block}>
              <h2 className={styles.blockHead}>Rating</h2>
              <div className={styles.impact}>
                <span className={styles.impactNum}>{impact}</span>
                <span className={styles.impactLabel}>Impact score</span>
              </div>
              {stats && stats.length > 0 && (
                <div className={styles.bars}>
                  {stats.map((s) => (
                    <div key={s.label} className={styles.barRow}>
                      <span className={styles.barLabel}>{s.label}</span>
                      <span className={styles.barTrack}>
                        <span className={styles.barFill} style={{ width: `${s.value}%` }} />
                      </span>
                      <span className={styles.barVal}>{s.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.block}>
              <div className={styles.meta}>
                <div>
                  <span className={styles.metaKey}>From</span>
                  <span className={styles.metaVal}>{nationality}</span>
                </div>
                <div>
                  <span className={styles.metaKey}>Era</span>
                  <span className={styles.metaVal}>{era}</span>
                </div>
              </div>
            </div>

            <div className={styles.block}>
              <h2 className={styles.blockHead}>{chipsLabel}</h2>
              <div className={styles.chips}>
                {chips.map((c) => (
                  <span key={c} className={styles.chip}>
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div className={styles.block}>
              <h2 className={styles.blockHead}>Scouting report</h2>
              <p className={styles.prose}>{scouting}</p>
            </div>

            {quote && (
              <div className={styles.block}>
                <h2 className={styles.blockHead}>Collector’s note</h2>
                <blockquote className={styles.quote}>{quote}</blockquote>
              </div>
            )}

            {note && (
              <div className={styles.block}>
                <h2 className={styles.blockHead}>{noteLabel}</h2>
                <p className={styles.note}>{note}</p>
              </div>
            )}

            {sources && sources.length > 0 && (
              <div className={styles.block}>
                <h2 className={styles.blockHead}>Sources</h2>
                <ul className={styles.sources}>
                  {sources.map((s, i) => (
                    <li key={s.url}>
                      <span className={styles.sourceNum}>{String(i + 1).padStart(2, '0')}</span>
                      <span>
                        <a href={s.url} target="_blank" rel="noreferrer nofollow">
                          {s.label}
                        </a>{' '}
                        <span className={styles.sourceHost}>{host(s.url)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          </div>
        </div>

        {(prev || next) && (
          <nav className={styles.pager} aria-label="More cards">
            {prev ? (
              <Link href={`${setHref}/${prev.slug}`} className={styles.pagerLink}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${prev.front}${v}`} alt="" className={styles.pagerThumb} loading="lazy" />
                <span>
                  <span className={styles.pagerKicker}>Previous</span>
                  <span className={styles.pagerName}>{prev.name}</span>
                </span>
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link
                href={`${setHref}/${next.slug}`}
                className={`${styles.pagerLink} ${styles.pagerNext}`}
              >
                <span>
                  <span className={styles.pagerKicker}>Next</span>
                  <span className={styles.pagerName}>{next.name}</span>
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${next.front}${v}`} alt="" className={styles.pagerThumb} loading="lazy" />
              </Link>
            )}
          </nav>
        )}
      </div>
    </section>
  );
}
