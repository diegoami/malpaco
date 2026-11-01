import type {Page} from '@playwright/test';
/** Independent 1px area oracle; the product resolver uses a different, coarser grid. */
export async function overlapPoint(page:Page,owner:string,radius=12){
 return page.locator('#geographic-map').evaluate((svg,{owner,radius})=>{
  const cells=[...svg.querySelectorAll<SVGGeometryElement>('[data-country] .cell')].map(cell=>({cell,id:cell.closest('[data-country]')!.getAttribute('data-country')!,owner:cell.closest('[data-country]')!.getAttribute('data-owner'),matrix:cell.getScreenCTM()!,bounds:cell.getBoundingClientRect()}));
  const at=(x:number,y:number)=>{
   if(!svg.contains(document.elementFromPoint(x,y)))return null;
   return cells.find(c=>x>=c.bounds.left&&x<=c.bounds.right&&y>=c.bounds.top&&y<=c.bounds.bottom&&c.cell.isPointInFill(new DOMPoint(x,y).matrixTransform(c.matrix.inverse())))?.id??null;
  };
  for(const c of cells.filter(c=>c.owner===owner)){const length=c.cell.getTotalLength();for(let t=0;t<length;t+=Math.max(1,length/50)){
   const boundary=c.cell.getPointAtLength(t).matrixTransform(c.matrix);
   for(const [ox,oy] of [[3,0],[-3,0],[0,3],[0,-3]]){
    const x=boundary.x+ox!,y=boundary.y+oy!;if(x<radius||y<radius||x>innerWidth-radius||y>innerHeight-radius||!svg.contains(document.elementFromPoint(x,y)))continue;
    const near=cells.filter(c=>c.bounds.right>=x-radius&&c.bounds.left<=x+radius&&c.bounds.bottom>=y-radius&&c.bounds.top<=y+radius);
    if(near.length<2)continue;
    const counts=new Map<string,number>();for(let dy=-radius+.5;dy<radius;dy++)for(let dx=-radius+.5;dx<radius;dx++){
     if(dx*dx+dy*dy>radius*radius)continue;const id=at(x+dx,y+dy);if(id)counts.set(id,(counts.get(id)??0)+1);
    }
    const ranked=[...counts].sort((a,b)=>b[1]-a[1]);const best=ranked[0],second=ranked[1];
    if(best&&second&&second[1]>=12&&best[1]>second[1]*1.5&&cells.find(c=>c.id===best[0])?.owner===owner)return {x,y,id:best[0]};
   }
  }}return null;
 },{owner,radius});
}
