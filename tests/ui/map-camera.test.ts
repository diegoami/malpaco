import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {cameraViewBox,chooseRotation,clampCamera,fitCamera,fitScale,focusCamera,FOCUS_MIN_ZOOM,MAX_ZOOM,NO_INSETS,obstructionInsets,panBy,resizeCamera,revealCamera,ROTATION_GAIN,screenToWorld,toView,toWorld,zoomAt} from '../../src/ui/mapCamera';
import type {CameraState,Insets,Rect,Viewport} from '../../src/ui/mapCamera';
import {createWorkspaceState,updateWorkspaceState} from '../../src/ui/workspaceState';

// Measured boards: the reference drawing's viewBox and the seed-1994 generated geometry.
const reference=(()=>{const [x,y,width,height]=/viewBox="([^"]+)"/.exec(readFileSync('fixtures/new-game/T65/map.svg','utf8'))![1]!.split(/\s+/).map(Number);return {x:x!,y:y!,width:width!,height:height!};})();
const geometry=JSON.parse(readFileSync('fixtures/new-game/T74/acceptance/measurements/seed-1994-result.json','utf8')).geography;
const q=geometry.unitsPerPixel as number;
const generated:Rect={x:geometry.bounds.x/q,y:geometry.bounds.y/q,width:geometry.bounds.width/q,height:geometry.bounds.height/q};
const countryRects:Rect[]=geometry.provinces.map((p:{polygon:[number,number][]})=>{
 const xs=p.polygon.map(v=>v[0]/q),ys=p.polygon.map(v=>v[1]/q);
 return {x:Math.min(...xs),y:Math.min(...ys),width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys)};
});
const smallest=countryRects.reduce((a,b)=>a.width*a.height<=b.width*b.height?a:b);
const vp=(width:number,height:number,insets:Insets=NO_INSETS):Viewport=>({width,height,insets});
const sizes:[number,number][]=[[320,568],[390,844],[568,320],[667,375],[844,390],[768,1024],[1024,768],[1280,800],[1920,1080],[800,540]];
const boards={reference,generated};

/** Screen pixel at which a world point is drawn. */
function screen(state:CameraState,world:Rect,viewport:Viewport,point:[number,number]):[number,number]{
 const box=cameraViewBox(state,world,viewport),s=viewport.width/box.width,[vx,vy]=toView(point,state.rotation);
 return [(vx-box.x)*s,(vy-box.y)*s];
}
const corners=(r:Rect):[number,number][]=>[[r.x,r.y],[r.x+r.width,r.y],[r.x,r.y+r.height],[r.x+r.width,r.y+r.height]];
const close=(a:number,b:number)=>expect(Math.abs(a-b)).toBeLessThan(1e-6);

describe('fit and the quarter turn',()=>{
 for(const [name,world] of Object.entries(boards))for(const [w,h] of sizes)it(`${name} ${w}x${h}: Fit draws the whole board inside the viewport, touching one axis`,()=>{
  const viewport=vp(w,h),state=fitCamera(world,viewport),box=cameraViewBox(state,world,viewport);
  close(box.width/box.height,w/h);
  const points=corners(world).map(p=>screen(state,world,viewport,p));
  for(const [x,y] of points){expect(x).toBeGreaterThanOrEqual(-1e-6);expect(y).toBeGreaterThanOrEqual(-1e-6);expect(x).toBeLessThanOrEqual(w+1e-6);expect(y).toBeLessThanOrEqual(h+1e-6);}
  const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
  expect(Math.min(Math.abs(Math.max(...xs)-Math.min(...xs)-w),Math.abs(Math.max(...ys)-Math.min(...ys)-h))).toBeLessThan(1e-6);
 });
 it('turns the landscape board in portrait and keeps it level in landscape',()=>{
  expect(sizes.map(([w,h])=>chooseRotation(reference,vp(w,h)))).toEqual([90,90,0,0,0,90,0,0,0,0]);
  expect(chooseRotation(generated,vp(320,568))).toBe(90);
 });
 it('turns exactly at the designed gain and not just below it',()=>{
  // A 2:1 board in a square-ish viewport: fit90/fit0 = height/width of the viewport over the board ratio.
  const world={x:0,y:0,width:200,height:100};
  const at=(ratio:number)=>chooseRotation(world,vp(100,100*ratio));
  // Viewport 100 x H: fit0 = min(100/200,H/100) = 0.5 for H >= 50; fit90 = min(100/100, H/200) = H/200.
  expect(at(ROTATION_GAIN)).toBe(90);
  expect(at(ROTATION_GAIN-0.001)).toBe(0);
  expect(fitScale(world,vp(100,110),90)/fitScale(world,vp(100,110),0)).toBeCloseTo(ROTATION_GAIN,10);
 });
 it('fits into the free area beside insets',()=>{
  const viewport=vp(1280,800,{top:0,right:420,bottom:0,left:0}),state=fitCamera(reference,viewport);
  for(const [x,y] of corners(reference).map(p=>screen(state,reference,viewport,p))){expect(x).toBeLessThanOrEqual(860+1e-6);expect(x).toBeGreaterThanOrEqual(-1e-6);expect(y).toBeGreaterThanOrEqual(-1e-6);expect(y).toBeLessThanOrEqual(800+1e-6);}
 });
});

describe('zoom, pan and clamps',()=>{
 const viewport=vp(390,844),fit=fitCamera(generated,viewport);
 it('keeps the world point under the pointer while zooming, within 1..MAX',()=>{
  const p:[number,number]=[100,300],before=screenToWorld(...p,fit,generated,viewport);
  const z=zoomAt(fit,2,...p,generated,viewport),after=screenToWorld(...p,z,generated,viewport);
  close(z.zoom,2);close(before[0],after[0]);close(before[1],after[1]);
  expect(zoomAt(fit,1000,...p,generated,viewport).zoom).toBe(MAX_ZOOM);
  expect(zoomAt(z,1e-6,...p,generated,viewport)).toEqual(fit);
 });
 it('swipe at Fit cannot move the board; zoomed pans stop at every edge',()=>{
  expect(panBy(fit,300,-200,generated,viewport)).toEqual(fit);
  const z=zoomAt(fit,4,195,422,generated,viewport);
  for(const [dx,dy] of [[1e5,0],[-1e5,0],[0,1e5],[0,-1e5]] as const){
   const moved=panBy(z,dx,dy,generated,viewport),box=cameraViewBox(moved,generated,viewport);
   const view=moved.rotation===90?{x:-(generated.y+generated.height),y:generated.x,width:generated.height,height:generated.width}:generated;
   expect(box.x).toBeGreaterThanOrEqual(view.x-1e-6);expect(box.y).toBeGreaterThanOrEqual(view.y-1e-6);
   expect(box.x+box.width).toBeLessThanOrEqual(view.x+view.width+1e-6);expect(box.y+box.height).toBeLessThanOrEqual(view.y+view.height+1e-6);
   expect(moved.zoom).toBe(z.zoom);
  }
 });
 it('round trips world and view coordinates in both orientations',()=>{
  for(const r of [0,90] as const)expect(toWorld(toView([12.5,-7],r),r)).toEqual([12.5,-7]);
 });
});

describe('focus, reveal and resize continuity',()=>{
 it('Focus centres the country and enlarges it; the smallest country reaches a readable zoom',()=>{
  for(const [w,h] of sizes){
   const viewport=vp(w,h),state=focusCamera(fitCamera(generated,viewport),smallest,generated,viewport);
   expect(state.zoom).toBeGreaterThanOrEqual(FOCUS_MIN_ZOOM);expect(state.zoom).toBeLessThanOrEqual(MAX_ZOOM);
   for(const [x,y] of corners(smallest).map(p=>screen(state,generated,viewport,p))){expect(x).toBeGreaterThanOrEqual(0);expect(x).toBeLessThanOrEqual(w);expect(y).toBeGreaterThanOrEqual(0);expect(y).toBeLessThanOrEqual(h);}
  }
 });
 it('reveal brings an off-screen country fully into view without zooming',()=>{
  const viewport=vp(390,844),zoomed=focusCamera(fitCamera(generated,viewport),countryRects[0]!,generated,viewport);
  for(const target of countryRects){
   const next=revealCamera(zoomed,target,generated,viewport);expect(next.zoom).toBe(zoomed.zoom);
   const box=cameraViewBox(next,generated,viewport),s=viewport.width/box.width;
   if(target.width*s>viewport.width||target.height*s>viewport.height)continue;
   for(const [x,y] of corners(target).map(p=>screen(next,generated,viewport,p))){expect(x).toBeGreaterThanOrEqual(-1e-6);expect(x).toBeLessThanOrEqual(390+1e-6);expect(y).toBeGreaterThanOrEqual(-1e-6);expect(y).toBeLessThanOrEqual(844+1e-6);}
  }
 });
 it('rotating the device keeps the world-space focus and zoom while the quarter turn follows',()=>{
  const portrait=vp(390,844),landscape=vp(844,390);
  const focused=focusCamera(fitCamera(generated,portrait),smallest,generated,portrait);
  expect(focused.rotation).toBe(90);
  const turned=resizeCamera(focused,generated,landscape);
  expect(turned.rotation).toBe(0);close(turned.zoom,focused.zoom);
  const centre:[number,number]=[smallest.x+smallest.width/2,smallest.y+smallest.height/2];
  const [x,y]=screen(turned,generated,landscape,centre);
  expect(x).toBeGreaterThan(0);expect(x).toBeLessThan(844);expect(y).toBeGreaterThan(0);expect(y).toBeLessThan(390);
  const back=resizeCamera(turned,generated,portrait);
  expect(back.rotation).toBe(90);close(back.x,focused.x);close(back.y,focused.y);close(back.zoom,focused.zoom);
 });
 it('rotation in the workspace leaves selection, confirmation and drafts untouched',()=>{
  const ws=updateWorkspaceState(createWorkspaceState(),{attack:{from:'province_1',to:'province_2',confirmed:true},drafts:{capture:'3e',move:'-',threshold:'7'},focus:'province_1'});
  const turned=updateWorkspaceState(ws,{camera:{...ws.camera,rotation:90}});
  expect({...turned,camera:ws.camera}).toEqual(ws);expect(turned.camera.rotation).toBe(90);
 });
 it('a replacement map fits its own bounds and never mutates either input',()=>{
  const viewport=Object.freeze(vp(390,844)),a=Object.freeze({...reference}),b=Object.freeze({x:-50,y:20,width:400,height:900});
  const first=zoomAt(fitCamera(a,viewport),3,10,10,a,viewport),second=fitCamera(b,viewport);
  expect(second).toEqual({x:150,y:470,zoom:1,rotation:0});expect(first.zoom).toBe(3);
  expect(clampCamera({...first,zoom:0.1},b,viewport).zoom).toBe(1);
 });
});

describe('overlays reframe the map beside them (E)',()=>{
 it('a right-hand drawer becomes a right inset; off-map and empty overlays are ignored',()=>{
  expect(obstructionInsets([{x:860,y:12,width:420,height:600}],{width:1280,height:800})).toEqual({top:0,right:420,bottom:0,left:0});
  expect(obstructionInsets([{x:0,y:600,width:390,height:244}],{width:390,height:844})).toEqual({top:0,right:0,bottom:244,left:0});
  expect(obstructionInsets([{x:2000,y:0,width:10,height:10},{x:10,y:10,width:0,height:50}],{width:1280,height:800})).toEqual(NO_INSETS);
 });
 it('with a card covering a side, every country centre is drawn in the free area',()=>{
  for(const [w,h] of sizes){
   const insets=obstructionInsets([{x:w*0.55,y:0,width:w*0.45,height:h}],{width:w,height:h}),viewport=vp(w,h,insets),state=fitCamera(generated,viewport);
   for(const r of countryRects){const [x]=screen(state,generated,viewport,[r.x+r.width/2,r.y+r.height/2]);expect(x).toBeLessThanOrEqual(w-insets.right+1e-6);}
  }
 });
});
