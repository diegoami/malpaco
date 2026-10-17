import {svg as inheritedSvg,html as inheritedHtml} from '../T63/render.mjs';
import {edges,distance,location} from '../T24/geometry.mjs';
import {segmentGap,pointSegmentGap} from '../T62/contract.mjs';
const cache=new WeakMap();
// [designed] Conservative reservations for the existing9px Georgia captions.
// Actual native font bounds, land clearance and routes are checked in browser.
function captions(board){
 if(cache.has(board))return cache.get(board);
 const occupied=[],result=[];
 for(const island of board.islands){
  const text=island.name+' +'+island.bonus,halfWidth=text.length*5.4/2,halfHeight=7;
  const ring=island.polygon,xs=ring.map(p=>p[0]),ys=ring.map(p=>p[1]);
  const preferred=[(Math.min(...xs)+Math.max(...xs))/2,Math.min(...ys)-10];
  const candidates=[];
  for(let j=0;j<ring.length;j++){
   const p=ring[j],a=ring[(j+ring.length-1)%ring.length],b=ring[(j+1)%ring.length],length=distance(a,b);
   const normal=[(b[1]-a[1])/length,(a[0]-b[0])/length];
   for(const padding of [3,8,15,24]){
    const offset=halfWidth*Math.abs(normal[0])+halfHeight*Math.abs(normal[1])+padding;
    candidates.push([p[0]+normal[0]*offset,p[1]+normal[1]*offset]);
   }
  }
  candidates.sort((a,b)=>distance(a,preferred)-distance(b,preferred));
  const position=candidates.find(([x,y])=>{
   const box=[[x-halfWidth,y-halfHeight],[x+halfWidth,y-halfHeight],[x+halfWidth,y+halfHeight],[x-halfWidth,y+halfHeight]];
   if(box.some(p=>p[0]<2||p[0]>798||p[1]<2||p[1]>458))return false;
   if(occupied.some(b=>x+halfWidth+2>b.left&&x-halfWidth-2<b.right&&y+halfHeight+2>b.top&&y-halfHeight-2<b.bottom))return false;
   for(const other of board.islands){
    if(box.some(p=>location(p,other.polygon)>=0))return false;
    if(other.polygon.some(([u,v])=>u>=x-halfWidth&&u<=x+halfWidth&&v>=y-halfHeight&&v<=y+halfHeight))return false;
    if(edges(box).some(([a,b])=>edges(other.polygon).some(([c,d])=>segmentGap(a,b,c,d)<=1e-6)))return false;
   }
   for(const route of board.routes)for(let j=1;j<route.points.length;j++){
    const a=route.points[j-1],b=route.points[j];
    if(edges(box).some(([c,d])=>segmentGap(a,b,c,d)<2))return false;
   }
   // Keep the caption associated with its intended island in crowded water.
   const nearest=p=>Math.min(...edges(p.polygon).map(([a,b])=>pointSegmentGap([x,y],a,b)));
   if(board.islands.some(other=>other.id!==island.id&&nearest(other)<nearest(island)))return false;
   return true;
  });
  if(!position)throw Error('No clear water caption reservation for '+island.id);
  const [x,y]=position;
  occupied.push({left:x-halfWidth,right:x+halfWidth,top:y-halfHeight,bottom:y+halfHeight});
  result.push({id:island.id,x,y:y+4});
 }
 cache.set(board,result);return result;
}
export function svg(board){
 const placements=captions(board);let index=0;
 return inheritedSvg(board).replace('</style>','\n.country .name{font-size:9px;font-weight:400;stroke:none}.country:is(:hover,:focus,.selected) .name{font-size:12px;font-weight:600;stroke:#f8f2e2;stroke-width:1.5}</style>').replace(/<text class="island-name" x="[^"]*" y="[^"]*">/g,()=>{
  const p=placements[index++];return `<text class="island-name" data-island="${p.id}" x="${p.x}" y="${p.y}">`;
 });
}
export const html=board=>inheritedHtml(board).replace(inheritedSvg(board),svg(board));
