/** Disposable proposal. Coordinates are native SVG units; gameplay remains fixed-point. */
export type Point=readonly [number,number];
type MutablePoint=[number,number];
interface Bounds {readonly x:number;readonly y:number;readonly width:number;readonly height:number}
export interface Country {readonly id:string;readonly island:string;readonly polygon:readonly Point[];readonly labelAt:Point;readonly borders:readonly string[]}
export interface Island {readonly id:string;readonly polygon:readonly Point[];readonly provinces:readonly string[]}
export interface Route {readonly from:string;readonly to:string;readonly points:readonly Point[]}
export interface AcceptedGeometry {readonly version:string;readonly seed:number;readonly unitsPerPixel:number;readonly bounds:Bounds;readonly islands:readonly Island[];readonly provinces:readonly Country[];readonly entranceReservations:readonly Route[]}
export interface Drawing {readonly seed:number;readonly bounds:Bounds;readonly islands:readonly Island[];readonly provinces:readonly Country[];readonly routes:readonly Route[]}
export interface Presentation extends Drawing {readonly drawingVersion:string;readonly contentKey:string}
export const DRAWING_VERSION='t72-relocated-flow-spread-v2';
/** [designed] Exactly the approved T72 constants; changes require a new drawing version. */
export const DRAWING_CONSTANTS=Object.freeze({strength:.65,steps:160,spacing:2,grid:2048});
const key=(p:Point)=>JSON.stringify(p),edgeKey=(a:Point,b:Point)=>[key(a),key(b)].sort().join('|');
const distance=(a:Point,b:Point)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const edges=(p:readonly Point[]):[Point,Point][]=>p.map((a,i)=>[a,p[(i+1)%p.length]!]);
const map2=(p:Point,f:(x:number,d:0|1)=>number):MutablePoint=>[f(p[0],0),f(p[1],1)];
const pointSegmentGap=(x:number,y:number,a:Point,b:Point)=>{const dx=b[0]-a[0],dy=b[1]-a[1],norm=dx*dx+dy*dy,t=norm?Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/norm)):0;return Math.hypot(x-(a[0]+t*dx),y-(a[1]+t*dy));};
const onSegment=(p:Point,a:Point,b:Point)=>{const length=distance(a,b);if(length<=1e-6)return distance(p,a)<=1e-6;const t=((p[0]-a[0])*(b[0]-a[0])+(p[1]-a[1])*(b[1]-a[1]))/((b[0]-a[0])**2+(b[1]-a[1])**2);return Math.abs((b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]))/length<=1e-6&&t>=-1e-6/length&&t<=1+1e-6/length;};
const stable=(value:unknown):string=>JSON.stringify(value,(_k,v:unknown)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a<b?-1:a>b?1:0)):v);
/** Exact content identity avoids digest collisions and includes all accepted geometry fields. */
export const presentationKey=(g:AcceptedGeometry,version=DRAWING_VERSION)=>stable({geometry:g,drawingVersion:version,constants:DRAWING_CONSTANTS});
export function immutable<T>(value:T):T {if(value&&typeof value==='object'){for(const v of Object.values(value))immutable(v);Object.freeze(value);}return value;}
interface Piece {a:Point;b:Point;owners:string[];island?:string}
function canonical(board:Drawing){
 const rings=new Map<string,Point[]>(),pieces=new Map<string,Piece>(),ports=board.routes.flatMap(r=>[r.points[0]!,r.points.at(-1)!]);
 for(const island of board.islands){
  const countries=board.provinces.filter(p=>p.island===island.id);
  const guards=ports.flatMap(p=>edges(island.polygon).filter(([a,b])=>onSegment(p,a,b)).flatMap(([a,b])=>[a,b].filter(v=>distance(v,p)>1e-6).map(v=>map2(p,(x,j)=>x+(v[j]-x)*Math.min(1,12/distance(v,p))))));
  const vertices=[...new Map([...island.polygon,...countries.flatMap(p=>p.polygon),...ports,...guards].map(p=>[key(p),p])).values()];
  for(const p of [island,...countries]){
   const ring=edges(p.polygon).flatMap(([a,b])=>vertices.filter(v=>onSegment(v,a,b)&&distance(v,b)>1e-6).sort((u,v)=>distance(a,u)-distance(a,v)));rings.set(p.id,ring);
   for(const[a,b]of edges(ring)){const k=edgeKey(a,b);if(!pieces.has(k)){const[u,v]=key(a)<key(b)?[a,b]:[b,a];pieces.set(k,{a:u!,b:v!,owners:[]});}const e=pieces.get(k)!;if(p===island)e.island=island.id;else e.owners.push(p.id);}
  }
 }return{rings,pieces};
}
export function derivePresentation(input:AcceptedGeometry):Presentation {
 if(input.version!=='island-geography-v1'||!Number.isFinite(input.unitsPerPixel)||input.unitsPerPixel<=0||!input.provinces.length||!input.islands.length)throw Error('Unsupported or incomplete accepted geography');
 const q=input.unitsPerPixel,point=(p:Point):MutablePoint=>[p[0]/q,p[1]/q];
 const board:Drawing={seed:input.seed,bounds:{x:input.bounds.x/q,y:input.bounds.y/q,width:input.bounds.width/q,height:input.bounds.height/q},provinces:input.provinces.map(p=>({...p,borders:[...p.borders],polygon:p.polygon.map(point),labelAt:point(p.labelAt)})),islands:input.islands.map(i=>({...i,provinces:[...i.provinces],polygon:i.polygon.map(point)})),routes:input.entranceReservations.map(r=>({...r,points:r.points.map(point)}))};
 const {strength,steps,spacing}=DRAWING_CONSTANTS,{rings,pieces}=canonical(board),labels=board.provinces.map(p=>[...p.labelAt] as MutablePoint);
 const hash=(seed:number,s:string)=>{let h=(seed^0x7291e03)>>>0;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h/4294967296;};
 const fields=board.islands.map(i=>{const xs=i.polygon.map(p=>p[0]),ys=i.polygon.map(p=>p[1]),w=Math.max(...xs)-Math.min(...xs),h=Math.max(...ys)-Math.min(...ys);return{cx:(Math.min(...xs)+Math.max(...xs))/2,cy:(Math.min(...ys)+Math.max(...ys))/2,rx:w/2,ry:h/2,phase:hash(board.seed,i.id)*Math.PI*2};});
 const baseResult:MutablePoint=[0,0],velocityResult:MutablePoint=[0,0];
 const base=([x,y]:Point):MutablePoint=>{let vx=0,vy=0;for(const f of fields){const u=(x-f.cx)/f.rx,v=(y-f.cy)/f.ry,qq=u*u+v*v;if(qq>6)continue;const e=Math.exp(-qq*qq*.50),p=f.phase;vx+=f.rx*.34*e*(Math.sin(2.0*v+p)+.42*Math.sin(3.5*u-1.2*v-p));vy+=f.ry*.36*e*(Math.sin(2.5*u+p*.7)+.48*Math.cos(3.1*v+u+p));}baseResult[0]=vx*Math.sin(Math.PI*x/board.bounds.width);baseResult[1]=vy*Math.sin(Math.PI*y/board.bounds.height);return baseResult;};
 const drift:MutablePoint=[6,3],labelSpeeds=labels.map(()=>drift),protectedLines=board.routes.flatMap(r=>r.points.slice(1).map((p,j):[Point,Point]=>[r.points[j]!,p])),protectedPorts=board.routes.flatMap(r=>[r.points[0]!,r.points.at(-1)!]);
 const junctionOwners=new Map<string,Set<string>>();for(const e of pieces.values())for(const p of[e.a,e.b]){const k=key(p);if(!junctionOwners.has(k))junctionOwners.set(k,new Set());for(const id of e.owners)junctionOwners.get(k)!.add(id);}
 const spreads=board.islands.flatMap(i=>{const ps=[...junctionOwners].filter(([,owners])=>owners.size>=3&&[...owners].every(id=>i.provinces.includes(id))).map(([k])=>JSON.parse(k) as MutablePoint);if(ps.length<2)return[];let pair:[Point,Point]=[ps[0]!,ps[1]!];for(const a of ps)for(const b of ps)if(distance(a,b)>distance(...pair))pair=[a,b];const length=distance(...pair);if(length>20)return[];const c:MutablePoint=[0,1].map(d=>ps.reduce((n,p)=>n+p[d]!,0)/ps.length) as MutablePoint,axis=map2(pair[0],(v,d)=>(pair[1][d]-v)/length);return[{c,axis,radius:28,width:14}];});
 const samples=new Map<string,MutablePoint[]>();for(const[k,e]of pieces){const n=Math.max(1,Math.ceil(distance(e.a,e.b)/spacing));samples.set(k,Array.from({length:n+1},(_,j)=>map2(e.a,(x,d)=>x+(e.b[d]-x)*j/n)));}
 const routes=board.routes.map(r=>r.points.map(p=>[...p] as MutablePoint)),points=new Map<string,MutablePoint>();for(const ps of[...samples.values(),...routes])for(const p of ps)if(!points.has(key(p)))points.set(key(p),[...p]);
 const labelGap=(p:Point,c:Point)=>{const x=Math.max(0,Math.abs(p[0]-c[0])-20),y=Math.max(0,Math.abs(p[1]-c[1])-20);return Number.isFinite(x)&&Number.isFinite(y)&&(x>24||y>24)?Infinity:Math.hypot(x,y);};
 for(let step=0;step<steps;step++){
  const speeds=labelSpeeds,shift=map2(drift,v=>v*strength*step/steps);
  const velocity=(p:Point):MutablePoint=>{let[vx,vy]=base(p),weight=1;const relativeX=p[0]-shift[0],relativeY=p[1]-shift[1];let gap=Infinity;for(const [a,b]of protectedLines)gap=Math.min(gap,pointSegmentGap(relativeX,relativeY,a,b)-5);for(const q of protectedPorts)gap=Math.min(gap,Math.hypot(relativeX-q[0],relativeY-q[1])-20);if(gap<=0)return drift;if(gap<24){const w=((24-gap)/gap)**4;vx+=w*drift[0];vy+=w*drift[1];weight+=w;}let minimumLabelGap=Infinity;for(let j=0;j<labels.length;j++){const d=labelGap(p,labels[j]!);minimumLabelGap=Math.min(minimumLabelGap,d);if(d<1e-10)return speeds[j]!;if(d>24)continue;const w=((24-d)/d)**4;vx+=w*speeds[j]![0];vy+=w*speeds[j]![1];weight+=w;}const w=Math.min(1,minimumLabelGap/3)**2*Math.min(1,gap/10);let sx=0,sy=0;for(const f of spreads){const qx=p[0]-f.c[0]-shift[0],qy=p[1]-f.c[1]-shift[1],along=qx*f.axis[0]+qy*f.axis[1],across=-qx*f.axis[1]+qy*f.axis[0],power=2.6*along*Math.exp(-((along/f.radius)**4)-(across/f.width)**4)*w;sx+=power*f.axis[0];sy+=power*f.axis[1];}velocityResult[0]=vx/weight+sx;velocityResult[1]=vy/weight+sy;return velocityResult;};
  for(const p of points.values()){const v=velocity(p);p[0]+=v[0]*strength/steps;p[1]+=v[1]*strength/steps;}for(let j=0;j<labels.length;j++){labels[j]![0]+=speeds[j]![0]*strength/steps;labels[j]![1]+=speeds[j]![1]*strength/steps;}
 }
 const snap=(p:Point)=>map2(p,x=>Math.round(x*2048)/2048),curves=new Map([...samples].map(([k,ps])=>[k,ps.map(p=>snap(points.get(key(p))!))]));
 const polygon=(id:string)=>edges(rings.get(id)!).flatMap(([a,b])=>{const ps=curves.get(edgeKey(a,b))!,e=pieces.get(edgeKey(a,b))!;return(key(a)===key(e.a)?ps:[...ps].reverse()).slice(0,-1).map(p=>[...p] as MutablePoint);});
 return immutable({drawingVersion:DRAWING_VERSION,contentKey:presentationKey(input),seed:board.seed,bounds:board.bounds,islands:board.islands.map(i=>({...i,polygon:polygon(i.id)})),provinces:board.provinces.map((p,j)=>({...p,polygon:polygon(p.id),labelAt:snap(labels[j]!)})),routes:board.routes.map((r,j)=>({...r,points:routes[j]!.map(p=>snap(points.get(key(p))!))}))});
}
