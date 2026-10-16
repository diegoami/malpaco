import { diagnostics, comparison } from './audit.mjs';
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
export function svg(board) {
  const path=p=>'M'+p.map(q=>q.join(',')).join('L')+'Z';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 460" aria-label="Seed 1994 reference geography">
  <style>
  .water{fill:#193e51}.coast{fill:#3c6570;stroke:#8baca7;stroke-width:2}
  .lane{fill:none;stroke:#d6bb7e;stroke-width:1.5;stroke-dasharray:4 3;stroke-linejoin:round}
  .country{cursor:pointer;outline:none}.cell{stroke:#244654;stroke-width:.8;stroke-linejoin:round}
  .country.selected .cell{stroke:#fff7bf;stroke-width:2.6}.country.neighbor .cell{stroke:#f5dc82;stroke-width:1.9}
  .country:focus-visible .cell{stroke:#fff;stroke-width:3}
  .country-label{pointer-events:none}.name{font:600 12px system-ui;fill:#102637;paint-order:stroke;stroke:#f8f2e2;stroke-width:1.5;stroke-linejoin:round;text-anchor:middle}
  .badge{fill:#132b3b}.count{font:600 14px system-ui;fill:#fff;text-anchor:middle}
  .island-name{font:italic 9px Georgia;fill:#d2e2da;text-anchor:middle}
  .port{fill:#f4d397;stroke:#193e51;stroke-width:.7}.centre{font:10px system-ui;fill:#fff5bd;stroke:#122f40;stroke-width:.4;paint-order:stroke}
  </style><rect class="water" width="800" height="460"/>
  ${board.routes.map(r=>`<polyline class="lane" data-edge="${esc([r.from,r.to].sort().join('|'))}" points="${r.points.map(p=>p.join(',')).join(' ')}"/>`).join('')}
  ${board.islands.map(i=>`<path class="coast" d="${path(i.polygon)}"/>`).join('')}
  ${board.provinces.map((p,j)=>{
    const [x,y]=p.labelAt,words=p.name.split(' ');
    return `<g class="country" role="button" tabindex="${j===0?'0':'-1'}" data-id="${esc(p.id)}" aria-label="${esc(`${p.name}, ${p.owner}, ${p.armies} armies`)}" aria-pressed="false">
    <title>${esc(p.name)}</title><path class="cell" fill="${p.owner==='seat1'?'#4d91ba':'#d99a55'}" d="${path(p.polygon)}"/>
    <g class="country-label"><text class="name" x="${x}" y="${y-11}">${esc(words[0])}</text><text class="name" x="${x}" y="${y+1}">${esc(words.slice(1).join(' '))}</text><rect class="badge" x="${x-22}" y="${y+4}" width="44" height="18" rx="5"/><text class="count" x="${x}" y="${y+18}">${p.owner==='seat1'?'1':'2'} · ${p.armies}</text></g>
    ${p.production?`<text class="centre" x="${x-25}" y="${y-10}">★</text>`:''}</g>`;
  }).join('')}
  ${board.routes.flatMap(r=>[r.points[0],r.points.at(-1)]).map(([x,y])=>`<circle class="port" cx="${x}" cy="${y}" r="1.5"/>`).join('')}
  ${board.islands.map(i=>{const xs=i.polygon.map(p=>p[0]),ys=i.polygon.map(p=>p[1]);return `<text class="island-name" x="${(Math.min(...xs)+Math.max(...xs))/2}" y="${Math.min(...ys)-5}">${esc(i.name)} +${i.bonus}</text>`;}).join('')}
  </svg>`;
}
export function html(board,label='Reference proposal') {
  const details=diagnostics(board),refinement=comparison(board),byId=new Map(board.provinces.map(p=>[p.id,p]));
  const named=edge=>edge.split('|').map(id=>byId.get(id).name).join(' ↔ ');
  const summary=Object.entries(details.changes).map(([kind,d])=>`<h3>${kind==='borders'?'Land borders':'Sea crossings'}</h3><p>Current ${d.current.length}; proposed ${d.proposed.length}. Every added/removed pair follows.</p><h4>Added (${d.added.length})</h4><ul>${d.added.map(e=>`<li>${esc(named(e))}</li>`).join('')}</ul><h4>Removed (${d.removed.length})</h4><ul>${d.removed.map(e=>`<li>${esc(named(e))}</li>`).join('')}</ul>`).join('');
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Seed 1994 reference</title>
  <style>*{box-sizing:border-box}body{margin:0;background:#193e51;color:#f8f2e2;font:14px system-ui;height:100vh;display:grid;grid-template-rows:56px minmax(0,1fr)}header{display:flex;align-items:center;gap:10px;padding:8px 14px;background:#102e3e}h1{font:600 18px Georgia;margin:0;white-space:nowrap}button{font:inherit;color:inherit;background:#254e60;border:1px solid #78939d;border-radius:5px;padding:7px 10px;cursor:pointer}button:focus-visible{outline:3px solid #f5dc82}#selection{font-size:12px;min-width:0;flex:1}#board{min-height:0;display:grid;place-items:center}svg{width:100%;height:100%;display:block}aside{position:fixed;right:10px;top:62px;bottom:10px;width:350px;max-width:calc(100vw - 20px);padding:16px;background:#102e3ef5;border:1px solid #86a5ad;border-radius:8px;overflow:auto}aside h2{font-size:18px}aside li{font-size:13px;margin:4px 0}.note{font-size:11px;color:#e1c483}#inspector[hidden]{display:none}</style>
  <header><h1>Seed 1994 · Nine Isles</h1><span id="selection" aria-live="polite">Select a country · S1 blue, S2 amber · ★ production centre</span><button id="inspect" aria-expanded="false">Topology</button><button id="export">Export SVG</button></header>
  <main id="board">${svg(board)}</main><aside id="inspector" hidden><h2>${esc(label)}</h2><p class="note">Reference fixture proposal; the current playable graph is unchanged. Exact topology and appearance need owner approval before integration.</p><p>Use click, Enter or Space to select; arrows move keyboard focus. Neighbours are outlined in gold.</p><h3>Changes from the T25 reference</h3><p>North: ${refinement.rotations.north.toFixed(2)}°; Cliff: ${refinement.rotations.cliff.toFixed(2)}° (positive clockwise). Fifteen sea crossings; every land border retained.</p><h4>Added</h4><ul>${refinement.sea.added.map(e=>`<li>${esc(named(e))}</li>`).join('')}</ul><h4>Removed</h4><ul>${refinement.sea.removed.map(e=>`<li>${esc(named(e))}</li>`).join('')}</ul><p>Island bonuses match T25. The older playable graph comparison follows.</p><h3>Island income</h3>${details.islands.map(i=>`<p>${esc(i.name)}: +${i.currentBonus} → +${i.proposedBonus}; ${i.entrances.length} entrance countries, ${i.neighbours.length} neighbouring islands</p>`).join('')}${summary}</aside>
  <script>window.REFERENCE_BOARD=${JSON.stringify(board).replaceAll('<','\\u003c')};
  (()=>{const B=window.REFERENCE_BOARD,nodes=[...document.querySelectorAll('.country')];
  function select(id){const p=B.provinces.find(p=>p.id===id),neighbors=new Set([...p.borders,...p.seaLanes]);for(const n of nodes){n.classList.toggle('selected',n.dataset.id===id);n.classList.toggle('neighbor',neighbors.has(n.dataset.id));n.setAttribute('aria-pressed',String(n.dataset.id===id));n.tabIndex=n.dataset.id===id?0:-1;}document.querySelector('#selection').textContent=p.name+' · '+p.owner+' · '+p.armies+' armies · Neighbours: '+[...neighbors].map(id=>B.provinces.find(q=>q.id===id).name).join(', ');}
  for(const [j,n] of nodes.entries()){n.addEventListener('click',()=>select(n.dataset.id));n.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(n.dataset.id);}if(['ArrowRight','ArrowDown','ArrowLeft','ArrowUp'].includes(e.key)){e.preventDefault();nodes[(j+(['ArrowRight','ArrowDown'].includes(e.key)?1:nodes.length-1))%nodes.length].focus();}});}
  document.querySelector('#inspect').onclick=()=>{const panel=document.querySelector('#inspector');panel.hidden=!panel.hidden;document.querySelector('#inspect').setAttribute('aria-expanded',String(!panel.hidden));};
  document.querySelector('#export').onclick=()=>{const blob=new Blob([new XMLSerializer().serializeToString(document.querySelector('svg'))],{type:'image/svg+xml'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='seed-1994-reference.svg';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};})();</script></html>`;
}
