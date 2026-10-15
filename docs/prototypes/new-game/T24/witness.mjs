// A hand-arranged schematic witness, NOT a seeded production map generator.
// Rectangular cells make adjacency/area/label controls independently inspectable.
// The visibility routing below only constructs paths through this fixed fixture.
export function witness() {
  const specs = [[10,40,25],[7,330,25],[7,570,25],[5,40,180],[5,330,180],
    [3,670,180],[3,40,335],[3,380,335],[3,670,335]];
  const board = { bounds: {x:0,y:0,width:800,height:460}, provinces:[], islands:[], routes:[] };
  for (const [i,[n,x,y]] of specs.entries()) {
    const cols=Math.ceil(n/2), width=cols*50;
    const island={id:`w${i}`,provinces:[],bonus:0,polygon:rectangle(x,y,width,100)};
    for(let j=0;j<n;j++) {
      const row=j<cols?0:1, col=row?j-cols:j;
      const w=(n%2 && j===n-1)?100:50;
      const p={id:`w${i}p${j}`,island:island.id,borders:[],seaLanes:[],
        polygon:rectangle(x+col*50,y+row*50,w,50),labelAt:[x+col*50+w/2,y+row*50+25],
        hitSizeCss:40,countTextCss:14,countContrast:4.5};
      island.provinces.push(p.id);board.provinces.push(p);
    }
    board.islands.push(island);
  }
  for(const a of board.provinces)for(const b of board.provinces) {
    if(a.id!==b.id && a.island===b.island && rectangleContact(a.polygon,b.polygon))a.borders.push(b.id);
  }
  const links=[[0,4,1,0],[1,3,2,0],[3,2,4,0],[4,2,5,2],[6,2,7,0],[7,2,8,2],
    [0,5,3,0],[3,3,6,0],[1,6,4,0],[4,4,7,0],[2,4,5,1],[5,2,8,1],
    [0,4,2,0],[2,6,8,1],[8,2,6,2],[6,0,0,5]];
  for(const [a,ap,b,bp] of links) {
    const from=board.provinces.find(p=>p.id===`w${a}p${ap}`),to=board.provinces.find(p=>p.id===`w${b}p${bp}`);
    from.seaLanes.push(to.id);to.seaLanes.push(from.id);
    const start=fixturePort(from,board.islands[a],board.islands[b]);
    const end=fixturePort(to,board.islands[b],board.islands[a]);
    board.routes.push({from:from.id,to:to.id,points:waterPath(start,end,board.islands)});
  }
  for(const i of board.islands)i.bonus=Math.max(2,Math.floor(i.provinces.length/2)+i.provinces.filter(id=>board.provinces.find(p=>p.id===id).seaLanes.length).length);
  return board;
}
export const rectangle=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
function rectangleContact(a,b) {
  const [ax,ay]=a[0],[ar,ab]=a[2],[bx,by]=b[0],[br,bb]=b[2];
  return ((ar===bx||br===ax)&&Math.min(ab,bb)>Math.max(ay,by)) ||
    ((ab===by||bb===ay)&&Math.min(ar,br)>Math.max(ax,bx));
}
function fixturePort(p,island,destination) {
  const [x,y]=p.polygon[0],[r,b]=p.polygon[2], [ix,iy]=island.polygon[0],[ir,ib]=island.polygon[2];
  const [dx,dy]=destination.polygon[0],[dr,db]=destination.polygon[2];
  const vx=(dx+dr-ix-ir)/2,vy=(dy+db-iy-ib)/2;
  const sides=[y===iy&&vy<0,r===ir&&vx>0,b===ib&&vy>0,x===ix&&vx<0];
  const first=sides.findIndex((yes,j)=>yes&&!sides[(j+3)%4]);
  if(first<0)throw Error(`No facing fixture port: ${p.id}`);
  const segments=[];
  for(let k=0;k<4&&sides[(first+k)%4];k++)segments.push([p.polygon[(first+k)%4],p.polygon[(first+k+1)%4]]);
  let half=segments.reduce((n,[a,b])=>n+Math.hypot(b[0]-a[0],b[1]-a[1]),0)/2;
  for(const [a,b] of segments) {
    const len=Math.hypot(b[0]-a[0],b[1]-a[1]);
    if(half<=len)return [a[0]+(b[0]-a[0])*half/len,a[1]+(b[1]-a[1])*half/len];
    half-=len;
  }
}
function waterPath(start,end,islands) {
  const rectangles=islands.map(i=>[...i.polygon[0],...i.polygon[2]]);
  const nodes=[start,end,...rectangles.flatMap(([x,y,r,b])=>[[x-8,y-8],[r+8,y-8],[r+8,b+8],[x-8,b+8]])];
  function visible(a,b) {
    for(const [x,y,r,bt] of rectangles) {
      let lo=0,hi=1;
      for(const [v,d,min,max] of [[a[0],b[0]-a[0],x,r],[a[1],b[1]-a[1],y,bt]]) {
        if(Math.abs(d)<1e-9){if(v<min||v>max){lo=2;break;}}
        else {const u=(min-v)/d,w=(max-v)/d;lo=Math.max(lo,Math.min(u,w));hi=Math.min(hi,Math.max(u,w));}
      }
      if(lo<=hi+1e-9 && hi>1e-9 && lo<1-1e-9)return false;
    }
    return true;
  }
  const distance=nodes.map(()=>Infinity),previous=[],done=new Set();distance[0]=0;
  for(let count=0;count<nodes.length;count++) {
    let k=-1;for(let i=0;i<nodes.length;i++)if(!done.has(i)&&(k<0||distance[i]<distance[k]))k=i;
    if(k<0||!Number.isFinite(distance[k]))break;
    if(k===1)break;done.add(k);
    for(let i=0;i<nodes.length;i++)if(!done.has(i)&&visible(nodes[k],nodes[i])) {
      const next=distance[k]+Math.hypot(nodes[k][0]-nodes[i][0],nodes[k][1]-nodes[i][1]);
      if(next<distance[i]){distance[i]=next;previous[i]=k;}
    }
  }
  if(!Number.isFinite(distance[1]))throw Error('Fixed witness routing failed');
  const result=[];for(let i=1;i!==undefined;i=previous[i])result.unshift(nodes[i]);
  return result;
}
