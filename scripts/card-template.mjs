// HTML/CSS card template for "Open Source Legends".
// REFERENCE: docs/proof1.png — CLEAN thin accent border (not an ornate frame),
// portrait top, tight name/title, thin keyword bar; back = header, cream
// Scouting/Signature panels, dark Skill Stack + IMPACT, quote, footer.
// Only raster image = the cartoonish AI portrait. Everything else HTML/CSS/SVG.

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
  // solid horizontal bars filled to value (matches the proof)
  return rows.map(([label, v]) =>
    `<div class="barRow"><span class="barLabel">${esc(label)}</span><span class="bar"><span class="barFill" style="width:${v}%"></span></span><span class="barVal">${v}</span></div>`
  ).join('');
}
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');`;
const emblem = (a, s = 24) => `<svg width="${s}" height="${s}" viewBox="0 0 48 48" fill="none"><path d="M24 3l16 5v13c0 12-7.4 20-16 24C15.4 41 8 33 8 21V8l16-5z" fill="#0a0810" stroke="${a}" stroke-width="2.6"/><path d="M20 18l-5 6 5 6M28 18l5 6-5 6M26 16l-4 17" stroke="${a}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const codeGlyph = (a, s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none"><path d="M12 9l-6 7 6 7M20 9l6 7-6 7M18 7l-4 18" stroke="${a}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

// shared shell — CLEAN thin accent border, dark premium background
const shell = (accent) => `${FONTS}
  * { margin:0; padding:0; box-sizing:border-box; }
  html,body { width:${CARD_W}px; height:${CARD_H}px; }
  body { font-family:'Inter',Arial,sans-serif; background:#05060a; }
  .card { position:relative; width:${CARD_W}px; height:${CARD_H}px; overflow:hidden; border-radius:26px;
    background: radial-gradient(120% 80% at 50% 0%, #1a1622 0%, #0e0d15 60%, #0a0910 100%);
    box-shadow: inset 0 0 0 2px ${accent}, inset 0 0 0 5px #07070d; }
  .crest { display:flex; align-items:center; gap:7px; }
  .crest .t { font-family:'Oswald'; color:#fff; font-weight:700; font-size:13px; letter-spacing:.8px; line-height:1.05; }`;

export function buildFront(card, portraitDataUri) {
  const accent = accentOf(card);
  const kw = traits(card).join('&nbsp;&nbsp;·&nbsp;&nbsp;');
  return `<!doctype html><html><head><meta charset="utf-8"><style>${shell(accent)}
  .portrait { position:absolute; left:14px; right:14px; top:14px; height:58%; border-radius:16px; overflow:hidden; box-shadow:inset 0 0 0 2px ${accent}55; }
  .portrait img { width:100%; height:100%; object-fit:cover; object-position:center 18%; }
  .portrait::after { content:''; position:absolute; left:0; right:0; bottom:0; height:34%; background:linear-gradient(180deg,transparent,rgba(14,13,21,.92)); }
  .num { position:absolute; top:18px; left:20px; z-index:4; font-family:'Oswald'; font-weight:700; color:#fff; font-size:40px; line-height:1; padding:2px 14px 4px; background:${accent}; color:#0a0810; border-radius:0 0 12px 0; clip-path:polygon(0 0,100% 0,84% 100%,0 100%); }
  .crestbox { position:absolute; top:20px; right:20px; z-index:4; }
  .info { position:absolute; left:24px; right:24px; top:60%; bottom:78px; z-index:3; display:flex; flex-direction:column; align-items:center; justify-content:flex-start; }
  .name { font-family:'Oswald'; color:#fff; font-weight:700; font-size:42px; letter-spacing:1px; text-transform:uppercase; text-align:center; line-height:1; }
  .title { color:${accent}; font-weight:700; font-size:17px; letter-spacing:2px; margin-top:10px; text-transform:uppercase; font-family:'Oswald'; text-align:center; }
  .kwbar { position:absolute; left:24px; right:24px; bottom:22px; z-index:4; display:flex; align-items:center; gap:12px; border-top:1px solid ${accent}55; padding-top:14px; }
  .badge { width:38px; height:38px; flex:0 0 auto; display:flex; align-items:center; justify-content:center; }
  .kw { font-family:'Oswald'; flex:1; text-align:center; color:#cfd2dc; font-weight:600; font-size:15px; letter-spacing:1.2px; }
  </style></head><body>
  <div class="card">
    <div class="portrait"><img src="${portraitDataUri}"></div>
    <div class="num">${pad2(card.card_number)}</div>
    <div class="crestbox"><span class="crest">${emblem(accent, 24)}<span class="t">OPEN SOURCE<br>LEGENDS</span></span></div>
    <div class="info"><div class="name">${esc(card.display_name)}</div><div class="title">${esc(card.card_title)}</div></div>
    <div class="kwbar"><span class="badge">${emblem(accent, 30)}</span><span class="kw">${kw}</span><span class="badge">${codeGlyph(accent, 28)}</span></div>
  </div></body></html>`;
}

export function buildBack(card) {
  const accent = accentOf(card);
  const rarity = rarityOf(card.impact_rating).toUpperCase();
  const projects = (card.primary_projects || []).slice(0, 5).map((p) => `<li>${esc(p)}</li>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>${shell(accent)}
  .card { display:flex; flex-direction:column; padding:26px 26px 22px; }
  h4 { font-family:'Oswald'; }
  .head .row { display:flex; align-items:baseline; gap:12px; }
  .head .num { font-family:'Oswald'; font-weight:700; color:${accent}; font-size:38px; line-height:.9; }
  .head .name { font-family:'Oswald'; color:#fff; font-weight:700; font-size:32px; text-transform:uppercase; line-height:.95; }
  .head .title { color:${accent}; font-weight:700; font-size:14px; letter-spacing:2px; margin-top:6px; text-transform:uppercase; font-family:'Oswald'; }
  .rule { height:2px; background:linear-gradient(90deg,${accent},transparent); margin:13px 0; }
  .panels { display:flex; gap:14px; }
  .panel { background:#ece7db; border-radius:10px; padding:13px 15px; }
  .panel h4 { color:#15131c; font-size:12px; letter-spacing:1.4px; margin-bottom:8px; font-weight:700; }
  .scout { flex:1.5; } .scout p { color:#2c2935; font-size:14px; line-height:1.45; }
  .sig { flex:1; } .sig ul { list-style:none; }
  .sig li { color:#2c2935; font-size:14px; line-height:1.62; padding-left:14px; position:relative; }
  .sig li::before { content:'•'; position:absolute; left:0; color:${accent}; font-weight:800; }
  .stack { display:flex; gap:16px; align-items:stretch; margin-top:18px; }
  .skill { flex:1.65; }
  .skill h4 { color:${accent}; font-size:13px; letter-spacing:2px; margin-bottom:12px; font-weight:700; }
  .barRow { display:flex; align-items:center; gap:11px; margin-bottom:18px; }
  .barLabel { font-family:'Oswald'; flex:0 0 150px; color:#b6bac8; font-size:12px; letter-spacing:.4px; font-weight:500; }
  .bar { flex:1; height:14px; border-radius:7px; background:#241d33; overflow:hidden; }
  .barFill { display:block; height:100%; border-radius:7px; background:${accent}; }
  .barVal { font-family:'Oswald'; flex:0 0 30px; text-align:right; color:#fff; font-weight:700; font-size:16px; }
  .impact { flex:1; background:#0a0910; border:2px solid ${accent}; border-radius:12px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; padding:14px 8px; }
  .impact .lab { color:#b6bac8; font-size:12px; letter-spacing:3px; font-family:'Oswald'; }
  .impact .score { font-family:'Oswald'; color:${accent}; font-weight:700; font-size:66px; line-height:.85; }
  .impact .rar { color:#fff; font-weight:700; font-size:13px; letter-spacing:2px; font-family:'Oswald'; }
  .impact .stars { color:${accent}; font-size:15px; letter-spacing:2px; margin-top:5px; }
  .spacer { flex:1; min-height:8px; }
  .quote { color:#d7d9e2; font-style:italic; font-size:15px; line-height:1.4; margin:10px 0 16px; }
  .quote .q { color:${accent}; font-size:26px; font-weight:700; margin-right:4px; vertical-align:-6px; font-family:Georgia,serif; }
  .foot { border-top:1px solid ${accent}55; padding-top:11px; color:#9a9ead; font-size:11px; letter-spacing:.3px; }
  .foot .r { display:flex; justify-content:space-between; align-items:center; }
  .foot b { color:#d7d9e2; }
  </style></head><body>
  <div class="card">
    <div class="head">
      <div class="row"><span class="num">${pad2(card.card_number)}</span><span class="name">${esc(card.display_name)}</span></div>
      <div class="title">${esc(card.card_title)}</div>
      <div class="rule"></div>
    </div>
    <div class="panels">
      <div class="panel scout"><h4>SCOUTING REPORT</h4><p>${esc(card.scouting_report)}</p></div>
      <div class="panel sig"><h4>SIGNATURE PROJECTS</h4><ul>${projects}</ul></div>
    </div>
    <div class="stack">
      <div class="skill"><h4>SKILL STACK</h4>${bars(card, accent)}</div>
      <div class="impact"><span class="lab">IMPACT</span><span class="score">${card.impact_rating}</span><span class="rar">${rarity}</span><span class="stars">★★★★★</span></div>
    </div>
    <div class="spacer"></div>
    <div class="quote"><span class="q">“</span>${esc(card.collector_note)}”</div>
    <div class="foot">
      <div class="r"><span>BORN <b>${esc(card.birth_date)}</b></span><span>NATIONALITY <b>${esc(card.nationality)}</b></span></div>
      <div class="r" style="margin-top:5px"><span>KNOWN FOR <b>${esc(card.known_for)}</b></span>${codeGlyph(accent, 18)}</div>
    </div>
  </div></body></html>`;
}
