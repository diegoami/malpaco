import type {MapCamera} from './mapCamera';
import type {GameMap,GameState} from '../core';
import type {MatchIdentity} from '../core/match-save';
import type {MapHandlers,MapViewState} from './mapView';

/** The renderer and replay origin travel with the explicit save identity. */
export interface MatchPresentation {
 readonly identity:MatchIdentity;
 readonly label:string;
 readonly initialState:GameState;
 /** The host's file UI continues version-1 saves too (A13): the main game screen only. */
 readonly acceptsVersion1?:boolean;
 /**
  * T96: the player's game (instant start): no file controls, New game confirms giving up, and
  * every new action is kept with `persist` so a refresh resumes; null clears it at the end.
  */
 readonly player?:{readonly persist:(text:string|null)=>void};
 readonly createMap:(map:GameMap,handlers:MapHandlers)=>{readonly el:SVGSVGElement;readonly camera?:MapCamera;render(view:MapViewState):void};
}
