// HTML/CSS card template for "Open Source Legends".
// REFERENCE: docs/proof1.png. Portrait is the ONLY raster image; everything
// else (frame, crest, badges, stats, text) is HTML/CSS/SVG.

export const CARD_W = 750;
export const CARD_H = 1050;

// Per-card accent colour — the proof gives each legend a distinct theme colour.
const PALETTE = ['#f5c451', '#e0473a', '#f0822e', '#3e7bd6', '#36b37e', '#9b6bff', '#2bb3c0', '#e35d8a'];
function accentOf(card) {
  let h = 0; for (const ch of String(card.display_name)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
export const rarityOf = (n) => (n >= 95 ? 'iconic' : n >= 90 ? 'legendary' : n >= 85 ? 'epic' : 'rare');
const pad2 = (n) => String(n).padStart(2, '0');
const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

function traits(card) {
  const m = [['ARCHITECT', card.code_rating], ['PIONEER', card.innovation_rating], ['BUILDER', card.community_rating], ['RELENTLESS', card.longevity_rating]]
    .sort((a, b) => b[1] - a[1]).slice(0, 2).map((x) => x[0]);
  return [...m, rarityOf(card.impact_rating).toUpperCase()];
}

function bars(c, accent) {
  const rows = [
    ['CODE ARCHITECTURE', c.code_rating], ['INNOVATION', c.innovation_rating],
    ['COMMUNITY IMPACT', c.community_rating], ['LONGEVITY', c.longevity_rating], ['OPEN SOURCE IMPACT', c.impact_rating],
  ];
  return rows.map(([label, v]) => {
    const filled = Math.round(v / 10);
    const segs = Array.from({ length: 10 }, (_, i) => `<span class="seg ${i < filled ? 'on' : ''}"></span>`).join('');
    return `<div class="barRow"><span class="barLabel">${esc(label)}</span><span class="bar">${segs}</span><span class="barVal">${v}</span></div>`;
  }).join('');
}

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');`;

const emblem = (a, s = 28) => `<svg width="${s}" height="${s}" viewBox="0 0 48 48" fill="none">
  <path d="M24 3l16 5v13c0 12-7.4 20-16 24C15.4 41 8 33 8 21V8l16-5z" fill="#0a0810" stroke="${a}" stroke-width="2.4"/>
  <path d="M20 18l-5 6 5 6M28 18l5 6-5 6M26 16l-4 17" stroke="${a}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const codeGlyph = (a, s = 24) => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none">
  <path d="M12 9l-6 7 6 7M20 9l6 7-6 7M18 7l-4 18" stroke="${a}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const shell = (accent) => `
  ${FONTS}
  * { margin:0; padding:0; box-sizing:border-box; }
  html,body { width:${CARD_W}px; height:${CARD_H}px; }
  body { font-family:'Inter',Arial,sans-serif; background:#05060a; }
  .card { position:relative; width:${CARD_W}px; height:${CARD_H}px; overflow:hidden; border-radius:32px; background:#14111e;
    box-shadow: inset 0 0 0 5px #0a0810, inset 0 0 0 7px ${accent}, inset 0 0 0 10px #0a0810; }
`;

export function buildFront(card, portraitDataUri) {
  const accent = accentOf(card);
  const kw = traits(card).join('&nbsp;·&nbsp;');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  ${shell(accent)}
  /* portrait contained in the top ~54% (proof layout) */
  .portrait { position:absolute; left:16px; right:16px; top:16px; height:556px; border-radius:20px; overflow:hidden;
    box-shadow: inset 0 0 0 2px ${accent}66; }
  .portrait img { width:100%; height:100%; object-fit:cover; object-position:center 16%; }
  .portrait::after { content:''; position:absolute; left:0; right:0; bottom:0; height:34%;
    background:linear-gradient(180deg, transparent, rgba(20,17,30,.85) 78%, #14111e 100%); }
  .num { position:absolute; top:20px; left:26px; z-index:5; font-family:'Oswald'; font-weight:700; color:#fff; font-size:58px; line-height:1;
    text-shadow:0 2px 12px rgba(0,0,0,.85); }
  .crest { position:absolute; top:24px; right:24px; z-index:5; display:flex; align-items:center; gap:8px;
    background:#0a0810cc; border:2px solid ${accent}; border-radius:9px; padding:6px 12px 6px 9px; clip-path:polygon(8% 0,100% 0,100% 100%,0 100%); }
  .crest .t { font-family:'Oswald'; color:#fff; font-weight:700; font-size:15px; letter-spacing:1.2px; line-height:1.05; }
  /* info section below the portrait */
  .info { position:absolute; left:0; right:0; top:560px; bottom:0; display:flex; flex-direction:column; align-items:center; padding:8px 26px 26px; }
  .name { font-family:'Oswald'; color:#fff; font-weight:700; font-size:50px; letter-spacing:1px; line-height:1; text-transform:uppercase; text-align:center; margin-top:14px; }
  .title { color:${accent}; font-weight:700; font-size:19px; letter-spacing:2.5px; margin-top:12px; text-transform:uppercase; text-align:center; font-family:'Oswald'; }
  .kwbar { margin-top:auto; width:100%; display:flex; align-items:center; gap:14px; background:#0c0a16; border:1.5px solid ${accent}55;
    border-radius:14px; padding:10px 14px; }
  .badge { width:46px; height:46px; flex:0 0 auto; border-radius:50%; background:#0a0810; border:2px solid ${accent};
    display:flex; align-items:center; justify-content:center; }
  .kw { font-family:'Oswald'; flex:1; text-align:center; color:#e4e6ee; font-weight:600; font-size:16px; letter-spacing:1.2px; }
  </style></head><body>
  <div class="card">
    <div class="portrait"><img src="${portraitDataUri}"></div>
    <div class="num">${pad2(card.card_number)}</div>
    <div class="crest">${emblem(accent, 24)}<span class="t">OPEN SOURCE<br>LEGENDS</span></div>
    <div class="info">
      <div class="name">${esc(card.display_name)}</div>
      <div class="title">${esc(card.card_title)}</div>
      <div class="kwbar">
        <span class="badge">${emblem(accent, 26)}</span>
        <span class="kw">${kw}</span>
        <span class="badge">${codeGlyph(accent, 24)}</span>
      </div>
    </div>
  </div></body></html>`;
}

export function buildBack(card) {
  const accent = accentOf(card);
  const bullet = accent;
  const rarity = rarityOf(card.impact_rating).toUpperCase();
  const projects = (card.primary_projects || []).slice(0, 5).map((p) => `<li>${esc(p)}</li>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  ${shell(accent)}
  .card { display:flex; flex-direction:column; padding:30px 30px 26px; }
  .head { flex:0 0 auto; }
  .head .row { display:flex; align-items:baseline; gap:14px; }
  .head .num { font-family:'Oswald'; font-weight:700; color:#fff; font-size:46px; line-height:.9; }
  .head .name { font-family:'Oswald'; color:#fff; font-weight:700; font-size:36px; text-transform:uppercase; line-height:.95; }
  .head .title { color:${accent}; font-weight:700; font-size:15px; letter-spacing:2px; margin-top:7px; text-transform:uppercase; font-family:'Oswald'; }
  .rule { height:3px; background:linear-gradient(90deg,${accent},${accent}22); border-radius:2px; margin-top:12px; }
  /* dense, packed from top like the proof */
  .content { flex:1; display:flex; flex-direction:column; gap:18px; padding-top:18px; min-height:0; }
  h4 { font-family:'Oswald'; }
  .panels { flex:0 0 auto; display:flex; gap:14px; align-items:stretch; }
  .panel { background:#efeae0; border-radius:11px; padding:14px 16px; }
  .panel h4 { color:#15101f; font-size:13px; letter-spacing:1.5px; margin-bottom:8px; font-weight:700; }
  .scout { flex:1.5; } .scout p { color:#2c2935; font-size:15px; line-height:1.48; }
  .sig { flex:1; } .sig ul { list-style:none; }
  .sig li { color:#2c2935; font-size:15px; line-height:1.62; padding-left:14px; position:relative; }
  .sig li::before { content:'▸'; position:absolute; left:0; color:${bullet}; font-weight:800; }
  .stack { flex:1; display:flex; gap:14px; align-items:stretch; min-height:0; }
  .skill { flex:1.75; display:flex; flex-direction:column; }
  .skill h4 { color:${accent}; font-size:14px; letter-spacing:2px; margin-bottom:12px; font-weight:700; }
  .barsWrap { flex:1; display:flex; flex-direction:column; justify-content:space-evenly; }
  .barRow { display:flex; align-items:center; gap:12px; }
  .barLabel { font-family:'Oswald'; flex:0 0 150px; color:#b6bac8; font-size:12.5px; letter-spacing:.5px; font-weight:500; }
  .bar { flex:1; display:flex; gap:3px; }
  .seg { flex:1; height:16px; border-radius:2px; background:#241d38; }
  .seg.on { background:${accent}; box-shadow:0 0 6px ${accent}55; }
  .barVal { font-family:'Oswald'; flex:0 0 32px; text-align:right; color:#fff; font-weight:700; font-size:17px; }
  .impact { flex:1; background:linear-gradient(180deg,#191327,#0e0a18); border:2px solid ${accent}; border-radius:13px;
    display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; }
  .impact .lab { color:#b6bac8; font-size:12px; letter-spacing:3px; font-family:'Oswald'; }
  .impact .score { font-family:'Oswald'; color:${accent}; font-weight:700; font-size:76px; line-height:.85; }
  .impact .rar { color:#fff; font-weight:700; font-size:14px; letter-spacing:2px; font-family:'Oswald'; }
  .impact .stars { color:${accent}; font-size:17px; letter-spacing:2px; margin-top:5px; }
  .quote { flex:0 0 auto; color:#e0e2ea; font-style:italic; font-size:16px; line-height:1.4; }
  .quote .q { color:${accent}; font-size:28px; font-weight:700; margin-right:5px; vertical-align:-7px; font-family:Georgia,serif; }
  .foot { flex:0 0 auto; border-top:1px solid ${accent}66; padding-top:11px; margin-top:12px; color:#9a9ead; font-size:11.5px; letter-spacing:.4px; }
  .foot .r { display:flex; justify-content:space-between; align-items:center; }
  .foot b { color:#e0e2ea; }
  </style></head><body>
  <div class="card">
    <div class="head">
      <div class="row"><span class="num">${pad2(card.card_number)}</span><span class="name">${esc(card.display_name)}</span></div>
      <div class="title">${esc(card.card_title)}</div>
      <div class="rule"></div>
    </div>
    <div class="content">
      <div class="panels">
        <div class="panel scout"><h4>SCOUTING REPORT</h4><p>${esc(card.scouting_report)}</p></div>
        <div class="panel sig"><h4>SIGNATURE PROJECTS</h4><ul>${projects}</ul></div>
      </div>
      <div class="stack">
        <div class="skill"><h4>SKILL STACK</h4><div class="barsWrap">${bars(card, accent)}</div></div>
        <div class="impact"><span class="lab">IMPACT</span><span class="score">${card.impact_rating}</span><span class="rar">${rarity}</span><span class="stars">★★★★★</span></div>
      </div>
      <div class="quote"><span class="q">“</span>${esc(card.collector_note)}”</div>
    </div>
    <div class="foot">
      <div class="r"><span>BORN <b>${esc(card.birth_date)}</b></span><span>NATIONALITY <b>${esc(card.nationality)}</b></span></div>
      <div class="r" style="margin-top:6px"><span>KNOWN FOR <b>${esc(card.known_for)}</b></span>${codeGlyph(accent, 20)}</div>
    </div>
  </div></body></html>`;
}
