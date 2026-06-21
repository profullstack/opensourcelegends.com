// HTML/CSS card template for "Open Source Legends" — matches the printed proof
// design (docs/proof1.png). Renders accurate text; the AI portrait is embedded.

export const CARD_W = 750;
export const CARD_H = 1050;

const ACCENT = { iconic: '#f5c451', legendary: '#b06bff', epic: '#4f8cff', rare: '#25c26e' };
export const rarityOf = (n) => (n >= 95 ? 'iconic' : n >= 90 ? 'legendary' : n >= 85 ? 'epic' : 'rare');
const pad2 = (n) => String(n).padStart(2, '0');
const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

function traits(c) {
  const m = [['ARCHITECT', c.code_rating], ['PIONEER', c.innovation_rating], ['BUILDER', c.community_rating], ['RELENTLESS', c.longevity_rating]]
    .sort((a, b) => b[1] - a[1]).slice(0, 2).map((x) => x[0]);
  return [...m, rarityOf(c.impact_rating).toUpperCase()];
}

function bars(c) {
  const rows = [
    ['CODE ARCHITECTURE', c.code_rating],
    ['INNOVATION', c.innovation_rating],
    ['COMMUNITY IMPACT', c.community_rating],
    ['LONGEVITY', c.longevity_rating],
    ['OPEN SOURCE IMPACT', c.impact_rating],
  ];
  return rows.map(([label, v]) => {
    const filled = Math.round(v / 10);
    const segs = Array.from({ length: 10 }, (_, i) => `<span class="seg ${i < filled ? 'on' : ''}"></span>`).join('');
    return `<div class="barRow"><span class="barLabel">${esc(label)}</span><span class="bar">${segs}</span><span class="barVal">${v}</span></div>`;
  }).join('');
}

// shared card shell — dark with a rarity-tinted foil inset border
const shell = (accent) => `
  * { margin:0; padding:0; box-sizing:border-box; }
  html,body { width:${CARD_W}px; height:${CARD_H}px; }
  body { font-family:'Inter','Helvetica Neue',Arial,sans-serif; background:#05060a; }
  .card { position:relative; width:${CARD_W}px; height:${CARD_H}px; overflow:hidden; border-radius:34px;
    background:#13101c; box-shadow: inset 0 0 0 6px #0b0911, inset 0 0 0 8px ${accent}66, inset 0 0 0 11px #0b0911; }
  .num { font-family:'JetBrains Mono',ui-monospace,monospace; font-weight:800; color:#fff; }
  .crestBox { display:flex; flex-direction:column; align-items:flex-end; background:#0b0911; border:2px solid ${accent};
    border-radius:10px; padding:8px 13px; clip-path:polygon(14% 0,100% 0,100% 100%,0 100%); }
  .crestBox .t { color:#fff; font-weight:800; font-size:15px; letter-spacing:1px; text-align:right; line-height:1.05; }
  .crestBox .c { color:${accent}; font-weight:800; font-size:12px; font-family:ui-monospace,monospace; margin-top:2px; }
`;

export function buildFront(card, portraitDataUri) {
  const accent = ACCENT[rarityOf(card.impact_rating)];
  const kw = traits(card).join('&nbsp;&nbsp;·&nbsp;&nbsp;');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  ${shell(accent)}
  .portrait { position:absolute; inset:11px; border-radius:26px; overflow:hidden; }
  .portrait img { width:100%; height:100%; object-fit:cover; object-position:center 22%; }
  .portrait::after { content:''; position:absolute; left:0; right:0; bottom:0; height:46%;
    background:linear-gradient(180deg, rgba(19,16,28,0) 0%, rgba(19,16,28,.85) 62%, #13101c 100%); }
  .num.top { position:absolute; top:26px; left:32px; z-index:5; font-size:56px; text-shadow:0 2px 10px rgba(0,0,0,.7); }
  .crest { position:absolute; top:24px; right:28px; z-index:5; }
  .plate { position:absolute; left:26px; right:26px; bottom:120px; z-index:5; text-align:center;
    background:linear-gradient(180deg,#1d1633,#130d22); border:2px solid ${accent}77; border-radius:18px; padding:20px 20px; }
  .name { color:#fff; font-weight:800; font-size:44px; letter-spacing:.5px; line-height:1; text-transform:uppercase; }
  .title { color:${accent}; font-weight:700; font-size:18px; letter-spacing:1.5px; margin-top:9px; text-transform:uppercase; }
  .footer { position:absolute; left:26px; right:26px; bottom:36px; z-index:5; display:flex; align-items:center; gap:14px; }
  .badge { width:64px; height:64px; flex:0 0 auto; border-radius:50%; background:#0b0911; border:2px solid ${accent};
    display:flex; align-items:center; justify-content:center; color:${accent}; font-weight:800; font-size:22px; font-family:ui-monospace,monospace; }
  .kw { flex:1; text-align:center; color:#d3d6e0; font-weight:700; font-size:17px; letter-spacing:1px; }
  </style></head><body>
  <div class="card">
    <div class="portrait"><img src="${portraitDataUri}"></div>
    <span class="num top">${pad2(card.card_number)}</span>
    <span class="crest"><span class="crestBox"><span class="t">OPEN SOURCE<br>LEGENDS</span><span class="c">&lt;/&gt;</span></span></span>
    <div class="plate"><div class="name">${esc(card.display_name)}</div><div class="title">${esc(card.card_title)}</div></div>
    <div class="footer">
      <span class="badge">${esc((card.primary_projects?.[0] || '?').replace(/[^A-Za-z]/g, '').slice(0, 2) || '?')}</span>
      <span class="kw">${kw}</span>
      <span class="badge">&lt;/&gt;</span>
    </div>
  </div></body></html>`;
}

export function buildBack(card) {
  const accent = ACCENT[rarityOf(card.impact_rating)];
  const rarity = rarityOf(card.impact_rating).toUpperCase();
  const projects = (card.primary_projects || []).slice(0, 5).map((p) => `<li>${esc(p)}</li>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  ${shell(accent)}
  .card { display:flex; flex-direction:column; padding:34px 34px 30px; }
  .head { flex:0 0 auto; }
  .head .row { display:flex; align-items:center; gap:16px; }
  .head .num { font-size:46px; line-height:1; }
  .head .name { color:#fff; font-weight:800; font-size:34px; text-transform:uppercase; line-height:1; }
  .head .title { color:${accent}; font-weight:700; font-size:15px; letter-spacing:1.5px; margin-top:7px; text-transform:uppercase; }
  .rule { height:2px; background:linear-gradient(90deg,${accent},transparent); margin:16px 0 0; }
  .content { flex:1; display:flex; flex-direction:column; justify-content:space-between; padding:6px 0; }
  h4 { color:${accent}; font-size:13px; letter-spacing:2px; margin-bottom:10px; font-weight:800; }
  .two { display:flex; gap:22px; }
  .scout { flex:1.35; } .sig { flex:1; border-left:1px solid #2a2440; padding-left:20px; }
  .scout p { color:#d7d9e2; font-size:16px; line-height:1.5; }
  .sig ul { list-style:none; } .sig li { color:#d7d9e2; font-size:16px; line-height:1.7; padding-left:16px; position:relative; }
  .sig li::before { content:'▸'; position:absolute; left:0; color:${accent}; }
  .stack { display:flex; gap:20px; align-items:stretch; }
  .skill { flex:1.7; }
  .barRow { display:flex; align-items:center; gap:12px; margin-bottom:13px; }
  .barLabel { flex:0 0 158px; color:#aeb2c0; font-size:12px; letter-spacing:.5px; }
  .bar { flex:1; display:flex; gap:3px; }
  .seg { flex:1; height:15px; border-radius:3px; background:#241d38; }
  .seg.on { background:${accent}; box-shadow:0 0 6px ${accent}66; }
  .barVal { flex:0 0 34px; text-align:right; color:#fff; font-weight:800; font-size:16px; font-family:ui-monospace,monospace; }
  .impact { flex:1; background:linear-gradient(180deg,#181226,#0f0b1a); border:2px solid ${accent}77; border-radius:14px;
    display:flex; flex-direction:column; align-items:center; justify-content:center; }
  .impact .lab { color:#aeb2c0; font-size:13px; letter-spacing:3px; }
  .impact .score { color:${accent}; font-weight:800; font-size:78px; line-height:.95; font-family:ui-monospace,monospace; }
  .impact .rar { color:#fff; font-weight:800; font-size:15px; letter-spacing:2px; }
  .impact .stars { color:${accent}; font-size:18px; letter-spacing:3px; margin-top:6px; }
  .quote { color:#d7d9e2; font-style:italic; font-size:17px; line-height:1.45; padding:0 4px; }
  .quote .q { color:${accent}; font-size:30px; font-weight:800; margin-right:6px; vertical-align:-6px; }
  .foot { flex:0 0 auto; display:flex; justify-content:space-between; align-items:center;
    border-top:1px solid #2a2440; padding-top:14px; color:#9a9ead; font-size:12px; letter-spacing:.5px; }
  .foot b { color:#d7d9e2; } .foot .c { color:${accent}; font-size:17px; font-family:ui-monospace,monospace; }
  </style></head><body>
  <div class="card">
    <div class="head">
      <div class="row"><span class="num">${pad2(card.card_number)}</span><span class="name">${esc(card.display_name)}</span></div>
      <div class="title">${esc(card.card_title)}</div>
      <div class="rule"></div>
    </div>
    <div class="content">
      <div class="two">
        <div class="scout"><h4>SCOUTING REPORT</h4><p>${esc(card.scouting_report)}</p></div>
        <div class="sig"><h4>SIGNATURE PROJECTS</h4><ul>${projects}</ul></div>
      </div>
      <div class="stack">
        <div class="skill"><h4>SKILL STACK</h4>${bars(card)}</div>
        <div class="impact"><span class="lab">IMPACT</span><span class="score">${card.impact_rating}</span><span class="rar">${rarity}</span><span class="stars">★★★★★</span></div>
      </div>
      <div class="quote"><span class="q">“</span>${esc(card.collector_note)}”</div>
    </div>
    <div class="foot"><span>BORN <b>${esc(card.birth_date)}</b></span><span>NATIONALITY <b>${esc(card.nationality)}</b></span><span class="c">&lt;/&gt;</span></div>
  </div></body></html>`;
}
