import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';

// Social previews want landscape. The cards are 500x745 portrait, which X and
// LinkedIn refuse to render large, so every card gets a 1200x630 composite with
// the art on the left and the stat line on the right.
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = 'image/png';

const RARITY_COLOR: Record<string, string> = {
  iconic: '#f5c451',
  legendary: '#b06bff',
  epic: '#4f8cff',
  rare: '#25c26e',
};

/** Inlines a file from /public as a data URI — satori cannot fetch relative paths. */
async function embed(publicPath: string) {
  const abs = path.join(process.cwd(), 'public', publicPath.replace(/^\//, ''));
  const bytes = await readFile(abs);
  return `data:image/png;base64,${bytes.toString('base64')}`;
}

export type OgCard = {
  number: number;
  name: string;
  handle?: string;
  title: string;
  rarity: string;
  rarityLabel: string;
  impact: number;
  front: string;
  setLabel: string;
};

export async function renderCardOg(card: OgCard) {
  const front = await embed(card.front);
  const accent = RARITY_COLOR[card.rarity] ?? '#f5c451';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 56,
          padding: '0 72px',
          background: '#08090e',
          backgroundImage:
            'linear-gradient(120deg, rgba(79,140,255,0.14) 0%, rgba(8,9,14,0) 45%), linear-gradient(300deg, rgba(176,107,255,0.16) 0%, rgba(8,9,14,0) 50%)',
          fontFamily: 'sans-serif',
        }}
      >
        <img
          src={front}
          width={356}
          height={530}
          style={{
            borderRadius: 14,
            border: `2px solid ${accent}`,
            boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, maxWidth: 640 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'nowrap',
              whiteSpace: 'nowrap',
              gap: 12,
              fontSize: 18,
              letterSpacing: 3,
              color: '#8b91a3',
              textTransform: 'uppercase',
            }}
          >
            <span style={{ color: '#f5c451' }}>Open Source Legends</span>
            <span>·</span>
            <span>{card.setLabel}</span>
            <span>·</span>
            <span>{`#${String(card.number).padStart(3, '0')}`}</span>
          </div>

          <div
            style={{
              fontSize: card.name.length > 20 ? 62 : 74,
              fontWeight: 700,
              color: '#f3f4f8',
              lineHeight: 1.05,
              marginTop: 22,
            }}
          >
            {card.name}
          </div>

          {card.handle ? (
            <div
              style={{ display: 'flex', fontSize: 30, color: '#f5c451', marginTop: 10 }}
            >{`“${card.handle}”`}</div>
          ) : null}

          <div style={{ fontSize: 30, color: '#8b91a3', marginTop: 16, lineHeight: 1.3 }}>
            {card.title}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 36 }}>
            <div
              style={{
                display: 'flex',
                fontSize: 20,
                letterSpacing: 3,
                textTransform: 'uppercase',
                color: accent,
                border: `2px solid ${accent}`,
                borderRadius: 999,
                padding: '8px 20px',
              }}
            >
              {card.rarityLabel}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 10,
                fontSize: 20,
                letterSpacing: 3,
                textTransform: 'uppercase',
                color: '#8b91a3',
              }}
            >
              <span style={{ fontSize: 40, fontWeight: 700, color: '#f3f4f8' }}>{card.impact}</span>
              <span>Impact</span>
            </div>
          </div>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
