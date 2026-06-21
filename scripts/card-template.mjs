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

const CREST = `<span class="crest"><span class="crestText">OPEN SOURCE<br>LEGENDS</span><span class="code">&lt;/&gt;</span></span>`;

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

const sharedCss = (accent) => `
  * { margin:0; padding:0; box-sizing:border-box; }
  html,body { width:${CARD_W}px; height:${CARD_H}px; }
  body { font-family: 'Inter','Helvetica Neue',Arial,sans-serif; background:#05060a; }
  .card {
    position:relative; width:${CARD_W}px; height:${CARD_H}px; overflow:hidden;
    border-radius:34px; background:#15101f;
    box-shadow: inset 0 0 0 6px #0c0a14, inset 0 0 0 8px ${accent}55, inset 0 0 0 11px #0c0a14;
  }
  .num { position:absolute; top:26px; left:30px; z-index:5; font-weight:800; font-size:54px; color:#fff;
         font-family:'JetBrains Mono',ui-monospace,monospace; text-shadow:0 2px 8px rgba(0,0,0,.6); }
  .crest { position:absolute; top:22px; right:26px; z-index:5; display:flex; flex-direction:column; align-items:flex-end;
           background:#0c0a14; border:2px solid ${accent}; border-radius:10px; padding:8px 12px; clip-path:polygon(12% 0,100% 0,100% 100%,0 100%); }
  .crestText { color:#fff; font-weight:800; font-size:15px; letter-spacing:1px; text-align:right; line-height:1.05; }
  .code { color:${accent}; font-weight:800; font-size:13px; font-family:ui-monospace,monospace; margin-top:2px; }
`;

export function buildFront(card, portraitDataUri) {
  const accent = ACCENT[rarityOf(card.impact_rating)];
  const kw = traits(card).join('&nbsp;&nbsp;·&nbsp;&nbsp;');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  ${sharedCss(accent)}
  .portrait { position:absolute; inset:0; }
  .portrait img { width:100%; height:72%; object-fit:cover; object-position:center top; }
  .portrait::after { content:''; position:absolute; left:0; right:0; top:48%; height:30%;
    background:linear-gradient(180deg, rgba(21,16,31,0) 0%, #15101f 92%); }
  .plate { position:absolute; left:24px; right:24px; bottom:118px; z-index:4;
    background:linear-gradient(180deg,#1c1530,#120d1f); border:2px solid ${accent}66; border-radius:18px;
    padding:18px 20px; text-align:center; }
  .name { color:#fff; font-weight:800; font-size:42px; letter-spacing:.5px; line-height:1; text-transform:uppercase; }
  .title { color:${accent}; font-weight:700; font-size:18px; letter-spacing:1.5px; margin-top:8px; text-transform:uppercase; }
  .footer { position:absolute; left:24px; right:24px; bottom:34px; z-index:4; display:flex; align-items:center; gap:14px; }
  .badge { width:62px; height:62px; flex:0 0 auto; border-radius:50%; background:#0c0a14; border:2px solid ${accent};
    display:flex; align-items:center; justify-content:center; color:${accent}; font-weight:800; font-size:22px; font-family:ui-monospace,monospace; }
  .kw { flex:1; text-align:center; color:#cfd2dc; font-weight:700; font-size:16px; letter-spacing:1px; }
  </style></head><body>
  <div class="card">
    <div class="portrait"><img src="${portraitDataUri}"></div>
    <span class="num">${pad2(card.card_number)}</span>
    ${CREST}
    <div class="plate"><div class="name">${esc(card.display_name)}</div><div class="title">${esc(card.card_title)}</div></div>
    <div class="footer">
      <span class="badge">${esc((card.primary_projects?.[0] || '?').slice(0, 2))}</span>
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
  ${sharedCss(accent)}
  .head { position:absolute; top:30px; left:30px; right:30px; }
  .head .name { color:#fff; font-weight:800; font-size:34px; text-transform:uppercase; line-height:1; }
  .head .title { color:${accent}; font-weight:700; font-size:15px; letter-spacing:1.5px; margin-top:6px; text-transform:uppercase; }
  .body { position:absolute; top:120px; left:30px; right:30px; bottom:120px; display:flex; flex-direction:column; gap:16px; }
  .two { display:flex; gap:14px; }
  .panel { background:#efeae0; border-radius:12px; padding:14px 16px; }
  .panel h4 { color:#15101f; font-size:13px; letter-spacing:1.5px; margin-bottom:8px; }
  .scout { flex:1.4; }
  .scout p { color:#2a2733; font-size:14.5px; line-height:1.45; }
  .sig { flex:1; }
  .sig ul { list-style:none; }
  .sig li { color:#2a2733; font-size:14.5px; line-height:1.55; padding-left:14px; position:relative; }
  .sig li::before { content:'•'; position:absolute; left:0; color:${accent}; }
  .stack { display:flex; gap:14px; align-items:stretch; }
  .stackMain { flex:1.7; background:#100c1a; border:1px solid #2a2440; border-radius:12px; padding:14px 16px; }
  .stackMain h4 { color:#cfd2dc; font-size:13px; letter-spacing:1.5px; margin-bottom:12px; }
  .barRow { display:flex; align-items:center; gap:10px; margin-bottom:9px; }
  .barLabel { flex:0 0 150px; color:#aeb2c0; font-size:11.5px; letter-spacing:.5px; }
  .bar { flex:1; display:flex; gap:3px; }
  .seg { flex:1; height:11px; border-radius:2px; background:#241d38; }
  .seg.on { background:${accent}; }
  .barVal { flex:0 0 30px; text-align:right; color:#fff; font-weight:800; font-size:14px; font-family:ui-monospace,monospace; }
  .impact { flex:1; background:#100c1a; border:1px solid ${accent}55; border-radius:12px; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:10px; }
  .impact .lab { color:#aeb2c0; font-size:12px; letter-spacing:2px; }
  .impact .score { color:${accent}; font-weight:800; font-size:64px; line-height:1; font-family:ui-monospace,monospace; }
  .impact .rar { color:#fff; font-weight:800; font-size:14px; letter-spacing:1.5px; margin-top:2px; }
  .impact .stars { color:${accent}; font-size:16px; letter-spacing:2px; margin-top:4px; }
  .quote { color:#cfd2dc; font-style:italic; font-size:15px; line-height:1.4; padding:0 6px; }
  .quote .q { color:${accent}; font-size:26px; font-weight:800; margin-right:4px; }
  .foot { position:absolute; bottom:30px; left:30px; right:30px; display:flex; justify-content:space-between; align-items:center;
    border-top:1px solid #2a2440; padding-top:12px; color:#9a9ead; font-size:11px; letter-spacing:.5px; }
  .foot b { color:#cfd2dc; }
  .foot .code { color:${accent}; font-size:16px; font-family:ui-monospace,monospace; }
  </style></head><body>
  <div class="card">
    <div class="head"><span class="num" style="position:static">${pad2(card.card_number)}</span>
      <div class="name">${esc(card.display_name)}</div><div class="title">${esc(card.card_title)}</div></div>
    <div class="body">
      <div class="two">
        <div class="panel scout"><h4>SCOUTING REPORT</h4><p>${esc(card.scouting_report)}</p></div>
        <div class="panel sig"><h4>SIGNATURE PROJECTS</h4><ul>${projects}</ul></div>
      </div>
      <div class="stack">
        <div class="stackMain"><h4>SKILL STACK</h4>${bars(card)}</div>
        <div class="impact"><span class="lab">IMPACT</span><span class="score">${card.impact_rating}</span><span class="rar">${rarity}</span><span class="stars">★★★★★</span></div>
      </div>
      <div class="quote"><span class="q">“</span>${esc(card.collector_note)}”</div>
    </div>
    <div class="foot"><span>BORN <b>${esc(card.birth_date)}</b></span><span>NATIONALITY <b>${esc(card.nationality)}</b></span><span class="code">&lt;/&gt;</span></div>
  </div></body></html>`;
}
