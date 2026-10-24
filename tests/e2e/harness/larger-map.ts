import '../../../src/styles.css';
import {createGeographicGame} from '../../../src/core/geographic-game';
import {defaultOptions} from '../../../src/core/options';
import {derivePresentation} from '../../../src/ui/generatedGeographyPresentation';
import type {AcceptedGeometry} from '../../../src/ui/generatedGeographyPresentation';
import {GeographicMapView} from '../../../src/ui/geographicMapView';
/** Real renderer/camera and generated geometry; selection callback is isolated from turn legality. */
export function mount(size:72|96){
 const o={...defaultOptions(),seed:7,regionCount:size,names:'numbered' as const};const r=createGeographicGame(o,undefined,{},3);if(!r.ok)throw Error(r.errors.join());
 const render=(id:string|null)=>map.render({state:r.state,selected:id,target:null,targets:[],hover:null,flash:[]});
 const map=new GeographicMapView(r.state.map,r.geography,{onProvince:id=>render(id),onBackground:()=>render(null),onHover:()=>{}},derivePresentation(r.geography as unknown as AcceptedGeometry));
 const board=document.createElement('section');board.className='board';board.style.cssText='position:fixed;inset:0';board.append(map.el);document.body.replaceChildren(board);render(null);
}
