import {readFileSync} from 'node:fs';
const root=new URL('../../',import.meta.url);
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const inline=s=>escape(s).replace(/!\[([^\]]*)\]\((manual-images\/[^)]+)\)/g,'<img src="$2" alt="$1" loading="lazy">')
 .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,'<a href="$2">$1</a>')
 .replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\*([^*]+)\*/g,'<em>$1</em>');
/** Deliberately small renderer for our authored guide: headings, paragraphs, lists and tables. */
export function manualHtml(){
 const lines=readFileSync(new URL('docs/play.md',root),'utf8').trim().split('\n');let html='',list='',table=false;const toc=[];
 const closeList=()=>{if(list){html+=`</${list}>`;list='';}};
 for(const line of lines){
  if(!line.trim()){closeList();if(table){html+='</tbody></table></div>';table=false;}continue;}
  if(line.startsWith('|')){
   closeList();const cells=line.split('|').slice(1,-1).map(s=>s.trim());
   if(cells.every(s=>/^:?-+:?$/.test(s)))continue;
   if(!table){html+='<div class="table-scroll"><table><thead><tr>'+cells.map(s=>`<th>${inline(s)}</th>`).join('')+'</tr></thead><tbody>';table=true;}
   else html+='<tr>'+cells.map(s=>`<td>${inline(s)}</td>`).join('')+'</tr>';continue;
  }
  const heading=/^(#{1,3}) (.+)$/.exec(line);
  if(heading){closeList();const level=heading[1].length,id=heading[2].toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-$/,'');html+=`<h${level} id="${id}">${inline(heading[2])}</h${level}>`;if(level===2)toc.push(`<li><a href="#${id}">${inline(heading[2])}</a></li>`);continue;}
  const item=/^(?:- |\d+\. )(.+)$/.exec(line);
  if(item){const kind=line.startsWith('-')?'ul':'ol';if(list!==kind){closeList();list=kind;html+=`<${kind}>`;}html+=`<li>${inline(item[1])}</li>`;continue;}
  closeList();html+=`<p>${inline(line)}</p>`;
 }
 closeList();
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Malpaco player manual</title><style>
 :root{color-scheme:light}body{margin:0;background:#f4f6f1;color:#18332e;font:18px/1.65 system-ui,sans-serif}main{max-width:960px;margin:auto;padding:24px}h1,h2,h3{line-height:1.2}h2{margin-top:2.4em}a{color:#125e76}img{display:block;max-width:100%;height:auto;border-radius:8px;border:1px solid #9aada6}li{margin:.45em 0}code{font-size:.9em;background:#e5eae4;padding:.1em .25em}table{border-collapse:collapse;width:100%;font-size:.95em}th,td{border:1px solid #9aada6;padding:10px;text-align:left;vertical-align:top}th{background:#e1e9df}.table-scroll{overflow-x:auto}nav{border-bottom:1px solid #9aada6;padding-bottom:1em}nav ul{columns:2;padding-left:1.2em}@media(max-width:600px){main{padding:16px}nav ul{columns:1}}@media print{body{background:white;font-size:11pt}nav{display:none}h2{break-after:avoid}img,tr{break-inside:avoid}a{color:inherit}}
 </style></head><body><main><nav aria-label="Manual contents"><a href="https://malpaco.netlify.app">Play Malpaco</a><ul>${toc.join('')}</ul></nav>${html}</main></body></html>`;
}
export function manualFiles(){
 const guide=readFileSync(new URL('docs/play.md',root),'utf8');
 const names=[...new Set([...guide.matchAll(/!\[[^\]]*\]\(manual-images\/([a-z-]+\.png)\)/g)].map(m=>m[1]))];
 return [{name:'manual/index.html',content:manualHtml()},...names.map(name=>({name:`manual/manual-images/${name}`,content:readFileSync(new URL(`docs/manual-images/${name}`,root))}))];
}
export function manualPlugin(){
 return {name:'player-manual',configureServer(server){server.middlewares.use((req,res,next)=>{
  const path=new URL(req.url??'/','http://localhost').pathname;
  if(!path.startsWith('/manual/'))return next();
  const file=manualFiles().find(f=>'/'+f.name===path);if(!file)return next();
  res.setHeader('Content-Type',path.endsWith('.png')?'image/png':'text/html; charset=utf-8');res.end(file.content);
 });},generateBundle(){for(const f of manualFiles())this.emitFile({type:'asset',fileName:f.name,source:f.content});}};
}
