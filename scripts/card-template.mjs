// HTML/CSS card template for "Open Source Legends".
// Composites: Gemini-generated accent frame (background+border) + AI portrait
// (front) + crisp HTML text. Matches docs/proof1.png richness with accurate text.

export const CARD_W = 700;
export const CARD_H = 1043;

const PALETTE = ['f5c451', 'e0473a', 'f0822e', '3e7bd6', '36b37e', '9b6bff', '2bb3c0', 'e35d8a'];
export function accentHexOf(card) {
  let h = 0; for (const ch of String(card.display_name)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
const accentOf = (card) => '#' + accentHexOf(card);
export const rarityOf = (n) => (n >= 95 ? 'iconic' : n >= 90 ? 'legendary' : n >= 85 ? 'epic' : 'rare');
const pad2 = (n) => String(n).padStart(2, '0');
const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

function traits(card) {
  const m = [['ARCHITECT', card.code_rating], ['PIONEER', card.innovation_rating], ['BUILDER', card.community_rating], ['RELENTLESS', card.longevity_rating]]
    .sort((a, b) => b[1] - a[1]).slice(0, 2).map((x) => x[0]);
  return [...m, rarityOf(card.impact_rating).toUpperCase()];
}
function bars(c, accent) {
  const rows = [['CODE ARCHITECTURE', c.code_rating], ['INNOVATION', c.innovation_rating], ['COMMUNITY IMPACT', c.community_rating], ['LONGEVITY', c.longevity_rating], ['OPEN SOURCE IMPACT', c.impact_rating]];
  return rows.map(([label, v]) => {
    const filled = Math.round(v / 10);
    const segs = Array.from({ length: 10 }, (_, i) => `<span class="seg ${i < filled ? 'on' : ''}"></span>`).join('');
    return `<div class="barRow"><span class="barLabel">${esc(label)}</span><span class="bar">${segs}</span><span class="barVal">${v}</span></div>`;
  }).join('');
}
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');`;
const emblem = (a, s = 26) => `<svg width="${s}" height="${s}" viewBox="0 0 48 48" fill="none"><path d="M24 3l16 5v13c0 12-7.4 20-16 24C15.4 41 8 33 8 21V8l16-5z" fill="#0a0810" stroke="${a}" stroke-width="2.4"/><path d="M20 18l-5 6 5 6M28 18l5 6-5 6M26 16l-4 17" stroke="${a}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const codeGlyph = (a, s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none"><path d="M12 9l-6 7 6 7M20 9l6 7-6 7M18 7l-4 18" stroke="${a}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const base = `* { margin:0; padding:0; box-sizing:border-box; }
  html,body { width:${CARD_W}px; height:${CARD_H}px; }
  body { font-family:'Inter',Arial,sans-serif; background:#000; }
  .card { position:relative; width:${CARD_W}px; height:${CARD_H}px; overflow:hidden; }
  .bg { position:absolute; inset:0; z-index:0; background:#0b0a12; }
  .frame { position:absolute; inset:0; z-index:1; pointer-events:none; }
  .frame img { width:100%; height:100%; object-fit:fill; }`;

export function buildFront(card, portraitDataUri, frameDataUri) {
  const accent = accentOf(card);
  const kw = traits(card).join('&nbsp;·&nbsp;');
  // zones match the proof-derived front frame (portrait window, crest banner,
  // name plate, two badge circles)
  return `<!doctype html><html><head><meta charset="utf-8"><style>${FONTS}
  ${base}
  .portrait { position:absolute; left:5%; right:5%; top:4%; height:53%; z-index:2; border-radius:14px; overflow:hidden; }
  .portrait img { width:100%; height:100%; object-fit:cover; object-position:center 16%; }
  .num { position:absolute; top:3.4%; left:7.5%; z-index:4; font-family:'Oswald'; font-weight:700; color:#fff; font-size:40px; line-height:1; text-shadow:0 2px 8px #000; }
  .crest { position:absolute; top:5%; right:6%; z-index:4; width:116px; text-align:center; }
  .crest .t { font-family:'Oswald'; color:#fff; font-weight:700; font-size:11px; letter-spacing:.4px; line-height:1.12; }
  .title { position:absolute; left:8%; right:8%; top:60.3%; z-index:4; text-align:center; color:${accent}; font-family:'Oswald'; font-weight:700; font-size:15px; letter-spacing:2px; text-transform:uppercase; }
  .name { position:absolute; left:8%; right:8%; top:67.2%; z-index:4; text-align:center; font-family:'Oswald'; color:#fff; font-weight:700; font-size:34px; letter-spacing:1px; text-transform:uppercase; line-height:1; }
  .bl { position:absolute; left:7.3%; top:87.4%; z-index:4; } .br { position:absolute; right:7.3%; top:87.4%; z-index:4; }
  .kw { position:absolute; left:22%; right:22%; top:89.6%; z-index:4; text-align:center; font-family:'Oswald'; color:#e4e6ee; font-weight:600; font-size:13px; letter-spacing:1px; }
  </style></head><body>
  <div class="card">
    <div class="bg"></div>
    <div class="portrait"><img src="${portraitDataUri}"></div>
    <div class="frame"><img src="${frameDataUri}"></div>
    <div class="num">${pad2(card.card_number)}</div>
    <div class="crest"><span class="t">OPEN SOURCE<br>LEGENDS</span></div>
    <div class="title">${esc(card.card_title)}</div>
    <div class="name">${esc(card.display_name)}</div>
    <div class="bl">${emblem(accent, 44)}</div>
    <div class="br">${codeGlyph(accent, 40)}</div>
    <div class="kw">${kw}</div>
  </div></body></html>`;
}

export function buildBack(card, frameDataUri) {
  const accent = accentOf(card);
  const rarity = rarityOf(card.impact_rating).toUpperCase();
  const projects = (card.primary_projects || []).slice(0, 5).map((p) => `<li>${esc(p)}</li>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>${FONTS}
  ${base}
  .content { position:absolute; left:8.5%; right:8.5%; top:6%; bottom:6%; z-index:2; display:flex; flex-direction:column; }
  h4 { font-family:'Oswald'; }
  .head .row { display:flex; align-items:baseline; gap:12px; }
  .head .num { font-family:'Oswald'; font-weight:700; color:#fff; font-size:40px; line-height:.9; }
  .head .name { font-family:'Oswald'; color:#fff; font-weight:700; font-size:30px; text-transform:uppercase; line-height:.95; }
  .head .title { color:${accent}; font-weight:700; font-size:13px; letter-spacing:2px; margin-top:6px; text-transform:uppercase; font-family:'Oswald'; }
  .rule { height:3px; background:linear-gradient(90deg,${accent},${accent}22); border-radius:2px; margin:11px 0; }
  .mid { flex:1; display:flex; flex-direction:column; gap:14px; min-height:0; }
  .panels { display:flex; gap:12px; }
  .panel { background:#efeae0; border-radius:10px; padding:12px 14px; }
  .panel h4 { color:#15101f; font-size:12px; letter-spacing:1.4px; margin-bottom:7px; font-weight:700; }
  .scout { flex:1.5; } .scout p { color:#2c2935; font-size:13.5px; line-height:1.45; }
  .sig { flex:1; } .sig ul { list-style:none; }
  .sig li { color:#2c2935; font-size:13.5px; line-height:1.6; padding-left:13px; position:relative; }
  .sig li::before { content:'▸'; position:absolute; left:0; color:${accent}; font-weight:800; }
  .stack { flex:1; display:flex; gap:12px; align-items:stretch; min-height:0; }
  .skill { flex:1.7; display:flex; flex-direction:column; }
  .skill h4 { color:${accent}; font-size:13px; letter-spacing:2px; margin-bottom:10px; font-weight:700; }
  .barsWrap { flex:1; display:flex; flex-direction:column; justify-content:space-evenly; }
  .barRow { display:flex; align-items:center; gap:10px; }
  .barLabel { font-family:'Oswald'; flex:0 0 132px; color:#c2c6d2; font-size:11px; letter-spacing:.4px; font-weight:500; }
  .bar { flex:1; display:flex; gap:2.5px; }
  .seg { flex:1; height:13px; border-radius:2px; background:#241d38; }
  .seg.on { background:${accent}; box-shadow:0 0 5px ${accent}66; }
  .barVal { font-family:'Oswald'; flex:0 0 28px; text-align:right; color:#fff; font-weight:700; font-size:15px; }
  .impact { flex:1; background:#0e0a18cc; border:2px solid ${accent}; border-radius:12px; display:flex; flex-direction:column; align-items:center; justify-content:center; }
  .impact .lab { color:#c2c6d2; font-size:11px; letter-spacing:3px; font-family:'Oswald'; }
  .impact .score { font-family:'Oswald'; color:${accent}; font-weight:700; font-size:64px; line-height:.85; }
  .impact .rar { color:#fff; font-weight:700; font-size:13px; letter-spacing:2px; font-family:'Oswald'; }
  .impact .stars { color:${accent}; font-size:15px; letter-spacing:2px; margin-top:4px; }
  .quote { color:#e0e2ea; font-style:italic; font-size:14px; line-height:1.4; }
  .quote .q { color:${accent}; font-size:26px; font-weight:700; margin-right:4px; vertical-align:-6px; font-family:Georgia,serif; }
  .foot { border-top:1px solid ${accent}66; padding-top:9px; margin-top:11px; color:#aab; font-size:10.5px; letter-spacing:.3px; }
  .foot .r { display:flex; justify-content:space-between; align-items:center; }
  .foot b { color:#e0e2ea; }
  </style></head><body>
  <div class="card">
    <div class="bg"></div>
    <div class="frame"><img src="${frameDataUri}"></div>
    <div class="content">
      <div class="head">
        <div class="row"><span class="num">${pad2(card.card_number)}</span><span class="name">${esc(card.display_name)}</span></div>
        <div class="title">${esc(card.card_title)}</div>
        <div class="rule"></div>
      </div>
      <div class="mid">
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
        <div class="r" style="margin-top:5px"><span>KNOWN FOR <b>${esc(card.known_for)}</b></span>${codeGlyph(accent, 18)}</div>
      </div>
    </div>
  </div></body></html>`;
}
